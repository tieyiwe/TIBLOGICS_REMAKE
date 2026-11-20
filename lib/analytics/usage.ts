import prisma from "@/lib/prisma";
import { ensureAnalyticsTables } from "./db";
import { cached } from "./cache";
import { areaSql } from "./paths";
import type { Filters } from "./filters";

// "Feature usage" (/admin_pro/analytics/usage): the most-viewed pages, the
// most-clicked links and buttons, the least-used ARFA features, and a device
// and country breakdown, for a date range and area. One GROUP BY per table,
// on the (page, createdAt) and (label, createdAt) indexes, at most 100 rows.

export interface PageRow { page: string; views: number; sessions: number; mobile: number; prevViews: number }
export interface ButtonRow { label: string; kind: string; clicks: number; sessions: number; pages: number; topPage: string | null; href: string | null }
export interface LabelPageRow { page: string; clicks: number; sessions: number }
export interface FeatureRow { key: string; label: string; views: number; clicks: number; sessions: number }
export interface SplitRow { key: string; views: number; sessions: number }

/** ARFA features the owner wants to watch: a page prefix and/or a data-track label. */
export const ARFA_FEATURES: Array<{ key: string; label: string; prefix?: string[]; track?: string }> = [
  { key: "tutor", label: "AI tutor", track: "arfa-tutor-open" },
  { key: "review", label: "Review (spaced practice)", prefix: ["/learn/review"] },
  { key: "studio", label: "Studio", prefix: ["/learn/studio"] },
  { key: "challenge", label: "Weekly challenge", prefix: ["/learn/challenge"] },
  { key: "cases", label: "Case studies", prefix: ["/learn/cases"] },
  { key: "community", label: "Community", prefix: ["/learn/community"] },
  { key: "live", label: "Live sessions", prefix: ["/learn/live"] },
  { key: "cheatsheet", label: "Cheat sheets", track: "arfa-cheatsheet" },
  { key: "glossary", label: "Glossary", prefix: ["/learning-box/glossary"], track: "arfa-glossary-term" },
];

interface Where {
  sql: string;
  args: unknown[];
}

/** Device and country filters (PageView and ClickEvent both have the columns). */
function extra(f: Filters, start: number): Where {
  const parts: string[] = [];
  const args: unknown[] = [];
  if (f.device) {
    args.push(f.device);
    parts.push(`"device" = $${start + args.length}`);
  }
  if (f.country) {
    args.push(f.country);
    parts.push(`"country" = $${start + args.length}`);
  }
  return { sql: parts.length ? ` AND ${parts.join(" AND ")}` : "", args };
}

const key = (name: string, f: Filters, more = "") =>
  `usage:${name}:${f.from.toISOString().slice(0, 13)}:${f.to.toISOString().slice(0, 13)}:${f.area}:${f.device}:${f.country}:${more}`;

export async function topPages(f: Filters): Promise<PageRow[]> {
  return cached(key("pages", f), async () => {
    await ensureAnalyticsTables();
    const x = extra(f, 2);
    const rows = await prisma.$queryRawUnsafe<Array<{ page: string; views: number; sessions: number; mobile: number }>>(
      `SELECT "page", count(*)::int AS views, count(DISTINCT "sessionId")::int AS sessions,
              count(*) FILTER (WHERE "device" = 'mobile')::int AS mobile
       FROM "PageView" WHERE "createdAt" >= $1 AND "createdAt" < $2 AND ${areaSql(f.area)}${x.sql}
       GROUP BY "page" ORDER BY views DESC, "page" LIMIT 100`,
      f.from, f.to, ...x.args,
    );
    if (!rows.length) return [];
    const px = extra(f, 3);
    const prev = await prisma.$queryRawUnsafe<Array<{ page: string; views: number }>>(
      `SELECT "page", count(*)::int AS views FROM "PageView"
       WHERE "createdAt" >= $1 AND "createdAt" < $2 AND "page" = ANY($3::text[])${px.sql}
       GROUP BY "page"`,
      f.prevFrom, f.prevTo, rows.map((r) => r.page), ...px.args,
    );
    const pm = new Map(prev.map((p) => [p.page, p.views]));
    return rows.map((r) => ({ ...r, prevViews: pm.get(r.page) ?? 0 }));
  });
}

