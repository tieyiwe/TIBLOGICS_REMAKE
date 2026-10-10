import prisma from "@/lib/prisma";
import { ensureAnalyticsTables } from "./db";
import { cached } from "./cache";
import { areaSql } from "./paths";
import type { Filters } from "./filters";

// Acquisition (/admin_pro/analytics/acquisition): where visits come from
// (source / medium / campaign, from UTM tags, /go links and the referrer,
// lib/analytics/sources.ts), the pages people land on, and the sign-ups,
// bookings and leads each source brought (TouchAttribution, first or last
// touch). Paid purchases and revenue per source come from lib/analytics/revenue.ts.

export const LEAD_KINDS = ["scanner_lead", "contact", "service_request", "lead_magnet", "scholarship_application"];

export interface SourceRow {
  source: string;
  medium: string | null;
  sessions: number;
  prevSessions: number;
  bounce: number;
  signups: number;
  bookings: number;
  leads: number;
}
export interface Acquisition {
  sources: SourceRow[];
  campaigns: Array<{ campaign: string; source: string | null; sessions: number; conversions: number }>;
  landings: Array<{ page: string; sessions: number; bounce: number; topSource: string | null }>;
  mediums: Array<{ medium: string; sessions: number }>;
  totalSessions: number;
}

function filt(f: Filters, start: number) {
  const args: unknown[] = [];
  let sql = "";
  if (f.device) { args.push(f.device); sql += ` AND "device" = $${start + args.length}`; }
  if (f.country) { args.push(f.country); sql += ` AND "country" = $${start + args.length}`; }
  if (f.source) { args.push(f.source); sql += ` AND "source" = $${start + args.length}`; }
  return { sql, args };
}

