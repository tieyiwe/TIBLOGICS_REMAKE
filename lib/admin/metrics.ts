import prisma from "@/lib/prisma";
import { trackMonthlyCents } from "@/lib/learn/track-monthly";
import { PLANS } from "@/lib/payments/provider";
import { ensureTrackPurchaseTable } from "@/lib/learn/purchases";
import { teamMrr } from "@/lib/learn/team/admin";

// Real figures for the admin dashboard and the revenue page.
//
// These pages used to render hardcoded numbers: $24,700 all-time revenue, $791
// "this month", three invented upcoming appointments with invented clients, and
// a six-month revenue curve, none of it from the database. The owner was being
// shown revenue that did not exist. Everything here is computed from records,
// and anything that is an estimate says so.

/**
 * Money actually received, in cents, from each paid source, including
 * Learning Box one-time track purchases, website scanner reports, calculator
 * Full Plans and AI Agent Readiness reports and kits. Subscription products (Learn
 * all-access, Readiness Monitor, Toolkit Live) are not here: individual
 * renewals are not recorded, so they are shown as estimates on their pages.
 */
const PAID_ORDER_STATUSES = ["paid", "fulfilled"];

function monthStart(d: Date, offsetMonths = 0): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offsetMonths, 1));
}

async function paidRevenueBetween(
  from: Date,
  to: Date,
): Promise<{ store: number; events: number; bookings: number; blueprints: number; learnTracks: number; scannerReports: number; calculatorPlans: number; agentReady: number; total: number }> {
  // Tables created on first sale (runtime DDL): absent means nothing sold.
  const sumSql = (sql: string) =>
    prisma.$queryRawUnsafe<Array<{ c: bigint | null }>>(sql, from, to).then((r) => Number(r[0]?.c ?? 0)).catch(() => 0);
  const [orders, events, bookings, blueprints, learnTracks, scannerReports, calculatorPlans, agentReady] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: PAID_ORDER_STATUSES }, createdAt: { gte: from, lt: to } },
    }),
    prisma.eventRegistration.aggregate({
      _sum: { price: true },
      where: { status: "paid", createdAt: { gte: from, lt: to } },
    }),
    prisma.appointment.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: "paid", createdAt: { gte: from, lt: to } },
    }),
    // One-time Automation Blueprints. The table is created on first sale, so
    // its absence means nothing has been sold, not an error.
    prisma.blueprint
      .aggregate({ _sum: { amountPaid: true }, where: { paidAt: { gte: from, lt: to } } })
      .catch(() => ({ _sum: { amountPaid: 0 } })),
    // Learning Box one-time track purchases (lifetime access to one track).
    ensureTrackPurchaseTable()
      .then(() =>
        prisma.trackPurchase.aggregate({ _sum: { amountCents: true }, where: { createdAt: { gte: from, lt: to } } }),
      )
      .catch(() => ({ _sum: { amountCents: 0 } })),
    // Website scanner full reports (paid unlocks).
    prisma.scannerLead
      .aggregate({ _sum: { amountPaid: true }, where: { unlockSource: "paid", unlockedAt: { gte: from, lt: to } } })
      .then((r) => r._sum.amountPaid ?? 0)
      .catch(() => 0),
    // AI Product Cost Calculator Full Plans (refunded ones excluded).
    sumSql(`SELECT sum("amountPaid")::bigint AS c FROM "CalculatorPass" WHERE "status" = 'paid' AND "paidAt" >= $1 AND "paidAt" < $2`),
    // AI Agent Readiness reports and kits (refunds put the tier back to free).
    sumSql(`SELECT sum("amountPaid")::bigint AS c FROM "AgentReadyScan" WHERE "tier" <> 'free' AND "paidAt" >= $1 AND "paidAt" < $2`),
  ]);
  const store = orders._sum.total ?? 0;
  const ev = events._sum.price ?? 0;
  const bk = bookings._sum.totalAmount ?? 0;
  const bp = blueprints._sum.amountPaid ?? 0;
  const lt = learnTracks._sum.amountCents ?? 0;
  return {
    store, events: ev, bookings: bk, blueprints: bp, learnTracks: lt, scannerReports, calculatorPlans, agentReady,
    total: store + ev + bk + bp + lt + scannerReports + calculatorPlans + agentReady,
  };
}

