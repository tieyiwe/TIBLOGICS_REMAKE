import { createHmac, randomBytes } from "crypto";
import type Stripe from "stripe";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { authOptions } from "@/lib/auth";
import { secretEquals, escapeHtml } from "@/lib/require-admin";
import { mailTransport, MAIL_FROM } from "@/lib/resend";
import { normEmail } from "@/lib/growth/outreach/normalize";
import { resolveCheckoutDiscount } from "@/lib/promotions/service";
import { formatMoney } from "@/lib/blueprint/config";
import type { Locale } from "@/lib/i18n/config";
import { translatorFor } from "@/lib/i18n/server";
import { sameOrigin } from "@/lib/learn/account-status/admin-auth";

// The calculator's paid Full Plan: the build budget, pricing and break-even,
// growth scenarios, savings recommendations, exports and more AI estimates.
// The running-cost calculator stays free.
//
//   CALCULATOR_PLAN_PRICE_CENTS  one-time price (default 1900 = $19; "0" takes it off sale)
//   CALCULATOR_PLAN_DAYS         how long a plan lasts (default 365)
//
// A plan is a CalculatorPass row. Access is a signed key, "<passId>.<sig>",
// with sig an HMAC of NEXTAUTH_SECRET over the id: nothing secret is stored,
// and a refund (status "refunded") or the expiry date ends access whatever
// the key. The key reaches the buyer two ways: an httpOnly cookie set when
// they come back from Stripe, and a link in the confirmation email for their
// other devices. Staff (owner, admins, team members) always have the plan.

export const PLAN_PRODUCT = "calculator-plan";
export const PLAN_COOKIE = "tib_calc_plan";

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");
export const CALCULATOR_PATH = "/tools/calculator";

export function planPrice(): number | null {
  const raw = process.env.CALCULATOR_PLAN_PRICE_CENTS;
  if (raw === undefined || raw === "") return 1900;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 100 ? n : null;
}

export function planDays(): number {
  const n = Number(process.env.CALCULATOR_PLAN_DAYS);
  return Number.isInteger(n) && n >= 1 && n <= 3650 ? n : 365;
}

