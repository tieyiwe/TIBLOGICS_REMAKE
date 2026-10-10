import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { ensureToolkitTables } from "./db";
import type { ToolkitPlan } from "./config";

// Stripe → ToolkitSubscription. Called from the webhook only.

function mapStatus(raw: Stripe.Subscription.Status): string {
  if (raw === "active" || raw === "trialing") return raw;
  if (raw === "canceled" || raw === "unpaid" || raw === "incomplete_expired") return "canceled";
  return "past_due";
}

export async function upsertToolkitSubscription(sub: Stripe.Subscription, studentIdArg?: string) {
  const studentId = studentIdArg ?? sub.metadata?.studentId;
  if (!studentId) return;
  await ensureToolkitTables();
  const plan: ToolkitPlan = sub.metadata?.plan === "guard" ? "guard" : "toolkit";
  const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
  const data = {
    plan,
    status: mapStatus(sub.status),
    stripeSubscriptionId: sub.id,
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
  };
  // A later event for an older, replaced subscription must not overwrite the
  // current one: only the row that holds this subscription id, or a row with
  // no live subscription, is updated.
  const existing = await prisma.toolkitSubscription.findUnique({ where: { studentId } });
  if (existing?.stripeSubscriptionId && existing.stripeSubscriptionId !== sub.id && ["active", "trialing", "past_due"].includes(existing.status)) {
    return;
  }
  await prisma.toolkitSubscription.upsert({ where: { studentId }, create: { studentId, ...data }, update: data });
}
