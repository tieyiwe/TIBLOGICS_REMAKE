// Owner analytics (/admin_pro/analytics): revenue, funnel, learning,
// retention, engagement and content, for a 7/30/90-day window compared with
// the window before it. Admin/owner only: callers check first.
//
// Design rules:
//   - Aggregated SQL only (prisma.$queryRaw tagged templates). Dates and the
//     table-name list are bound parameters; the only Prisma.raw/Prisma.sql
//     fragments spliced in are constants written here, never request input.
//   - A fixed number of queries per load (about 17), whatever the data size.
//   - Read only. Several tables are created at runtime by their features
//     (TrackPurchase, Team, LoginEvent, Tutor, Community, Video, Toolkit...),
//     so one to_regclass query decides which of them exist, and every query
//     that touches an optional table only includes that part when it does.
//     A missing table shows as "not tracked", never a crash.
//   - Results are cached in process for CACHE_MS per range.
//
// Definitions reused from lib/learn/admin/learners.ts and lib/admin/metrics.ts:
//   - Active learner: signed in (LoginEvent), completed a lesson, or earned XP
//     (PointsLedger) in the window.
//   - Paid learner: a Stripe Learn subscription (live or since cancelled) or a
//     one-time track purchase.
//   - Learn MRR: active subscriptions at today's plan prices (PLANS), annual
//     divided by 12, plus team seats (teamMrr). An estimate, labelled so.
//   - Track completed: holds a certificate for it, or every lesson is done
//     (LessonProgress) or tested out (LessonMastery). Days to complete run
//     from first activity in the track to the certificate (or last lesson).
//   - Paid one-time revenue: Order paid|fulfilled, EventRegistration paid,
//     Appointment paid, Blueprint paidAt, TrackPurchase: stored amounts.
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { PLANS } from "@/lib/payments/provider";
import { toolkitPlans } from "@/lib/toolkit/config";
import { teamMrr } from "@/lib/learn/team/admin";

const DAY = 86_400_000;
const CACHE_MS = 60_000;
/** A learner with no activity in a started track for this long counts as stalled. */
export const STALL_DAYS = 14;
/** Minimum answers before a question can appear in "hardest questions". */
export const MIN_ANSWERS = 5;

/**
 * Owner analytics shows revenue, so it is narrower than "staff": the owner,
 * admins, or a collaborator granted every permission ("*"). Learners never.
 */
export function canViewAnalytics(
  user: { studentId?: string | null; isOwner?: boolean; isAdmin?: boolean; permissions?: string[] } | null | undefined,
): boolean {
  if (!user || user.studentId) return false;
  return !!(user.isOwner || user.isAdmin || user.permissions?.includes("*"));
}

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

export function parseRange(v: string | string[] | null | undefined): RangeDays {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 30;
}

const OPTIONAL_TABLES = [
  "TrackPurchase", "Team", "ToolkitSubscription", "ToolkitRun", "LoginEvent", "DiagnosticSession",
  "LessonMastery", "TutorThread", "TutorMessage", "CommunityThread", "CommunityPost", "VideoProgress",
  "Blueprint", "PageView", "CohortMember",
] as const;
type OptionalTable = (typeof OPTIONAL_TABLES)[number];

// ── Result shape ────────────────────────────────────────────────────────────

export interface Pair { cur: number; prev: number }
export interface DayPoint { day: string; value: number }

export interface RevenueSource { key: string; label: string; cents: Pair; count: Pair; tracked: boolean }

export interface Analytics {
  range: RangeDays;
  generatedAt: string;
  from: string;
  prevFrom: string;
  tables: Record<OptionalTable, boolean>;
  revenue: {
    sources: RevenueSource[];
    total: Pair;
    daily: DayPoint[];
    mrr: {
      learnCents: number;
      learnMonthly: number;
      learnAnnual: number;
      learnPriceCents: number;
      teamCents: number;
      teams: number;
      teamSeats: number;
      toolkitCents: number | null;
      toolkitActive: number;
      totalCents: number;
    };
    newLearnSubs: Pair;
    cancelledLearnSubs: Pair;
    newToolkitSubs: Pair | null;
    newTeams: Pair | null;
  };
  funnel: {
    visitors: Pair | null;
    steps: Array<{ key: string; label: string; cur: number; prev: number }>;
  };
  learning: {
    dau: Pair;
    wau: Pair;
    mau: Pair;
    dailyActive: DayPoint[];
    lessonsPerDay: DayPoint[];
    lessons: Pair;
    tracks: TrackRow[];
    assessments: Array<{ kind: "quiz" | "exam" | "lab"; attempts: Pair; passed: Pair }>;
    hardest: HardQuestion[];
  };
  retention: { weeks: number; cohorts: Array<{ week: string; size: number; retained: number[] }> };
  engagement: EngagementRow[];
  content: {
    blog: Array<{ slug: string; title: string; category: string; views: number; createdAt: string }>;
    products: Array<{ name: string; units: number; cents: number }>;
    productsAllTime: Array<{ name: string; sold: number; priceCents: number }>;
    pages: Array<{ page: string; views: number; visitors: number }>;
  };
}

export interface TrackRow {
  id: string;
  title: string;
  status: string;
  lessons: number;
  enrolled: number;
  startedInPeriod: number;
  activeInPeriod: number;
  completed: number;
  completionPct: number;
  medianDays: number | null;
  avgProgressPct: number;
  certificates: number;
  stalled: number;
  dropModule: string | null;
  dropModuleStalls: number;
  quiz: { attempts: number; passed: number };
  exam: { attempts: number; passed: number };
}

export interface HardQuestion { kind: "quiz" | "exam"; track: string; module: string; question: string; answers: number; correctPct: number }
export interface EngagementRow { key: string; label: string; cur: number; prev: number; tracked: boolean }

// ── Helpers ─────────────────────────────────────────────────────────────────

