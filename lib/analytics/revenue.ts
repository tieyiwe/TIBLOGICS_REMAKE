import prisma from "@/lib/prisma";
import { PLANS } from "@/lib/payments/provider";
import { TRACK_MONTHLY_CENTS } from "@/lib/learn/track-monthly";
import { ensureAnalyticsTables } from "./db";
import { cached } from "./cache";
import type { Filters } from "./filters";

// Revenue analytics (/admin_pro/analytics/revenue; owner, admins and the
// Business analytics permission). Every paid record the platform stores, as
// one list of (line, when, cents, buyer, record):
//
//   ARFA tracks         TrackPurchase (one-time)
//   ARFA monthly plans  LearnSubscription / TrackSubscription: the first month
//                       at today's list price (renewals are not stored: an
//                       estimate, labelled so; MRR is on the Business report)
//   Youth               YouthSponsorship, once paid
//   Store               Order paid or fulfilled
//   Scanner reports     ScannerLead unlocked by payment
//   Donations           ScholarshipDonation (first gifts and renewals)
//   Bookings, events, blueprints: paid appointments, registrations, blueprints
//
// Attribution joins each record to its TouchAttribution row (first or last
// touch, lib/analytics/touch.ts). The buyer key (email or learner id) is only
// used inside SQL to tell new from returning buyers; it never leaves it.

export const LINES: Record<string, string> = {
  arfa_tracks: "ARFA tracks",
  arfa_plans: "ARFA monthly plans (first month, est.)",
  youth: "AI-Empowered Youth",
  store: "Store",
  scanner_reports: "Scanner reports",
  donations: "Donations",
  bookings: "Paid bookings",
  events: "Events",
  blueprints: "AI Blueprints",
};

const OPTIONAL = ["TrackPurchase", "TrackSubscription", "YouthSponsorship", "ScholarshipDonation", "Blueprint", "TouchAttribution", "LearnTrack"] as const;

async function present(): Promise<Record<string, boolean>> {
  const rows = await prisma.$queryRawUnsafe<Array<{ t: string; ok: boolean }>>(
    `SELECT t, to_regclass(quote_ident(t)) IS NOT NULL AS ok FROM unnest($1::text[]) AS t`,
    [...OPTIONAL],
  );
  return Object.fromEntries(rows.map((r) => [r.t, r.ok]));
}

/** The union of paid records. Only constants are spliced in. */
function revSql(has: Record<string, boolean>): string {
  const monthly = Object.entries(TRACK_MONTHLY_CENTS)
    .map(([slug, c]) => `('${slug.replace(/'/g, "")}', ${Number(c) | 0})`)
    .join(", ");
  const parts = [
    `SELECT 'store' AS line, o."createdAt" AS at, o."total"::bigint AS cents, lower(o."email") AS buyer, 'order' AS kind, o."id" AS ref, NULL::text AS product FROM "Order" o WHERE o."status" IN ('paid','fulfilled')`,
    `SELECT 'bookings', a."createdAt", a."totalAmount"::bigint, lower(a."email"), 'appointment', a."id", a."serviceType" FROM "Appointment" a WHERE a."paymentStatus" = 'paid'`,
    `SELECT 'events', e."createdAt", e."price"::bigint, lower(e."email"), 'event_registration', e."id", e."eventName" FROM "EventRegistration" e WHERE e."status" = 'paid'`,
    `SELECT 'scanner_reports', COALESCE(l."unlockedAt", l."createdAt"), COALESCE(l."amountPaid", 0)::bigint, lower(l."email"), 'scanner', l."id", 'Website scanner full report' FROM "ScannerLead" l WHERE l."unlockSource" = 'paid'`,
    `SELECT 'arfa_plans', ls."createdAt", ${PLANS.monthly.amount}::bigint, ls."studentId", 'learn_subscription_checkout', ls."studentId", 'ARFA all-tracks monthly plan' FROM "LearnSubscription" ls WHERE ls."stripeSubscriptionId" IS NOT NULL`,
  ];
  if (has.TrackPurchase)
    parts.push(
      `SELECT 'arfa_tracks', tp."createdAt", tp."amountCents"::bigint, tp."studentId", 'track_checkout', tp."studentId" || ':' || tp."trackId", ${has.LearnTrack ? `(SELECT t."title" FROM "LearnTrack" t WHERE t."id" = tp."trackId")` : `tp."trackId"`} FROM "TrackPurchase" tp`,
    );
  if (has.TrackSubscription && monthly)
    parts.push(
      `SELECT 'arfa_plans', ts."createdAt", COALESCE(p.c, 0)::bigint, ts."studentId", 'track_checkout', ts."studentId" || ':' || ts."trackId", COALESCE(t."title", 'Track') || ' monthly' FROM "TrackSubscription" ts LEFT JOIN "LearnTrack" t ON t."id" = ts."trackId" LEFT JOIN (VALUES ${monthly}) AS p(slug, c) ON p.slug = t."slug"`,
    );
  if (has.YouthSponsorship)
    parts.push(`SELECT 'youth', y."createdAt", y."amountCents"::bigint, lower(y."sponsorEmail"), 'youth_sponsor', y."id", 'AI-Empowered Youth (' || y."plan" || ')' FROM "YouthSponsorship" y WHERE y."status" <> 'checkout'`);
  if (has.ScholarshipDonation)
    parts.push(`SELECT 'donations', d."createdAt", d."amountCents"::bigint, lower(d."email"), 'donation', d."stripeSessionId", 'Scholarship donation (' || d."frequency" || ')' FROM "ScholarshipDonation" d`);
  if (has.Blueprint) parts.push(`SELECT 'blueprints', b."paidAt", b."amountPaid"::bigint, lower(b."email"), 'blueprint', b."id", 'AI Blueprint' FROM "Blueprint" b WHERE b."paidAt" IS NOT NULL`);
  return parts.join("\n UNION ALL ");
}

