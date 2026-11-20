import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveCheckoutDiscount } from "@/lib/promotions/service";
import { eventSeatLineItems, groupNotePrefix, seatTotal } from "@/lib/events/seat-pricing";

export async function POST(req: NextRequest) {
  // Public; each call creates a Stripe checkout session.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!(await checkRateLimit(`event-checkout:${ip}`, ip === "unknown" ? 200 : 20, 60 * 60_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
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
    if (reg.status === "paid") {
      return NextResponse.json({ error: "This registration is already paid." }, { status: 409 });
    }
    const event = await prisma.event.findUnique({ where: { slug: reg.eventSlug }, select: { title: true, price: true, currency: true } });
    if (!event || event.price <= 0) {
      return NextResponse.json({ error: "This event has no payment to make." }, { status: 409 });
    }

    const baseUrl = (
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL ??
      "https://tiblogics.com"
    ).replace(/\/$/, "");

    // Every seat of the booking, priced from the Event row (it used to charge
    // one seat at a fixed Stripe Price whatever the booking).
    const extras = reg.confirmationNumber
      ? await prisma.eventRegistration.count({ where: { notes: { startsWith: groupNotePrefix(reg.confirmationNumber) } } })
      : 0;
    const lineItems = eventSeatLineItems(event.title, event.price, event.currency, 1 + extras);
    const promo = await resolveCheckoutDiscount({
      lines: [{ key: "events", id: reg.eventSlug, amountCents: seatTotal(lineItems) }],
      recurring: false,
      buyer: { email: reg.email },
    });
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
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
        seats: String(1 + extras),
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