const num = (v: unknown): number => (v == null ? 0 : typeof v === "bigint" ? Number(v) : Number(v) || 0);
const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const startOfUtcDay = (t: number) => {
  const d = new Date(t);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

function daySeries(from: Date, now: Date, rows: Array<{ d: Date | string; n: unknown }>): DayPoint[] {
  const by = new Map(rows.map((r) => [typeof r.d === "string" ? r.d.slice(0, 10) : dayKey(r.d), num(r.n)]));
  const out: DayPoint[] = [];
  for (let t = startOfUtcDay(from.getTime()); t <= now.getTime(); t += DAY) {
    const k = dayKey(new Date(t));
    out.push({ day: k, value: by.get(k) ?? 0 });
  }
  return out;
}

async function tablesPresent(): Promise<Record<OptionalTable, boolean>> {
  const names = [...OPTIONAL_TABLES] as string[];
  const rows = await prisma.$queryRaw<Array<{ t: string; ok: boolean }>>`
    SELECT t, to_regclass(quote_ident(t)) IS NOT NULL AS ok FROM unnest(${names}::text[]) AS t`;
  const out = Object.fromEntries(OPTIONAL_TABLES.map((t) => [t, false])) as Record<OptionalTable, boolean>;
  for (const r of rows) if (r.ok) out[r.t as OptionalTable] = true;
  return out;
}

/** (sid, at) rows of learner activity since a date: sign-ins, lessons, XP. */
function activitySql(has: Record<OptionalTable, boolean>, since: Date): Prisma.Sql {
  const logins = has.LoginEvent
    ? Prisma.sql`SELECT "studentId" AS sid, "at" AS at FROM "LoginEvent" WHERE "at" >= ${since} UNION ALL `
    : Prisma.empty;
  return Prisma.sql`${logins}SELECT "studentId" AS sid, "completedAt" AS at FROM "LessonProgress" WHERE "completedAt" >= ${since}
    UNION ALL SELECT "studentId" AS sid, "createdAt" AS at FROM "PointsLedger" WHERE "createdAt" >= ${since}`;
}

/** Shared CTEs for per-track enrolment and completion (all time). */
function trackCtes(has: Record<OptionalTable, boolean>): Prisma.Sql {
  const mastery = has.LessonMastery
    ? Prisma.sql`UNION ALL SELECT lm."studentId", lm."trackId", lm."lessonId", lm."masteredAt" FROM "LessonMastery" lm`
    : Prisma.empty;
  const diag = has.DiagnosticSession
    ? Prisma.sql`UNION ALL SELECT d."studentId", d."trackId", d."createdAt" FROM "DiagnosticSession" d`
    : Prisma.empty;
  return Prisma.sql`
    lessons AS (
      SELECT l."id" AS lesson_id, m."trackId" AS track_id, m."id" AS module_id, m."sortOrder" AS ms, l."sortOrder" AS ls
      FROM "Lesson" l JOIN "LearnModule" m ON m."id" = l."moduleId"),
    tot AS (SELECT track_id, COUNT(*)::int AS n FROM lessons GROUP BY 1),
    done AS (
      SELECT lp."studentId" AS sid, x.track_id, lp."lessonId" AS lesson_id, lp."completedAt" AS at
      FROM "LessonProgress" lp JOIN lessons x ON x.lesson_id = lp."lessonId"
      ${mastery}),
    touch AS (
      SELECT sid, track_id, at FROM done
      UNION ALL SELECT qa."studentId", m."trackId", qa."createdAt" FROM "QuizAttempt" qa
        JOIN "Quiz" q ON q."id" = qa."quizId" JOIN "LearnModule" m ON m."id" = q."moduleId"
      UNION ALL SELECT la."studentId", lb."trackId", la."createdAt" FROM "LabAttempt" la JOIN "Lab" lb ON lb."id" = la."labId"
      UNION ALL SELECT es."studentId", fe."trackId", es."startedAt" FROM "FinalExamSession" es JOIN "FinalExam" fe ON fe."id" = es."finalExamId"
      ${diag}),
    enr AS (SELECT sid, track_id, MIN(at) AS first_at, MAX(at) AS last_at FROM touch GROUP BY 1, 2),
    dn AS (SELECT sid, track_id, COUNT(DISTINCT lesson_id)::int AS n, MAX(at) AS last_done FROM done GROUP BY 1, 2),
    cert AS (SELECT "studentId" AS sid, "trackId" AS track_id, "issuedAt" AS at FROM "LearnCertificate" WHERE NOT "revoked"),
    per AS (
      SELECT e.sid, e.track_id, e.first_at, e.last_at, COALESCE(dn.n, 0) AS n,
        COALESCE(c.at, dn.last_done) AS last_done,
        (c.sid IS NOT NULL OR (t.n > 0 AND COALESCE(dn.n, 0) >= t.n)) AS completed
      FROM enr e JOIN tot t ON t.track_id = e.track_id
      LEFT JOIN dn ON dn.sid = e.sid AND dn.track_id = e.track_id
      LEFT JOIN cert c ON c.sid = e.sid AND c.track_id = e.track_id)`;
}

// ── Queries ─────────────────────────────────────────────────────────────────

const PAID_ORDER = ["paid", "fulfilled"];
const PAID_SUB = ["active", "trialing", "past_due", "canceled"];

async function compute(range: RangeDays): Promise<Analytics> {
  const nowMs = Date.now();
  const now = new Date(nowMs);
  const cur0 = new Date(nowMs - range * DAY);
  const prev0 = new Date(nowMs - 2 * range * DAY);
  const actSince = new Date(cur0.getTime() - 30 * DAY);
  const stallCut = new Date(nowMs - STALL_DAYS * DAY);
  const retentionWeeks = range === 7 ? 6 : range === 30 ? 8 : 12;
  const thisMonday = startOfUtcDay(nowMs) - ((new Date(nowMs).getUTCDay() + 6) % 7) * DAY;
  const firstWeek = new Date(thisMonday - (retentionWeeks - 1) * 7 * DAY);

  const has = await tablesPresent(); // 1 query

  // Revenue per source, current vs previous window (1 query).
  const win = (col: Prisma.Sql, amount: Prisma.Sql) => Prisma.sql`
    COALESCE(SUM(${amount}) FILTER (WHERE ${col} >= ${cur0}), 0)::bigint AS cur,
    COALESCE(SUM(${amount}) FILTER (WHERE ${col} < ${cur0}), 0)::bigint AS prev,
    COUNT(*) FILTER (WHERE ${col} >= ${cur0})::int AS ncur,
    COUNT(*) FILTER (WHERE ${col} < ${cur0})::int AS nprev`;
  const span = (col: Prisma.Sql) => Prisma.sql`${col} >= ${prev0} AND ${col} < ${now}`;
  const revenueQ = prisma.$queryRaw<Array<{ src: string; cur: bigint; prev: bigint; ncur: number; nprev: number }>>`
    SELECT 'store' AS src, ${win(Prisma.sql`"createdAt"`, Prisma.sql`"total"`)} FROM "Order"
      WHERE "status" IN (${Prisma.join(PAID_ORDER)}) AND ${span(Prisma.sql`"createdAt"`)}
    UNION ALL SELECT 'events', ${win(Prisma.sql`"createdAt"`, Prisma.sql`"price"`)} FROM "EventRegistration"
      WHERE "status" = 'paid' AND ${span(Prisma.sql`"createdAt"`)}
    UNION ALL SELECT 'bookings', ${win(Prisma.sql`"createdAt"`, Prisma.sql`"totalAmount"`)} FROM "Appointment"
      WHERE "paymentStatus" = 'paid' AND ${span(Prisma.sql`"createdAt"`)}
    ${has.Blueprint ? Prisma.sql`UNION ALL SELECT 'blueprints', ${win(Prisma.sql`"paidAt"`, Prisma.sql`"amountPaid"`)} FROM "Blueprint" WHERE ${span(Prisma.sql`"paidAt"`)}` : Prisma.empty}
    ${has.TrackPurchase ? Prisma.sql`UNION ALL SELECT 'tracks', ${win(Prisma.sql`"createdAt"`, Prisma.sql`"amountCents"`)} FROM "TrackPurchase" WHERE ${span(Prisma.sql`"createdAt"`)}` : Prisma.empty}
    UNION ALL SELECT 'learn_new', ${win(Prisma.sql`"createdAt"`, Prisma.sql`0`)} FROM "LearnSubscription"
      WHERE "stripeSubscriptionId" IS NOT NULL AND "status" IN (${Prisma.join(PAID_SUB)}) AND ${span(Prisma.sql`"createdAt"`)}
    UNION ALL SELECT 'learn_cancel', ${win(Prisma.sql`"updatedAt"`, Prisma.sql`0`)} FROM "LearnSubscription"
      WHERE "status" = 'canceled' AND "stripeSubscriptionId" IS NOT NULL AND ${span(Prisma.sql`"updatedAt"`)}
    ${has.ToolkitSubscription ? Prisma.sql`UNION ALL SELECT 'toolkit_new', ${win(Prisma.sql`"createdAt"`, Prisma.sql`0`)} FROM "ToolkitSubscription" WHERE "stripeSubscriptionId" IS NOT NULL AND ${span(Prisma.sql`"createdAt"`)}` : Prisma.empty}
    ${has.Team ? Prisma.sql`UNION ALL SELECT 'team_new', ${win(Prisma.sql`"createdAt"`, Prisma.sql`0`)} FROM "Team" WHERE "stripeSubscriptionId" IS NOT NULL AND NOT "comped" AND ${span(Prisma.sql`"createdAt"`)}` : Prisma.empty}`;

  // Subscriptions in force now (1 query) + team MRR (lib/learn/team/admin).
  const subsQ = prisma.$queryRaw<Array<{ kind: string; plan: string; n: number }>>`
    SELECT 'learn' AS kind, "plan", COUNT(*)::int AS n FROM "LearnSubscription" WHERE "status" = 'active' GROUP BY 2
    ${has.ToolkitSubscription ? Prisma.sql`UNION ALL SELECT 'toolkit', "plan", COUNT(*)::int FROM "ToolkitSubscription" WHERE "status" = 'active' GROUP BY 2` : Prisma.empty}`;

  // Paid one-time revenue per day in the window (1 query).
  const dailyRevQ = prisma.$queryRaw<Array<{ d: Date; n: bigint }>>`
    SELECT date_trunc('day', at) AS d, SUM(c)::bigint AS n FROM (
      SELECT "createdAt" AS at, "total" AS c FROM "Order" WHERE "status" IN (${Prisma.join(PAID_ORDER)}) AND "createdAt" >= ${cur0}
      UNION ALL SELECT "createdAt", "price" FROM "EventRegistration" WHERE "status" = 'paid' AND "createdAt" >= ${cur0}
      UNION ALL SELECT "createdAt", "totalAmount" FROM "Appointment" WHERE "paymentStatus" = 'paid' AND "createdAt" >= ${cur0}
      ${has.Blueprint ? Prisma.sql`UNION ALL SELECT "paidAt", "amountPaid" FROM "Blueprint" WHERE "paidAt" >= ${cur0}` : Prisma.empty}
      ${has.TrackPurchase ? Prisma.sql`UNION ALL SELECT "createdAt", "amountCents" FROM "TrackPurchase" WHERE "createdAt" >= ${cur0}` : Prisma.empty}
    ) x GROUP BY 1`;

  // Funnel: learners who signed up in each window, and how far they got (1 query).
  const funnelQ = prisma.$queryRaw<Array<{ cur: boolean; signups: number; placement: number; lesson: number; quiz: number; paid: number; cert: number }>>`
    WITH s AS (SELECT "id", "createdAt" >= ${cur0} AS cur FROM "Student" WHERE "createdAt" >= ${prev0} AND "createdAt" < ${now})
    SELECT s.cur,
      COUNT(*)::int AS signups,
      ${has.DiagnosticSession
        ? Prisma.sql`COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM "DiagnosticSession" d WHERE d."studentId" = s."id" AND d."status" = 'completed'))::int`
        : Prisma.sql`0`} AS placement,
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM "LessonProgress" lp WHERE lp."studentId" = s."id"))::int AS lesson,
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM "QuizAttempt" qa WHERE qa."studentId" = s."id" AND qa."passed"))::int AS quiz,
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM "LearnSubscription" ls WHERE ls."studentId" = s."id" AND ls."stripeSubscriptionId" IS NOT NULL AND ls."status" IN (${Prisma.join(PAID_SUB)}))
        ${has.TrackPurchase ? Prisma.sql`OR EXISTS (SELECT 1 FROM "TrackPurchase" tp WHERE tp."studentId" = s."id")` : Prisma.empty})::int AS paid,
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM "LearnCertificate" c WHERE c."studentId" = s."id" AND NOT c."revoked"))::int AS cert
    FROM s GROUP BY s.cur`;

  // DAU/WAU/MAU now and at the start of the window, plus daily actives (1 query).
  const activeQ = prisma.$queryRaw<Array<{ k: string; d: Date | null; n: number }>>`
    WITH a AS (${activitySql(has, actSince)})
    SELECT 'day' AS k, date_trunc('day', at) AS d, COUNT(DISTINCT sid)::int AS n FROM a WHERE at >= ${cur0} GROUP BY 2
    UNION ALL SELECT 'dau', NULL, COUNT(DISTINCT sid) FILTER (WHERE at >= ${new Date(nowMs - DAY)})::int FROM a
    UNION ALL SELECT 'wau', NULL, COUNT(DISTINCT sid) FILTER (WHERE at >= ${new Date(nowMs - 7 * DAY)})::int FROM a
    UNION ALL SELECT 'mau', NULL, COUNT(DISTINCT sid) FILTER (WHERE at >= ${new Date(nowMs - 30 * DAY)})::int FROM a
    UNION ALL SELECT 'dau0', NULL, COUNT(DISTINCT sid) FILTER (WHERE at >= ${new Date(cur0.getTime() - DAY)} AND at < ${cur0})::int FROM a
    UNION ALL SELECT 'wau0', NULL, COUNT(DISTINCT sid) FILTER (WHERE at >= ${new Date(cur0.getTime() - 7 * DAY)} AND at < ${cur0})::int FROM a
    UNION ALL SELECT 'mau0', NULL, COUNT(DISTINCT sid) FILTER (WHERE at < ${cur0})::int FROM a`;

  // Lessons completed per day (1 query).
  const lessonsQ = prisma.$queryRaw<Array<{ d: Date; n: number }>>`
    SELECT date_trunc('day', "completedAt") AS d, COUNT(*)::int AS n FROM "LessonProgress"
    WHERE "completedAt" >= ${prev0} AND "completedAt" < ${now} GROUP BY 1`;

  // Per track: enrolment, completion, median days, stalls (1 query each).
  const tracksQ = prisma.$queryRaw<Array<{
    id: string; title: string; status: string; lessons: number; enrolled: number; started: number; active: number;
    completed: number; median_days: number | null; avg_progress: number | null; certs: number; stalled: number;
  }>>`
    WITH ${trackCtes(has)}
    SELECT t."id", t."title", t."status", COALESCE(MAX(tot.n), 0)::int AS lessons,
      COUNT(per.sid)::int AS enrolled,
      COUNT(per.sid) FILTER (WHERE per.first_at >= ${cur0})::int AS started,
      COUNT(per.sid) FILTER (WHERE per.last_at >= ${cur0})::int AS active,
      COUNT(per.sid) FILTER (WHERE per.completed)::int AS completed,
      (percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (per.last_done - per.first_at)) / 86400.0)
        FILTER (WHERE per.completed))::float8 AS median_days,
      AVG(per.n::float8 / NULLIF(tot.n, 0))::float8 AS avg_progress,
      (SELECT COUNT(*) FROM "LearnCertificate" c WHERE c."trackId" = t."id" AND NOT c."revoked")::int AS certs,
      COUNT(per.sid) FILTER (WHERE NOT per.completed AND per.last_at < ${stallCut})::int AS stalled
    FROM "LearnTrack" t
    LEFT JOIN per ON per.track_id = t."id"
    LEFT JOIN tot ON tot.track_id = t."id"
    GROUP BY t."id", t."title", t."status", t."sortOrder"
    ORDER BY t."sortOrder", t."title"`;

  // Where stalled learners stopped: the module of their next not-done lesson.
  const dropQ = prisma.$queryRaw<Array<{ track_id: string; module: string; n: number }>>`
    WITH ${trackCtes(has)},
    stalled AS (SELECT sid, track_id FROM per WHERE NOT completed AND last_at < ${stallCut}),
    nxt AS (
      SELECT s.track_id, (
        SELECT x.module_id FROM lessons x
        WHERE x.track_id = s.track_id AND NOT EXISTS (SELECT 1 FROM done d WHERE d.sid = s.sid AND d.lesson_id = x.lesson_id)
        ORDER BY x.ms, x.ls LIMIT 1) AS module_id
      FROM stalled s)
    SELECT nxt.track_id, m."title" AS module, COUNT(*)::int AS n
    FROM nxt JOIN "LearnModule" m ON m."id" = nxt.module_id
    GROUP BY 1, 2, m."sortOrder" ORDER BY 1, n DESC, m."sortOrder"`;

  // Quiz, exam and lab pass rates by track, both windows (1 query).
  const assessQ = prisma.$queryRaw<Array<{ track_id: string; kind: "quiz" | "exam" | "lab"; cur: boolean; attempts: number; passed: number }>>`
    SELECT m."trackId" AS track_id, 'quiz' AS kind, qa."createdAt" >= ${cur0} AS cur, COUNT(*)::int AS attempts, COUNT(*) FILTER (WHERE qa."passed")::int AS passed
      FROM "QuizAttempt" qa JOIN "Quiz" q ON q."id" = qa."quizId" JOIN "LearnModule" m ON m."id" = q."moduleId"
      WHERE qa."createdAt" >= ${prev0} AND qa."createdAt" < ${now} GROUP BY 1, 2, 3
    UNION ALL SELECT fe."trackId", 'exam', es."submittedAt" >= ${cur0}, COUNT(*)::int, COUNT(*) FILTER (WHERE es."passed")::int
      FROM "FinalExamSession" es JOIN "FinalExam" fe ON fe."id" = es."finalExamId"
      WHERE es."status" = 'submitted' AND es."submittedAt" >= ${prev0} AND es."submittedAt" < ${now} GROUP BY 1, 2, 3
    UNION ALL SELECT lb."trackId", 'lab', la."updatedAt" >= ${cur0}, COUNT(*)::int, COUNT(*) FILTER (WHERE la."passed")::int
      FROM "LabAttempt" la JOIN "Lab" lb ON lb."id" = la."labId"
      WHERE la."status" = 'submitted' AND la."updatedAt" >= ${prev0} AND la."updatedAt" < ${now} GROUP BY 1, 2, 3`;

  // Hardest questions, all time: lowest share answered correctly (1 query).
  const hardQ = prisma.$queryRaw<Array<{ kind: "quiz" | "exam"; track: string; module: string; question: string; n: number; correct: number }>>`
    WITH qa AS (
      SELECT e.key AS qid, e.value AS v FROM "QuizAttempt" a,
        jsonb_each_text(CASE WHEN jsonb_typeof(a."answers") = 'object' THEN a."answers" ELSE '{}'::jsonb END) e),
    ea AS (
      SELECT e.key AS qid, e.value AS v FROM "FinalExamSession" s,
        jsonb_each_text(CASE WHEN jsonb_typeof(s."answers") = 'object' THEN s."answers" ELSE '{}'::jsonb END) e
      WHERE s."status" = 'submitted'),
    scored AS (
      SELECT 'quiz' AS kind, t."title" AS track, m."title" AS module, qq."question", COUNT(*)::int AS n,
        COUNT(*) FILTER (WHERE qa.v ~ '^-?[0-9]+$' AND qa.v::int = qq."correctIndex")::int AS correct
      FROM qa JOIN "QuizQuestion" qq ON qq."id" = qa.qid JOIN "Quiz" q ON q."id" = qq."quizId"
      JOIN "LearnModule" m ON m."id" = q."moduleId" JOIN "LearnTrack" t ON t."id" = m."trackId"
      GROUP BY qq."id", t."title", m."title", qq."question"
      UNION ALL
      SELECT 'exam', t."title", COALESCE(m."title", 'Final exam'), fq."question", COUNT(*)::int,
        COUNT(*) FILTER (WHERE ea.v ~ '^-?[0-9]+$' AND ea.v::int = fq."correctIndex")::int
      FROM ea JOIN "FinalExamQuestion" fq ON fq."id" = ea.qid JOIN "FinalExam" fe ON fe."id" = fq."finalExamId"
      JOIN "LearnTrack" t ON t."id" = fe."trackId" LEFT JOIN "LearnModule" m ON m."id" = fq."moduleId"
      GROUP BY fq."id", t."title", m."title", fq."question")
    SELECT * FROM scored WHERE n >= ${MIN_ANSWERS} ORDER BY correct::float8 / n ASC, n DESC LIMIT 10`;

  // Weekly sign-up cohorts x weeks with any activity (1 query).
  const retentionQ = prisma.$queryRaw<Array<{ wk: Date; k: number; n: number }>>`
    WITH s AS (SELECT "id", date_trunc('week', "createdAt") AS wk FROM "Student" WHERE "createdAt" >= ${firstWeek}),
    a AS (${activitySql(has, firstWeek)}),
    r AS (
      SELECT DISTINCT s.wk, s."id", FLOOR(EXTRACT(EPOCH FROM (date_trunc('week', a.at) - s.wk)) / 604800)::int AS k
      FROM s JOIN a ON a.sid = s."id" WHERE a.at >= s.wk)
    SELECT wk, -1 AS k, COUNT(*)::int AS n FROM s GROUP BY wk
    UNION ALL SELECT wk, k, COUNT(*)::int FROM r GROUP BY wk, k`;

  // Engagement counters, both windows (1 query).
  const ev = (key: string, from: Prisma.Sql, col: Prisma.Sql, expr: Prisma.Sql = Prisma.sql`*`, distinct = false) => Prisma.sql`
    SELECT ${key}::text AS key,
      COUNT(${distinct ? Prisma.sql`DISTINCT ` : Prisma.empty}${expr}) FILTER (WHERE ${col} >= ${cur0})::int AS cur,
      COUNT(${distinct ? Prisma.sql`DISTINCT ` : Prisma.empty}${expr}) FILTER (WHERE ${col} < ${cur0})::int AS prev
    ${from} AND ${col} >= ${prev0} AND ${col} < ${now}`;
  const parts: Prisma.Sql[] = [
    ev("studio", Prisma.sql`FROM "PointsLedger" WHERE "source" = 'studio_challenge'`, Prisma.sql`"createdAt"`),
    ev("studio_learners", Prisma.sql`FROM "PointsLedger" WHERE "source" = 'studio_challenge'`, Prisma.sql`"createdAt"`, Prisma.sql`"studentId"`, true),
    ev("daily_review", Prisma.sql`FROM "PointsLedger" WHERE "source" = 'daily_review'`, Prisma.sql`"createdAt"`),
    ev("reflections", Prisma.sql`FROM "LessonReflection" WHERE TRUE`, Prisma.sql`"createdAt"`),
    ev("capstones", Prisma.sql`FROM "CapstoneSubmission" WHERE TRUE`, Prisma.sql`"createdAt"`),
    ev("certificates", Prisma.sql`FROM "LearnCertificate" WHERE NOT "revoked"`, Prisma.sql`"issuedAt"`),
  ];
  if (has.TutorMessage) parts.push(ev("tutor_msgs", Prisma.sql`FROM "TutorMessage" WHERE "role" = 'user'`, Prisma.sql`"createdAt"`));
  if (has.TutorMessage && has.TutorThread) {
    parts.push(ev("tutor_learners", Prisma.sql`FROM "TutorMessage" tm JOIN "TutorThread" tt ON tt."id" = tm."threadId" WHERE tm."role" = 'user'`, Prisma.sql`tm."createdAt"`, Prisma.sql`tt."studentId"`, true));
  }
  if (has.CommunityThread) parts.push(ev("community_threads", Prisma.sql`FROM "CommunityThread" WHERE "deletedAt" IS NULL`, Prisma.sql`"createdAt"`));
  if (has.CommunityPost) parts.push(ev("community_posts", Prisma.sql`FROM "CommunityPost" WHERE "deletedAt" IS NULL`, Prisma.sql`"createdAt"`));
  if (has.CohortMember) parts.push(ev("cohort_joins", Prisma.sql`FROM "CohortMember" WHERE TRUE`, Prisma.sql`"joinedAt"`));
  if (has.VideoProgress) parts.push(ev("video_watched", Prisma.sql`FROM "VideoProgress" WHERE TRUE`, Prisma.sql`"watchedAt"`));
  if (has.ToolkitRun) parts.push(ev("toolkit_runs", Prisma.sql`FROM "ToolkitRun" WHERE TRUE`, Prisma.sql`"createdAt"`));
  if (has.LoginEvent) parts.push(ev("logins", Prisma.sql`FROM "LoginEvent" WHERE TRUE`, Prisma.sql`"at"`));
  if (has.PageView) {
    parts.push(ev("pageviews", Prisma.sql`FROM "PageView" WHERE TRUE`, Prisma.sql`"createdAt"`));
    parts.push(ev("visitors", Prisma.sql`FROM "PageView" WHERE TRUE`, Prisma.sql`"createdAt"`, Prisma.sql`"sessionId"`, true));
  }
  const engagementQ = prisma.$queryRaw<Array<{ key: string; cur: number; prev: number }>>`${Prisma.join(parts, " UNION ALL ")}`;

  // Content (3 queries).
  const blogQ = prisma.$queryRaw<Array<{ slug: string; title: string; category: string; views: number; createdAt: Date }>>`
    SELECT "slug", "title", "category", "viewCount"::int AS views, "createdAt" FROM "BlogPost"
    WHERE "published" AND "viewCount" > 0 ORDER BY "viewCount" DESC, "createdAt" DESC LIMIT 10`;
  const productsQ = prisma.$queryRaw<Array<{ k: string; name: string; units: number; cents: bigint }>>`
    SELECT 'period' AS k, COALESCE(MAX(i->>'name'), 'Unnamed') AS name,
      SUM(CASE WHEN (i->>'quantity') ~ '^[0-9]+$' THEN (i->>'quantity')::int ELSE 1 END)::int AS units,
      SUM((CASE WHEN (i->>'price') ~ '^[0-9]+([.][0-9]+)?$' THEN (i->>'price')::numeric ELSE 0 END)
        * (CASE WHEN (i->>'quantity') ~ '^[0-9]+$' THEN (i->>'quantity')::int ELSE 1 END))::bigint AS cents
    FROM "Order" o,
      jsonb_array_elements(CASE WHEN jsonb_typeof(o."items") = 'array' THEN o."items" ELSE '[]'::jsonb END) i
    WHERE o."status" IN (${Prisma.join(PAID_ORDER)}) AND o."createdAt" >= ${cur0}
    GROUP BY COALESCE(i->>'productId', i->>'slug', i->>'name')
    UNION ALL
    (SELECT 'all', "name", "soldCount"::int, "price"::bigint FROM "Product" WHERE "soldCount" > 0 ORDER BY "soldCount" DESC LIMIT 10)`;
  const pagesQ = has.PageView
    ? prisma.$queryRaw<Array<{ page: string; views: number; visitors: number }>>`
        SELECT "page", COUNT(*)::int AS views, COUNT(DISTINCT "sessionId")::int AS visitors FROM "PageView"
        WHERE "createdAt" >= ${cur0} GROUP BY 1 ORDER BY views DESC LIMIT 10`
    : Promise.resolve([]);

  const [revenue, subs, team, dailyRev, funnel, active, lessons, tracks, drops, assess, hard, retention, engagement, blog, products, pages] =
    await Promise.all([
      revenueQ, subsQ, teamMrr(), dailyRevQ, funnelQ, activeQ, lessonsQ, tracksQ, dropQ, assessQ, hardQ, retentionQ,
      engagementQ, blogQ, productsQ, pagesQ,
    ]);

  // ── Revenue ──
  const rev = new Map(revenue.map((r) => [r.src, r]));
  const pairOf = (k: string, f: "money" | "count"): Pair => {
    const r = rev.get(k);
    return f === "money" ? { cur: num(r?.cur), prev: num(r?.prev) } : { cur: num(r?.ncur), prev: num(r?.nprev) };
  };
  const SOURCES: Array<[string, string, boolean]> = [
    ["tracks", "Learning Box track purchases (one-time)", has.TrackPurchase],
    ["store", "Store orders", true],
    ["events", "Events & training", true],
    ["bookings", "Paid bookings", true],
    ["blueprints", "Automation Blueprints", has.Blueprint],
  ];
  const sources: RevenueSource[] = SOURCES.map(([key, label, tracked]) => ({
    key, label, tracked, cents: pairOf(key, "money"), count: pairOf(key, "count"),
  }));
  const total = sources.reduce((a, s) => ({ cur: a.cur + s.cents.cur, prev: a.prev + s.cents.prev }), { cur: 0, prev: 0 });

  const learnMonthly = num(subs.find((s) => s.kind === "learn" && s.plan === "monthly")?.n);
  const learnAnnual = num(subs.find((s) => s.kind === "learn" && s.plan === "annual")?.n);
  const learnCents = learnMonthly * PLANS.monthly.amount + Math.round((learnAnnual * PLANS.annual.amount) / 12);
  const tkPlans = toolkitPlans();
  let toolkitCents: number | null = 0;
  let toolkitActive = 0;
  for (const s of subs.filter((x) => x.kind === "toolkit")) {
    toolkitActive += num(s.n);
    const price = tkPlans[s.plan as keyof typeof tkPlans]?.amount ?? null;
    toolkitCents = price == null || toolkitCents == null ? null : toolkitCents + price * num(s.n);
  }

  // ── Funnel ──
  const fCur = funnel.find((r) => r.cur);
  const fPrev = funnel.find((r) => !r.cur);
  const step = (key: keyof Omit<(typeof funnel)[number], "cur">, label: string) => ({ key, label, cur: num(fCur?.[key]), prev: num(fPrev?.[key]) });
  const eng = new Map(engagement.map((e) => [e.key, e]));
  const visitors = eng.get("visitors");

  // ── Learning ──
  const act = new Map(active.filter((a) => a.k !== "day").map((a) => [a.k, num(a.n)]));
  const lessonRows = lessons.filter((r) => new Date(r.d) >= new Date(startOfUtcDay(cur0.getTime())));
  // Window totals by UTC day bucket (the first day of the window counts as current).
  const curStart = startOfUtcDay(cur0.getTime());
  const lessonPair: Pair = {
    cur: lessons.filter((r) => new Date(r.d).getTime() >= curStart).reduce((n, r) => n + num(r.n), 0),
    prev: lessons.filter((r) => new Date(r.d).getTime() < curStart).reduce((n, r) => n + num(r.n), 0),
  };

  const assessBy = new Map<string, { attempts: number; passed: number }>();
  const assessTotals = new Map<string, { attempts: Pair; passed: Pair }>();
  for (const a of assess) {
    if (a.cur) {
      const k = `${a.track_id}|${a.kind}`;
      const v = assessBy.get(k) ?? { attempts: 0, passed: 0 };
      assessBy.set(k, { attempts: v.attempts + num(a.attempts), passed: v.passed + num(a.passed) });
    }
    const t = assessTotals.get(a.kind) ?? { attempts: { cur: 0, prev: 0 }, passed: { cur: 0, prev: 0 } };
    const side = a.cur ? "cur" : "prev";
    t.attempts[side] += num(a.attempts);
    t.passed[side] += num(a.passed);
    assessTotals.set(a.kind, t);
  }
  const topDrop = new Map<string, { module: string; n: number }>();
  for (const d of drops) if (!topDrop.has(d.track_id)) topDrop.set(d.track_id, { module: d.module, n: num(d.n) });

  const trackRows: TrackRow[] = tracks.map((t) => {
    const enrolled = num(t.enrolled);
    const completed = num(t.completed);
    const drop = topDrop.get(t.id);
    return {
      id: t.id,
      title: t.title,
      status: t.status,
      lessons: num(t.lessons),
      enrolled,
      startedInPeriod: num(t.started),
      activeInPeriod: num(t.active),
      completed,
      completionPct: enrolled ? Math.round((completed / enrolled) * 100) : 0,
      medianDays: t.median_days == null ? null : Math.round(num(t.median_days) * 10) / 10,
      avgProgressPct: Math.round(num(t.avg_progress) * 100),
      certificates: num(t.certs),
      stalled: num(t.stalled),
      dropModule: drop?.module ?? null,
      dropModuleStalls: drop?.n ?? 0,
      quiz: assessBy.get(`${t.id}|quiz`) ?? { attempts: 0, passed: 0 },
      exam: assessBy.get(`${t.id}|exam`) ?? { attempts: 0, passed: 0 },
    };
  });

  // ── Retention ──
  const cohorts = Array.from({ length: retentionWeeks }, (_, i) => {
    const wk = thisMonday - (retentionWeeks - 1 - i) * 7 * DAY;
    const rows = retention.filter((r) => new Date(r.wk).getTime() === wk);
    const size = num(rows.find((r) => num(r.k) === -1)?.n);
    const weeksAvailable = retentionWeeks - i; // week 0 .. current week
    const retained = Array.from({ length: weeksAvailable }, (_, k) => num(rows.find((r) => num(r.k) === k)?.n));
    return { week: dayKey(new Date(wk)), size, retained };
  });

  // ── Engagement ──
  const ENGAGEMENT: Array<[string, string, boolean]> = [
    ["tutor_msgs", "Tutor questions asked", has.TutorMessage],
    ["tutor_learners", "Learners using Tutor", has.TutorMessage && has.TutorThread],
    ["studio", "Studio challenges completed", true],
    ["studio_learners", "Learners completing Studio challenges", true],
    ["daily_review", "Daily Review sessions", true],
    ["community_threads", "Community threads started", has.CommunityThread],
    ["community_posts", "Community replies", has.CommunityPost],
    ["cohort_joins", "Cohort enrolments", has.CohortMember],
    ["video_watched", "Lesson videos watched (80%+)", has.VideoProgress],
    ["reflections", "Lesson reflections written", true],
    ["capstones", "Capstone submissions", true],
    ["certificates", "Certificates issued", true],
    ["logins", "Learner sign-ins", has.LoginEvent],
    ["toolkit_runs", "Toolkit Live runs", has.ToolkitRun],
  ];
  const engagementRows: EngagementRow[] = ENGAGEMENT.map(([key, label, tracked]) => ({
    key, label, tracked, cur: num(eng.get(key)?.cur), prev: num(eng.get(key)?.prev),
  }));

  return {
    range,
    generatedAt: now.toISOString(),
    from: cur0.toISOString(),
    prevFrom: prev0.toISOString(),
    tables: has,
    revenue: {
      sources,
      total,
      daily: daySeries(cur0, now, dailyRev),
      mrr: {
        learnCents,
        learnMonthly,
        learnAnnual,
        learnPriceCents: PLANS.monthly.amount,
        teamCents: team.cents,
        teams: team.teams,
        teamSeats: team.seats,
        toolkitCents,
        toolkitActive,
        totalCents: learnCents + team.cents + (toolkitCents ?? 0),
      },
      newLearnSubs: pairOf("learn_new", "count"),
      cancelledLearnSubs: pairOf("learn_cancel", "count"),
      newToolkitSubs: has.ToolkitSubscription ? pairOf("toolkit_new", "count") : null,
      newTeams: has.Team ? pairOf("team_new", "count") : null,
    },
    funnel: {
      visitors: visitors ? { cur: num(visitors.cur), prev: num(visitors.prev) } : null,
      steps: [
        step("signups", "Signed up"),
        ...(has.DiagnosticSession ? [step("placement", "Placement check done")] : []),
        step("lesson", "Completed a first lesson"),
        step("quiz", "Passed a first quiz"),
        step("paid", "Paid (subscription or track)"),
        step("cert", "Earned a certificate"),
      ],
    },
    learning: {
      dau: { cur: act.get("dau") ?? 0, prev: act.get("dau0") ?? 0 },
      wau: { cur: act.get("wau") ?? 0, prev: act.get("wau0") ?? 0 },
      mau: { cur: act.get("mau") ?? 0, prev: act.get("mau0") ?? 0 },
      dailyActive: daySeries(cur0, now, active.filter((a) => a.k === "day" && a.d).map((a) => ({ d: a.d!, n: a.n }))),
      lessonsPerDay: daySeries(cur0, now, lessonRows),
      lessons: lessonPair,
      tracks: trackRows,
      assessments: (["quiz", "exam", "lab"] as const).map((kind) => ({
        kind,
        ...(assessTotals.get(kind) ?? { attempts: { cur: 0, prev: 0 }, passed: { cur: 0, prev: 0 } }),
      })),
      hardest: hard.map((h) => ({
        kind: h.kind, track: h.track, module: h.module, question: h.question,
        answers: num(h.n), correctPct: num(h.n) ? Math.round((num(h.correct) / num(h.n)) * 100) : 0,
      })),
    },
    retention: { weeks: retentionWeeks, cohorts },
    engagement: engagementRows,
    content: {
      blog: blog.map((b) => ({ slug: b.slug, title: b.title, category: b.category, views: num(b.views), createdAt: new Date(b.createdAt).toISOString() })),
      products: products.filter((p) => p.k === "period").map((p) => ({ name: p.name, units: num(p.units), cents: num(p.cents) }))
        .sort((a, b) => b.cents - a.cents).slice(0, 10),
      productsAllTime: products.filter((p) => p.k === "all").map((p) => ({ name: p.name, sold: num(p.units), priceCents: num(p.cents) })),
      pages: pages.map((p) => ({ page: p.page, views: num(p.views), visitors: num(p.visitors) })),
    },
  };
}

