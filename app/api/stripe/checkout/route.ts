import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";

// Max reasonable appointment price: $5000
const MAX_AMOUNT_CENTS = 500_000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { appointmentId, amount, serviceType, clientEmail } = body;

    // Validate required fields
    if (!appointmentId || typeof appointmentId !== "string") {
      return NextResponse.json({ error: "Invalid appointmentId" }, { status: 400 });
    }
    if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0 || amount > MAX_AMOUNT_CENTS) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!serviceType || typeof serviceType !== "string" || serviceType.length > 200) {
      return NextResponse.json({ error: "Invalid serviceType" }, { status: 400 });
    }
    if (!clientEmail || typeof clientEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clientEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Verify the appointment exists and the amount matches what's stored
    const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    if (appt.totalAmount !== amount) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price_data: { currency: "usd", product_data: { name: serviceType }, unit_amount: amount }, quantity: 1 }],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/book/success?appointmentId=${appointmentId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/book`,
      metadata: { appointmentId, serviceType, clientEmail },
      customer_email: clientEmail,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("[POST /api/stripe/checkout]", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
