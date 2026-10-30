import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { findMonitorByToken } from "@/lib/monitor/access";
import { monitorLink } from "@/lib/monitor/token";
import { getLocale, translatorFor } from "@/lib/i18n/server";

// Stripe's hosted portal: update the card, see invoices, cancel.

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const locale = await getLocale();
  const t = translatorFor(locale);
  const sub = await findMonitorByToken(token);
  if (!sub) return NextResponse.json({ error: t("tools.api.notFound") }, { status: 404 });
  if (!sub.stripeCustomerId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: t("tools.monitor.api.billingUnavailable") }, { status: 409 });
  }
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: await monitorLink(sub),
      locale: locale === "fr" ? "fr" : "auto",
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("[monitor/billing]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: t("tools.monitor.api.billingFailed") }, { status: 502 });
  }
}