// ── Cache ───────────────────────────────────────────────────────────────────

const cache = new Map<RangeDays, { at: number; value: Promise<Analytics> }>();

/** Analytics for a range, cached in process for a minute (in-flight loads shared). */
export function getAnalytics(range: RangeDays): Promise<Analytics> {
  const hit = cache.get(range);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const value = compute(range).catch((err) => {
    cache.delete(range);
    throw err;
  });
  cache.set(range, { at: Date.now(), value });
  return value;
}

// ── CSV ─────────────────────────────────────────────────────────────────────

export const CSV_TABLES = [
  "revenue", "revenue-daily", "funnel", "activity-daily", "tracks", "assessments", "hardest-questions",
  "retention", "engagement", "blog", "products", "pages",
] as const;
export type CsvTable = (typeof CSV_TABLES)[number];

/** One CSV cell: quoted, with formula-leading characters neutralised. */
function cell(v: string | number | null | undefined): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const dollars = (c: number) => (c / 100).toFixed(2);
const rate = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : "");

export function analyticsCsv(a: Analytics, table: CsvTable): string {
  let head: string[] = [];
  let rows: Array<Array<string | number | null>> = [];
  switch (table) {
    case "revenue":
      head = ["Source", "Basis", `Last ${a.range} days (USD)`, "Previous period (USD)", "Payments", "Previous payments"];
      rows = a.revenue.sources.map((s) => [s.label, s.tracked ? "stored amounts" : "not tracked", dollars(s.cents.cur), dollars(s.cents.prev), s.count.cur, s.count.prev]);
      rows.push(["Total one-time", "stored amounts", dollars(a.revenue.total.cur), dollars(a.revenue.total.prev), "", ""]);
      rows.push(["Learning Box MRR", `estimate: ${a.revenue.mrr.learnMonthly} monthly + ${a.revenue.mrr.learnAnnual} annual active`, dollars(a.revenue.mrr.learnCents), "", "", ""]);
      rows.push(["Team seats MRR", `estimate: ${a.revenue.mrr.teams} teams, ${a.revenue.mrr.teamSeats} seats`, dollars(a.revenue.mrr.teamCents), "", "", ""]);
      rows.push(["Toolkit Live MRR", a.revenue.mrr.toolkitCents == null ? "price not set" : `estimate: ${a.revenue.mrr.toolkitActive} active`, a.revenue.mrr.toolkitCents == null ? "" : dollars(a.revenue.mrr.toolkitCents), "", "", ""]);
      rows.push(["New paid Learn subscriptions", "count", "", "", a.revenue.newLearnSubs.cur, a.revenue.newLearnSubs.prev]);
      rows.push(["Cancelled Learn subscriptions", "count (by last update, estimate)", "", "", a.revenue.cancelledLearnSubs.cur, a.revenue.cancelledLearnSubs.prev]);
      break;
    case "revenue-daily":
      head = ["Day (UTC)", "Paid one-time revenue (USD)"];
      rows = a.revenue.daily.map((d) => [d.day, dollars(d.value)]);
      break;
    case "funnel": {
      head = ["Step", `Last ${a.range} days`, "% of sign-ups", "Previous period", "Previous % of sign-ups"];
      const s0 = a.funnel.steps[0];
      if (a.funnel.visitors) rows.push(["Visitors (unique sessions)", a.funnel.visitors.cur, "", a.funnel.visitors.prev, ""]);
      rows.push(...a.funnel.steps.map((s) => [s.label, s.cur, rate(s.cur, s0.cur), s.prev, rate(s.prev, s0.prev)]));
      break;
    }
    case "activity-daily":
      head = ["Day (UTC)", "Active learners", "Lessons completed"];
      rows = a.learning.dailyActive.map((d, i) => [d.day, d.value, a.learning.lessonsPerDay[i]?.value ?? 0]);
      break;
    case "tracks":
      head = [
        "Track", "Status", "Lessons", "Enrolled (all time)", `Started (last ${a.range} days)`, `Active (last ${a.range} days)`,
        "Completed", "Completion %", "Median days to complete", "Avg progress %", "Certificates", `Stalled (${STALL_DAYS}+ days)`,
        "Module with most stalls", "Stalls there", "Quiz attempts", "Quiz pass %", "Exam attempts", "Exam pass %",
      ];
      rows = a.learning.tracks.map((t) => [
        t.title, t.status, t.lessons, t.enrolled, t.startedInPeriod, t.activeInPeriod, t.completed, t.completionPct,
        t.medianDays, t.avgProgressPct, t.certificates, t.stalled, t.dropModule, t.dropModuleStalls,
        t.quiz.attempts, rate(t.quiz.passed, t.quiz.attempts), t.exam.attempts, rate(t.exam.passed, t.exam.attempts),
      ]);
      break;
    case "assessments":
      head = ["Kind", `Attempts (last ${a.range} days)`, "Pass %", "Previous attempts", "Previous pass %"];
      rows = a.learning.assessments.map((x) => [x.kind, x.attempts.cur, rate(x.passed.cur, x.attempts.cur), x.attempts.prev, rate(x.passed.prev, x.attempts.prev)]);
      break;
    case "hardest-questions":
      head = ["Kind", "Track", "Module", "Question", "Answers (all time)", "% correct"];
      rows = a.learning.hardest.map((h) => [h.kind, h.track, h.module, h.question, h.answers, h.correctPct]);
      break;
    case "retention":
      head = ["Sign-up week (Mon, UTC)", "Sign-ups", ...Array.from({ length: a.retention.weeks }, (_, k) => `Week ${k} %`)];
      rows = a.retention.cohorts.map((c) => [c.week, c.size, ...c.retained.map((n) => rate(n, c.size))]);
      break;
    case "engagement":
      head = ["Metric", `Last ${a.range} days`, "Previous period", "Tracked"];
      rows = a.engagement.map((e) => [e.label, e.tracked ? e.cur : "", e.tracked ? e.prev : "", e.tracked ? "yes" : "no (table missing)"]);
      break;
    case "blog":
      head = ["Title", "Slug", "Category", "Views (all time)", "Published (UTC)"];
      rows = a.content.blog.map((b) => [b.title, b.slug, b.category, b.views, b.createdAt]);
      break;
    case "products":
      head = ["Product", `Units (last ${a.range} days)`, `Revenue (last ${a.range} days, USD)`];
      rows = a.content.products.map((p) => [p.name, p.units, dollars(p.cents)]);
      rows.push([], ["Product", "Sold (all time)", "Current price (USD)"], ...a.content.productsAllTime.map((p) => [p.name, p.sold, dollars(p.priceCents)]));
      break;
    case "pages":
      head = ["Page", `Views (last ${a.range} days)`, "Unique sessions"];
      rows = a.content.pages.map((p) => [p.page, p.views, p.visitors]);
      break;
  }
  const lines = [head.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))];
  return "﻿" + lines.join("\r\n") + "\r\n";
}