export async function topButtons(f: Filters): Promise<ButtonRow[]> {
  return cached(key("buttons", f), async () => {
    await ensureAnalyticsTables();
    const x = extra(f, 2);
    return prisma.$queryRawUnsafe<ButtonRow[]>(
      `SELECT "label", mode() WITHIN GROUP (ORDER BY "kind") AS kind, count(*)::int AS clicks,
              count(DISTINCT "sessionId")::int AS sessions, count(DISTINCT "page")::int AS pages,
              mode() WITHIN GROUP (ORDER BY "page") AS "topPage", mode() WITHIN GROUP (ORDER BY "href") AS href
       FROM "ClickEvent" WHERE "createdAt" >= $1 AND "createdAt" < $2 AND ${areaSql(f.area)}${x.sql}
       GROUP BY "label" ORDER BY clicks DESC, "label" LIMIT 100`,
      f.from, f.to, ...x.args,
    );
  });
}

/** Where one button or link is clicked. */
export async function labelPages(f: Filters, label: string): Promise<LabelPageRow[]> {
  return cached(key("label", f, label), async () => {
    await ensureAnalyticsTables();
    const x = extra(f, 3);
    return prisma.$queryRawUnsafe<LabelPageRow[]>(
      `SELECT "page", count(*)::int AS clicks, count(DISTINCT "sessionId")::int AS sessions
       FROM "ClickEvent" WHERE "label" = $3 AND "createdAt" >= $1 AND "createdAt" < $2 AND ${areaSql(f.area)}${x.sql}
       GROUP BY "page" ORDER BY clicks DESC LIMIT 100`,
      f.from, f.to, label.slice(0, 120), ...x.args,
    );
  });
}

/** ARFA features, least used first. Views of the feature's pages plus clicks on its controls. */
export async function arfaFeatures(f: Filters): Promise<FeatureRow[]> {
  return cached(key("features", f), async () => {
    await ensureAnalyticsTables();
    const x = extra(f, 2);
    const viewCase = ARFA_FEATURES.filter((a) => a.prefix)
      .map((a) => `WHEN ${a.prefix!.map((p) => `("page" = '${p}' OR "page" LIKE '${p}/%')`).join(" OR ")} THEN '${a.key}'`)
      .join(" ");
    const clickCase = ARFA_FEATURES.filter((a) => a.track).map((a) => `WHEN "label" = '${a.track}' THEN '${a.key}'`).join(" ");
    const [views, clicks] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ k: string; n: number; s: number }>>(
        `SELECT k, count(*)::int AS n, count(DISTINCT "sessionId")::int AS s FROM (
           SELECT CASE ${viewCase} END AS k, "sessionId" FROM "PageView"
           WHERE "createdAt" >= $1 AND "createdAt" < $2 AND ("page" LIKE '/learn/%' OR "page" LIKE '/learning-box/glossary%')${x.sql}
         ) t WHERE k IS NOT NULL GROUP BY k`,
        f.from, f.to, ...x.args,
      ),
      prisma.$queryRawUnsafe<Array<{ k: string; n: number; s: number }>>(
        `SELECT k, count(*)::int AS n, count(DISTINCT "sessionId")::int AS s FROM (
           SELECT CASE ${clickCase} END AS k, "sessionId" FROM "ClickEvent"
           WHERE "createdAt" >= $1 AND "createdAt" < $2 AND "label" LIKE 'arfa-%'${x.sql}
         ) t WHERE k IS NOT NULL GROUP BY k`,
        f.from, f.to, ...x.args,
      ),
    ]);
    const v = new Map(views.map((r) => [r.k, r]));
    const c = new Map(clicks.map((r) => [r.k, r]));
    return ARFA_FEATURES.map((a) => ({
      key: a.key,
      label: a.label,
      views: v.get(a.key)?.n ?? 0,
      clicks: c.get(a.key)?.n ?? 0,
      sessions: Math.max(v.get(a.key)?.s ?? 0, c.get(a.key)?.s ?? 0),
    })).sort((a, b) => a.views + a.clicks - (b.views + b.clicks) || a.label.localeCompare(b.label));
  });
}

