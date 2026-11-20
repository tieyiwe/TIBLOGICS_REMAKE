import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import payments from "@/lib/payments";
import { requireStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import { trackSubscriptionCustomer } from "@/lib/learn/track-subscriptions";

const SITE = (
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com"
).replace(/\/$/, "");

export async function POST() {
  const { error, student } = await requireStudent();
  if (error) return error;
  const t = await getT();

  const sub = await prisma.learnSubscription
    .findUnique({ where: { studentId: student.id }, select: { stripeCustomerId: true, status: true } })
    .catch(() => null);

  // The customer of a live subscription: the all-tracks plan while it runs,
  // else a track's own monthly plan (so a learner who cancelled all tracks
  // but still pays for Vibe Coding reaches that subscription), else whatever
  // customer they have. New checkouts reuse one customer, so for anyone who
  // subscribes from now on these are the same.
  const allTracksLive = sub?.stripeCustomerId && sub.status !== "canceled" ? sub.stripeCustomerId : null;
  const customerId = allTracksLive ?? (await trackSubscriptionCustomer(student.id)) ?? sub?.stripeCustomerId ?? null;
  if (!customerId) {
    return NextResponse.json({ error: t("learn.api.noBilling") }, { status: 404 });
  }

  try {
    const { url } = await payments.createBillingPortal(
      customerId,
      `${SITE}/learn/account/subscription`,
    );
    return NextResponse.json({ url });
  } catch (err) {
    // See /api/learn/checkout — Stripe error text is internal detail.
    console.error("[POST /api/learn/billing-portal]", err);
    return NextResponse.json(
      { error: t("learn.api.portalFailed") },
      { status: 500 },
    );
  }
}