export interface RevenueData {
  total: { cur: number; prev: number; orders: number; prevOrders: number; buyers: number; prevBuyers: number };
  lines: Array<{ key: string; label: string; cur: number; prev: number; n: number }>;
  bySource: Array<{ key: string; medium: string | null; cur: number; n: number }>;
  byCampaign: Array<{ key: string; cur: number; n: number }>;
  byCountry: Array<{ key: string; cur: number; n: number }>;
  newVsReturning: { newCents: number; newBuyers: number; retCents: number; retBuyers: number };
  trend: Array<{ day: string; value: number }>;
  bucket: "day" | "week" | "month";
  products: Array<{ name: string; line: string; cents: number; n: number }>;
  refunds: { cents: number; n: number; tracked: boolean };
  attributed: number;
}

export async function getRevenue(f: Filters, model: "first" | "last" = "last"): Promise<RevenueData> {
  return cached(`revenue:${f.from.toISOString().slice(0, 13)}:${f.to.toISOString().slice(0, 13)}:${f.source}:${f.country}:${f.device}:${model}`, async () => {
    await ensureAnalyticsTables();
    const has = await present();
    const touch = has.TouchAttribution;
    const src = model === "first" ? "ftSource" : "ltSource";
    const med = model === "first" ? "ftMedium" : "ltMedium";
    const camp = model === "first" ? "ftCampaign" : "ltCampaign";
    const args: unknown[] = [f.from, f.to, f.prevFrom];
    let filt = "";
    if (touch) {
      if (f.source) { args.push(f.source); filt += ` AND ta."${src}" = $${args.length}`; }
      if (f.country) { args.push(f.country); filt += ` AND ta."country" = $${args.length}`; }
      if (f.device) { args.push(f.device); filt += ` AND ta."device" = $${args.length}`; }
    }
    const join = touch ? `LEFT JOIN "TouchAttribution" ta ON ta."kind" = r.kind AND ta."refId" = r.ref` : "";
    const taCol = (c: string) => (touch ? `ta."${c}"` : "NULL::text");
    const base = `WITH rev AS (${revSql(has)}),
      r AS (SELECT r.*, ${taCol(src)} AS src, ${taCol(med)} AS med, ${taCol(camp)} AS camp, ${taCol("country")} AS country,
              min(r.at) OVER (PARTITION BY r.buyer) AS first_at
            FROM rev r ${join} WHERE r.at IS NOT NULL${filt})`;
    const span = Math.max(1, (f.to.getTime() - f.from.getTime()) / 86_400_000);
    const bucket: RevenueData["bucket"] = span <= 45 ? "day" : span <= 140 ? "week" : "month";
    const q = <T,>(sql: string) => prisma.$queryRawUnsafe<T[]>(`${base} ${sql}`, ...args);
    const [tot, lines, bySource, byCampaign, byCountry, nvr, trend, products] = await Promise.all([
      q<{ cur: bigint; prev: bigint; n: number; pn: number; b: number; pb: number; att: number }>(
        `SELECT COALESCE(sum(cents) FILTER (WHERE at >= $1 AND at < $2), 0)::bigint AS cur,
                COALESCE(sum(cents) FILTER (WHERE at >= $3 AND at < $1), 0)::bigint AS prev,
                count(*) FILTER (WHERE at >= $1 AND at < $2)::int AS n, count(*) FILTER (WHERE at >= $3 AND at < $1)::int AS pn,
                count(DISTINCT buyer) FILTER (WHERE at >= $1 AND at < $2)::int AS b, count(DISTINCT buyer) FILTER (WHERE at >= $3 AND at < $1)::int AS pb,
                count(*) FILTER (WHERE at >= $1 AND at < $2 AND src IS NOT NULL AND src <> '(unknown)')::int AS att
         FROM r`,
      ),
      q<{ line: string; cur: bigint; prev: bigint; n: number }>(
        `SELECT line, COALESCE(sum(cents) FILTER (WHERE at >= $1 AND at < $2), 0)::bigint AS cur,
                COALESCE(sum(cents) FILTER (WHERE at >= $3 AND at < $1), 0)::bigint AS prev,
                count(*) FILTER (WHERE at >= $1 AND at < $2)::int AS n
         FROM r GROUP BY line`,
      ),
      q<{ key: string; medium: string | null; cur: bigint; n: number }>(
        `SELECT COALESCE(src, '(not attributed)') AS key, max(med) AS medium, sum(cents)::bigint AS cur, count(*)::int AS n
         FROM r WHERE at >= $1 AND at < $2 GROUP BY 1 ORDER BY cur DESC LIMIT 50`,
      ),
      q<{ key: string; cur: bigint; n: number }>(
        `SELECT camp AS key, sum(cents)::bigint AS cur, count(*)::int AS n FROM r WHERE at >= $1 AND at < $2 AND camp IS NOT NULL GROUP BY 1 ORDER BY cur DESC LIMIT 50`,
      ),
      q<{ key: string; cur: bigint; n: number }>(
        `SELECT COALESCE(country, '??') AS key, sum(cents)::bigint AS cur, count(*)::int AS n FROM r WHERE at >= $1 AND at < $2 GROUP BY 1 ORDER BY cur DESC LIMIT 50`,
      ),
      q<{ nc: bigint; nb: number; rc: bigint; rb: number }>(
        `SELECT COALESCE(sum(cents) FILTER (WHERE first_at >= $1), 0)::bigint AS nc, count(DISTINCT buyer) FILTER (WHERE first_at >= $1)::int AS nb,
                COALESCE(sum(cents) FILTER (WHERE first_at < $1), 0)::bigint AS rc, count(DISTINCT buyer) FILTER (WHERE first_at < $1)::int AS rb
         FROM r WHERE at >= $1 AND at < $2`,
      ),
      q<{ d: Date; n: bigint }>(`SELECT date_trunc('${bucket}', at) AS d, sum(cents)::bigint AS n FROM r WHERE at >= $1 AND at < $2 GROUP BY 1 ORDER BY 1`),
      q<{ name: string; line: string; cents: bigint; n: number }>(
        `SELECT name, line, sum(c)::bigint AS cents, sum(q)::int AS n FROM (
           SELECT COALESCE(it->>'name', 'Store item') AS name, 'store' AS line,
                  (COALESCE((it->>'price')::bigint, 0) * GREATEST(COALESCE((it->>'quantity')::int, 1), 1)) AS c, GREATEST(COALESCE((it->>'quantity')::int, 1), 1) AS q
           FROM r JOIN "Order" o ON r.kind = 'order' AND o."id" = r.ref, jsonb_array_elements(CASE WHEN jsonb_typeof(o."items") = 'array' THEN o."items" ELSE '[]'::jsonb END) it
           WHERE r.at >= $1 AND r.at < $2
           UNION ALL SELECT COALESCE(product, line), line, cents, 1 FROM r WHERE at >= $1 AND at < $2 AND kind <> 'order'
         ) x GROUP BY 1, 2 ORDER BY cents DESC LIMIT 20`,
      ),
    ]);
    // Refunds: only what the platform records (orders marked refunded); Stripe-side refunds are not synced.
    const refunds = await prisma
      .$queryRawUnsafe<Array<{ c: bigint; n: number }>>(
        `SELECT COALESCE(sum("total"), 0)::bigint AS c, count(*)::int AS n FROM "Order" WHERE "status" = 'refunded' AND "updatedAt" >= $1 AND "updatedAt" < $2`,
        f.from, f.to,
      )
      .catch(() => [{ c: BigInt(0), n: 0 }]);
    const t = tot[0];
    const N = (v: bigint | number | null | undefined) => Number(v ?? 0);
    const lineMap = new Map(lines.map((l) => [l.line, l]));
    return {
      total: { cur: N(t?.cur), prev: N(t?.prev), orders: t?.n ?? 0, prevOrders: t?.pn ?? 0, buyers: t?.b ?? 0, prevBuyers: t?.pb ?? 0 },
      lines: Object.entries(LINES).map(([key, label]) => ({ key, label, cur: N(lineMap.get(key)?.cur), prev: N(lineMap.get(key)?.prev), n: lineMap.get(key)?.n ?? 0 })).sort((a, b) => b.cur - a.cur),
      bySource: bySource.map((x) => ({ key: x.key, medium: x.medium, cur: N(x.cur), n: x.n })),
      byCampaign: byCampaign.map((x) => ({ key: x.key, cur: N(x.cur), n: x.n })),
      byCountry: byCountry.map((x) => ({ key: x.key, cur: N(x.cur), n: x.n })),
      newVsReturning: { newCents: N(nvr[0]?.nc), newBuyers: nvr[0]?.nb ?? 0, retCents: N(nvr[0]?.rc), retBuyers: nvr[0]?.rb ?? 0 },
      trend: fillTrend(f, bucket, trend.map((x) => ({ d: new Date(x.d), n: N(x.n) }))),
      bucket,
      products: products.map((p) => ({ name: p.name, line: p.line, cents: N(p.cents), n: p.n })),
      refunds: { cents: N(refunds[0]?.c), n: refunds[0]?.n ?? 0, tracked: true },
      attributed: t?.att ?? 0,
    };
  });
}

