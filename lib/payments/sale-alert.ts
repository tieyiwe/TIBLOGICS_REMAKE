import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { sendSalesAlertEmail } from "@/lib/resend";

// "You made a sale": one email to sales@tiblogics.com for every payment on
// the platform (any Stripe Checkout that is paid, and each subscription
// renewal). Sent once per payment: a retried webhook finds the row in
// "SaleAlert" and stays quiet. Never throws; the webhook's work comes first.

let ready: Promise<void> | null = null;
export function ensureSaleAlertTable(): Promise<void> {
  ready ??= prisma
    .$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "SaleAlert" ("id" TEXT PRIMARY KEY, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
    .then(() => undefined)
    .catch((err) => {
      ready = null;
      throw err;
    });
  return ready;
}

const LABELS: Record<string, string> = {
  learn: "ARFA monthly plan (all tracks)",
  "learn-track": "ARFA track (one time, lifetime)",
  "learn-team": "ARFA team plan",
  "scholarship-donation": "Tilo Vision Scholarship donation",
  "automation-blueprint": "Automation Blueprint",
  "scanner-report": "Website scanner full report",
  "toolkit-live": "Toolkit Live subscription",
  "readiness-monitor": "Readiness Monitor subscription",
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() || "USD" }).format(cents / 100);

/** Claims the alert for this payment id; false if it was already sent. */
async function claim(id: string): Promise<boolean> {
  await ensureSaleAlertTable();
  const n = await prisma.$executeRawUnsafe(`INSERT INTO "SaleAlert" ("id") VALUES ($1) ON CONFLICT ("id") DO NOTHING`, id);
  return n > 0;
}

async function send(a: { id: string; what: string; amountCents: number; currency: string; email: string | null; name: string | null; detail: string[] }) {
  if (!(await claim(a.id))) return;
  const amount = money(a.amountCents, a.currency);
  const row = (k: string, v: string) => `<tr><td style="padding:6px 0;color:#8A9BA0;">${k}</td><td style="padding:6px 0;text-align:right;">${v}</td></tr>`;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
    <h2 style="color:#131A1B;font-size:18px;margin:0 0 4px;">New payment: ${esc(amount)}</h2>
    <p style="color:#5A6E84;font-size:14px;margin:0 0 14px;">${esc(a.what)}</p>
    <table style="width:100%;font-size:14px;color:#131A1B;border-collapse:collapse;">
      ${row("Amount", `<strong>${esc(amount)}</strong>`)}
      ${row("Customer", esc(a.name ?? "–"))}
      ${row("Email", esc(a.email ?? "–"))}
      ${a.detail.map((d) => { const [k, ...v] = d.split(": "); return row(esc(k), esc(v.join(": "))); }).join("")}
      ${row("Stripe reference", esc(a.id))}
    </table>
  </div>`;
  try {
    await sendSalesAlertEmail(`💰 ${amount}: ${a.what}`, html);
  } catch (err) {
    // Not sent: free the claim so a Stripe retry can try again.
    await prisma.$executeRawUnsafe(`DELETE FROM "SaleAlert" WHERE "id" = $1`, a.id).catch(() => {});
    throw err;
  }
}

/** A paid Checkout session (call on checkout.session.completed and async_payment_succeeded). */
export async function alertCheckoutSale(session: Stripe.Checkout.Session): Promise<void> {
  try {
    if (session.payment_status !== "paid" || !session.amount_total) return;
    const m = session.metadata ?? {};
    let what = (m.product && LABELS[m.product]) || "";
    const detail: string[] = [];
    if (m.product === "learn-track" && m.trackId) {
      const t = await prisma.learnTrack.findUnique({ where: { id: m.trackId }, select: { title: true } }).catch(() => null);
      if (t) detail.push(`Track: ${t.title}`);
      if (m.scholarshipCode) detail.push(`Scholarship: ${m.scholarshipCode}`);
    }
    if (m.orderId) {
      what = "Shop order";
      const o = await prisma.order.findUnique({ where: { id: m.orderId }, select: { orderNumber: true } }).catch(() => null);
      if (o) detail.push(`Order: ${o.orderNumber}`);
    }
    if (m.registrationId) {
      what = "Event registration";
      const r = await prisma.eventRegistration.findUnique({ where: { id: m.registrationId }, select: { eventName: true } }).catch(() => null);
      if (r) detail.push(`Event: ${r.eventName}`);
    }
    if (m.appointmentId) {
      what = "Paid consultation booking";
      const ap = await prisma.appointment.findUnique({ where: { id: m.appointmentId }, select: { serviceType: true } }).catch(() => null);
      if (ap) detail.push(`Service: ${ap.serviceType}`);
    }
    if (session.total_details?.amount_discount) detail.push(`Discount: ${money(session.total_details.amount_discount, session.currency ?? "usd")}`);
    if (session.mode === "subscription") detail.push("Billing: first payment of a subscription");
    await send({
      id: session.id,
      what: what || "Payment",
      amountCents: session.amount_total,
      currency: session.currency ?? "usd",
      email: session.customer_details?.email ?? session.customer_email ?? null,
      name: session.customer_details?.name ?? null,
      detail,
    });
  } catch (err) {
    console.error("[sale-alert] checkout", err instanceof Error ? err.message : err);
  }
}

/** A subscription renewal (invoice.paid). The first invoice is covered by the checkout alert. */
export async function alertInvoiceSale(invoice: Stripe.Invoice): Promise<void> {
  try {
    if (invoice.billing_reason !== "subscription_cycle" || !invoice.amount_paid || !invoice.id) return;
    const product =
      (invoice as unknown as { subscription_details?: { metadata?: Record<string, string> } }).subscription_details?.metadata?.product ??
      invoice.lines?.data?.[0]?.metadata?.product ??
      "";
    await send({
      id: invoice.id,
      what: `${LABELS[product] ?? "Subscription"}: renewal`,
      amountCents: invoice.amount_paid,
      currency: invoice.currency ?? "usd",
      email: invoice.customer_email ?? null,
      name: invoice.customer_name ?? null,
      detail: ["Billing: monthly renewal"],
    });
  } catch (err) {
    console.error("[sale-alert] invoice", err instanceof Error ? err.message : err);
  }
}
