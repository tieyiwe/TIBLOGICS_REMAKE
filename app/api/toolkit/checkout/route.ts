import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensureToolkitTables } from "@/lib/toolkit/db";
import { toolkitPlans, TOOLKIT_PRODUCT, type ToolkitPlan } from "@/lib/toolkit/config";
import { getT } from "@/lib/i18n/server";
import { recordAttribution } from "@/lib/growth/attribution";
import { resolveCheckoutDiscount } from "@/lib/promotions/service";

// Starts a Toolkit Live or Compliance Guard subscription for the signed-in
// account. The price comes only from server configuration.

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const t = await getT();
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: t("toolkit.api.signIn") }, { status: 401 });
  if (!(await checkRateLimit(`toolkit-checkout:${student.id}`, 10, 3_600_000))) {
    return NextResponse.json({ error: t("toolkit.api.tooManyAttempts") }, { status: 429 });
  }

  const { plan: planId } = await req.json().catch(() => ({}));
  const plans = toolkitPlans();
  const plan = plans[planId as ToolkitPlan];
  if (!plan) return NextResponse.json({ error: t("toolkit.api.choosePlan") }, { status: 400 });
  if (!plan.amount) return NextResponse.json({ error: t("toolkit.api.notOnSale", { plan: plan.name }) }, { status: 503 });
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: t("toolkit.api.paymentsOff") }, { status: 503 });

  await ensureToolkitTables();
  const existing = await prisma.toolkitSubscription.findUnique({ where: { studentId: student.id } });
  if (existing && ["active", "trialing", "past_due"].includes(existing.status)) {
    return NextResponse.json(
      { error: t("toolkit.api.alreadySubscribed") },
      { status: 409 },
    );
  }

  const lineItem = plan.priceId
    ? { price: plan.priceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: plan.amount,
          recurring: { interval: "month" as const },
          product_data: { name: `TIBLOGICS ${plan.name}`, description: plan.blurb },
        },
      };
  const metadata = { product: TOOLKIT_PRODUCT, studentId: student.id, plan: plan.id };

  try {
    const discount = await resolveCheckoutDiscount({
      lines: [{ key: "toolkit", id: plan.id, amountCents: plan.amount }],
      recurring: true,
      buyer: { studentId: student.id, email: student.email },
    });
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [lineItem as never],
      customer: existing?.stripeCustomerId ?? undefined,
      customer_email: existing?.stripeCustomerId ? undefined : student.email,
      ...(discount.couponId ? { discounts: [{ coupon: discount.couponId }] } : discount.allowPromotionCodes ? { allow_promotion_codes: true } : {}),
      client_reference_id: student.id,
      success_url: `${SITE}/toolkit?welcome=1`,
      cancel_url: `${SITE}/tools/toolkit-live?canceled=1`,
      metadata: { ...discount.metadata, ...metadata },
      subscription_data: { metadata },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    await recordAttribution({ kind: "toolkit_checkout", refId: student.id, cookieHeader: req.headers.get("cookie"), headers: req.headers, amountCents: plan.amount });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[toolkit/checkout]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: t("toolkit.api.checkoutFailed") }, { status: 502 });
  }
}
