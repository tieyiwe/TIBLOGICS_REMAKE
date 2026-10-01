import prisma from "@/lib/prisma";
import { getLinkReport } from "../reports";
import { ensureAcquireTables } from "./db";
import { campaignFor } from "./store";

// Numbers for the acquisition pages: views, sign-ups and CTA clicks per
// magnet and landing page, and the sign-ups/purchases that followed (from
// Links & attribution, by each page's campaign).

export interface RefStats {
  views: number;
  captures: number;
  ctas: number;
  quizzes: number;
  /** captures / views, 0..1 (null without views). */
  rate: number | null;
  /** Sign-ups and paid conversions credited to the campaign (last 365 days). */
  signups: number;
  conversions: number;
  revenueCents: number;
}

const blank = (): RefStats => ({ views: 0, captures: 0, ctas: 0, quizzes: 0, rate: null, signups: 0, conversions: 0, revenueCents: 0 });

export async function statsFor(refType: "magnet" | "page", rows: { id: string; slug: string }[]): Promise<Map<string, RefStats>> {
  await ensureAcquireTables();
  const out = new Map<string, RefStats>(rows.map((r) => [r.id, blank()]));
  if (!rows.length) return out;
  const ids = rows.map((r) => r.id);
  const [events, captures, report] = await Promise.all([
    prisma.acquireEvent.groupBy({ by: ["refId", "kind"], where: { refType, refId: { in: ids } }, _count: { _all: true } }),
    prisma.acquireCapture.groupBy({ by: ["refId"], where: { refType, refId: { in: ids } }, _count: { _all: true } }),
    getLinkReport(365).catch(() => null),
  ]);
  for (const e of events) {
    const s = out.get(e.refId);
    if (!s) continue;
    if (e.kind === "view") s.views = e._count._all;
    if (e.kind === "cta") s.ctas = e._count._all;
    if (e.kind === "quiz") s.quizzes = e._count._all;
  }
  for (const c of captures) {
    const s = out.get(c.refId);
    if (s) s.captures = c._count._all;
  }
  const byCampaign = new Map((report?.byCampaign ?? []).map((r) => [r.key, r]));
  for (const r of rows) {
    const s = out.get(r.id)!;
    s.rate = s.views ? s.captures / s.views : null;
    const c = byCampaign.get(campaignFor(refType, r.slug));
    if (c) {
      s.signups = c.signups;
      s.conversions = c.conversions;
      s.revenueCents = c.revenueCents;
    }
  }
  return out;
}

export interface RecentCapture {
  id: string;
  refType: string;
  slug: string;
  email: string;
  name: string | null;
  business: string | null;
  createdAt: string;
  score: number | null;
  leadId: string | null;
  utmCampaign: string | null;
}

export async function recentCaptures(limit = 12, where: { refType?: string; refId?: string } = {}): Promise<RecentCapture[]> {
  await ensureAcquireTables();
  const rows = await prisma.acquireCapture.findMany({ where, orderBy: { createdAt: "desc" }, take: limit });
  return rows.map((r) => ({
    id: r.id,
    refType: r.refType,
    slug: r.slug,
    email: r.email,
    name: r.name,
    business: r.business,
    createdAt: r.createdAt.toISOString(),
    score: r.result && typeof r.result === "object" && typeof (r.result as { score?: unknown }).score === "number" ? ((r.result as { score: number }).score) : null,
    leadId: r.leadId,
    utmCampaign: r.utmCampaign,
  }));
}

/** Captures per day for the last `days` days (oldest first), for sparklines. */
export async function capturesByDay(days = 30): Promise<number[]> {
  await ensureAcquireTables();
  const from = new Date(Date.now() - (days - 1) * 86_400_000);
  from.setUTCHours(0, 0, 0, 0);
  const rows = await prisma.$queryRaw<{ d: string; n: bigint }[]>`
    SELECT to_char("createdAt", 'YYYY-MM-DD') AS d, COUNT(*)::bigint AS n FROM "AcquireCapture" WHERE "createdAt" >= ${from} GROUP BY 1`;
  const map = new Map(rows.map((r) => [r.d, Number(r.n)]));
  const out: number[] = [];
  for (let i = 0; i < days; i++) out.push(map.get(new Date(from.getTime() + i * 86_400_000).toISOString().slice(0, 10)) ?? 0);
  return out;
}
