import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { sendConfirmationEmail, sendTiweNotification } from "@/lib/resend";
import Stripe from "stripe";
import { createMeeting } from "@/lib/meeting-providers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed", err);
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  // Always return 200 after signature check — Stripe will retry on 5xx
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const appointmentId = session.metadata?.appointmentId;

      if (appointmentId) {
        // Auto-create meeting link on payment confirmation
        const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
        let meetingLink: string | null = null;
        if (appt) {
          meetingLink = await createMeeting({
            serviceType: appt.serviceType,
            date: appt.date,
            timeSlot: appt.timeSlot,
            timezone: appt.timezone,
            serviceDuration: Number(appt.serviceDuration),
            firstName: appt.firstName,
            lastName: appt.lastName,
          });
        }

        const updated = await prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            status: "CONFIRMED",
            stripePaymentId: session.payment_intent as string,
            stripeSessionId: session.id,
            paymentStatus: "paid",
            confirmedAt: new Date(),
            zoomLink: meetingLink,
          },
        });

        await Promise.allSettled([
          sendConfirmationEmail({
            firstName: updated.firstName,
            lastName: updated.lastName,
            email: updated.email,
            serviceType: updated.serviceType,
            date: updated.date,
            timeSlot: updated.timeSlot,
            serviceDuration: updated.serviceDuration,
            zoomLink: updated.zoomLink,
            totalAmount: updated.totalAmount,
          }).catch((err) => console.error("[sendConfirmationEmail]", err)),

          sendTiweNotification({
            firstName: updated.firstName,
            lastName: updated.lastName,
            email: updated.email,
            company: updated.company,
            serviceType: updated.serviceType,
            date: updated.date,
            timeSlot: updated.timeSlot,
            totalAmount: updated.totalAmount,
            goalNotes: updated.goalNotes,
            paymentStatus: updated.paymentStatus,
            addOnRecording: updated.addOnRecording,
            addOnActionPlan: updated.addOnActionPlan,
            addOnSlackAccess: updated.addOnSlackAccess,
          }).catch((err) => console.error("[sendTiweNotification]", err)),
        ]);
      }
    }
  } catch (error) {
    console.error("[stripe/webhook] Event handling error", error);
  }

  return new Response("ok", { status: 200 });
}
