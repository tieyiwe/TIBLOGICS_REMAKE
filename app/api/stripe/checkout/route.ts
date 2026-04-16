import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { appointmentId, amount, serviceType, clientEmail, clientName } =
      body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: body.serviceType },
            unit_amount: body.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/book/success?appointmentId=${body.appointmentId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/book`,
      metadata: {
        appointmentId: body.appointmentId,
        serviceType: body.serviceType,
        clientEmail: body.clientEmail,
      },
      customer_email: body.clientEmail,
    });

    // Suppress unused-variable warnings — values are destructured for validation clarity
    void appointmentId;
    void amount;
    void serviceType;
    void clientEmail;
    void clientName;

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("[POST /api/stripe/checkout]", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
