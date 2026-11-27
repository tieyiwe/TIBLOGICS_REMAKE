import { createHash, randomBytes } from "crypto";
import type Stripe from "stripe";
import type { AgentReadyScan } from "@prisma/client";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { normEmail } from "@/lib/growth/outreach/normalize";
import { resolveCheckoutDiscount } from "@/lib/promotions/service";
import { recordAttribution } from "@/lib/growth/attribution";
import type { Locale } from "@/lib/i18n/config";
import { translatorFor } from "@/lib/i18n/server";
import { ensureAgentReadyTables } from "./db";
import { scanAgentReady, type AgentScan, type CheckId, type Area, type Status } from "./scan";
import { fixGuide, guidePlatform, KIT_FILES, type Fix, type KitFileName } from "./kit";
import { freePerDay, kitCents, priceFor, reportCents, type Buy, type Tier } from "./prices";

export { freePerDay, kitCents, priceFor, reportCents };
export type { Buy, Tier };

// AI Agent Readiness: the product.
//
//   free    the score, the verdict, how many AI agents are turned away and how
//           many problems there are, by area. Not which, not why.
//   report  ($25) every check and every AI agent: what passes, what fails, the
//           evidence (the robots.txt line, the status a firewall answered).
//   kit     ($50, or $25 more after the report) the report, a fix guide for
//           the site's own platform, the files to upload (robots.txt in two
//           versions, llms.txt, structured data) and re-scans to check the
//           fixes.
//
// What a tier may see is cut on the server (viewOf): the browser never gets
// more than was paid for. Staff (scanner permission) see everything.
//
//   AGENT_READY_REPORT_CENTS  default 2500 ("0" takes the tier off sale)
//   AGENT_READY_KIT_CENTS     default 5000
//   AGENT_READY_FREE_PER_DAY  free scans of one site per day (default 5)

export const AGENT_PRODUCT = "agent-ready";
export { KIT_RESCANS } from "./limits";
import { KIT_RESCANS } from "./limits";


const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");
export const AGENT_PATH = "/tools/ai-agent-ready";

export const TOKEN_RE = /^[A-Za-z0-9_-]{24,64}$/;
const newToken = () => randomBytes(24).toString("base64url");
const newId = () => "ar" + randomBytes(12).toString("hex");
export const hashIp = (ip: string) => createHash("sha256").update(`${process.env.NEXTAUTH_SECRET ?? ""}:agent:${ip}`).digest("hex").slice(0, 32);

export async function scanByToken(token: string): Promise<AgentReadyScan | null> {
  if (!TOKEN_RE.test(token)) return null;
  await ensureAgentReadyTables();
  return prisma.agentReadyScan.findUnique({ where: { token } });
}

/** Free scans of this site today (customers only), for the daily limit. */
export async function freeScansToday(host: string): Promise<number> {
  await ensureAgentReadyTables();
  return prisma.agentReadyScan.count({ where: { host, staff: false, createdAt: { gte: new Date(Date.now() - 86_400_000) } } });
}

export function hostOf(raw: string): string | null {
  let v = raw.trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try {
    const h = new URL(v).hostname.toLowerCase().replace(/\.+$/, "").replace(/^www\./, "");
    return h && h.length <= 253 && h.includes(".") ? h : null;
  } catch {
    return null;
  }
}

export async function runScan(url: string, opts: { locale: Locale; ip: string; staff: boolean }): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const out = await scanAgentReady(url);
  if (!out.ok) return { ok: false, error: out.error };
  await ensureAgentReadyTables();
  const token = newToken();
  await prisma.agentReadyScan.create({
    data: {
      id: newId(),
      token,
      url: out.scan.url.slice(0, 500),
      host: out.scan.host.slice(0, 253),
      locale: opts.locale,
      ipHash: hashIp(opts.ip),
      score: out.scan.score,
      verdict: out.scan.verdict,
      result: out.scan as unknown as object,
      staff: opts.staff,
    },
  });
  return { ok: true, token };
}

