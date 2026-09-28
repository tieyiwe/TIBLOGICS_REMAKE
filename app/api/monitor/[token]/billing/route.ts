import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { findMonitorByToken } from "@/lib/monitor/access";
import { monitorLink } from "@/lib/monitor/token";

// Stripe's hosted portal: update the card, see invoices, cancel.

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sub = await findMonitorByToken(token);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!sub.stripeCustomerId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Billing is not available for this subscription. Email info@tiblogics.com." }, { status: 409 });
  }
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: await monitorLink(sub),
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("[monitor/billing]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not open billing. Please try again." }, { status: 502 });
  }
}
