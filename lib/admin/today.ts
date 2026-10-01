import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

// The "Today" dashboard at /admin_pro.
//
// Budget: 7 queries per load, all read only, run in parallel after one
// to_regclass probe. Several tables are created at runtime by their features
// (Growth, Learn community, capstones, track purchases, blueprints, login
// events), so the probe decides which exist and every query that touches an
// optional table only includes that part when it does. A missing table reads
// as zero, never a crash.
//
// Definitions mirror the existing pages:
//   - Paid revenue: lib/admin/metrics.ts paidRevenueBetween (paid/fulfilled
//     orders, paid event registrations, paid bookings, blueprints, track
//     purchases), in cents.
//   - Active learner: lib/learn/admin/learners.ts learnerStats (signed in,
//     completed a lesson, or earned XP in the window). LoginEvent is used for
//     sign-ins when present so the previous window can be counted too.
//   - Outreach awaiting approval: lib/growth/outreach/summary.ts (draft messages).
//   - Hot leads: GrowthLead.stage = 'hot'.

const DAY = 86_400_000;

const OPTIONAL = [
  "GrowthPost",
  "OutreachMessage",
  "GrowthLead",
  "CapstoneSubmission",
  "CommunityReport",
  "LoginEvent",
  "TrackPurchase",
  "Blueprint",
] as const;
type Opt = (typeof OPTIONAL)[number];

async function present(): Promise<Record<Opt, boolean>> {
  const names = [...OPTIONAL] as string[];
  const out = Object.fromEntries(OPTIONAL.map((t) => [t, false])) as Record<Opt, boolean>;
  try {
    const rows = await prisma.$queryRaw<Array<{ t: string; ok: boolean }>>`
      SELECT t, to_regclass(quote_ident(t)) IS NOT NULL AS ok FROM unnest(${names}::text[]) AS t`;
    for (const r of rows) if (r.ok) out[r.t as Opt] = true;
  } catch (err) {
    console.error("[admin/today] table probe", err);
  }
  return out;
}

const n = (v: unknown) => Number(v ?? 0);

async function safe<T>(label: string, p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (err) {
    console.error(`[admin/today] ${label}`, err);
    return fallback;
  }
}

export interface TodayData {
  generatedAt: Date;
  revenue: { mtd: number; prevMtd: number; spark: number[] };
  signups: { cur: number; prev: number; today: number; spark: number[] };
  active: { cur: number; prev: number };
  leads: { cur: number; prev: number; growth: number; prospects: number };
  upcoming: Array<{
    id: string;
    date: Date;
    timeSlot: string;
    firstName: string;
    lastName: string;
    serviceType: string;
    status: string;
  }>;
  upcomingWeek: number;
  upcomingCapped: boolean;
  inbox: {
    growthDrafts: number;
    outreachDrafts: number;
    hotLeads: number;
    capstones: number;
    reports: number;
    serviceRequests: number;
    pendingAppointments: number;
    blogDrafts: number;
  };
  activity: Array<{ kind: string; title: string; detail: string; href: string; at: Date }>;
}