function fillTrend(f: Filters, bucket: RevenueData["bucket"], rows: Array<{ d: Date; n: number }>): Array<{ day: string; value: number }> {
  const key = (d: Date) => d.toISOString().slice(0, 10);
  const by = new Map(rows.map((r) => [key(r.d), r.n]));
  const out: Array<{ day: string; value: number }> = [];
  const d = new Date(f.from);
  d.setUTCHours(0, 0, 0, 0);
  if (bucket === "week") d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  if (bucket === "month") d.setUTCDate(1);
  for (let i = 0; d < f.to && i < 400; i++) {
    out.push({ day: key(d), value: by.get(key(d)) ?? 0 });
    if (bucket === "day") d.setUTCDate(d.getUTCDate() + 1);
    else if (bucket === "week") d.setUTCDate(d.getUTCDate() + 7);
    else d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

export function revenueCsvRows(r: RevenueData, table: string): unknown[][] {
  const $ = (c: number) => (c / 100).toFixed(2);
  switch (table) {
    case "lines": return [["product_line", "revenue_usd", "previous_period_usd", "payments"], ...r.lines.map((l) => [l.label, $(l.cur), $(l.prev), l.n])];
    case "sources": return [["source", "medium", "revenue_usd", "payments"], ...r.bySource.map((l) => [l.key, l.medium, $(l.cur), l.n])];
    case "campaigns": return [["campaign", "revenue_usd", "payments"], ...r.byCampaign.map((l) => [l.key, $(l.cur), l.n])];
    case "countries": return [["country", "revenue_usd", "payments"], ...r.byCountry.map((l) => [l.key, $(l.cur), l.n])];
    case "trend": return [[r.bucket, "revenue_usd"], ...r.trend.map((l) => [l.day, $(l.value)])];
    case "products": return [["product", "line", "revenue_usd", "units"], ...r.products.map((l) => [l.name, LINES[l.line] ?? l.line, $(l.cents), l.n])];
    default: return [["metric", "value"], ["revenue_usd", $(r.total.cur)], ["previous_usd", $(r.total.prev)], ["payments", r.total.orders], ["buyers", r.total.buyers],
      ["arpu_usd", r.total.buyers ? $(r.total.cur / r.total.buyers) : ""], ["new_buyer_revenue_usd", $(r.newVsReturning.newCents)], ["returning_buyer_revenue_usd", $(r.newVsReturning.retCents)],
      ["refunds_usd", $(r.refunds.cents)]];
  }
}