/** The kit's re-scan: the same report, measured again (to check the fixes). */
export async function rescan(row: AgentReadyScan, staff: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!staff && (row.tier !== "kit" || row.rescans >= KIT_RESCANS)) return { ok: false, error: "noRescans" };
  // One at a time, and not twice a minute (each costs a dozen requests).
  const n = await prisma.agentReadyScan.updateMany({
    where: { id: row.id, rescans: row.rescans, updatedAt: { lt: new Date(Date.now() - 60_000) } },
    data: { updatedAt: new Date(), ...(staff ? {} : { rescans: { increment: 1 } }) },
  });
  if (n.count !== 1) return { ok: false, error: "busy" };
  const out = await scanAgentReady(row.url);
  if (!out.ok) {
    if (!staff) await prisma.agentReadyScan.update({ where: { id: row.id }, data: { rescans: { decrement: 1 } } });
    return { ok: false, error: out.error };
  }
  await prisma.agentReadyScan.update({
    where: { id: row.id },
    data: { score: out.scan.score, verdict: out.scan.verdict, result: out.scan as unknown as object, updatedAt: new Date() },
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// What each tier sees
// ---------------------------------------------------------------------------

export interface AgentView {
  token: string;
  host: string;
  url: string;
  scannedAt: string;
  score: number;
  verdict: AgentScan["verdict"];
  platform: string | null;
  guidePlatform: string;
  shop: boolean;
  tier: Tier;
  staff: boolean;
  /** The teaser every tier gets. */
  summary: {
    assistantsBlocked: number;
    assistantsTotal: number;
    searchBlocked: number;
    searchTotal: number;
    firewallRefused: number;
    problems: number;
    byArea: Record<Area, number>;
    checks: Array<{ id: CheckId; area: Area }>;
  };
  prices: { report: number | null; kit: number | null };
  // report and kit
  checks?: Array<{ id: CheckId; area: Area; status: Status; points: number; max: number; facts: AgentScan["checks"][number]["facts"] }>;
  agents?: AgentScan["agents"];
  testedPaths?: string[];
  cdn?: string | null;
  product?: AgentScan["product"];
  // kit
  fixes?: Fix[];
  files?: KitFileName[];
  rescansLeft?: number;
}

export function viewOf(row: AgentReadyScan, staff: boolean): AgentView {
  const scan = row.result as unknown as AgentScan;
  const tier: Tier = staff ? "kit" : (row.tier as Tier);
  const c = (id: CheckId) => scan.checks.find((x) => x.id === id);
  const len = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  const counted = scan.checks.filter((x) => x.status === "fail" || x.status === "warn");
  const byArea: Record<Area, number> = { access: 0, read: 0, data: 0, guide: 0 };
  for (const x of counted) byArea[x.area]++;
  const view: AgentView = {
    token: row.token,
    host: row.host,
    url: row.url,
    scannedAt: scan.scannedAt,
    score: row.score,
    verdict: scan.verdict,
    platform: scan.platform,
    guidePlatform: guidePlatform(scan.platform),
    shop: scan.shop,
    tier,
    staff,
    summary: {
      assistantsBlocked: len(c("assistants")?.facts.blocked),
      assistantsTotal: scan.agents.filter((a) => a.role === "assistant").length,
      searchBlocked: len(c("search")?.facts.blocked),
      searchTotal: scan.agents.filter((a) => a.role === "search").length,
      firewallRefused: len(c("firewall")?.facts.refusedUseful),
      problems: counted.length,
      byArea,
      checks: scan.checks.filter((x) => x.id !== "training").map((x) => ({ id: x.id, area: x.area })),
    },
    prices: { report: priceFor(row.tier as Tier, "report"), kit: priceFor(row.tier as Tier, "kit") },
  };
  if (tier === "free") return view;
  view.checks = scan.checks.map((x) => ({ id: x.id, area: x.area, status: x.status, points: x.points, max: x.max, facts: x.facts }));
  view.agents = scan.agents;
  view.testedPaths = scan.testedPaths;
  view.cdn = scan.cdn;
  view.product = scan.product;
  if (tier !== "kit") return view;
  view.fixes = fixGuide(scan);
  view.files = [...KIT_FILES];
  view.rescansLeft = staff ? 99 : Math.max(0, KIT_RESCANS - row.rescans);
  return view;
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export async function startCheckout(
  row: AgentReadyScan,
  buy: Buy,
  locale: Locale,
  cookieHeader: string | null,
): Promise<{ ok: true; url: string } | { ok: false; error: "notOnSale" | "paymentsOff" | "failed" | "owned" }> {
  const tier = row.tier as Tier;
  if ((buy === "report" && tier !== "free") || tier === "kit") return { ok: false, error: "owned" };
  const price = priceFor(tier, buy);
  if (!price) return { ok: false, error: "notOnSale" };
  if (!process.env.STRIPE_SECRET_KEY) return { ok: false, error: "paymentsOff" };
  const t = translatorFor(locale);
  const metadata = { product: AGENT_PRODUCT, scanId: row.id, buy };
  try {
    const discount = await resolveCheckoutDiscount({
      lines: [{ key: "other", amountCents: price }],
      recurring: false,
      buyer: { email: row.email ?? undefined },
    });
    const back = `${SITE}${AGENT_PATH}/r/${row.token}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: price,
            product_data: {
              name: t(buy === "kit" ? (tier === "report" ? "tools.agent.buy.kitUpgradeName" : "tools.agent.buy.kitName") : "tools.agent.buy.reportName"),
              description: t(buy === "kit" ? "tools.agent.buy.kitDesc" : "tools.agent.buy.reportDesc", { host: row.host }).slice(0, 300),
            },
          },
        },
      ],
      ...(row.email ? { customer_email: row.email } : {}),
      ...(discount.couponId ? { discounts: [{ coupon: discount.couponId }] } : discount.allowPromotionCodes ? { allow_promotion_codes: true } : {}),
      client_reference_id: row.id,
      locale: locale === "fr" ? "fr" : "auto",
      success_url: `${back}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${back}?canceled=1`,
      metadata: { ...discount.metadata, ...metadata },
      payment_intent_data: { metadata },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    await recordAttribution({ kind: "agent-ready", refId: row.id, cookieHeader, amountCents: price }).catch(() => {});
    return { ok: true, url: session.url };
  } catch (err) {
    console.error("[agent-ready/checkout]", err instanceof Error ? err.message : err);
    return { ok: false, error: "failed" };
  }
}

/**
 * A completed checkout (webhook, or the buyer's return with session_id).
 * Conditional updates, so a retried webhook and the return page count a
 * payment once. Returns true when the scan has what this session bought.
 */
export async function markPaid(session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.metadata?.product !== AGENT_PRODUCT || session.mode !== "payment") return false;
  const id = session.metadata.scanId;
  const buy = session.metadata.buy === "kit" ? "kit" : session.metadata.buy === "report" ? "report" : null;
  if (!id || !/^ar[0-9a-f]{24}$/.test(id) || !buy) return false;
  const paid = session.payment_status === "paid" || (session.status === "complete" && session.payment_status === "no_payment_required");
  if (!paid) return false;
  await ensureAgentReadyTables();
  const email = normEmail(session.customer_details?.email ?? session.customer_email ?? null);
  const amount = session.amount_total ?? 0;
  const n =
    buy === "kit"
      ? await prisma.agentReadyScan.updateMany({
          where: { id, kitSessionId: null, tier: { in: ["free", "report"] } },
          data: { tier: "kit", kitSessionId: session.id, amountPaid: { increment: amount }, paidAt: new Date() },
        })
      : await prisma.agentReadyScan.updateMany({
          where: { id, reportSessionId: null, tier: "free" },
          data: { tier: "report", reportSessionId: session.id, amountPaid: { increment: amount }, paidAt: new Date() },
        });
  if (email) await prisma.agentReadyScan.updateMany({ where: { id, email: null }, data: { email } });
  const row = await prisma.agentReadyScan.findUnique({ where: { id } });
  if (!row) return false;
  if (n.count === 1) {
    const { sendAgentReceipt } = await import("./email");
    sendAgentReceipt(row, buy).catch((err) => console.error("[agent-ready] receipt", err instanceof Error ? err.message : err));
  }
  return buy === "kit" ? row.tier === "kit" : row.tier !== "free";
}

/** A refunded or disputed checkout takes back what it bought. Returns a note for the refund email, or null. */
export async function refundAgentSession(sessionId: string): Promise<string | null> {
  await ensureAgentReadyTables();
  const kit = await prisma.agentReadyScan.updateMany({
    where: { kitSessionId: sessionId, tier: "kit" },
    data: { tier: "report" },
  });
  // A kit bought straight away (no report session) goes back to free.
  if (kit.count) {
    await prisma.agentReadyScan.updateMany({ where: { kitSessionId: sessionId, reportSessionId: null }, data: { tier: "free" } });
    return "AI Agent Readiness kit taken back.";
  }
  // The report refunded: the kit upgrade was priced on top of it, so both go.
  const report = await prisma.agentReadyScan.updateMany({ where: { reportSessionId: sessionId, tier: { not: "free" } }, data: { tier: "free" } });
  return report.count ? "AI Agent Readiness report locked again." : null;
}
