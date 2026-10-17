import type Stripe from "stripe";
import prisma from "@/lib/prisma";

// ── TIBLOGICS Learn subscription sync ───────────────────────────────────────
// Mirrors Stripe's subscription state into LearnSubscription. Grace is cleared
// whenever the subscription returns to a healthy state.
export async function upsertLearnSubscription(sub: Stripe.Subscription, studentIdArg?: string) {
  const studentId = studentIdArg ?? sub.metadata?.studentId;
  if (!studentId) return;

  const raw = sub.status; // trialing|active|past_due|canceled|incomplete|unpaid|...
  // A subscription whose first payment never settled was never paid for. It
  // used to fall through to past_due below, which carries a 7-day grace, so
  // an abandoned checkout granted a week of every track. Leave the row as it
  // is: an existing healthy subscription is not overwritten, and nothing is
  // granted to a new one. incomplete_expired still maps to canceled.
  if (raw === "incomplete") {
    console.log(`[stripe/webhook] Learn sub ${sub.id} incomplete (first payment not settled): no access`);
    return;
  }
  const status =
    raw === "active" || raw === "trialing" || raw === "past_due"
      ? raw
      : raw === "canceled" || raw === "incomplete_expired" || raw === "unpaid"
      ? "canceled"
      : "past_due";

  const periodEndUnix = (sub as unknown as { current_period_end?: number }).current_period_end;
  const currentPeriodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : null;
  const plan = sub.metadata?.plan === "annual" ? "annual" : "monthly";
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;

  // One row per learner, so two subscriptions (a second checkout, a
  // resubscribe while Stripe still retries the old card) must not fight over
  // it: a different subscription only replaces the row when it is at least as
  // healthy as the one recorded. An old subscription's cancellation can then
  // never cut off a learner whose newer subscription is paying.
  const RANK: Record<string, number> = { active: 2, trialing: 2, past_due: 1, canceled: 0 };
  const current = await prisma.learnSubscription.findUnique({ where: { studentId }, select: { status: true, stripeSubscriptionId: true } });
  if (current?.stripeSubscriptionId && current.stripeSubscriptionId !== sub.id && (RANK[status] ?? 0) < (RANK[current.status] ?? 0)) {
    console.log(`[stripe/webhook] Learn sub ${sub.id} (${status}) ignored: student keeps ${current.stripeSubscriptionId} (${current.status})`);
    return;
  }

  // Entering past_due starts a 7-day grace; returning to healthy clears it.
  // Staying past_due keeps the original deadline: any change to the
  // subscription (the learner toggling cancel-at-period-end in the billing
  // portal, say) fires customer.subscription.updated, and restarting the
  // window on each one would extend unpaid access indefinitely.
  let graceUntil: Date | null = null;
  if (status === "past_due") {
    const prev = await prisma.learnSubscription
      .findUnique({ where: { studentId }, select: { status: true, graceUntil: true, stripeSubscriptionId: true } })
      .catch(() => null);
    graceUntil =
      prev?.status === "past_due" && prev.graceUntil && prev.stripeSubscriptionId === sub.id
        ? prev.graceUntil
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  // A new subscription (resubscribing after a cancel) is on today's terms: the
  // tracks now sold separately are no longer included.
  const prevSub = await prisma.learnSubscription.findUnique({ where: { studentId }, select: { stripeSubscriptionId: true } }).catch(() => null);
  const newSubscription = !!prevSub?.stripeSubscriptionId && prevSub.stripeSubscriptionId !== sub.id;

  const data = {
    ...(newSubscription ? { allTracksLegacy: false } : {}),
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    status,
    plan,
    currentPeriodEnd,
    graceUntil,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
  };

  // Throws on a database error: the webhook answers 500 so Stripe retries.
  await prisma.learnSubscription.upsert({
    where: { studentId },
    create: { studentId, ...data },
    update: data,
  });
}