/**
 * Monthly recurring revenue implied by active Learn subscriptions, at today's
 * plan prices. An ESTIMATE: subscriptions do not record what each person
 * actually pays (founding rates, discounts), so this is labelled as such.
 */
async function estimatedLearnMrr(): Promise<{
  cents: number;
  activeSubscribers: number;
  /** Team plans (included in cents): seats x per-seat price, active paying teams. */
  teamCents: number;
  activeTeams: number;
  teamSeats: number;
}> {
  const teams = await teamMrr();
  const subs = await prisma.learnSubscription.groupBy({
    by: ["plan"],
    where: { status: "active" },
    _count: { _all: true },
  });
  let cents = 0;
  let n = 0;
  for (const s of subs) {
    n += s._count._all;
    cents += s.plan === "annual" ? Math.round((PLANS.annual.amount / 12) * s._count._all) : PLANS.monthly.amount * s._count._all;
  }
  // Tracks on their own monthly plan (lib/learn/track-monthly.ts).
  const own = await prisma.trackSubscription.findMany({ where: { status: "active" }, select: { trackId: true } }).catch(() => []);
  if (own.length) {
    const slugs = new Map(
      (await prisma.learnTrack.findMany({ where: { id: { in: [...new Set(own.map((x) => x.trackId))] } }, select: { id: true, slug: true } })).map((x) => [x.id, x.slug]),
    );
    for (const x of own) {
      n++;
      cents += trackMonthlyCents(slugs.get(x.trackId)) ?? 0;
    }
  }
  return { cents: cents + teams.cents, activeSubscribers: n, teamCents: teams.cents, activeTeams: teams.teams, teamSeats: teams.seats };
}

function pctChange(now: number, before: number): number | undefined {
  if (before === 0) return undefined; // "up from nothing" is not a percentage
  return Math.round(((now - before) / before) * 100);
}

export async function getDashboard() {
  const now = new Date();
  const thisMonth = monthStart(now);
  const nextMonth = monthStart(now, 1);
  const lastMonth = monthStart(now, -1);
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const [
    apptsThis, apptsLast, revThis, revLast, prospectsThis, toolsToday,
    upcoming, recentProspects,
  ] = await Promise.all([
    prisma.appointment.count({ where: { date: { gte: thisMonth, lt: nextMonth }, status: { not: "CANCELLED" } } }),
    prisma.appointment.count({ where: { date: { gte: lastMonth, lt: thisMonth }, status: { not: "CANCELLED" } } }),
    paidRevenueBetween(thisMonth, nextMonth),
    paidRevenueBetween(lastMonth, thisMonth),
    prisma.prospect.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.toolUsage.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.appointment.findMany({
      where: { date: { gte: todayStart }, status: { not: "CANCELLED" } },
      orderBy: [{ date: "asc" }],
      take: 5,
      select: { id: true, date: true, timeSlot: true, firstName: true, lastName: true, serviceType: true, status: true, totalAmount: true },
    }),
    prisma.prospect.findMany({
      where: { archived: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, business: true, industry: true, status: true, suggestedSolutions: true },
    }),
  ]);

  return {
    appointmentsThisMonth: apptsThis,
    appointmentsChange: pctChange(apptsThis, apptsLast),
    revenueThisMonth: revThis.total,
    revenueChange: pctChange(revThis.total, revLast.total),
    newProspectsThisMonth: prospectsThis,
    toolUsesToday: toolsToday,
    upcoming,
    recentProspects,
    trend: await getRevenueTrend(6),
  };
}

