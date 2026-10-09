import prisma from "@/lib/prisma";
import { ensureAnalyticsTables } from "./db";
import { cached } from "./cache";
import type { Filters } from "./filters";

// Conversion funnels (/admin_pro/analytics/funnels). Early steps are visits
// (distinct sessions in PageView, or client events in ToolUsage); later steps
// come from the business records themselves (appointments, scans, sign-ups,
// payments), never from a browser beacon. Source, device and country filters
// apply to visits through PageView, to scans through ScanLog, and to records
// through their TouchAttribution row (lib/analytics/touch.ts).
//
// Steps are counted independently in the period, so a later step can come from
// a visit before the period; conversion is each step over the one before.

export interface FunnelStep { key: string; label: string; n: number; prev: number; kind: "visits" | "records" }
export interface Funnel { key: string; label: string; note: string; steps: FunnelStep[] }

type Args = unknown[];

class Q {
  args: Args = [];
  p(v: unknown): string {
    this.args.push(v);
    return `$${this.args.length}`;
  }
}

/** Filters on a table with "device", "country" and "source" columns. */
function visitFilters(q: Q, f: Filters, alias = ""): string {
  const a = alias ? `${alias}.` : "";
  let s = "";
  if (f.device) s += ` AND ${a}"device" = ${q.p(f.device)}`;
  if (f.country) s += ` AND ${a}"country" = ${q.p(f.country)}`;
  if (f.source) s += ` AND ${a}"source" = ${q.p(f.source)}`;
  return s;
}

/** A join on TouchAttribution for records, when any filter is set. */
function touchJoin(q: Q, f: Filters, kind: string, refExpr: string): string {
  if (!f.device && !f.country && !f.source) return "";
  let s = ` JOIN "TouchAttribution" ta ON ta."kind" = ${q.p(kind)} AND ta."refId" = ${refExpr}`;
  if (f.device) s += ` AND ta."device" = ${q.p(f.device)}`;
  if (f.country) s += ` AND ta."country" = ${q.p(f.country)}`;
  if (f.source) s += ` AND ta."ltSource" = ${q.p(f.source)}`;
  return s;
}

async function count(sqlFor: (q: Q, from: Date, to: Date) => string, f: Filters): Promise<{ cur: number; prev: number }> {
  const run = async (from: Date, to: Date) => {
    const q = new Q();
    const sql = sqlFor(q, from, to);
    try {
      const r = await prisma.$queryRawUnsafe<Array<{ n: number }>>(sql, ...q.args);
      return Number(r[0]?.n ?? 0);
    } catch (err) {
      // A runtime table that does not exist yet: the step reads 0.
      console.error("[analytics/funnels]", err instanceof Error ? err.message.slice(0, 200) : err);
      return 0;
    }
  };
  const [cur, prev] = await Promise.all([run(f.from, f.to), run(f.prevFrom, f.prevTo)]);
  return { cur, prev };
}

const visits = (f: Filters, pageCond: string) => (q: Q, from: Date, to: Date) =>
  `SELECT count(DISTINCT "sessionId")::int AS n FROM "PageView"
   WHERE "createdAt" >= ${q.p(from)} AND "createdAt" < ${q.p(to)} AND (${pageCond})${visitFilters(q, f)}`;

const event = (f: Filters, tool: string) => (q: Q, from: Date, to: Date) =>
  `SELECT count(DISTINCT t."sessionId")::int AS n FROM "ToolUsage" t
   ${f.device || f.country || f.source ? `JOIN "PageView" pv ON pv."sessionId" = t."sessionId" AND pv."createdAt" >= ${q.p(from)} AND pv."createdAt" < ${q.p(to)}${visitFilters(q, f, "pv")}` : ""}
   WHERE t."tool" = ${q.p(tool)} AND t."createdAt" >= ${q.p(from)} AND t."createdAt" < ${q.p(to)}`;

/** Steps for one funnel, in order. */
type StepDef = { key: string; label: string; kind: FunnelStep["kind"]; sql: (q: Q, from: Date, to: Date) => string };

