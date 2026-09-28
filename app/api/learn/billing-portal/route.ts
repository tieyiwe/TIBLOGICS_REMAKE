import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import payments from "@/lib/payments";
import { requireStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";

const SITE = (
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com"
).replace(/\/$/, "");

export async function POST() {
  const { error, student } = await requireStudent();
  if (error) return error;
  const t = await getT();

  const sub = await prisma.learnSubscription
    .findUnique({ where: { studentId: student.id }, select: { stripeCustomerId: true } })
    .catch(() => null);

  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: t("learn.api.noBilling") }, { status: 404 });
  }

  try {
    const { url } = await payments.createBillingPortal(
      sub.stripeCustomerId,
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
