import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";

export async function POST(req: NextRequest) {
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      customer_email: reg.email,
      success_url: `${baseUrl}/events/${reg.eventSlug}?payment=success&conf=${reg.confirmationNumber}`,
      cancel_url: `${baseUrl}/events/${reg.eventSlug}?payment=cancelled`,
      metadata: {
        registrationId: reg.id,
        confirmationNumber: reg.confirmationNumber ?? "",
        eventSlug: reg.eventSlug,
      },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("[POST /api/events/checkout]", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