function defs(f: Filters): Array<{ key: string; label: string; note: string; steps: StepDef[] }> {
  const signupSet = (q: Q, from: Date, to: Date) =>
    `SELECT s."id" FROM "Student" s${touchJoin(q, f, "learn_signup", `s."id"`)} WHERE s."createdAt" >= ${q.p(from)} AND s."createdAt" < ${q.p(to)}`;
  return [
    {
      key: "services",
      label: "Services",
      note: "Visit, a services or contact page, the booking page, a time picked, a booking made, and a call held.",
      steps: [
        { key: "visit", label: "Visited the site", kind: "visits", sql: visits(f, "TRUE") },
        { key: "services", label: "Services or contact page", kind: "visits", sql: visits(f, `"page" = '/services' OR "page" LIKE '/services/%' OR "page" = '/contact'`) },
        { key: "book_page", label: "Opened the booking page", kind: "visits", sql: visits(f, `"page" = '/book'`) },
        { key: "book_start", label: "Booking started (picked a time)", kind: "visits", sql: event(f, "booking_details") },
        {
          key: "booked", label: "Booked", kind: "records",
          sql: (q, from, to) => `SELECT count(*)::int AS n FROM "Appointment" a${touchJoin(q, f, "appointment", `a."id"`)} WHERE a."createdAt" >= ${q.p(from)} AND a."createdAt" < ${q.p(to)} AND a."status" <> 'CANCELLED'`,
        },
        {
          key: "completed", label: "Call completed", kind: "records",
          sql: (q, from, to) => `SELECT count(*)::int AS n FROM "Appointment" a${touchJoin(q, f, "appointment", `a."id"`)} WHERE a."createdAt" >= ${q.p(from)} AND a."createdAt" < ${q.p(to)} AND a."status" = 'COMPLETED'`,
        },
      ],
    },
    {
      key: "scanner",
      label: "Website scanner",
      note: "The scanner (home page or /tools/scanner), a scan run, an email left for the results, and a report bought or a call booked.",
      steps: [
        { key: "scan_page", label: "Saw a scanner (home or /tools/scanner)", kind: "visits", sql: visits(f, `"page" IN ('/', '/tools/scanner')`) },
        {
          key: "scan_run", label: "Ran a scan", kind: "records",
          sql: (q, from, to) => `SELECT count(*)::int AS n FROM "ScanLog" WHERE "createdAt" >= ${q.p(from)} AND "createdAt" < ${q.p(to)} AND NOT "staff" AND "outcome" IN ('ok','held','limit','rescan')${visitFilters(q, f)}`,
        },
        {
          key: "email", label: "Left an email for the results", kind: "records",
          sql: (q, from, to) => `SELECT count(*)::int AS n FROM "ScannerLead" l
            ${f.device || f.country || f.source ? `JOIN "ScanLog" sl ON sl."leadId" = l."id"${visitFilters(q, f, "sl")}` : ""}
            WHERE l."createdAt" >= ${q.p(from)} AND l."createdAt" < ${q.p(to)} AND l."email" IS NOT NULL`,
        },
        {
          key: "converted", label: "Bought the report or booked a call", kind: "records",
          sql: (q, from, to) => `SELECT count(*)::int AS n FROM "ScannerLead" l
            ${f.device || f.country || f.source ? `JOIN "ScanLog" sl ON sl."leadId" = l."id"${visitFilters(q, f, "sl")}` : ""}
            WHERE l."createdAt" >= ${q.p(from)} AND l."createdAt" < ${q.p(to)} AND (l."unlockSource" = 'paid' OR l."bookedCallAt" IS NOT NULL OR l."appointmentId" IS NOT NULL)`,
        },
      ],
    },
    {
      key: "arfa",
      label: "ARFA (AI Academy)",
      note: "Learning Box, a track page, the join page, an account, a payment, the first lesson, a first module finished, a certificate. Steps from the account on follow the people who signed up in the period.",
      steps: [
        { key: "box", label: "Visited the Learning Box", kind: "visits", sql: visits(f, `"page" = '/learning-box' OR "page" LIKE '/learning-box/%'`) },
        { key: "track", label: "Viewed a track page", kind: "visits", sql: visits(f, `"page" LIKE '/learning-box/%' AND "page" NOT IN ('/learning-box/join', '/learning-box/glossary')`) },
        { key: "join", label: "Started joining", kind: "visits", sql: visits(f, `"page" = '/learning-box/join' OR "page" = '/learn/signup'`) },
        { key: "account", label: "Created an account", kind: "records", sql: (q, from, to) => `SELECT count(*)::int AS n FROM (${signupSet(q, from, to)}) s` },
        {
          key: "paid", label: "Bought a track or a plan", kind: "records",
          sql: (q, from, to) => `SELECT count(*)::int AS n FROM (${signupSet(q, from, to)}) s WHERE
            EXISTS (SELECT 1 FROM "TrackPurchase" tp WHERE tp."studentId" = s."id")
            OR EXISTS (SELECT 1 FROM "LearnSubscription" ls WHERE ls."studentId" = s."id" AND ls."stripeSubscriptionId" IS NOT NULL)
            OR (to_regclass('"TrackSubscription"') IS NOT NULL AND EXISTS (SELECT 1 FROM "TrackSubscription" ts WHERE ts."studentId" = s."id"))`,
        },
        { key: "lesson", label: "Completed a first lesson", kind: "records", sql: (q, from, to) => `SELECT count(*)::int AS n FROM (${signupSet(q, from, to)}) s WHERE EXISTS (SELECT 1 FROM "LessonProgress" lp WHERE lp."studentId" = s."id")` },
        {
          key: "module", label: "Finished a first module", kind: "records",
          sql: (q, from, to) => `SELECT count(*)::int AS n FROM (${signupSet(q, from, to)}) s WHERE EXISTS (
            SELECT 1 FROM "LearnModule" m WHERE NOT EXISTS (
              SELECT 1 FROM "Lesson" l WHERE l."moduleId" = m."id" AND NOT EXISTS (SELECT 1 FROM "LessonProgress" lp WHERE lp."studentId" = s."id" AND lp."lessonId" = l."id"))
            AND EXISTS (SELECT 1 FROM "Lesson" l WHERE l."moduleId" = m."id"))`,
        },
        { key: "cert", label: "Earned a certificate", kind: "records", sql: (q, from, to) => `SELECT count(*)::int AS n FROM (${signupSet(q, from, to)}) s WHERE EXISTS (SELECT 1 FROM "LearnCertificate" c WHERE c."studentId" = s."id" AND NOT c."revoked")` },
      ],
    },
    {
      key: "store",
      label: "Store",
      note: "A product page, a checkout started (an order created) and a paid order.",
      steps: [
        { key: "product", label: "Viewed a product", kind: "visits", sql: visits(f, `"page" LIKE '/store/%' AND "page" NOT LIKE '/store/collections%'`) },
        {
          key: "checkout", label: "Started checkout", kind: "records",
          sql: (q, from, to) => `SELECT count(*)::int AS n FROM "Order" o${touchJoin(q, f, "order", `o."id"`)} WHERE o."createdAt" >= ${q.p(from)} AND o."createdAt" < ${q.p(to)}`,
        },
        {
          key: "paid", label: "Paid", kind: "records",
          sql: (q, from, to) => `SELECT count(*)::int AS n FROM "Order" o${touchJoin(q, f, "order", `o."id"`)} WHERE o."createdAt" >= ${q.p(from)} AND o."createdAt" < ${q.p(to)} AND o."status" IN ('paid','fulfilled')`,
        },
      ],
    },
    {
      key: "youth",
      label: "AI-Empowered Youth",
      note: "The program page, the sponsor form, a paid sponsorship and the young person's account activated.",
      steps: [
        { key: "program", label: "Viewed the program", kind: "visits", sql: visits(f, `"page" LIKE '/learning-box/ai-empowered-youth%'`) },
        { key: "sponsor", label: "Opened the sponsor form", kind: "visits", sql: visits(f, `"page" = '/sponsor-youth'`) },
        { key: "sponsor_start", label: "Started the sponsor flow", kind: "visits", sql: event(f, "sponsor_step") },
        {
          key: "paid", label: "Paid", kind: "records",
          sql: (q, from, to) => `SELECT count(*)::int AS n FROM "YouthSponsorship" y${touchJoin(q, f, "youth_sponsor", `y."id"`)} WHERE y."createdAt" >= ${q.p(from)} AND y."createdAt" < ${q.p(to)} AND y."status" <> 'checkout'`,
        },
        {
          key: "active", label: "Young person activated", kind: "records",
          sql: (q, from, to) => `SELECT count(*)::int AS n FROM "YouthSponsorship" y${touchJoin(q, f, "youth_sponsor", `y."id"`)} WHERE y."createdAt" >= ${q.p(from)} AND y."createdAt" < ${q.p(to)} AND y."status" = 'active'`,
        },
      ],
    },
  ];
}