/** Paid revenue per calendar month, oldest first. */
export async function getRevenueTrend(months: number) {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const from = monthStart(now, i - (months - 1));
    return { from, to: monthStart(now, i - (months - 1) + 1) };
  });
  const sums = await Promise.all(buckets.map((b) => paidRevenueBetween(b.from, b.to)));
  return buckets.map((b, i) => ({
    month: b.from.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
    revenue: Math.round(sums[i].total / 100),
  }));
}

export async function getRevenue() {
  const now = new Date();
  const thisMonth = monthStart(now);
  const [allTime, thisM, lastM, mrr, trend, recentOrders] = await Promise.all([
    paidRevenueBetween(new Date(0), monthStart(now, 1)),
    paidRevenueBetween(thisMonth, monthStart(now, 1)),
    paidRevenueBetween(monthStart(now, -1), thisMonth),
    estimatedLearnMrr(),
    getRevenueTrend(12),
    prisma.order.findMany({
      where: { status: { in: PAID_ORDER_STATUSES } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, orderNumber: true, email: true, total: true, createdAt: true, items: true },
    }),
  ]);
  return { allTime, thisMonth: thisM, lastMonth: lastM, mrr, trend, recentOrders };
}

/**
 * Real tool usage: uses per tool per week for the last six weeks, plus the
 * scanner's funnel from its leads table.
 *
 * The page this feeds used to show invented figures, including metrics
 * nothing records ("average session 4.2 min", "average project value
 * $8,400"). ToolUsage stores the tool and the time, so that is what is shown.
 */
