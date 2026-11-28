import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { ensureMonitorTables } from "./db";
import { monitorLink } from "./token";
import { sendMonitorWelcomeEmail } from "./email";
import { runMonitor } from "./run";

// Stripe → MonitorSubscription. Called from the webhook only.

function mapStatus(raw: Stripe.Subscription.Status): string {
  if (raw === "active" || raw === "trialing") return "active";
  if (raw === "canceled" || raw === "unpaid" || raw === "incomplete_expired") return "canceled";
  return "past_due";
}

function periodEnd(sub: Stripe.Subscription): Date | null {
  const unix = (sub as unknown as { current_period_end?: number }).current_period_end;
  return unix ? new Date(unix * 1000) : null;
}

/**
 * Checkout finished: turn the pending row on, send the link, start the first scan.
 *
 * Only a `pending` row is activated, in one conditional update, so a Stripe
 * retry of the same event (or two deliveries racing) sends one welcome email
 * and starts one scan, not two.
 */
export async function activateMonitor(monitorId: string, sub: Stripe.Subscription) {
  await ensureMonitorTables();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  const activated = await prisma.monitorSubscription.updateMany({
    where: { id: monitorId, status: "pending" },
    data: {
      status: mapStatus(sub.status),
      stripeSubscriptionId: sub.id,
      stripeCustomerId: customerId,
      currentPeriodEnd: periodEnd(sub),
      nextRunAt: new Date(),
    },
  });
  if (activated.count === 0) return;

  const row = await prisma.monitorSubscription.findUnique({ where: { id: monitorId } });
  if (!row) return;

  await sendMonitorWelcomeEmail({
    email: row.email,
    name: row.name,
    siteUrl: row.siteUrl,
    link: await monitorLink(row),
  }).catch((err) => console.error("[monitor] welcome email failed", monitorId, err instanceof Error ? err.message : err));

  // Not awaited: the webhook has to answer Stripe promptly. If this process
  // dies first, nextRunAt is already due and the hourly cron picks it up.
  if (row.status === "active") {
    runMonitor(monitorId).catch((err) =>
      console.error("[monitor] first run failed", monitorId, err instanceof Error ? err.message : err),
    );
  }
}

/**
 * Renewals, failed payments, cancellations. Matched by Stripe subscription id,
 * so an event for a checkout that has not completed yet changes nothing and
 * cannot activate a row without the welcome email.
 */
export async function syncMonitorSubscription(sub: Stripe.Subscription) {
  await ensureMonitorTables();
  await prisma.monitorSubscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: { status: mapStatus(sub.status), currentPeriodEnd: periodEnd(sub) },
  });
}