export async function splits(f: Filters): Promise<{ devices: SplitRow[]; countries: SplitRow[]; totals: { views: number; sessions: number; clicks: number; prevViews: number; prevSessions: number; prevClicks: number } }> {
  return cached(key("splits", f), async () => {
    await ensureAnalyticsTables();
    const x = extra(f, 2);
    const x3 = extra(f, 3);
    const a = areaSql(f.area);
    const [devices, countries, totals, clicks] = await Promise.all([
      prisma.$queryRawUnsafe<SplitRow[]>(
        `SELECT "device" AS key, count(*)::int AS views, count(DISTINCT "sessionId")::int AS sessions FROM "PageView"
         WHERE "createdAt" >= $1 AND "createdAt" < $2 AND ${a}${x.sql} GROUP BY "device" ORDER BY views DESC`,
        f.from, f.to, ...x.args,
      ),
      prisma.$queryRawUnsafe<SplitRow[]>(
        `SELECT COALESCE("country", '??') AS key, count(*)::int AS views, count(DISTINCT "sessionId")::int AS sessions FROM "PageView"
         WHERE "createdAt" >= $1 AND "createdAt" < $2 AND ${a}${x.sql} GROUP BY 1 ORDER BY views DESC LIMIT 30`,
        f.from, f.to, ...x.args,
      ),
      prisma.$queryRawUnsafe<Array<{ cur: number; curS: number; prev: number; prevS: number }>>(
        `SELECT count(*) FILTER (WHERE "createdAt" >= $1)::int AS cur,
                count(DISTINCT "sessionId") FILTER (WHERE "createdAt" >= $1)::int AS "curS",
                count(*) FILTER (WHERE "createdAt" < $1)::int AS prev,
                count(DISTINCT "sessionId") FILTER (WHERE "createdAt" < $1)::int AS "prevS"
         FROM "PageView" WHERE "createdAt" >= $3 AND "createdAt" < $2 AND ${a}${x3.sql}`,
        f.from, f.to, f.prevFrom, ...x3.args,
      ),
      prisma.$queryRawUnsafe<Array<{ cur: number; prev: number }>>(
        `SELECT count(*) FILTER (WHERE "createdAt" >= $1)::int AS cur, count(*) FILTER (WHERE "createdAt" < $1)::int AS prev
         FROM "ClickEvent" WHERE "createdAt" >= $3 AND "createdAt" < $2 AND ${a}${x3.sql}`,
        f.from, f.to, f.prevFrom, ...x3.args,
      ),
    ]);
    const t = totals[0] ?? { cur: 0, curS: 0, prev: 0, prevS: 0 };
    return {
      devices,
      countries,
      totals: { views: t.cur, sessions: t.curS, prevViews: t.prev, prevSessions: t.prevS, clicks: clicks[0]?.cur ?? 0, prevClicks: clicks[0]?.prev ?? 0 },
    };
  });
}

/** CSV tables of the usage page. */
export const USAGE_TABLES = ["pages", "buttons", "features", "devices", "countries", "label"] as const;
export type UsageTable = (typeof USAGE_TABLES)[number];

export async function usageCsvRows(table: UsageTable, f: Filters, label?: string | null): Promise<unknown[][]> {
  switch (table) {
    case "pages": {
      const r = await topPages(f);
      return [["page", "views", "unique_sessions", "previous_period_views", "mobile_share_pct"], ...r.map((x) => [x.page, x.views, x.sessions, x.prevViews, x.views ? Math.round((x.mobile / x.views) * 100) : 0])];
    }
    case "buttons": {
      const r = await topButtons(f);
      return [["label", "kind", "clicks", "unique_sessions", "pages", "top_page", "href"], ...r.map((x) => [x.label, x.kind, x.clicks, x.sessions, x.pages, x.topPage, x.href])];
    }
    case "label": {
      const r = label ? await labelPages(f, label) : [];
      return [["label", "page", "clicks", "unique_sessions"], ...r.map((x) => [label, x.page, x.clicks, x.sessions])];
    }
    case "features": {
      const r = await arfaFeatures(f);
      return [["feature", "page_views", "clicks", "sessions"], ...r.map((x) => [x.label, x.views, x.clicks, x.sessions])];
    }
    case "devices":
    case "countries": {
      const s = await splits(f);
      const rows = table === "devices" ? s.devices : s.countries;
      return [[table === "devices" ? "device" : "country", "views", "sessions"], ...rows.map((x) => [x.key, x.views, x.sessions])];
    }
  }
}