export async function getToday(): Promise<TodayData> {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  // Same elapsed time into last month (clamped to its length) for a fair delta.
  const elapsed = now.getTime() - monthStart.getTime();
  const prevMtdEnd = new Date(Math.min(prevMonthStart.getTime() + elapsed, monthStart.getTime()));
  const d7 = new Date(now.getTime() - 7 * DAY);
  const d14 = new Date(now.getTime() - 14 * DAY);
  const sparkFrom = new Date(todayStart.getTime() - 13 * DAY);
  const revFrom = sparkFrom < prevMonthStart ? sparkFrom : prevMonthStart;
  const in30 = new Date(todayStart.getTime() + 30 * DAY);
  const in7 = new Date(todayStart.getTime() + 7 * DAY);

  const has = await present();

  // 1. Revenue rows by day since the earlier of last month start / 14 days ago.
  const revenueQ = prisma.$queryRaw<Array<{ day: Date; cents: bigint | number }>>`
    SELECT date_trunc('day', at) AS day, SUM(cents)::bigint AS cents FROM (
      SELECT "createdAt" AS at, "total" AS cents FROM "Order"
        WHERE "status" IN ('paid','fulfilled') AND "createdAt" >= ${revFrom}
      UNION ALL
      SELECT "createdAt", "price" FROM "EventRegistration" WHERE "status" = 'paid' AND "createdAt" >= ${revFrom}
      UNION ALL
      SELECT "createdAt", "totalAmount" FROM "Appointment" WHERE "paymentStatus" = 'paid' AND "createdAt" >= ${revFrom}
      ${has.Blueprint ? Prisma.sql`UNION ALL SELECT "paidAt", "amountPaid" FROM "Blueprint" WHERE "paidAt" >= ${revFrom}` : Prisma.empty}
      ${has.TrackPurchase ? Prisma.sql`UNION ALL SELECT "createdAt", "amountCents" FROM "TrackPurchase" WHERE "createdAt" >= ${revFrom}` : Prisma.empty}
    ) r GROUP BY 1`;

  // 2. Learn sign-ups by day (14 days).
  const signupQ = prisma.$queryRaw<Array<{ day: Date; c: bigint | number }>>`
    SELECT date_trunc('day', "createdAt") AS day, count(*) AS c FROM "Student"
    WHERE "createdAt" >= ${d14 < sparkFrom ? d14 : sparkFrom} GROUP BY 1`;

  // 3. Active learners, this 7 days vs the 7 before.
  const activeQ = prisma.$queryRaw<Array<{ cur: bigint | number; prev: bigint | number }>>`
    SELECT count(DISTINCT sid) FILTER (WHERE at >= ${d7}) AS cur,
           count(DISTINCT sid) FILTER (WHERE at < ${d7}) AS prev
    FROM (
      ${
        has.LoginEvent
          ? Prisma.sql`SELECT "studentId" AS sid, "at" AS at FROM "LoginEvent" WHERE "at" >= ${d14}
                       UNION ALL SELECT "id", "lastLoginAt" FROM "Student" WHERE "lastLoginAt" >= ${d14}`
          : Prisma.sql`SELECT "id" AS sid, "lastLoginAt" AS at FROM "Student" WHERE "lastLoginAt" >= ${d14}`
      }
      UNION ALL SELECT "studentId", "completedAt" FROM "LessonProgress" WHERE "completedAt" >= ${d14}
      UNION ALL SELECT "studentId", "createdAt" FROM "PointsLedger" WHERE "createdAt" >= ${d14}
    ) a`;

  // 4. New leads (Growth leads + prospects), plus every "needs you" count.
  const countsQ = prisma.$queryRaw<Array<Record<string, bigint | number>>>`
    SELECT
      (SELECT count(*) FROM "Prospect" WHERE "createdAt" >= ${d7}) AS prospects_cur,
      (SELECT count(*) FROM "Prospect" WHERE "createdAt" >= ${d14} AND "createdAt" < ${d7}) AS prospects_prev,
      ${has.GrowthLead ? Prisma.sql`(SELECT count(*) FROM "GrowthLead" WHERE "createdAt" >= ${d7})` : Prisma.sql`0`} AS growth_cur,
      ${has.GrowthLead ? Prisma.sql`(SELECT count(*) FROM "GrowthLead" WHERE "createdAt" >= ${d14} AND "createdAt" < ${d7})` : Prisma.sql`0`} AS growth_prev,
      ${has.GrowthLead ? Prisma.sql`(SELECT count(*) FROM "GrowthLead" WHERE "stage" = 'hot')` : Prisma.sql`0`} AS hot,
      ${has.GrowthPost ? Prisma.sql`(SELECT count(*) FROM "GrowthPost" WHERE "status" = 'draft')` : Prisma.sql`0`} AS growth_drafts,
      ${has.OutreachMessage ? Prisma.sql`(SELECT count(*) FROM "OutreachMessage" WHERE "status" = 'draft')` : Prisma.sql`0`} AS outreach_drafts,
      ${has.CapstoneSubmission ? Prisma.sql`(SELECT count(*) FROM "CapstoneSubmission" WHERE "status" IN ('submitted','in_review'))` : Prisma.sql`0`} AS capstones,
      ${has.CommunityReport ? Prisma.sql`(SELECT count(*) FROM "CommunityReport" WHERE "status" = 'open')` : Prisma.sql`0`} AS reports,
      (SELECT count(*) FROM "ServiceRequest" WHERE "status" = 'NEW') AS service_requests,
      (SELECT count(*) FROM "Appointment" WHERE "status" = 'PENDING' AND "date" >= ${todayStart}) AS pending_appts,
      (SELECT count(*) FROM "BlogPost" WHERE "published" = false) AS blog_drafts`;

  // 5. Upcoming appointments (next 30 days, capped).
  const upcomingQ = prisma.appointment.findMany({
    where: { date: { gte: todayStart, lt: in30 }, status: { not: "CANCELLED" } },
    orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
    take: 25,
    select: { id: true, date: true, timeSlot: true, firstName: true, lastName: true, serviceType: true, status: true },
  });

  // 6. Recent activity across the business, newest first.
  const activityQ = prisma.$queryRaw<Array<{ kind: string; title: string; detail: string | null; ref: string | null; at: Date }>>`
    SELECT * FROM (
      (SELECT 'learner' AS kind, "name" AS title, "email" AS detail, "id" AS ref, "createdAt" AS at FROM "Student" ORDER BY "createdAt" DESC LIMIT 5)
      UNION ALL
      (SELECT 'order', "orderNumber", "email", "id", "createdAt" FROM "Order" WHERE "status" IN ('paid','fulfilled') ORDER BY "createdAt" DESC LIMIT 5)
      UNION ALL
      (SELECT 'appointment', "firstName" || ' ' || "lastName", "serviceType", "id", "createdAt" FROM "Appointment" ORDER BY "createdAt" DESC LIMIT 5)
      UNION ALL
      (SELECT 'service_request', "firstName" || ' ' || "lastName", "service", "id", "createdAt" FROM "ServiceRequest" ORDER BY "createdAt" DESC LIMIT 5)
      UNION ALL
      (SELECT 'prospect', "name", "business", "id", "createdAt" FROM "Prospect" ORDER BY "createdAt" DESC LIMIT 5)
      ${
        has.GrowthLead
          ? Prisma.sql`UNION ALL (SELECT 'lead', "companyName", "source", "id", "createdAt" FROM "GrowthLead" ORDER BY "createdAt" DESC LIMIT 5)`
          : Prisma.empty
      }
    ) x ORDER BY at DESC LIMIT 10`;

  const [rev, signups, active, counts, upcoming, activity] = await Promise.all([
    safe("revenue", revenueQ, []),
    safe("signups", signupQ, []),
    safe("active", activeQ, [{ cur: 0, prev: 0 }]),
    safe("counts", countsQ, [{}]),
    safe("upcoming", upcomingQ, []),
    safe("activity", activityQ, []),
  ]);

  // Revenue roll-ups.
  const dayKey = (d: Date) => new Date(d).toISOString().slice(0, 10);
  const revByDay = new Map<string, number>();
  let mtd = 0;
  let prevMtd = 0;
  for (const r of rev) {
    const t = new Date(r.day).getTime();
    const c = n(r.cents);
    revByDay.set(dayKey(r.day), c);
    if (t >= monthStart.getTime()) mtd += c;
    else if (t >= prevMonthStart.getTime() && t < prevMtdEnd.getTime()) prevMtd += c;
  }
  const days = Array.from({ length: 14 }, (_, i) => dayKey(new Date(sparkFrom.getTime() + i * DAY)));
  const revSpark = days.map((k) => Math.round((revByDay.get(k) ?? 0) / 100));

  const suByDay = new Map(signups.map((r) => [dayKey(r.day), n(r.c)]));
  let suCur = 0;
  let suPrev = 0;
  for (const r of signups) {
    const t = new Date(r.day).getTime();
    // Day buckets: last 7 calendar days including today vs the 7 before.
    if (t >= todayStart.getTime() - 6 * DAY) suCur += n(r.c);
    else if (t >= todayStart.getTime() - 13 * DAY) suPrev += n(r.c);
  }

  const c = counts[0] ?? {};
  const growthCur = n(c.growth_cur);
  const prospectsCur = n(c.prospects_cur);

  const kindHref: Record<string, (ref: string) => string> = {
    learner: (id) => `/admin_pro/learn/learners/${id}`,
    order: () => "/admin_pro/shop",
    appointment: () => "/admin_pro/appointments",
    service_request: () => "/admin_pro/service-requests",
    prospect: () => "/admin_pro/prospects",
    lead: () => "/admin_pro/growth/leads",
  };

  return {
    generatedAt: now,
    revenue: { mtd, prevMtd, spark: revSpark },
    signups: { cur: suCur, prev: suPrev, today: suByDay.get(dayKey(todayStart)) ?? 0, spark: days.map((k) => suByDay.get(k) ?? 0) },
    active: { cur: n(active[0]?.cur), prev: n(active[0]?.prev) },
    leads: { cur: growthCur + prospectsCur, prev: n(c.growth_prev) + n(c.prospects_prev), growth: growthCur, prospects: prospectsCur },
    upcoming: upcoming.slice(0, 6).map((a) => ({ ...a, status: String(a.status) })),
    upcomingWeek: upcoming.filter((a) => a.date < in7).length,
    upcomingCapped: upcoming.length >= 25,
    inbox: {
      growthDrafts: n(c.growth_drafts),
      outreachDrafts: n(c.outreach_drafts),
      hotLeads: n(c.hot),
      capstones: n(c.capstones),
      reports: n(c.reports),
      serviceRequests: n(c.service_requests),
      pendingAppointments: n(c.pending_appts),
      blogDrafts: n(c.blog_drafts),
    },
    activity: activity.map((a) => ({
      kind: a.kind,
      title: a.title,
      detail: a.detail ?? "",
      href: (kindHref[a.kind] ?? (() => "/admin_pro"))(a.ref ?? ""),
      at: new Date(a.at),
    })),
  };
}
