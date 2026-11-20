import prisma from "@/lib/prisma";
import { ensureAnalyticsTables } from "./db";
import { cached, clearAnalyticsCache } from "./cache";
import { getRevenue } from "./revenue";
import { getFunnels } from "./funnels";
import { parseFilters, type Filters } from "./filters";

// Insights home (/admin_pro/analytics): the headline numbers against the
// period before, "what changed" (biggest movers, by simple rules), monthly
// goals the owner sets, and the inputs for the AI summary (aggregates only).

export interface Kpi { key: string; label: string; cur: number; prev: number; money?: boolean; pct?: boolean }
export interface Mover { kind: "source" | "page" | "country" | "funnel"; label: string; cur: number; prev: number; change: number; text: string }

async function n(sql: string, args: unknown[]): Promise<number> {
  try {
    const r = await prisma.$queryRawUnsafe<Array<{ n: number | bigint }>>(sql, ...args);
    return Number(r[0]?.n ?? 0);
  } catch {
    return 0; // optional table not created yet
  }
}

async function leads(from: Date, to: Date): Promise<number> {
  const parts = await Promise.all([
    n(`SELECT count(*)::int AS n FROM "ScannerLead" WHERE "email" IS NOT NULL AND COALESCE("consentAt", "createdAt") >= $1 AND COALESCE("consentAt", "createdAt") < $2`, [from, to]),
    n(`SELECT count(*)::int AS n FROM "PartnershipApplication" WHERE "createdAt" >= $1 AND "createdAt" < $2`, [from, to]),
    n(`SELECT count(*)::int AS n FROM "ServiceRequest" WHERE "createdAt" >= $1 AND "createdAt" < $2`, [from, to]),
    n(`SELECT count(*)::int AS n FROM "AcquireCapture" WHERE "createdAt" >= $1 AND "createdAt" < $2`, [from, to]),
    n(`SELECT count(*)::int AS n FROM "ScholarshipApplication" WHERE "createdAt" >= $1 AND "createdAt" < $2`, [from, to]),
  ]);
  return parts.reduce((a, b) => a + b, 0);
}

async function counts(from: Date, to: Date) {
  const [visitors, bookings, signups, lds] = await Promise.all([
    n(`SELECT count(DISTINCT "sessionId")::int AS n FROM "PageView" WHERE "createdAt" >= $1 AND "createdAt" < $2`, [from, to]),
    n(`SELECT count(*)::int AS n FROM "Appointment" WHERE "createdAt" >= $1 AND "createdAt" < $2 AND "status" <> 'CANCELLED'`, [from, to]),
    n(`SELECT count(*)::int AS n FROM "Student" WHERE "createdAt" >= $1 AND "createdAt" < $2`, [from, to]),
    leads(from, to),
  ]);
  return { visitors, bookings, signups, leads: lds };
}

export async function getKpis(f: Filters, withRevenue: boolean): Promise<Kpi[]> {
  return cached(`ins:kpi:${f.from.toISOString().slice(0, 13)}:${f.to.toISOString().slice(0, 13)}:${withRevenue}`, async () => {
    await ensureAnalyticsTables();
    const plain = { ...f, source: null, country: null, device: null };
    const [c, p, rev] = await Promise.all([counts(f.from, f.to), counts(f.prevFrom, f.prevTo), getRevenue(plain)]);
    const conv = (x: typeof c, sales: number) => (x.visitors ? ((x.signups + x.bookings + sales) / x.visitors) * 100 : 0);
    const out: Kpi[] = [
      { key: "visitors", label: "Visitors (sessions)", cur: c.visitors, prev: p.visitors },
      { key: "leads", label: "Leads", cur: c.leads, prev: p.leads },
      { key: "bookings", label: "Bookings", cur: c.bookings, prev: p.bookings },
      { key: "signups", label: "ARFA sign-ups", cur: c.signups, prev: p.signups },
      { key: "sales", label: "Sales (paid records)", cur: rev.total.orders, prev: rev.total.prevOrders },
    ];
    if (withRevenue) out.push({ key: "revenue", label: "Revenue", cur: rev.total.cur, prev: rev.total.prev, money: true });
    out.push({ key: "conversion", label: "Conversion rate", cur: Math.round(conv(c, rev.total.orders) * 10) / 10, prev: Math.round(conv(p, rev.total.prevOrders) * 10) / 10, pct: true });
    return out;
  });
}

const pctChange = (cur: number, prev: number) => (prev ? (cur - prev) / prev : cur ? 1 : 0);

