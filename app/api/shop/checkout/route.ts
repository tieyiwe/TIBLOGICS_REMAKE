import { NextRequest, NextResponse } from "next/server";
import { getT } from "@/lib/i18n/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { checkRateLimit } from "@/lib/require-admin";
import type Stripe from "stripe";
import { recordAttribution } from "@/lib/growth/attribution";
import { resolveCheckoutDiscount } from "@/lib/promotions/service";
import { codeFromBody, promoCheckoutError } from "@/lib/promotions/http";
import type { CheckoutLine } from "@/lib/promotions/shared";

function orderNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TIB-${ymd}-${rand}`;
}

export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`shop-checkout:${ip}`, 10, 60_000))) {
    return NextResponse.json({ error: t("pages.api.tooMany") }, { status: 429 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: t("pages.api.shop.notConfigured") }, { status: 503 });
  }

  try {
    const { items, promoCode, email: rawEmail } = await req.json();
    const buyerEmail = typeof rawEmail === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail.trim()) ? rawEmail.trim().slice(0, 320) : null;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: t("pages.api.shop.cartEmpty") }, { status: 400 });
    }

    // Normalise requested quantities by product id
    const wanted = new Map<string, number>();
    for (const it of items) {
      const id = String(it?.id ?? "");
      const qty = Math.max(1, Math.min(99, Math.floor(Number(it?.quantity) || 1)));
      if (id) wanted.set(id, (wanted.get(id) ?? 0) + qty);
    }
    if (wanted.size === 0) {
      return NextResponse.json({ error: t("pages.api.shop.cartEmpty") }, { status: 400 });
    }

    // Authoritative product data from DB (never trust client prices)
    const products = await prisma.product.findMany({
      where: { id: { in: [...wanted.keys()], }, published: true },
    });
    if (products.length === 0) {
      return NextResponse.json({ error: t("pages.api.shop.noProducts") }, { status: 400 });
    }

    const baseUrl = (
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL ??
      "https://tiblogics.com"
    ).replace(/\/$/, "");

    const currency = (products[0].currency || "USD").toLowerCase();
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const orderItems: Array<{ productId: string; slug: string; name: string; price: number; quantity: number; image: string | null }> = [];
    let subtotal = 0;
    let anyPhysical = false;
    const promoLines: CheckoutLine[] = [];

    for (const p of products) {
      const qty = wanted.get(p.id) ?? 1;
      if (p.stock != null && p.stock < qty) continue; // out of stock — skip
      if (!p.digital) anyPhysical = true;
      subtotal += p.price * qty;
      promoLines.push({ key: "store", id: p.id, amountCents: p.price * qty });
      orderItems.push({
        productId: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        quantity: qty,
        image: p.images?.[0] ?? null,
      });
      lineItems.push({
        quantity: qty,
        price_data: {
          currency,
          unit_amount: p.price,
          product_data: {
            name: p.name,
            ...(p.tagline ? { description: p.tagline } : {}),
            ...(p.images?.[0] && /^https?:\/\//.test(p.images[0]) ? { images: [p.images[0]] } : {}),
          },
        },
      });
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: t("pages.api.shop.outOfStock") }, { status: 400 });
    }

    // One discount: a typed code, else an automatic sale (lib/promotions).
    // Prices above came from the database; the discount is computed here too.
    const discount = await resolveCheckoutDiscount({
      lines: promoLines,
      recurring: false,
      code: codeFromBody(promoCode),
      buyer: { email: buyerEmail },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: orderNumber(),
        email: "",
        items: orderItems as unknown as Prisma.InputJsonValue,
        subtotal,
        total: subtotal - discount.discountCents,
        currency: currency.toUpperCase(),
        status: "pending",
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      ...(discount.couponId ? { discounts: [{ coupon: discount.couponId }] } : discount.allowPromotionCodes ? { allow_promotion_codes: true } : {}),
      ...(buyerEmail ? { customer_email: buyerEmail } : {}),
      billing_address_collection: "auto",
      phone_number_collection: { enabled: true },
      ...(anyPhysical
        ? { shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "AU", "NG", "GH", "KE", "ZA"] } }
        : {}),
      success_url: `${baseUrl}/store/success?order=${order.orderNumber}`,
      cancel_url: `${baseUrl}/store?checkout=cancelled`,
      metadata: { ...discount.metadata, orderId: order.id, orderNumber: order.orderNumber },
    });

    await recordAttribution({ kind: "order", refId: order.id, cookieHeader: req.headers.get("cookie"), headers: req.headers, amountCents: order.total });
    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err) {
    const promoErr = promoCheckoutError(t, err);
    if (promoErr) return promoErr;
    // Public endpoint — a raw Stripe error names our price ids, key mode and
    // request parameters. Log it, return something a shopper can act on.
    console.error("[POST /api/shop/checkout]", err);
    return NextResponse.json(
      { error: t("pages.api.shop.checkoutFailed") },
      { status: 500 },
    );
  }
}
