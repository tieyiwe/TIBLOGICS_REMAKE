import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { sendConfirmationEmail, sendTiweNotification } from "@/lib/resend";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed", err);
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const appointmentId = session.metadata?.appointmentId;

      if (appointmentId) {
        const appt = await prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            status: "CONFIRMED",
            stripePaymentId: session.payment_intent as string,
            stripeSessionId: session.id,
            paymentStatus: "paid",
            confirmedAt: new Date(),
          },
        });

        // Send emails — log errors but don't fail the webhook response
        await Promise.allSettled([
          sendConfirmationEmail({
            firstName: appt.firstName,
            lastName: appt.lastName,
            email: appt.email,
            serviceType: appt.serviceType,
            date: appt.date,
            timeSlot: appt.timeSlot,
            serviceDuration: appt.serviceDuration,
            zoomLink: appt.zoomLink,
            totalAmount: appt.totalAmount,
          }).catch((err) => console.error("[sendConfirmationEmail]", err)),

          sendTiweNotification({
            firstName: appt.firstName,
            lastName: appt.lastName,
            email: appt.email,
            company: appt.company,
            serviceType: appt.serviceType,
            date: appt.date,
            timeSlot: appt.timeSlot,
            totalAmount: appt.totalAmount,
            goalNotes: appt.goalNotes,
            paymentStatus: appt.paymentStatus,
            addOnRecording: appt.addOnRecording,
            addOnActionPlan: appt.addOnActionPlan,
            addOnSlackAccess: appt.addOnSlackAccess,
          }).catch((err) => console.error("[sendTiweNotification]", err)),
        ]);
      }
    }
  } catch (error) {
    console.error("[stripe/webhook] Event handling error", error);
    // Still return 200 so Stripe doesn't retry indefinitely for non-transient errors
    return new Response("Event handling error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