export async function getToolUsage() {
  const weeks = 6;
  const now = new Date();
  const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7)));
  const since = new Date(startOfWeek.getTime() - (weeks - 1) * 7 * 86_400_000);

  const [rows, allTime, scans, leadsWithEmail, bookedFromScan, avg] = await Promise.all([
    prisma.$queryRaw<Array<{ tool: string; week: Date; n: bigint }>>`
      SELECT "tool", date_trunc('week', "createdAt") AS week, count(*) AS n
      FROM "ToolUsage" WHERE "createdAt" >= ${since}
      GROUP BY 1, 2`,
    prisma.toolUsage.groupBy({ by: ["tool"], _count: { _all: true } }),
    prisma.scannerLead.count(),
    prisma.scannerLead.count({ where: { email: { not: null } } }),
    prisma.scannerLead.count({ where: { bookedCallAt: { not: null } } }),
    prisma.scannerLead.aggregate({ _avg: { overallScore: true } }),
  ]);

  // AI Agent Readiness checks (customers only) and calculator Full Plans. Both
  // tables are created on first use: absent means none yet.
  const [agentWeeks, agentStats, plans, recentPlans] = await Promise.all([
    prisma
      .$queryRawUnsafe<Array<{ week: Date; n: bigint }>>(
        `SELECT date_trunc('week', "createdAt") AS week, count(*) AS n FROM "AgentReadyScan" WHERE "staff" = false AND "createdAt" >= $1 GROUP BY 1`,
        since,
      )
      .catch(() => []),
    prisma
      .$queryRawUnsafe<Array<{ total: bigint; paid: bigint; kits: bigint; avg: number | null; revenue: bigint | null }>>(
        `SELECT count(*) AS total, count(*) FILTER (WHERE "tier" <> 'free') AS paid, count(*) FILTER (WHERE "tier" = 'kit') AS kits,
                avg("score")::float AS avg, sum("amountPaid") FILTER (WHERE "tier" <> 'free') AS revenue
         FROM "AgentReadyScan" WHERE "staff" = false`,
      )
      .then((r) => r[0])
      .catch(() => null),
    prisma
      .$queryRawUnsafe<Array<{ n: bigint; revenue: bigint | null }>>(`SELECT count(*) AS n, sum("amountPaid") AS revenue FROM "CalculatorPass" WHERE "status" = 'paid'`)
      .then((r) => r[0])
      .catch(() => null),
    prisma
      .$queryRawUnsafe<Array<{ email: string | null; status: string; amountPaid: number; paidAt: Date | null; expiresAt: Date | null }>>(
        `SELECT "email", "status", "amountPaid", "paidAt", "expiresAt" FROM "CalculatorPass" WHERE "status" IN ('paid', 'refunded') ORDER BY "paidAt" DESC NULLS LAST LIMIT 20`,
      )
      .catch(() => []),
  ]);

  const weekStarts = Array.from({ length: weeks }, (_, i) => new Date(since.getTime() + i * 7 * 86_400_000));
  const label = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const series = (tool: string) =>
    weekStarts.map((w) => ({
      week: label(w),
      uses:
        tool === "agentReady"
          ? Number(agentWeeks.find((r) => new Date(r.week).getTime() === w.getTime())?.n ?? 0)
          : Number(rows.find((r) => r.tool === tool && new Date(r.week).getTime() === w.getTime())?.n ?? 0),
    }));
  const totals: Record<string, number> = Object.fromEntries(allTime.map((t) => [t.tool, t._count._all]));
  totals.agentReady = Number(agentStats?.total ?? 0);
  const agentTotal = Number(agentStats?.total ?? 0);

  return {
    tools: ["agentReady", "scanner", "calculator", "advisor"].map((tool) => ({
      tool,
      allTime: totals[tool] ?? 0,
      last6Weeks: series(tool).reduce((n, w) => n + w.uses, 0),
      trend: series(tool),
    })),
    scanner: {
      savedScans: scans,
      emailCaptureRate: scans === 0 ? null : Math.round((leadsWithEmail / scans) * 100),
      bookingRate: scans === 0 ? null : Math.round((bookedFromScan / scans) * 100),
      avgScore: avg._avg.overallScore == null ? null : Math.round(avg._avg.overallScore),
    },
    agentReady: {
      checks: agentTotal,
      paid: Number(agentStats?.paid ?? 0),
      kits: Number(agentStats?.kits ?? 0),
      paidRate: agentTotal === 0 ? null : Math.round((Number(agentStats?.paid ?? 0) / agentTotal) * 100),
      avgScore: agentStats?.avg == null ? null : Math.round(agentStats.avg),
      revenueCents: Number(agentStats?.revenue ?? 0),
    },
    calculator: {
      plansSold: Number(plans?.n ?? 0),
      revenueCents: Number(plans?.revenue ?? 0),
      recent: recentPlans.map((p) => ({
        email: p.email,
        status: p.status,
        amountPaid: p.amountPaid,
        paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : null,
        expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString() : null,
      })),
    },
  };
}

export type ToolUsageData = Awaited<ReturnType<typeof getToolUsage>>;

export async function getScannerLeads() {
  await (await import("@/lib/scanner/db")).ensureScannerColumns();
  const [rows, total, withEmail, booked, avg, paid] = await Promise.all([
    prisma.scannerLead.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, url: true, createdAt: true, overallScore: true, aiScore: true,
        seoScore: true, perfScore: true, uxScore: true, email: true, name: true, bookedCallAt: true,
        domain: true, token: true, unlockedAt: true, unlockSource: true, amountPaid: true, reportStatus: true,
        followupStage: true, emailedAt: true, growthLeadId: true, parentId: true, extra: true, report: true, appointmentId: true,
      },
    }),
    prisma.scannerLead.count(),
    prisma.scannerLead.count({ where: { email: { not: null } } }),
    prisma.scannerLead.count({ where: { bookedCallAt: { not: null } } }),
    prisma.scannerLead.aggregate({ _avg: { overallScore: true } }),
    prisma.scannerLead.aggregate({ where: { unlockSource: "paid" }, _count: { _all: true }, _sum: { amountPaid: true } }),
  ]);
  return {
    rows,
    total,
    withEmail,
    booked,
    paid: paid._count._all,
    revenueCents: paid._sum.amountPaid ?? 0,
    avgScore: avg._avg.overallScore == null ? null : Math.round(avg._avg.overallScore),
  };
}
