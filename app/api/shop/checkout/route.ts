import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { rateLimit } from "@/lib/require-admin";
import type Stripe from "stripe";

function orderNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TIB-${ymd}-${rand}`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!rateLimit(`shop-checkout:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
  }

  try {
    const { items } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Normalise requested quantities by product id
    const wanted = new Map<string, number>();
    for (const it of items) {
      const id = String(it?.id ?? "");
      const qty = Math.max(1, Math.min(99, Math.floor(Number(it?.quantity) || 1)));
      if (id) wanted.set(id, (wanted.get(id) ?? 0) + qty);
    }
    if (wanted.size === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Authoritative product data from DB (never trust client prices)
    const products = await prisma.product.findMany({
      where: { id: { in: [...wanted.keys()], }, published: true },
    });
    if (products.length === 0) {
      return NextResponse.json({ error: "No available products in cart" }, { status: 400 });
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

    for (const p of products) {
      const qty = wanted.get(p.id) ?? 1;
      if (p.stock != null && p.stock < qty) continue; // out of stock — skip
      if (!p.digital) anyPhysical = true;
      subtotal += p.price * qty;
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
      return NextResponse.json({ error: "Items are out of stock" }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: orderNumber(),
        email: "",
        items: orderItems as unknown as Prisma.InputJsonValue,
        subtotal,
        total: subtotal,
        currency: currency.toUpperCase(),
        status: "pending",
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      phone_number_collection: { enabled: true },
      ...(anyPhysical
        ? { shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "AU", "NG", "GH", "KE", "ZA"] } }
        : {}),
      success_url: `${baseUrl}/shop/success?order=${order.orderNumber}`,
      cancel_url: `${baseUrl}/shop?checkout=cancelled`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/shop/checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