const fkey = (f: Filters) => `${f.from.toISOString().slice(0, 13)}:${f.to.toISOString().slice(0, 13)}:${f.device}:${f.country}:${f.source}`;

export async function getFunnels(f: Filters): Promise<Funnel[]> {
  return cached(`funnels:${fkey(f)}`, async () => {
    await ensureAnalyticsTables();
    return Promise.all(
      defs(f).map(async (d) => ({
        key: d.key,
        label: d.label,
        note: d.note,
        steps: await Promise.all(
          d.steps.map(async (s) => {
            const c = await count(s.sql, f);
            return { key: s.key, label: s.label, kind: s.kind, n: c.cur, prev: c.prev };
          }),
        ),
      })),
    );
  });
}

/** The step with the worst conversion from the step before (the biggest leak). */
export function biggestLeak(fn: Funnel): { from: FunnelStep; to: FunnelStep; rate: number } | null {
  let worst: { from: FunnelStep; to: FunnelStep; rate: number } | null = null;
  for (let i = 1; i < fn.steps.length; i++) {
    const a = fn.steps[i - 1];
    const b = fn.steps[i];
    if (a.n < 5) continue;
    const rate = Math.min(1, b.n / a.n);
    if (!worst || rate < worst.rate) worst = { from: a, to: b, rate };
  }
  return worst;
}

export function funnelCsvRows(funnels: Funnel[]): unknown[][] {
  const rows: unknown[][] = [["funnel", "step", "count", "previous_period", "conversion_from_previous_step_pct", "of_first_step_pct", "drop_off"]];
  for (const fn of funnels) {
    fn.steps.forEach((s, i) => {
      const before = i ? fn.steps[i - 1].n : null;
      rows.push([
        fn.label, s.label, s.n, s.prev,
        before ? Math.round((Math.min(s.n, before) / before) * 100) : "",
        fn.steps[0].n ? Math.round((s.n / fn.steps[0].n) * 100) : "",
        before != null ? Math.max(0, before - s.n) : "",
      ]);
    });
  }
  return rows;
}
