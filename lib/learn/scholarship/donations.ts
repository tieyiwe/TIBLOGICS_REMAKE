import { createHmac, randomUUID } from "crypto";
import type Stripe from "stripe";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { isLocale } from "@/lib/i18n/config";
import { secretEquals } from "@/lib/require-admin";
import { ensureScholarshipTables } from "./db";
import { sendDonationAlert, sendDonationThanks } from "./emails";

// Gifts to the Tilo Vision Scholarship fund, from the donate box (ARFA, the
// scholarship page, Partners, About): one time or monthly, through Stripe
// Checkout. The first payment is recorded and thanked by email (once, keyed
// on the Stripe session); each monthly renewal is recorded from its invoice.

export const DONATION_PRODUCT = "scholarship-donation";
export const DONATION_MIN_CENTS = 500;
export const DONATION_MAX_CENTS = 1_000_000;
export type Frequency = "once" | "monthly";

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");
/** Where the donate box was: the donor comes back there if they cancel. */
export const DONATE_FROM = { arfa: "/learning-box", scholarship: "/tilo-vision-scholarship", about: "/about", partners: "/contact", products: "/products" } as const;
export type DonateFrom = keyof typeof DONATE_FROM;

export async function createDonationCheckout(d: { amountCents: number; frequency: Frequency; locale: string; from: DonateFrom }): Promise<string> {
  const metadata = { product: DONATION_PRODUCT, frequency: d.frequency, locale: isLocale(d.locale) ? d.locale : "en" };
  const product_data = {
    name: "Tilo Vision Scholarship fund",
    description:
      d.frequency === "monthly"
        ? "Monthly gift that helps people gain practical AI skills through ARFA, the TIBLOGICS AI Academy."
        : "Gift that helps people gain practical AI skills through ARFA, the TIBLOGICS AI Academy.",
  };
  const common = {
    success_url: `${SITE}/tilo-vision-scholarship/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE}${DONATE_FROM[d.from]}?donation=cancelled`,
    metadata,
    allow_promotion_codes: false,
    locale: (d.locale === "fr" ? "fr" : d.locale === "sw" ? "auto" : "en") as Stripe.Checkout.SessionCreateParams.Locale,
  };
  const session =
    d.frequency === "monthly"
      ? await stripe.checkout.sessions.create({
          ...common,
          mode: "subscription",
          line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: d.amountCents, recurring: { interval: "month" }, product_data } }],
          subscription_data: { metadata },
        })
      : await stripe.checkout.sessions.create({
          ...common,
          mode: "payment",
          submit_type: "donate",
          customer_creation: "always",
          line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: d.amountCents, product_data } }],
          payment_intent_data: { metadata },
        });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

/** A signed link to manage (change or stop) a monthly gift: Stripe's billing portal. */
const manageSig = (customerId: string) => createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "dev").update(`donation-manage:${customerId}`).digest("base64url").slice(0, 32);
export const manageUrl = (customerId: string) => `${SITE}/api/scholarship/donate/manage?c=${encodeURIComponent(customerId)}&s=${manageSig(customerId)}`;
export const manageLinkValid = (customerId: string, sig: string) => /^cus_[A-Za-z0-9]{6,64}$/.test(customerId) && secretEquals(sig, manageSig(customerId));

const idOf = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : v?.id ?? null);

/**
 * A completed donation checkout (webhook, or the donor's return to the thank
 * you page). Records it once and sends the thank-you then. Returns the row.
 */
