import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { ensureToolkitTables } from "@/lib/toolkit/db";
import { getT } from "@/lib/i18n/server";

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

// Stripe's hosted portal: card, invoices, cancel.
export async function POST() {
  const t = await getT();
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: t("toolkit.api.signIn") }, { status: 401 });
  await ensureToolkitTables();
  const sub = await prisma.toolkitSubscription.findUnique({ where: { studentId: student.id } });
  if (!sub?.stripeCustomerId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: t("toolkit.api.noBilling") }, { status: 404 });
  }
  try {
    const portal = await stripe.billingPortal.sessions.create({ customer: sub.stripeCustomerId, return_url: `${SITE}/toolkit` });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("[toolkit/billing]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: t("toolkit.api.billingFailed") }, { status: 502 });
  }
}
