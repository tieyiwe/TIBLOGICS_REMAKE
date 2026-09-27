import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import payments from "@/lib/payments";
import { requireStudent } from "@/lib/learn/session";

const SITE = (
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com"
).replace(/\/$/, "");

export async function POST() {
  const { error, student } = await requireStudent();
  if (error) return error;

  const sub = await prisma.learnSubscription
    .findUnique({ where: { studentId: student.id }, select: { stripeCustomerId: true } })
    .catch(() => null);

  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 404 });
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
      { error: "Could not open the billing portal. Please try again or contact support." },
      { status: 500 },
    );
  }
}