export async function recordDonation(session: Stripe.Checkout.Session): Promise<{ amountCents: number; frequency: Frequency; name: string | null } | null> {
  if (session.metadata?.product !== DONATION_PRODUCT) return null;
  const paid = session.payment_status === "paid" || (session.status === "complete" && session.payment_status === "no_payment_required");
  if (!paid) return null;
  await ensureScholarshipTables();
  const frequency: Frequency = session.metadata?.frequency === "monthly" ? "monthly" : "once";
  const email = (session.customer_details?.email ?? session.customer_email ?? "").trim().toLowerCase() || null;
  const name = session.customer_details?.name?.trim().slice(0, 120) || null;
  const locale = isLocale(session.metadata?.locale) ? session.metadata!.locale : "en";
  const amountCents = session.amount_total ?? 0;
  const customerId = idOf(session.customer as string | { id: string } | null);
  const n = await prisma.$executeRaw`
    INSERT INTO "ScholarshipDonation" ("id", "frequency", "stage", "amountCents", "currency", "email", "name", "locale", "stripeSessionId", "stripeSubscriptionId", "stripeCustomerId")
    VALUES (${randomUUID()}, ${frequency}, 'first', ${amountCents}, ${(session.currency ?? "usd").toLowerCase()}, ${email}, ${name}, ${locale}, ${session.id},
            ${idOf(session.subscription as string | { id: string } | null)}, ${customerId})
    ON CONFLICT DO NOTHING`;
  if (n > 0) {
    // Claimed by the insert: thank once, whichever path got here first.
    if (email) {
      await sendDonationThanks({ email, name, locale, amountCents, frequency, manage: frequency === "monthly" && customerId ? manageUrl(customerId) : null })
        .then(() => prisma.scholarshipDonation.updateMany({ where: { stripeSessionId: session.id }, data: { thankedAt: new Date() } }))
        .catch((err) => console.error("[donation] thank-you email", err instanceof Error ? err.message : err));
    }
    await sendDonationAlert({ name, email, amountCents, frequency }).catch((err) => console.error("[donation] alert", err instanceof Error ? err.message : err));
  }
  return { amountCents, frequency, name };
}

/** A monthly gift renewed (invoice paid after the first). */
export async function recordDonationRenewal(invoice: Stripe.Invoice): Promise<void> {
  const inv = invoice as unknown as {
    id: string;
    amount_paid: number;
    currency: string;
    billing_reason?: string;
    customer?: string | { id: string } | null;
    customer_email?: string | null;
    subscription?: string | { id: string } | null;
    subscription_details?: { metadata?: Record<string, string> } | null;
    parent?: { subscription_details?: { metadata?: Record<string, string>; subscription?: string } | null } | null;
  };
  const meta = inv.parent?.subscription_details?.metadata ?? inv.subscription_details?.metadata ?? {};
  if (meta.product !== DONATION_PRODUCT || inv.billing_reason === "subscription_create" || !inv.amount_paid) return;
  await ensureScholarshipTables();
  const subId = idOf(inv.subscription ?? null) ?? inv.parent?.subscription_details?.subscription ?? null;
  await prisma.$executeRaw`
    INSERT INTO "ScholarshipDonation" ("id", "frequency", "stage", "amountCents", "currency", "email", "locale", "stripeInvoiceId", "stripeSubscriptionId", "stripeCustomerId")
    VALUES (${randomUUID()}, 'monthly', 'renewal', ${inv.amount_paid}, ${(inv.currency ?? "usd").toLowerCase()}, ${inv.customer_email?.toLowerCase() ?? null},
            ${isLocale(meta.locale) ? meta.locale : "en"}, ${inv.id}, ${subId}, ${idOf(inv.customer ?? null)})
    ON CONFLICT DO NOTHING`;
}

/** A monthly gift stopped. */
export async function markDonationCanceled(sub: Stripe.Subscription): Promise<void> {
  if (sub.metadata?.product !== DONATION_PRODUCT || sub.status !== "canceled") return;
  await ensureScholarshipTables();
  await prisma.scholarshipDonation.updateMany({ where: { stripeSubscriptionId: sub.id, stage: "first", canceledAt: null }, data: { canceledAt: new Date() } });
}

export interface DonationSummary {
  raisedCents: number;
  donors: number;
  monthlyActive: number;
  monthlyCents: number;
  recent: Array<{ id: string; at: Date; name: string | null; email: string | null; amountCents: number; frequency: string; stage: string; canceled: boolean }>;
}

export async function donationSummary(): Promise<DonationSummary> {
  await ensureScholarshipTables();
  const [sum, donors, monthly, recent] = await Promise.all([
    prisma.scholarshipDonation.aggregate({ _sum: { amountCents: true } }),
    prisma.scholarshipDonation.findMany({ where: { stage: "first" }, distinct: ["email"], select: { email: true } }),
    prisma.scholarshipDonation.findMany({ where: { stage: "first", frequency: "monthly", canceledAt: null }, select: { amountCents: true } }),
    prisma.scholarshipDonation.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return {
    raisedCents: sum._sum.amountCents ?? 0,
    donors: donors.length,
    monthlyActive: monthly.length,
    monthlyCents: monthly.reduce((n, m) => n + m.amountCents, 0),
    recent: recent.map((r) => ({ id: r.id, at: r.createdAt, name: r.name, email: r.email, amountCents: r.amountCents, frequency: r.frequency, stage: r.stage, canceled: !!r.canceledAt })),
  };
}
