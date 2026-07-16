import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { sendConfirmationEmail, sendTiweNotification, sendEventWelcomeEmail, sendAdminNewRegistrationAlert, sendOrderConfirmationEmail, sendAdminOrderAlert } from "@/lib/resend";
import Stripe from "stripe";
import { createMeeting } from "@/lib/meeting-providers";
import stripe from "@/lib/stripe";

export async function POST(req: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed", err);
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  // Always return 200 after signature check — Stripe will retry on 5xx
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const appointmentId = session.metadata?.appointmentId;
      const registrationId = session.metadata?.registrationId;
      const orderId = session.metadata?.orderId;

      // ── Shop order payment ──────────────────────────────────────────────
      if (orderId) {
        const email = session.customer_details?.email ?? session.customer_email ?? "";
        const name = session.customer_details?.name ?? null;
        const phone = session.customer_details?.phone ?? null;
        const shipping = (session as unknown as { shipping_details?: unknown }).shipping_details ?? null;

        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "paid",
            stripeSessionId: session.id,
            email,
            customerName: name,
            phone,
            ...(shipping ? { shippingAddress: JSON.parse(JSON.stringify(shipping)) } : {}),
          },
        });

        // Update inventory / sold counts (best-effort)
        const items = Array.isArray(order.items) ? (order.items as unknown as Array<{ productId: string; quantity: number }>) : [];
        for (const it of items) {
          const prod = await prisma.product.findUnique({ where: { id: it.productId }, select: { stock: true } }).catch(() => null);
          await prisma.product.update({
            where: { id: it.productId },
            data: {
              soldCount: { increment: it.quantity },
              ...(prod?.stock != null ? { stock: { decrement: Math.min(prod.stock, it.quantity) } } : {}),
            },
          }).catch((err) => console.error("[stripe/webhook] product update", err));
        }

        if (email) {
          // Mark any saved cart for this shopper as recovered (stops reminders)
          prisma.abandonedCart
            .updateMany({ where: { email: email.toLowerCase(), recoveredAt: null }, data: { recoveredAt: new Date() } })
            .catch((err) => console.error("[stripe/webhook] cart recover", err));

          sendOrderConfirmationEmail({
            email,
            customerName: name,
            orderNumber: order.orderNumber,
            items,
            total: order.total,
            currency: order.currency,
          }).catch((err) => console.error("[stripe/webhook] order email FAILED:", err instanceof Error ? err.message : err));
        }
        sendAdminOrderAlert({
          orderNumber: order.orderNumber,
          email,
          customerName: name,
          total: order.total,
          currency: order.currency,
          itemCount: items.reduce((n, i) => n + (i.quantity || 0), 0),
        }).catch((err) => console.error("[stripe/webhook] admin order alert FAILED:", err instanceof Error ? err.message : err));
      }

      // ── Event registration payment ──────────────────────────────────────
      if (registrationId) {
        const reg = await prisma.eventRegistration.update({
          where: { id: registrationId },
          data: {
            status: "paid",
            stripeSessionId: session.id,
          },
        });

        // Notify admin of confirmed sale
        sendAdminNewRegistrationAlert({
          firstName: reg.firstName,
          lastName: reg.lastName,
          email: reg.email,
          eventName: reg.eventName,
          confirmationNumber: reg.confirmationNumber ?? undefined,
          whatsapp: reg.whatsapp,
        }).then(() => {
          console.log(`[stripe/webhook] ✓ Admin alert sent for ${reg.confirmationNumber}`);
        }).catch((err) => {
          console.error(`[stripe/webhook] ✗ Admin alert FAILED:`, err instanceof Error ? err.message : err);
        });

        // Send the "You're in — let's build" welcome email now that payment
        // succeeded. firstName is captured from the registration record.
        console.log(`[stripe/webhook] Sending welcome email to ${reg.email} (reg: ${registrationId})`);
        await sendEventWelcomeEmail({
          firstName: reg.firstName,
          email: reg.email,
          eventName: reg.eventName,
          confirmationNumber: reg.confirmationNumber,
        }).then(() => {
          console.log(`[stripe/webhook] ✓ Welcome email sent to ${reg.email}`);
        }).catch((err) => {
          console.error(`[stripe/webhook] ✗ Welcome email FAILED for ${reg.email}:`, err instanceof Error ? err.message : err);
        });
      }

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
            serviceDuration: appt.serviceDuration,
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
            meetingLink: updated.zoomLink,
          }).catch((err) => console.error("[sendTiweNotification]", err)),
        ]);
      }
    }
  } catch (error) {
    console.error("[stripe/webhook] Event handling error", error);
  }

  return new Response("ok", { status: 200 });
}