export async function getAcquisition(f: Filters, model: "first" | "last" = "last"): Promise<Acquisition> {
  return cached(`acq:${f.from.toISOString().slice(0, 13)}:${f.to.toISOString().slice(0, 13)}:${f.area}:${f.device}:${f.country}:${f.source}:${model}`, async () => {
    await ensureAnalyticsTables();
    const x = filt(f, 2);
    const a = areaSql(f.area);
    const src = model === "first" ? "ftSource" : "ltSource";
    const med = model === "first" ? "ftMedium" : "ltMedium";
    const camp = model === "first" ? "ftCampaign" : "ltCampaign";
    const ta: unknown[] = [];
    let taF = "";
    if (f.device) { ta.push(f.device); taF += ` AND "device" = $${2 + ta.length}`; }
    if (f.country) { ta.push(f.country); taF += ` AND "country" = $${2 + ta.length}`; }
    if (f.source) { ta.push(f.source); taF += ` AND "${src}" = $${2 + ta.length}`; }

    // One row per session: its source and whether it bounced.
    const sessCte = (from: string, to: string) => `WITH s AS (
        SELECT "sessionId", max(COALESCE("source", '(unknown)')) AS source, max("medium") AS medium, max("campaign") AS campaign,
               count(*) AS views, sum(COALESCE("engagedMs", 0)) AS ms,
               (array_agg("page" ORDER BY "createdAt"))[1] AS landing
        FROM "PageView" WHERE "createdAt" >= ${from} AND "createdAt" < ${to} AND ${a}${x.sql} GROUP BY 1)`;
    const [cur, prev, conv, camps, lands, meds] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ source: string; medium: string | null; n: number; b: number }>>(
        `${sessCte("$1", "$2")} SELECT source, max(medium) AS medium, count(*)::int AS n, count(*) FILTER (WHERE views = 1 AND ms < 10000)::int AS b
         FROM s GROUP BY source ORDER BY n DESC LIMIT 100`,
        f.from, f.to, ...x.args,
      ),
      prisma.$queryRawUnsafe<Array<{ source: string; n: number }>>(
        `${sessCte("$1", "$2")} SELECT source, count(*)::int AS n FROM s GROUP BY source`,
        f.prevFrom, f.prevTo, ...x.args,
      ),
      prisma.$queryRawUnsafe<Array<{ source: string; medium: string | null; signups: number; bookings: number; leads: number }>>(
        `SELECT COALESCE("${src}", '(unknown)') AS source, max("${med}") AS medium,
                count(*) FILTER (WHERE "kind" = 'learn_signup')::int AS signups,
                count(*) FILTER (WHERE "kind" = 'appointment')::int AS bookings,
                count(*) FILTER (WHERE "kind" = ANY(ARRAY[${LEAD_KINDS.map((k) => `'${k}'`).join(",")}]))::int AS leads
         FROM "TouchAttribution" WHERE "createdAt" >= $1 AND "createdAt" < $2${taF} GROUP BY 1`,
        f.from, f.to, ...ta,
      ),
      prisma.$queryRawUnsafe<Array<{ campaign: string; source: string | null; sessions: number; conversions: number }>>(
        `WITH v AS (SELECT "campaign", max("source") AS source, count(DISTINCT "sessionId")::int AS sessions FROM "PageView"
                    WHERE "createdAt" >= $1 AND "createdAt" < $2 AND "campaign" IS NOT NULL AND ${a}${x.sql} GROUP BY 1),
              c AS (SELECT "${camp}" AS campaign, count(*)::int AS n FROM "TouchAttribution" WHERE "createdAt" >= $1 AND "createdAt" < $2 AND "${camp}" IS NOT NULL GROUP BY 1)
         SELECT COALESCE(v.campaign, c.campaign) AS campaign, v.source, COALESCE(v.sessions, 0) AS sessions, COALESCE(c.n, 0) AS conversions
         FROM v FULL JOIN c ON c.campaign = v.campaign ORDER BY sessions DESC, conversions DESC LIMIT 100`,
        f.from, f.to, ...x.args,
      ),
      prisma.$queryRawUnsafe<Array<{ page: string; n: number; b: number; top: string | null }>>(
        `${sessCte("$1", "$2")} SELECT landing AS page, count(*)::int AS n, count(*) FILTER (WHERE views = 1 AND ms < 10000)::int AS b,
                mode() WITHIN GROUP (ORDER BY source) AS top
         FROM s GROUP BY landing ORDER BY n DESC LIMIT 100`,
        f.from, f.to, ...x.args,
      ),
      prisma.$queryRawUnsafe<Array<{ medium: string; n: number }>>(
        `${sessCte("$1", "$2")} SELECT COALESCE(medium, '(unknown)') AS medium, count(*)::int AS n FROM s GROUP BY 1 ORDER BY n DESC`,
        f.from, f.to, ...x.args,
      ),
    ]);
    const prevMap = new Map(prev.map((p) => [p.source, p.n]));
    const convMap = new Map(conv.map((c) => [c.source, c]));
    const rows: SourceRow[] = cur.map((r) => {
      const c = convMap.get(r.source);
      return { source: r.source, medium: r.medium ?? c?.medium ?? null, sessions: r.n, prevSessions: prevMap.get(r.source) ?? 0, bounce: r.b, signups: c?.signups ?? 0, bookings: c?.bookings ?? 0, leads: c?.leads ?? 0 };
    });
    // Sources that converted without a visit in the period (the visit was earlier).
    for (const c of conv) if (!rows.some((r) => r.source === c.source)) rows.push({ source: c.source, medium: c.medium, sessions: 0, prevSessions: prevMap.get(c.source) ?? 0, bounce: 0, signups: c.signups, bookings: c.bookings, leads: c.leads });
    return {
      sources: rows.slice(0, 100),
      campaigns: camps,
      landings: lands.map((l) => ({ page: l.page, sessions: l.n, bounce: l.b, topSource: l.top })),
      mediums: meds.map((m) => ({ medium: m.medium, sessions: m.n })),
      totalSessions: cur.reduce((n, r) => n + r.n, 0),
    };
  });
}

/** Distinct sources seen recently, for the filter dropdown. */
export async function knownSources(): Promise<string[]> {
  return cached("acq:sources", async () => {
    try {
      await ensureAnalyticsTables();
      const r = await prisma.$queryRawUnsafe<Array<{ source: string }>>(
        `SELECT "source" FROM "PageView" WHERE "createdAt" >= now() - interval '90 days' AND "source" IS NOT NULL GROUP BY 1 ORDER BY count(*) DESC LIMIT 40`,
      );
      return r.map((x) => x.source);
    } catch {
      return [];
    }
  });
}

export function acquisitionCsvRows(a: Acquisition, table: string): unknown[][] {
  switch (table) {
    case "campaigns": return [["campaign", "source", "sessions", "conversions"], ...a.campaigns.map((c) => [c.campaign, c.source, c.sessions, c.conversions])];
    case "landings": return [["landing_page", "sessions", "bounces", "top_source"], ...a.landings.map((l) => [l.page, l.sessions, l.bounce, l.topSource])];
    case "mediums": return [["medium", "sessions"], ...a.mediums.map((m) => [m.medium, m.sessions])];
    default: return [["source", "medium", "sessions", "previous_period_sessions", "bounces", "signups", "bookings", "leads"], ...a.sources.map((s) => [s.source, s.medium, s.sessions, s.prevSessions, s.bounce, s.signups, s.bookings, s.leads])];
  }
}
