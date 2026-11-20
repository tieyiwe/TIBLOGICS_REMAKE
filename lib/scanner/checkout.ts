import type { ScannerLead } from "@prisma/client";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import type { Locale } from "@/lib/i18n/config";
import { resolveCheckoutDiscount } from "@/lib/promotions/service";
import { recordAttribution } from "@/lib/growth/attribution";
import { reportPrice, SCANNER_PRODUCT } from "./config";

// Stripe checkout for the full report. The price comes from server
// configuration, never the request. The webhook (product "scanner-report")
// unlocks the scan; so does the buyer's return to the report page, which
// checks the session with Stripe (lib/scanner/unlock.ts markReportPaid).

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export async function startReportCheckout(
  lead: ScannerLead,
  locale: Locale,
  cookieHeader: string | null,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const price = reportPrice();
  if (!price) return { ok: false, error: "tools.sr.err.notOnSale" };
  if (!process.env.STRIPE_SECRET_KEY) return { ok: false, error: "tools.api.paymentsOff" };
  if (!lead.token) return { ok: false, error: "tools.api.checkoutFailed" };
  const metadata = { product: SCANNER_PRODUCT, leadId: lead.id };
  try {
    const discount = await resolveCheckoutDiscount({
      lines: [{ key: "other", amountCents: price }],
      recurring: false,
      buyer: { email: lead.email ?? undefined },
    });
    const report = `${SITE}/tools/scanner/report/${lead.token}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: price,
            product_data: {
              name: "TIBLOGICS Website Report",
              description: `Full report for ${lead.domain ?? lead.url}: fix steps, build ideas, PDF and a re-scan within 30 days`.slice(0, 300),
            },
          },
        },
      ],
      ...(lead.email ? { customer_email: lead.email } : {}),
      ...(discount.couponId ? { discounts: [{ coupon: discount.couponId }] } : discount.allowPromotionCodes ? { allow_promotion_codes: true } : {}),
      client_reference_id: lead.id,
      locale: locale === "fr" ? "fr" : "auto",
      success_url: `${report}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${report}?canceled=1`,
      metadata: { ...discount.metadata, ...metadata },
      payment_intent_data: { metadata },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    await prisma.scannerLead.update({ where: { id: lead.id }, data: { stripeSessionId: session.id } });
    await recordAttribution({ kind: "scanner", refId: lead.id, cookieHeader, amountCents: price }).catch(() => {});
    return { ok: true, url: session.url };
  } catch (err) {
    console.error("[scanner/checkout]", err instanceof Error ? err.message : err);
    return { ok: false, error: "tools.api.checkoutFailed" };
  }
}