/** Biggest movers: at least 10 in one period and a change of 25% or more. */
export async function whatChanged(f: Filters): Promise<Mover[]> {
  return cached(`ins:movers:${f.from.toISOString().slice(0, 13)}:${f.to.toISOString().slice(0, 13)}`, async () => {
    await ensureAnalyticsTables();
    const group = (col: string, distinctSessions: boolean) =>
      prisma.$queryRawUnsafe<Array<{ k: string; cur: number; prev: number }>>(
        `SELECT COALESCE(${col}, '(unknown)') AS k,
                count(${distinctSessions ? `DISTINCT "sessionId"` : "*"}) FILTER (WHERE "createdAt" >= $1)::int AS cur,
                count(${distinctSessions ? `DISTINCT "sessionId"` : "*"}) FILTER (WHERE "createdAt" < $1)::int AS prev
         FROM "PageView" WHERE "createdAt" >= $3 AND "createdAt" < $2 GROUP BY 1
         HAVING greatest(count(*) FILTER (WHERE "createdAt" >= $1), count(*) FILTER (WHERE "createdAt" < $1)) >= 10
         ORDER BY abs(count(*) FILTER (WHERE "createdAt" >= $1) - count(*) FILTER (WHERE "createdAt" < $1)) DESC LIMIT 30`,
        f.from, f.to, f.prevFrom,
      );
    const [sources, pages, countries, funnels] = await Promise.all([
      group(`"source"`, true),
      group(`"page"`, false),
      group(`"country"`, true),
      getFunnels({ ...f, source: null, country: null, device: null }),
    ]);
    const out: Mover[] = [];
    const add = (kind: Mover["kind"], label: string, cur: number, prev: number, noun: string) => {
      if (Math.max(cur, prev) < 10) return;
      const ch = pctChange(cur, prev);
      if (Math.abs(ch) < 0.25) return;
      const dir = cur > prev ? "up" : "down";
      out.push({ kind, label, cur, prev, change: ch, text: prev ? `${noun} ${dir} ${Math.abs(Math.round(ch * 100))}% (${cur} vs ${prev})` : `${noun} new: ${cur} (none before)` });
    };
    // Views recorded before sources were tracked have none: not a mover.
    for (const s of sources) if (s.k !== "(unknown)") add("source", s.k, s.cur, s.prev, `Visits from ${s.k}`);
    for (const p of pages) add("page", p.k, p.cur, p.prev, `Views of ${p.k}`);
    for (const c of countries) if (c.k !== "(unknown)") add("country", c.k, c.cur, c.prev, `Visits from ${c.k}`);
    for (const fn of funnels) {
      for (let i = 1; i < fn.steps.length; i++) {
        const a = fn.steps[i - 1];
        const b = fn.steps[i];
        if (a.n < 10 || a.prev < 10) continue;
        const rc = Math.min(1, b.n / a.n);
        const rp = Math.min(1, b.prev / a.prev);
        if (Math.abs(rc - rp) < 0.1) continue;
        out.push({
          kind: "funnel",
          label: `${fn.label}: ${b.label}`,
          cur: Math.round(rc * 100),
          prev: Math.round(rp * 100),
          change: rp ? (rc - rp) / rp : 1,
          text: `${fn.label}, "${a.label}" → "${b.label}": ${Math.round(rc * 100)}% (was ${Math.round(rp * 100)}%)`,
        });
      }
    }
    return out.sort((a, b) => Math.abs(b.change) * Math.log10(10 + Math.max(b.cur, b.prev)) - Math.abs(a.change) * Math.log10(10 + Math.max(a.cur, a.prev))).slice(0, 10);
  });
}

// ── Goals ────────────────────────────────────────────────────────────────────

export const GOAL_METRICS = { revenue: "Revenue (USD)", bookings: "Bookings", signups: "ARFA sign-ups" } as const;
export type GoalMetric = keyof typeof GOAL_METRICS;

export interface GoalProgress { metric: GoalMetric; label: string; target: number | null; actual: number; pace: number; money: boolean }

export const monthKey = (d = new Date()) => d.toISOString().slice(0, 7);

export async function getGoals(month = monthKey(), withRevenue = true): Promise<GoalProgress[]> {
  await ensureAnalyticsTables();
  const rows = await prisma.$queryRawUnsafe<Array<{ metric: string; target: number }>>(`SELECT "metric", "target" FROM "AnalyticsGoal" WHERE "month" = $1`, month);
  const t = new Map(rows.map((r) => [r.metric, Number(r.target)]));
  const start = new Date(`${month}-01T00:00:00Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  const now = Date.now();
  const pace = Math.min(1, Math.max(0, (now - start.getTime()) / (end.getTime() - start.getTime())));
  const f = parseFilters({ from: month + "-01", to: new Date(Math.min(now, end.getTime() - 1)).toISOString().slice(0, 10) });
  const [c, rev] = await Promise.all([counts(start, end), withRevenue ? getRevenue({ ...f, from: start, to: end, source: null, country: null, device: null }) : null]);
  const out: GoalProgress[] = [];
  if (withRevenue) out.push({ metric: "revenue", label: GOAL_METRICS.revenue, target: t.get("revenue") ?? null, actual: rev?.total.cur ?? 0, pace, money: true });
  out.push({ metric: "bookings", label: GOAL_METRICS.bookings, target: t.get("bookings") ?? null, actual: c.bookings, pace, money: false });
  out.push({ metric: "signups", label: GOAL_METRICS.signups, target: t.get("signups") ?? null, actual: c.signups, pace, money: false });
  return out;
}

export async function setGoal(month: string, metric: GoalMetric, target: number | null): Promise<void> {
  await ensureAnalyticsTables();
  if (target == null) await prisma.$executeRawUnsafe(`DELETE FROM "AnalyticsGoal" WHERE "month" = $1 AND "metric" = $2`, month, metric);
  else
    await prisma.$executeRawUnsafe(
      `INSERT INTO "AnalyticsGoal" ("month","metric","target","updatedAt") VALUES ($1,$2,$3,CURRENT_TIMESTAMP)
       ON CONFLICT ("month","metric") DO UPDATE SET "target" = EXCLUDED."target", "updatedAt" = CURRENT_TIMESTAMP`,
      month, metric, Math.round(target),
    );
  clearAnalyticsCache("ins:");
}

// ── Weekly email opt-out (Settings) ─────────────────────────────────────────

export const WEEKLY_EMAIL_KEY = "analytics_weekly_email";

export async function weeklyEmailEnabled(): Promise<boolean> {
  const row = await prisma.adminSettings.findUnique({ where: { key: WEEKLY_EMAIL_KEY } }).catch(() => null);
  return row?.value !== "off";
}

export async function setWeeklyEmail(on: boolean): Promise<void> {
  await prisma.adminSettings.upsert({ where: { key: WEEKLY_EMAIL_KEY }, create: { key: WEEKLY_EMAIL_KEY, value: on ? "on" : "off" }, update: { value: on ? "on" : "off" } });
}
