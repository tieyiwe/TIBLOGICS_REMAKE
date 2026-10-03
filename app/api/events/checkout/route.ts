import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveCheckoutDiscount } from "@/lib/promotions/service";

export async function POST(req: NextRequest) {
  // Public; each call creates a Stripe checkout session.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!(await checkRateLimit(`event-checkout:${ip}`, ip === "unknown" ? 200 : 20, 60 * 60_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const priceId = process.env.STRIPE_EVENT_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
  }

  try {
    const { registrationId } = await req.json();

    if (!registrationId || typeof registrationId !== "string") {
      return NextResponse.json({ error: "Invalid registrationId" }, { status: 400 });
    }

    const reg = await prisma.eventRegistration.findUnique({ where: { id: registrationId } });
    if (!reg) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const baseUrl = (
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL ??
      "https://tiblogics.com"
    ).replace(/\/$/, "");

    // The seat price lives on the Stripe Price; read it for the promotion's math.
    const unit = await stripe.prices.retrieve(priceId).then((p) => p.unit_amount ?? 0).catch(() => 0);
    const promo = await resolveCheckoutDiscount({
      lines: [{ key: "events", id: reg.eventSlug, amountCents: unit }],
      recurring: false,
      buyer: { email: reg.email },
    });
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      ...(promo.couponId ? { discounts: [{ coupon: promo.couponId }] } : promo.allowPromotionCodes ? { allow_promotion_codes: true } : {}),
      customer_email: reg.email,
      success_url: `${baseUrl}/events/${reg.eventSlug}/confirmed?conf=${reg.confirmationNumber}`,
      cancel_url: `${baseUrl}/events/${reg.eventSlug}?payment=cancelled&conf=${reg.confirmationNumber}`,
      metadata: {
        ...promo.metadata,
        registrationId: reg.id,
        confirmationNumber: reg.confirmationNumber ?? "",
        eventSlug: reg.eventSlug,
      },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    // Stripe errors quote our own request parameters and key mode back at us;
    // this endpoint is public, so log the detail and return a fixed message.
    console.error("[POST /api/events/checkout]", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again or contact support." },
      { status: 500 },
    );
  }
}