// ---------------------------------------------------------------------------
// Table (runtime DDL, like the other tables; listed in db-prepare)
// ---------------------------------------------------------------------------

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "CalculatorPass" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripeSessionId" TEXT,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "emailedAt" TIMESTAMP(3),
    CONSTRAINT "CalculatorPass_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CalculatorPass_stripeSessionId_key" ON "CalculatorPass"("stripeSessionId")`,
  `CREATE INDEX IF NOT EXISTS "CalculatorPass_status_idx" ON "CalculatorPass"("status")`,
  `CREATE INDEX IF NOT EXISTS "CalculatorPass_email_idx" ON "CalculatorPass"("email")`,
];

let ready: Promise<void> | null = null;
export function ensureCalculatorTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

const ID_RE = /^[a-z0-9]{20,40}$/;

function sign(id: string): string | null {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(`calculator-plan:${id}`).digest("base64url").slice(0, 32);
}

export function planKey(id: string): string | null {
  const s = sign(id);
  return s ? `${id}.${s}` : null;
}

/** The pass id a key stands for, if the signature is right. Says nothing about payment. */
export function keyId(key: unknown): string | null {
  if (typeof key !== "string" || key.length > 120) return null;
  const [id, sig] = key.split(".");
  if (!id || !sig || !ID_RE.test(id)) return null;
  const want = sign(id);
  return want && secretEquals(sig, want) ? id : null;
}

export function accessUrl(id: string): string {
  return `${SITE}${CALCULATOR_PATH}?plan=${encodeURIComponent(planKey(id) ?? "")}`;
}

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

export type Access =
  | { full: true; via: "staff"; passId: null; expiresAt: null }
  | { full: true; via: "plan"; passId: string; expiresAt: string }
  | { full: false; via: null; passId: null; expiresAt: null };

const NONE: Access = { full: false, via: null, passId: null, expiresAt: null };

async function isStaff(): Promise<boolean> {
  try {
    const u = (await getServerSession(authOptions))?.user;
    if (!u || u.studentId) return false;
    return !!(u.isOwner || u.isAdmin || u.collaboratorId);
  } catch {
    return false;
  }
}

/** A paid, unexpired plan for this key. */
export async function activePlan(key: unknown): Promise<{ id: string; expiresAt: Date } | null> {
  const id = keyId(key);
  if (!id) return null;
  await ensureCalculatorTables();
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; expiresAt: Date | null }>>(
    `SELECT "id", "expiresAt" FROM "CalculatorPass" WHERE "id" = $1 AND "status" = 'paid' AND "expiresAt" > now()`,
    id,
  );
  const r = rows[0];
  return r?.expiresAt ? { id: r.id, expiresAt: r.expiresAt } : null;
}

/** Who may see the full plan: staff, or the holder of a paid plan's key (cookie). */
export async function calculatorAccess(cookieKey: string | undefined | null): Promise<Access> {
  const plan = cookieKey ? await activePlan(cookieKey) : null;
  if (plan) return { full: true, via: "plan", passId: plan.id, expiresAt: plan.expiresAt.toISOString() };
  if (await isStaff()) return { full: true, via: "staff", passId: null, expiresAt: null };
  return NONE;
}

/**
 * A browser's request from another site (its Origin header names another
 * host). The plan routes refuse those: they set or clear the plan cookie and
 * start checkouts, and are only ever called by the calculator page itself.
 * Requests without an Origin header (server to server, tests) pass. Same
 * check as the admin's (lib/learn/account-status/admin-auth.ts).
 */
export function crossSite(req: Request): boolean {
  return !sameOrigin(req);
}

export function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

// ---------------------------------------------------------------------------
// Checkout and fulfilment
// ---------------------------------------------------------------------------

/** cuid-like: "c" and 24 lower-case letters and digits. */
const newId = () => "c" + Array.from(randomBytes(24), (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");

export async function startPlanCheckout(opts: {
  email: string | null;
  locale: Locale;
}): Promise<{ ok: true; url: string } | { ok: false; error: "notOnSale" | "paymentsOff" | "failed" }> {
  const price = planPrice();
  if (!price) return { ok: false, error: "notOnSale" };
  if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXTAUTH_SECRET) return { ok: false, error: "paymentsOff" };
  await ensureCalculatorTables();
  const id = newId();
  const email = normEmail(opts.email);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CalculatorPass" ("id", "email", "locale", "status") VALUES ($1, $2, $3, 'pending')`,
    id,
    email,
    opts.locale,
  );
  const t = translatorFor(opts.locale);
  const metadata = { product: PLAN_PRODUCT, passId: id };
  try {
    const discount = await resolveCheckoutDiscount({
      lines: [{ key: "other", amountCents: price }],
      recurring: false,
      buyer: { email: email ?? undefined },
    });
    const back = `${SITE}${CALCULATOR_PATH}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: price,
            product_data: {
              name: t("calculator.plan.productName"),
              description: t("calculator.plan.productDesc", { days: planDays() }).slice(0, 300),
            },
          },
        },
      ],
      ...(email ? { customer_email: email } : {}),
      ...(discount.couponId ? { discounts: [{ coupon: discount.couponId }] } : discount.allowPromotionCodes ? { allow_promotion_codes: true } : {}),
      client_reference_id: id,
      locale: opts.locale === "fr" ? "fr" : "auto",
      success_url: `${back}?plan=paid&session_id={CHECKOUT_SESSION_ID}#plan`,
      cancel_url: `${back}?plan=canceled#plan`,
      metadata: { ...discount.metadata, ...metadata },
      payment_intent_data: { metadata },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    await prisma.$executeRawUnsafe(`UPDATE "CalculatorPass" SET "stripeSessionId" = $2 WHERE "id" = $1`, id, session.id);
    return { ok: true, url: session.url };
  } catch (err) {
    console.error("[calculator/checkout]", err instanceof Error ? err.message : err);
    return { ok: false, error: "failed" };
  }
}

/**
 * A completed checkout (webhook, or the buyer's return with session_id).
 * Pending to paid in one conditional update, so a retried webhook and the
 * return page activate (and email) once. Returns the pass id when the session
 * is a paid plan, whether this call or an earlier one activated it.
 */
export async function markPlanPaid(session: Stripe.Checkout.Session): Promise<{ id: string; expiresAt: Date } | null> {
  if (session.metadata?.product !== PLAN_PRODUCT || session.mode !== "payment") return null;
  const id = session.metadata.passId;
  if (!id || !ID_RE.test(id)) return null;
  // A 100% promotion code completes with "no_payment_required".
  const paid = session.payment_status === "paid" || (session.status === "complete" && session.payment_status === "no_payment_required");
  if (!paid) return null;
  await ensureCalculatorTables();
  const expires = new Date(Date.now() + planDays() * 86_400_000);
  const email = normEmail(session.customer_details?.email ?? session.customer_email ?? null);
  const n = await prisma.$executeRawUnsafe(
    `UPDATE "CalculatorPass" SET "status" = 'paid', "paidAt" = now(), "expiresAt" = $3, "amountPaid" = $4,
       "stripeSessionId" = $2, "email" = COALESCE("email", $5)
     WHERE "id" = $1 AND "status" = 'pending' AND ("stripeSessionId" IS NULL OR "stripeSessionId" = $2)`,
    id,
    session.id,
    expires,
    session.amount_total ?? 0,
    email,
  );
  if (n === 1) {
    sendPlanEmail(id).catch((err) => console.error("[calculator/plan] email", err instanceof Error ? err.message : err));
  }
  const rows = await prisma.$queryRawUnsafe<Array<{ expiresAt: Date | null }>>(
    `SELECT "expiresAt" FROM "CalculatorPass" WHERE "id" = $1 AND "status" = 'paid' AND "stripeSessionId" = $2`,
    id,
    session.id,
  );
  return rows[0]?.expiresAt ? { id, expiresAt: rows[0].expiresAt } : null;
}

