import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { checkRateLimit, isValidEmail } from "@/lib/require-admin";
import { ensureMonitorTables } from "@/lib/monitor/db";
import { monitorPricing, MONITOR_PRODUCT } from "@/lib/monitor/config";
import { validateSites } from "@/lib/monitor/sites";
import { hashMonitorToken, monitorToken, newTokenSalt } from "@/lib/monitor/token";

// Starts a Readiness Monitor subscription.
//
// The subscription row is created as `pending` before Stripe, so the webhook
// has something to activate; a checkout that is abandoned leaves a pending row
// that nothing scans and no link opens. The price comes only from server
// configuration — nothing in the request body can change what is charged.

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`monitor-checkout:${ip}`, 10, 3_600_000))) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const pricing = monitorPricing();
  if (!pricing) {
    return NextResponse.json({ error: "The Readiness Monitor is not on sale yet. Join the waitlist and we'll tell you when it opens." }, { status: 503 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  }

  let body: { email?: unknown; name?: unknown; siteUrl?: unknown; competitors?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!isValidEmail(body.email)) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  const email = body.email.trim().toLowerCase();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) || null : null;

  const sites = await validateSites(body.siteUrl, body.competitors);
  if (!sites.ok) return NextResponse.json({ error: sites.error }, { status: 400 });

  await ensureMonitorTables();

  const tokenSalt = newTokenSalt();
  const sub = await prisma.monitorSubscription.create({
    data: {
      email,
      name,
      siteUrl: sites.siteUrl,
      competitors: sites.competitors,
      status: "pending",
      tokenSalt,
      // Placeholder until the id exists; replaced just below. The link is not
      // sent to anyone until payment clears.
      tokenHash: hashMonitorToken(newTokenSalt()),
    },
  });
  await prisma.monitorSubscription.update({
    where: { id: sub.id },
    data: { tokenHash: hashMonitorToken(monitorToken(sub.id, tokenSalt)) },
  });

  const lineItem = pricing.priceId
    ? { price: pricing.priceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: pricing.currency.toLowerCase(),
          unit_amount: pricing.amount,
          recurring: { interval: pricing.interval },
          product_data: {
            name: "TIBLOGICS Readiness Monitor",
            description: `Weekly AI-readiness scans of your site and up to 3 competitors`,
          },
        },
      };

  const metadata = { product: MONITOR_PRODUCT, monitorId: sub.id };
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [lineItem as never],
      customer_email: email,
      allow_promotion_codes: true,
      client_reference_id: sub.id,
      success_url: `${SITE_URL}/tools/readiness-monitor?welcome=1`,
      cancel_url: `${SITE_URL}/tools/readiness-monitor?canceled=1`,
      metadata,
      subscription_data: { metadata },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[monitor/checkout]", err instanceof Error ? err.message : err);
    await prisma.monitorSubscription.delete({ where: { id: sub.id } }).catch(() => {});
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
  }
}
