import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { stripeCodeBoxAllowed } from "@/lib/promotions/service";
import { checkRateLimit, isValidEmail } from "@/lib/require-admin";
import { ensureMonitorTables } from "@/lib/monitor/db";
import { monitorPricing, MONITOR_PRODUCT } from "@/lib/monitor/config";
import { validateSites } from "@/lib/monitor/sites";
import { hashMonitorToken, monitorToken, newTokenSalt } from "@/lib/monitor/token";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { MAX_COMPETITORS } from "@/lib/monitor/config";

// Starts a Readiness Monitor subscription.
//
// The subscription row is created as `pending` before Stripe, so the webhook
// has something to activate; a checkout that is abandoned leaves a pending row
// that nothing scans and no link opens. The price comes only from server
// configuration — nothing in the request body can change what is charged.

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const locale = await getLocale();
  const t = translatorFor(locale);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`monitor-checkout:${ip}`, 10, 3_600_000))) {
    return NextResponse.json({ error: t("tools.api.tooManyAttempts") }, { status: 429 });
  }

  const pricing = monitorPricing();
  if (!pricing) {
    return NextResponse.json({ error: t("tools.monitor.api.notOnSale") }, { status: 503 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: t("tools.api.paymentsOff") }, { status: 503 });
  }

  let body: { email?: unknown; name?: unknown; siteUrl?: unknown; competitors?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: t("tools.api.invalidRequest") }, { status: 400 });
  }

  if (!isValidEmail(body.email)) return NextResponse.json({ error: t("tools.api.invalidEmail") }, { status: 400 });
  const email = body.email.trim().toLowerCase();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) || null : null;

  const sites = await validateSites(body.siteUrl, body.competitors, t);
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
            description: t("tools.monitor.api.stripeDesc", { n: MAX_COMPETITORS }),
          },
        },
      };

  const metadata = { product: MONITOR_PRODUCT, monitorId: sub.id };
  try {
    // Not a promotion scope: Stripe's code box shows only when no admin code
    // could be misapplied here (lib/promotions stripeCodeBoxAllowed).
    const codeBox = await stripeCodeBoxAllowed([{ key: "other", amountCents: 0 }]);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [lineItem as never],
      customer_email: email,
      ...(codeBox ? { allow_promotion_codes: true } : {}),
      client_reference_id: sub.id,
      // Stripe has French; for Swahili it follows the browser.
      locale: locale === "fr" ? "fr" : "auto",
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
    return NextResponse.json({ error: t("tools.api.checkoutFailed") }, { status: 502 });
  }
}
