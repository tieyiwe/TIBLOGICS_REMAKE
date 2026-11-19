import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { sendSalesAlertEmail } from "@/lib/resend";

// Refunds and chargebacks (Stripe webhook: charge.refunded,
// charge.dispute.created). Before this, a refunded or disputed payment kept
// everything it had bought.
//
// A FULL refund, or any dispute, of a one-time purchase takes it back:
//   Learning Box track (lifetime), sponsored lifetime place  → access removed
//   store order → "refunded" (its downloads stop working)
//   event seats → "refunded"; appointment → cancelled
//   website scanner report → locked again; Automation Blueprint → "refunded"
// A subscription payment:
//   dispute → the subscription is cancelled now (the usual cancellation
//             handling then removes access)
//   refund  → nothing automatic (often a goodwill gesture): the owner decides
//             in Stripe, and the alert says so.
// A partial refund changes nothing. Every case emails the sales inbox.

type Kind = "refund" | "dispute";

const piOf = (charge: Stripe.Charge) =>
  typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id ?? null;

export async function handleChargeReversal(kind: Kind, charge: Stripe.Charge): Promise<void> {
  if (kind === "refund" && !(charge.refunded || charge.amount_refunded >= charge.amount)) return; // partial refund
  const pi = piOf(charge);
  const done: string[] = [];

  // A subscription payment (an invoice's charge).
  const invoiceId = (charge as unknown as { invoice?: string | { id: string } | null }).invoice;
  const invId = typeof invoiceId === "string" ? invoiceId : invoiceId?.id ?? null;
  if (invId) {
    const invoice = await stripe.invoices.retrieve(invId).catch(() => null);
    const raw = invoice as unknown as { subscription?: string | { id: string } | null; parent?: { subscription_details?: { subscription?: string } } } | null;
    const subId =
      (typeof raw?.subscription === "string" ? raw.subscription : raw?.subscription?.id) ?? raw?.parent?.subscription_details?.subscription ?? null;
    if (subId && kind === "dispute") {
      await stripe.subscriptions.cancel(subId).catch((err) => console.error("[refunds] cancel subscription", subId, err instanceof Error ? err.message : err));
      done.push(`Subscription ${subId} cancelled (the cancellation removes access).`);
    } else if (subId) {
      done.push(`Subscription ${subId} payment refunded. Access is unchanged: cancel the subscription in Stripe if it should end.`);
    }
  }

  // A one-time checkout.
  const session = pi
    ? (await stripe.checkout.sessions.list({ payment_intent: pi, limit: 1 }).catch(() => null))?.data[0] ?? null
    : null;
  if (session && session.mode === "payment") {
    const sid = session.id;
    const tracks = await prisma.trackPurchase.deleteMany({ where: { OR: [{ stripeSessionId: sid }, ...(pi ? [{ stripePaymentIntent: pi }] : [])] } });
    if (tracks.count) done.push(`${tracks.count} track purchase(s) removed (lifetime access ended).`);
    const sponsor = await prisma.youthSponsorship.updateMany({ where: { stripeSessionId: sid }, data: { status: "refunded" } }).catch(() => ({ count: 0 }));
    if (sponsor.count) done.push("Youth sponsorship marked refunded.");
    const orders = await prisma.order.updateMany({ where: { stripeSessionId: sid, status: { in: ["paid", "fulfilled"] } }, data: { status: "refunded" } });
    if (orders.count) done.push("Store order marked refunded (downloads stop).");
    const regs = await prisma.eventRegistration.updateMany({ where: { stripeSessionId: sid, status: "paid" }, data: { status: "refunded" } });
    if (regs.count) done.push(`${regs.count} event seat(s) marked refunded.`);
    const appts = await prisma.appointment.updateMany({ where: { stripeSessionId: sid }, data: { paymentStatus: "refunded", status: "CANCELLED" } });
    if (appts.count) done.push("Appointment cancelled.");
    const scans = await prisma.scannerLead.updateMany({ where: { stripeSessionId: sid, unlockedAt: { not: null } }, data: { unlockedAt: null, unlockSource: null } });
    if (scans.count) done.push("Website scanner report locked again.");
    const bps = await prisma.blueprint.updateMany({ where: { stripeSessionId: sid, status: { not: "refunded" } }, data: { status: "refunded" } });
    if (bps.count) done.push("Automation Blueprint marked refunded.");
  }

  const amount = `${(charge.amount / 100).toFixed(2)} ${charge.currency.toUpperCase()}`;
  const who = charge.billing_details?.email ?? (session?.customer_details?.email ?? "unknown");
  console.log(`[refunds] ${kind} ${charge.id}: ${done.join(" ") || "no matching purchase"}`);
  await sendSalesAlertEmail(
    kind === "dispute" ? `Chargeback opened: ${amount}` : `Refund: ${amount}`,
    `<p>${kind === "dispute" ? "A customer disputed a payment." : "A payment was fully refunded."}</p>
     <p>Charge ${charge.id} · ${amount} · ${String(who).replace(/[<>&"']/g, "")}</p>
     <ul>${(done.length ? done : ["No purchase on this site matched this payment; nothing was changed."]).map((d) => `<li>${d}</li>`).join("")}</ul>`,
  ).catch((err) => console.error("[refunds] alert email", err instanceof Error ? err.message : err));
}