/** The return from Stripe: check the session with Stripe, never the request. */
export async function confirmReturn(sessionId: unknown): Promise<{ id: string; expiresAt: Date } | null> {
  if (typeof sessionId !== "string" || !/^cs_[A-Za-z0-9_]{8,200}$/.test(sessionId)) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return await markPlanPaid(session);
  } catch (err) {
    console.error("[calculator/plan] confirm", err instanceof Error ? err.message : err);
    return null;
  }
}

/** The confirmation email with the access link, once. */
async function sendPlanEmail(id: string): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<Array<{ email: string | null; locale: string; expiresAt: Date | null; amountPaid: number; emailedAt: Date | null }>>(
    `SELECT "email", "locale", "expiresAt", "amountPaid", "emailedAt" FROM "CalculatorPass" WHERE "id" = $1`,
    id,
  );
  const p = rows[0];
  if (!p?.email || p.emailedAt || !p.expiresAt) return;
  const claimed = await prisma.$executeRawUnsafe(`UPDATE "CalculatorPass" SET "emailedAt" = now() WHERE "id" = $1 AND "emailedAt" IS NULL`, id);
  if (claimed !== 1) return;
  const locale = (["en", "fr", "sw"].includes(p.locale) ? p.locale : "en") as Locale;
  const t = translatorFor(locale);
  const link = accessUrl(id);
  const until = p.expiresAt.toLocaleDateString(locale, { dateStyle: "long" });
  const esc = escapeHtml;
  const html = `
  <div style="background:#F4F7FB;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6ebf1;">
      <div style="background:linear-gradient(135deg,#0D1B2A,#1B3A6B);padding:22px 30px;font-size:18px;font-weight:800;color:#fff;">TIB<span style="color:#F47C20;">LOGICS</span> · ${esc(t("calculator.plan.emailBrand"))}</div>
      <div style="padding:28px 30px;font-size:14px;color:#3A4A5C;line-height:1.7;">
        <h1 style="font-size:20px;color:#0D1B2A;margin:0 0 12px;">${esc(t("calculator.plan.emailTitle"))}</h1>
        <p style="margin:0 0 12px;">${esc(t("calculator.plan.emailBody", { date: until }))}</p>
        <p style="margin:0 0 18px;">${esc(t("calculator.plan.emailDevices"))}</p>
        <a href="${esc(link)}" style="display:inline-block;background:#F47C20;color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px;">${esc(t("calculator.plan.emailButton"))}</a>
        <p style="margin:18px 0 0;font-size:12px;color:#7A8FA6;">${esc(t("calculator.plan.emailKeep"))}</p>
      </div>
    </div>
  </div>`;
  const text = [t("calculator.plan.emailTitle"), "", t("calculator.plan.emailBody", { date: until }), t("calculator.plan.emailDevices"), "", link, "", t("calculator.plan.emailKeep")].join("\n");
  try {
    await mailTransport().sendMail({ from: MAIL_FROM, to: p.email, subject: t("calculator.plan.emailSubject"), html, text });
  } catch (err) {
    await prisma.$executeRawUnsafe(`UPDATE "CalculatorPass" SET "emailedAt" = NULL WHERE "id" = $1`, id).catch(() => {});
    throw err;
  }
}

/** Refund or chargeback: the plan stops working. Returns how many plans ended. */
export async function refundPlan(stripeSessionId: string): Promise<number> {
  await ensureCalculatorTables();
  return prisma.$executeRawUnsafe(`UPDATE "CalculatorPass" SET "status" = 'refunded' WHERE "stripeSessionId" = $1 AND "status" = 'paid'`, stripeSessionId);
}

export function priceLabel(locale: Locale): string | null {
  const c = planPrice();
  return c ? formatMoney(c, locale) : null;
}
