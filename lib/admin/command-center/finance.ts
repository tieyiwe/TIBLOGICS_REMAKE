import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { PLANS } from "@/lib/payments/provider";
import { toolkitPlans } from "@/lib/toolkit/config";
import { ensureFinanceTables } from "./db";
import { addDays, addMonths, dayToDate, keyOf } from "./dates";
import {
  DEFAULT_FX,
  EXPENSE_CATEGORIES,
  PLATFORM_SOURCES,
  categoryLabel,
  sourceLabel,
  type Currency,
  type PlatformSource,
} from "./constants";
import { addMonthKey, monthKey, monthStartUtc } from "./money";
import { notify } from "./pm";
import { PERM_FINANCE } from "./permissions";

// Finance: the books behind /admin_pro/command-center/finance.
//
// Three kinds of rows:
//   - Manual entries (FinIncome, FinExpense), including expenses generated
//     from recurring charges (FinRecurring, one per period, idempotent).
//   - Platform income, read live from the records Stripe payments already
//     write (orders, event registrations, paid bookings, blueprints, track
//     purchases) plus monthly ESTIMATES for subscriptions (ARFA Learn, team
//     seats, Toolkit Live) at today's prices: subscriptions store no payment
//     history here, so those rows are labelled as estimates.
//   - Automatic estimated expenses: AI API cost from AiUsage per month, and
//     Stripe fees on Stripe-backed income (2.9% + 30c by default, editable).
// All totals are USD cents. Months are calendar months in UTC.

// ── Settings ─────────────────────────────────────────────────────────────────

export interface FinanceSettings {
  stripePercent: number;
  stripeFixedCents: number;
  autoAiCosts: boolean;
  autoStripeFees: boolean;
  fx: { CAD: number; EUR: number; XOF: number };
}

const SETTINGS_KEY = "finance_settings";
const DEFAULT_SETTINGS: FinanceSettings = {
  stripePercent: 2.9,
  stripeFixedCents: 30,
  autoAiCosts: true,
  autoStripeFees: true,
  fx: { CAD: DEFAULT_FX.CAD, EUR: DEFAULT_FX.EUR, XOF: DEFAULT_FX.XOF },
};

export async function getFinanceSettings(): Promise<FinanceSettings> {
  try {
    const row = await prisma.adminSettings.findUnique({ where: { key: SETTINGS_KEY } });
    if (!row) return DEFAULT_SETTINGS;
    const v = JSON.parse(row.value) as Partial<FinanceSettings>;
    return { ...DEFAULT_SETTINGS, ...v, fx: { ...DEFAULT_SETTINGS.fx, ...(v.fx ?? {}) } };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveFinanceSettings(patch: Partial<FinanceSettings>): Promise<FinanceSettings> {
  const cur = await getFinanceSettings();
  const next = { ...cur, ...patch, fx: { ...cur.fx, ...(patch.fx ?? {}) } };
  await prisma.adminSettings.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}

function rateFor(currency: string, s: FinanceSettings): number {
  const c = currency.toUpperCase();
  if (c === "USD") return 1;
  return (s.fx as Record<string, number>)[c] ?? 1;
}

const num = (v: unknown) => (v == null ? 0 : typeof v === "bigint" ? Number(v) : Number(v) || 0);

async function tablesPresent(names: string[]): Promise<Record<string, boolean>> {
  const rows = await prisma.$queryRaw<Array<{ t: string; ok: boolean }>>`
    SELECT t, to_regclass('"' || t || '"') IS NOT NULL AS ok FROM unnest(${names}::text[]) AS t`;
  return Object.fromEntries(rows.map((r) => [r.t, r.ok]));
}

const OPTIONAL = ["Blueprint", "TrackPurchase", "Team", "ToolkitSubscription", "AiUsage", "LearnSubscription"];

// ── Platform income ──────────────────────────────────────────────────────────

export interface MonthAmount {
  month: string;
  key: string;
  cents: number;
  count: number;
}

/** One-time Stripe-backed income per source and month, USD cents. */
async function platformOneTime(from: Date, to: Date, s: FinanceSettings, has: Record<string, boolean>): Promise<MonthAmount[]> {
  const rows = await prisma.$queryRaw<Array<{ src: string; m: string; cur: string; cents: bigint; n: number }>>`
    SELECT src, to_char(date_trunc('month', at), 'YYYY-MM') AS m, upper(cur) AS cur, COALESCE(SUM(c), 0)::bigint AS cents, COUNT(*)::int AS n FROM (
      SELECT 'store' AS src, "createdAt" AS at, "total" AS c, "currency" AS cur FROM "Order"
        WHERE "status" IN ('paid', 'fulfilled') AND "createdAt" >= ${from} AND "createdAt" < ${to}
      UNION ALL SELECT 'events', "createdAt", "price", "currency" FROM "EventRegistration"
        WHERE "status" = 'paid' AND "createdAt" >= ${from} AND "createdAt" < ${to}
      UNION ALL SELECT 'bookings', "createdAt", "totalAmount", 'USD' FROM "Appointment"
        WHERE "paymentStatus" = 'paid' AND "createdAt" >= ${from} AND "createdAt" < ${to}
      ${has.Blueprint ? Prisma.sql`UNION ALL SELECT 'blueprints', "paidAt", "amountPaid", 'USD' FROM "Blueprint" WHERE "paidAt" >= ${from} AND "paidAt" < ${to}` : Prisma.empty}
      ${has.TrackPurchase ? Prisma.sql`UNION ALL SELECT 'tracks', "createdAt", "amountCents", "currency" FROM "TrackPurchase" WHERE "createdAt" >= ${from} AND "createdAt" < ${to}` : Prisma.empty}
    ) x GROUP BY 1, 2, 3`;
  const out = new Map<string, MonthAmount>();
  for (const r of rows) {
    const k = `${r.src}|${r.m}`;
    const cur = out.get(k) ?? { key: r.src, month: r.m, cents: 0, count: 0 };
    cur.cents += Math.round(num(r.cents) * rateFor(r.cur || "USD", s));
    cur.count += num(r.n);
    out.set(k, cur);
  }
  return [...out.values()];
}

interface SubRow {
  plan: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

function activeInMonth(r: SubRow, m: string, now: Date): boolean {
  const start = monthStartUtc(m);
  const end = monthStartUtc(addMonthKey(m, 1));
  if (start > now || r.createdAt >= end) return false;
  if (r.status === "active" || r.status === "past_due") return true;
  if (r.status === "canceled" || r.status === "cancelled") return r.updatedAt >= start;
  return false; // trialing, pending, incomplete: nothing paid yet
}

/** Monthly subscription income ESTIMATES (Learn, team seats, Toolkit Live). */
async function platformSubscriptions(months: string[], has: Record<string, boolean>): Promise<MonthAmount[]> {
  const now = new Date();
  const out: MonthAmount[] = [];
  if (has.LearnSubscription) {
    const subs = await prisma.learnSubscription.findMany({
      where: { stripeSubscriptionId: { not: null } },
      select: { plan: true, status: true, createdAt: true, updatedAt: true },
    });
    for (const m of months) {
      let cents = 0;
      let count = 0;
      for (const s of subs) {
        if (!activeInMonth(s, m, now)) continue;
        count++;
        cents += s.plan === "annual" ? Math.round(PLANS.annual.amount / 12) : PLANS.monthly.amount;
      }
      if (count) out.push({ key: "learn_subs", month: m, cents, count });
    }
  }
  if (has.Team) {
    const [teams, pricing] = await Promise.all([
      prisma.team.findMany({
        where: { comped: false, stripeSubscriptionId: { not: null } },
        select: { seats: true, seatPriceCents: true, status: true, createdAt: true, updatedAt: true },
      }),
      import("@/lib/learn/team/settings").then((m) => m.getTeamPricing().then((p) => ({ p, seatPrice: m.seatPrice }))).catch(() => null),
    ]);
    if (pricing) {
      for (const m of months) {
        let cents = 0;
        let count = 0;
        for (const t of teams) {
          if (!activeInMonth({ plan: "", ...t }, m, now)) continue;
          count++;
          cents += t.seats * pricing.seatPrice(t, pricing.p);
        }
        if (count) out.push({ key: "team_seats", month: m, cents, count });
      }
    }
  }
  if (has.ToolkitSubscription) {
    const plans = toolkitPlans() as Record<string, { amount: number | null }>;
    const subs = await prisma.toolkitSubscription.findMany({
      where: { stripeSubscriptionId: { not: null } },
      select: { plan: true, status: true, createdAt: true, updatedAt: true },
    });
    for (const m of months) {
      let cents = 0;
      let count = 0;
      for (const s of subs) {
        const price = plans[s.plan]?.amount;
        if (!price || !activeInMonth(s, m, now)) continue;
        count++;
        cents += price;
      }
      if (count) out.push({ key: "toolkit", month: m, cents, count });
    }
  }
  return out;
}

/** Estimated MRR now: platform subscriptions plus client retainers on projects. */
export async function currentMrr() {
  const has = await tablesPresent(OPTIONAL);
  const m = monthKey(new Date());
  const subs = await platformSubscriptions([m], has);
  const by = (k: string) => subs.find((s) => s.key === k)?.cents ?? 0;
  const retainers = await prisma.project.aggregate({ where: { archived: false, status: { in: ["ACTIVE", "PAUSED"] } }, _sum: { monthlyRecurring: true } });
  const retainerCents = (retainers._sum.monthlyRecurring ?? 0) * 100;
  const learn = by("learn_subs");
  const team = by("team_seats");
  const toolkit = by("toolkit");
  return { learn, team, toolkit, retainers: retainerCents, total: learn + team + toolkit + retainerCents };
}

// ── Automatic expenses ───────────────────────────────────────────────────────

async function aiCostsMonthly(from: Date, to: Date, has: Record<string, boolean>): Promise<Map<string, number>> {
  if (!has.AiUsage) return new Map();
  const rows = await prisma.$queryRaw<Array<{ m: string; c: number }>>`
    SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS m, COALESCE(SUM("costCents"), 0)::float8 AS c
    FROM "AiUsage" WHERE "createdAt" >= ${from} AND "createdAt" < ${to} GROUP BY 1`;
  return new Map(rows.map((r) => [r.m, Math.round(num(r.c))]));
}

function stripeFees(income: MonthAmount[], s: FinanceSettings): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of income) {
    // Every platform source is paid through Stripe; manual entries are not.
    const fee = Math.round((r.cents * s.stripePercent) / 100 + r.count * s.stripeFixedCents);
    out.set(r.month, (out.get(r.month) ?? 0) + fee);
  }
  return out;
}

// ── Recurring expenses ───────────────────────────────────────────────────────

function occurrence(startKey: string, interval: string, i: number): string {
  return addMonths(startKey, interval === "annual" ? 12 * i : i);
}

function periodKeyOf(dayKey: string, interval: string): string {
  return interval === "annual" ? dayKey.slice(0, 4) : dayKey.slice(0, 7);
}

/**
 * Creates the expense for every period of every active recurring charge that
 * has come due, then moves its next date on. Idempotent: the unique
 * (recurringId, periodKey) index means a second run, or two at once, adds
 * nothing. Returns how many expenses were created.
 */
export async function generateRecurringExpenses(now = new Date()): Promise<number> {
  await ensureFinanceTables();
  const today = keyOf(now)!;
  const due = await prisma.finRecurring.findMany({ where: { active: true, nextDate: { lte: dayToDate(today) } } });
  let created = 0;
  for (const r of due) {
    const startKey = keyOf(r.startDate)!;
    const nextKey = keyOf(r.nextDate)!;
    let i = 0;
    while (occurrence(startKey, r.interval, i) < nextKey && i < 600) i++;
    const rows: Prisma.FinExpenseCreateManyInput[] = [];
    let k = occurrence(startKey, r.interval, i);
    while (k <= today && rows.length < 60) {
      rows.push({
        date: dayToDate(k),
        vendor: r.vendor,
        category: r.category,
        description: r.description ?? `${r.interval === "annual" ? "Annual" : "Monthly"} charge`,
        projectId: r.projectId,
        amountCents: r.amountCents,
        currency: r.currency,
        fxRate: r.fxRate,
        amountUsdCents: r.amountUsdCents,
        taxCents: r.taxCents,
        taxUsdCents: r.taxUsdCents,
        taxLabel: r.taxLabel,
        paymentMethod: r.paymentMethod,
        recurringId: r.id,
        periodKey: periodKeyOf(k, r.interval),
        createdById: "system",
      });
      i++;
      k = occurrence(startKey, r.interval, i);
    }
    if (rows.length) {
      const res = await prisma.finExpense.createMany({ data: rows, skipDuplicates: true });
      created += res.count;
    }
    await prisma.finRecurring.update({ where: { id: r.id }, data: { nextDate: dayToDate(k) } });
  }
  return created;
}

// ── Monthly aggregates ───────────────────────────────────────────────────────

export interface MonthTotals {
  month: string;
  income: number;
  expenses: number;
  net: number;
  incomeBySource: Record<string, number>;
  expensesByCategory: Record<string, number>;
  platformCounts: Record<string, number>;
}

/** Income and expenses per month for [fromMonth, toMonth], all sources. */
export async function monthlyTotals(fromMonth: string, toMonth: string): Promise<MonthTotals[]> {
  await ensureFinanceTables();
  const [s, has] = await Promise.all([getFinanceSettings(), tablesPresent(OPTIONAL)]);
  const months: string[] = [];
  for (let m = fromMonth; m <= toMonth; m = addMonthKey(m, 1)) months.push(m);
  const from = monthStartUtc(fromMonth);
  const to = monthStartUtc(addMonthKey(toMonth, 1));

  const [oneTime, subs, ai, manualIncome, manualExpense] = await Promise.all([
    platformOneTime(from, to, s, has),
    platformSubscriptions(months, has),
    s.autoAiCosts ? aiCostsMonthly(from, to, has) : Promise.resolve(new Map<string, number>()),
    prisma.$queryRaw<Array<{ m: string; c: bigint }>>`
      SELECT to_char(date_trunc('month', COALESCE("paidAt", "date")), 'YYYY-MM') AS m, COALESCE(SUM("amountUsdCents"), 0)::bigint AS c
      FROM "FinIncome" WHERE "status" = 'paid' AND COALESCE("paidAt", "date") >= ${from} AND COALESCE("paidAt", "date") < ${to} GROUP BY 1`,
    prisma.$queryRaw<Array<{ m: string; cat: string; c: bigint }>>`
      SELECT to_char(date_trunc('month', "date"), 'YYYY-MM') AS m, "category" AS cat, COALESCE(SUM("amountUsdCents"), 0)::bigint AS c
      FROM "FinExpense" WHERE "date" >= ${from} AND "date" < ${to} GROUP BY 1, 2`,
  ]);
  const platform = [...oneTime, ...subs];
  const fees = s.autoStripeFees ? stripeFees(platform, s) : new Map<string, number>();

  return months.map((m) => {
    const incomeBySource: Record<string, number> = {};
    const platformCounts: Record<string, number> = {};
    for (const p of platform.filter((x) => x.month === m)) {
      incomeBySource[p.key] = (incomeBySource[p.key] ?? 0) + p.cents;
      platformCounts[p.key] = (platformCounts[p.key] ?? 0) + p.count;
    }
    const manual = num(manualIncome.find((r) => r.m === m)?.c);
    if (manual) incomeBySource.manual = manual;
    const expensesByCategory: Record<string, number> = {};
    for (const r of manualExpense.filter((x) => x.m === m)) expensesByCategory[r.cat] = (expensesByCategory[r.cat] ?? 0) + num(r.c);
    const aiCents = ai.get(m) ?? 0;
    if (aiCents) expensesByCategory.ai_apis = (expensesByCategory.ai_apis ?? 0) + aiCents;
    const feeCents = fees.get(m) ?? 0;
    if (feeCents) expensesByCategory.fees = (expensesByCategory.fees ?? 0) + feeCents;
    const income = Object.values(incomeBySource).reduce((a, b) => a + b, 0);
    const expenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
    return { month: m, income, expenses, net: income - expenses, incomeBySource, expensesByCategory, platformCounts };
  });
}

// ── Budgets ──────────────────────────────────────────────────────────────────

export interface BudgetLine {
  category: string;
  label: string;
  budget: number;
  spent: number;
  pct: number | null;
  level: "ok" | "warn" | "over" | "none";
}

export function budgetLines(budgets: Array<{ category: string; monthlyUsdCents: number }>, spentByCat: Record<string, number>): BudgetLine[] {
  return EXPENSE_CATEGORIES.map((c) => {
    const b = budgets.find((x) => x.category === c.value)?.monthlyUsdCents ?? 0;
    const spent = spentByCat[c.value] ?? 0;
    const pct = b ? (spent / b) * 100 : null;
    return {
      category: c.value,
      label: c.label,
      budget: b,
      spent,
      pct,
      level: !b ? "none" : pct! >= 100 ? "over" : pct! >= 80 ? "warn" : "ok",
    } as BudgetLine;
  });
}

/** People who should hear about money: the owner, admins and finance collaborators. */
async function financeRecipients(): Promise<string[]> {
  const collabs = await prisma.collaborator
    .findMany({ where: { active: true }, select: { id: true, isAdmin: true, permissions: true } })
    .catch(() => []);
  return ["owner", ...collabs.filter((c) => c.isAdmin || c.permissions.includes("*") || c.permissions.includes(PERM_FINANCE)).map((c) => c.id)];
}

/** In-admin alerts at 80% and 100% of a category budget, once per category per month per level. */
export async function raiseBudgetAlerts(month: string, lines: BudgetLine[]): Promise<number> {
  const hits = lines.filter((l) => l.level === "warn" || l.level === "over");
  if (!hits.length) return 0;
  const to = await financeRecipients();
  for (const l of hits) {
    const level = l.level === "over" ? 100 : 80;
    await notify(to, {
      kind: "budget",
      title: level === 100 ? `${l.label} is over budget` : `${l.label} has used ${Math.floor(l.pct!)}% of its budget`,
      body: `$${(l.spent / 100).toFixed(2)} of $${(l.budget / 100).toFixed(2)} in ${month}`,
      href: "/admin_pro/command-center/finance/budgets",
      dedupeKey: `budget:${l.category}:${month}:${level}`,
    });
  }
  return hits.length;
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface OverdueInvoice {
  id: string;
  client: string;
  invoiceNumber: string | null;
  amountUsdCents: number;
  dueKey: string | null;
  daysOverdue: number;
  projectId: string | null;
}

export async function overdueInvoices(today: string): Promise<OverdueInvoice[]> {
  const rows = await prisma.finIncome.findMany({
    where: { OR: [{ status: "overdue" }, { status: "invoiced", dueDate: { lt: dayToDate(today) } }] },
    orderBy: { dueDate: "asc" },
    take: 50,
  });
  return rows.map((r) => {
    const dueKey = keyOf(r.dueDate);
    return {
      id: r.id,
      client: r.client,
      invoiceNumber: r.invoiceNumber,
      amountUsdCents: r.amountUsdCents + r.taxUsdCents,
      dueKey,
      daysOverdue: dueKey ? Math.max(0, Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${dueKey}T12:00:00Z`)) / 86_400_000)) : 0,
      projectId: r.projectId,
    };
  });
}

export async function getDashboard(month: string, today: string) {
  await ensureFinanceTables();
  await generateRecurringExpenses();
  const first = addMonthKey(month, -11);
  const [series, mrr, budgets, upcoming, overdue, outstanding, settings, topProjects] = await Promise.all([
    monthlyTotals(first, month),
    currentMrr(),
    prisma.finBudget.findMany(),
    prisma.finRecurring.findMany({
      where: { active: true, nextDate: { lte: dayToDate(addDays(today, 30)) } },
      orderBy: { nextDate: "asc" },
      take: 20,
    }),
    overdueInvoices(today),
    prisma.finIncome.aggregate({ where: { status: { in: ["invoiced", "overdue"] } }, _sum: { amountUsdCents: true, taxUsdCents: true }, _count: true }),
    getFinanceSettings(),
    topProjectsByProfit(),
  ]);
  const cur = series[series.length - 1];
  const prev = series[series.length - 2];
  const lines = budgetLines(budgets, cur.expensesByCategory);
  // Only the current month raises alerts; looking at an old month does not.
  if (month === monthKey(new Date())) await raiseBudgetAlerts(month, lines);
  return {
    month,
    cur,
    prev,
    series,
    mrr,
    budgets: lines,
    upcoming: upcoming.map((r) => ({
      id: r.id,
      vendor: r.vendor,
      category: r.category,
      interval: r.interval,
      nextKey: keyOf(r.nextDate)!,
      amountUsdCents: r.amountUsdCents,
      amountCents: r.amountCents,
      currency: r.currency,
    })),
    overdue,
    outstanding: { cents: (outstanding._sum.amountUsdCents ?? 0) + (outstanding._sum.taxUsdCents ?? 0), count: outstanding._count },
    settings,
    topProjects,
  };
}

export async function topProjectsByProfit(limit = 6) {
  const rows = await prisma.$queryRaw<Array<{ id: string; name: string; color: string; inc: bigint; exp: bigint }>>`
    SELECT p."id", p."name", p."color",
      COALESCE((SELECT SUM(i."amountUsdCents") FROM "FinIncome" i WHERE i."projectId" = p."id" AND i."status" = 'paid'), 0)::bigint AS inc,
      COALESCE((SELECT SUM(e."amountUsdCents") FROM "FinExpense" e WHERE e."projectId" = p."id"), 0)::bigint AS exp
    FROM "Project" p
    WHERE EXISTS (SELECT 1 FROM "FinIncome" i WHERE i."projectId" = p."id") OR EXISTS (SELECT 1 FROM "FinExpense" e WHERE e."projectId" = p."id")`;
  return rows
    .map((r) => ({ id: r.id, name: r.name, color: r.color, income: num(r.inc), expenses: num(r.exp), profit: num(r.inc) - num(r.exp) }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limit);
}

// ── Lists ────────────────────────────────────────────────────────────────────

export interface IncomeRow {
  id: string;
  kind: "manual" | "platform";
  source: string;
  sourceLabel: string;
  dateKey: string;
  client: string;
  description: string | null;
  projectId: string | null;
  amountCents: number;
  currency: string;
  fxRate: number;
  amountUsdCents: number;
  taxCents: number;
  taxUsdCents: number;
  taxLabel: string | null;
  status: string;
  invoiceNumber: string | null;
  dueKey: string | null;
  paidKey: string | null;
  notes: string | null;
  estimate: boolean;
}

export interface ExpenseRow {
  id: string;
  kind: "manual" | "recurring" | "auto";
  source: string;
  dateKey: string;
  vendor: string;
  category: string;
  description: string | null;
  projectId: string | null;
  amountCents: number;
  currency: string;
  fxRate: number;
  amountUsdCents: number;
  taxCents: number;
  taxUsdCents: number;
  taxLabel: string | null;
  paymentMethod: string | null;
  receiptId: string | null;
  receiptUrl: string | null;
  recurringId: string | null;
  notes: string | null;
  estimate: boolean;
}

type IncomeDb = Awaited<ReturnType<typeof prisma.finIncome.findMany>>[number];
type ExpenseDb = Awaited<ReturnType<typeof prisma.finExpense.findMany>>[number];

export function incomeRow(r: IncomeDb, today: string): IncomeRow {
  const dueKey = keyOf(r.dueDate);
  const status = r.status === "invoiced" && dueKey && dueKey < today ? "overdue" : r.status;
  return {
    id: r.id,
    kind: "manual",
    source: "manual",
    sourceLabel: sourceLabel("manual"),
    dateKey: keyOf(r.date)!,
    client: r.client,
    description: r.description,
    projectId: r.projectId,
    amountCents: r.amountCents,
    currency: r.currency,
    fxRate: r.fxRate,
    amountUsdCents: r.amountUsdCents,
    taxCents: r.taxCents,
    taxUsdCents: r.taxUsdCents,
    taxLabel: r.taxLabel,
    status,
    invoiceNumber: r.invoiceNumber,
    dueKey,
    paidKey: keyOf(r.paidAt),
    notes: r.notes,
    estimate: false,
  };
}

export function expenseRow(r: ExpenseDb): ExpenseRow {
  return {
    id: r.id,
    kind: r.recurringId ? "recurring" : "manual",
    source: r.recurringId ? "recurring" : "manual",
    dateKey: keyOf(r.date)!,
    vendor: r.vendor,
    category: r.category,
    description: r.description,
    projectId: r.projectId,
    amountCents: r.amountCents,
    currency: r.currency,
    fxRate: r.fxRate,
    amountUsdCents: r.amountUsdCents,
    taxCents: r.taxCents,
    taxUsdCents: r.taxUsdCents,
    taxLabel: r.taxLabel,
    paymentMethod: r.paymentMethod,
    receiptId: r.receiptId,
    receiptUrl: r.receiptUrl,
    recurringId: r.recurringId,
    notes: r.notes,
    estimate: false,
  };
}

/** Individual platform payments in a date range, newest first. */
async function platformIncomeRows(from: Date, to: Date, s: FinanceSettings, limit: number): Promise<IncomeRow[]> {
  const has = await tablesPresent(OPTIONAL);
  const rows = await prisma.$queryRaw<Array<{ src: string; id: string; at: Date; c: number; cur: string; who: string | null; what: string | null }>>`
    SELECT * FROM (
      SELECT 'store' AS src, "id", "createdAt" AS at, "total" AS c, "currency" AS cur, COALESCE("customerName", "email") AS who, 'Store order' AS what
        FROM "Order" WHERE "status" IN ('paid', 'fulfilled') AND "createdAt" >= ${from} AND "createdAt" < ${to}
      UNION ALL SELECT 'events', "id", "createdAt", "price", "currency", trim("firstName" || ' ' || "lastName"), "eventName"
        FROM "EventRegistration" WHERE "status" = 'paid' AND "createdAt" >= ${from} AND "createdAt" < ${to}
      UNION ALL SELECT 'bookings', "id", "createdAt", "totalAmount", 'USD', trim("firstName" || ' ' || "lastName"), "serviceType"
        FROM "Appointment" WHERE "paymentStatus" = 'paid' AND "createdAt" >= ${from} AND "createdAt" < ${to}
      ${has.Blueprint ? Prisma.sql`UNION ALL SELECT 'blueprints', "id", "paidAt", "amountPaid", 'USD', "name", 'Automation Blueprint' FROM "Blueprint" WHERE "paidAt" >= ${from} AND "paidAt" < ${to}` : Prisma.empty}
      ${has.TrackPurchase ? Prisma.sql`UNION ALL SELECT 'tracks', "id", "createdAt", "amountCents", "currency", NULL, 'Track purchase' FROM "TrackPurchase" WHERE "createdAt" >= ${from} AND "createdAt" < ${to}` : Prisma.empty}
    ) x ORDER BY at DESC LIMIT ${limit}`;
  return rows.map((r) => {
    const cur = (r.cur || "USD").toUpperCase();
    const fx = rateFor(cur, s);
    return {
      id: `${r.src}:${r.id}`,
      kind: "platform" as const,
      source: r.src,
      sourceLabel: sourceLabel(r.src),
      dateKey: keyOf(r.at)!,
      client: r.who || "Customer",
      description: r.what ? String(r.what).replace(/_/g, " ") : null,
      projectId: null,
      amountCents: num(r.c),
      currency: cur,
      fxRate: fx,
      amountUsdCents: Math.round(num(r.c) * fx),
      taxCents: 0,
      taxUsdCents: 0,
      taxLabel: null,
      status: "paid",
      invoiceNumber: null,
      dueKey: null,
      paidKey: keyOf(r.at),
      notes: null,
      estimate: false,
    };
  });
}

export async function incomeList(opts: { fromKey: string; toKey: string; today: string; includePlatform: boolean; limit?: number }): Promise<IncomeRow[]> {
  await ensureFinanceTables();
  const from = dayToDate(opts.fromKey);
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(dayToDate(opts.toKey).getTime());
  to.setUTCHours(24, 0, 0, 0);
  const manual = await prisma.finIncome.findMany({
    where: { date: { gte: from, lt: to } },
    orderBy: { date: "desc" },
    take: opts.limit ?? 2000,
  });
  const rows = manual.map((r) => incomeRow(r, opts.today));
  if (opts.includePlatform) {
    const s = await getFinanceSettings();
    rows.push(...(await platformIncomeRows(from, to, s, opts.limit ?? 2000)));
    // Subscription estimates: one row per source per month in the range.
    const has = await tablesPresent(OPTIONAL);
    const months: string[] = [];
    for (let m = opts.fromKey.slice(0, 7); m <= opts.toKey.slice(0, 7); m = addMonthKey(m, 1)) months.push(m);
    for (const sub of await platformSubscriptions(months, has)) {
      rows.push({
        id: `${sub.key}:${sub.month}`,
        kind: "platform",
        source: sub.key,
        sourceLabel: sourceLabel(sub.key),
        dateKey: `${sub.month}-01`,
        client: `${sub.count} active subscription${sub.count === 1 ? "" : "s"}`,
        description: `${sourceLabel(sub.key)} for ${sub.month} (estimate at current prices)`,
        projectId: null,
        amountCents: sub.cents,
        currency: "USD",
        fxRate: 1,
        amountUsdCents: sub.cents,
        taxCents: 0,
        taxUsdCents: 0,
        taxLabel: null,
        status: "paid",
        invoiceNumber: null,
        dueKey: null,
        paidKey: `${sub.month}-01`,
        notes: null,
        estimate: true,
      });
    }
  }
  return rows.sort((a, b) => (a.dateKey < b.dateKey ? 1 : a.dateKey > b.dateKey ? -1 : 0));
}

export async function expenseList(opts: { fromKey: string; toKey: string; includeAuto: boolean; limit?: number }): Promise<ExpenseRow[]> {
  await ensureFinanceTables();
  await generateRecurringExpenses();
  const from = dayToDate(opts.fromKey);
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(dayToDate(opts.toKey).getTime());
  to.setUTCHours(24, 0, 0, 0);
  const manual = await prisma.finExpense.findMany({ where: { date: { gte: from, lt: to } }, orderBy: { date: "desc" }, take: opts.limit ?? 2000 });
  const rows: ExpenseRow[] = manual.map(expenseRow);
  if (opts.includeAuto) {
    const totals = await monthlyTotals(opts.fromKey.slice(0, 7), opts.toKey.slice(0, 7));
    const manualByMonthCat = new Map<string, number>();
    for (const r of await prisma.$queryRaw<Array<{ m: string; cat: string; c: bigint }>>`
      SELECT to_char(date_trunc('month', "date"), 'YYYY-MM') AS m, "category" AS cat, COALESCE(SUM("amountUsdCents"), 0)::bigint AS c
      FROM "FinExpense" WHERE "date" >= ${monthStartUtc(opts.fromKey.slice(0, 7))} AND "date" < ${monthStartUtc(addMonthKey(opts.toKey.slice(0, 7), 1))} GROUP BY 1, 2`) {
      manualByMonthCat.set(`${r.m}|${r.cat}`, num(r.c));
    }
    const s = await getFinanceSettings();
    for (const t of totals) {
      const endKey = t.month === monthKey(new Date()) ? keyOf(new Date())! : addDays(`${addMonthKey(t.month, 1)}-01`, -1);
      for (const [cat, label, on] of [
        ["ai_apis", "AI API usage (from AiUsage)", s.autoAiCosts],
        ["fees", `Stripe fees (estimate: ${s.stripePercent}% + ${s.stripeFixedCents}c per payment)`, s.autoStripeFees],
      ] as const) {
        if (!on) continue;
        const auto = (t.expensesByCategory[cat] ?? 0) - (manualByMonthCat.get(`${t.month}|${cat}`) ?? 0);
        if (auto <= 0) continue;
        rows.push({
          id: `auto:${cat}:${t.month}`,
          kind: "auto",
          source: cat === "ai_apis" ? "auto_ai" : "auto_stripe",
          dateKey: endKey,
          vendor: cat === "ai_apis" ? "AI providers" : "Stripe",
          category: cat,
          description: `${label}, ${t.month}`,
          projectId: null,
          amountCents: auto,
          currency: "USD",
          fxRate: 1,
          amountUsdCents: auto,
          taxCents: 0,
          taxUsdCents: 0,
          taxLabel: null,
          paymentMethod: null,
          receiptId: null,
          receiptUrl: null,
          recurringId: null,
          notes: null,
          estimate: true,
        });
      }
    }
  }
  return rows.sort((a, b) => (a.dateKey < b.dateKey ? 1 : a.dateKey > b.dateKey ? -1 : 0));
}

// ── Per project ──────────────────────────────────────────────────────────────

export interface ProjectFinance {
  income: IncomeRow[];
  expenses: ExpenseRow[];
  paidIncomeCents: number;
  outstandingCents: number;
  expenseCents: number;
  laborMinutes: number;
  hourlyRateCents: number | null;
  laborCents: number;
  profitCents: number;
}

export async function projectFinance(projectId: string, hourlyRateCents: number | null, laborMinutes: number): Promise<ProjectFinance> {
  await ensureFinanceTables();
  const today = keyOf(new Date())!;
  const [inc, exp] = await Promise.all([
    prisma.finIncome.findMany({ where: { projectId }, orderBy: { date: "desc" }, take: 500 }),
    prisma.finExpense.findMany({ where: { projectId }, orderBy: { date: "desc" }, take: 500 }),
  ]);
  const income = inc.map((r) => incomeRow(r, today));
  const expenses = exp.map(expenseRow);
  const paid = income.filter((r) => r.status === "paid").reduce((n, r) => n + r.amountUsdCents, 0);
  const outstanding = income.filter((r) => r.status !== "paid").reduce((n, r) => n + r.amountUsdCents, 0);
  const expenseCents = expenses.reduce((n, r) => n + r.amountUsdCents, 0);
  const laborCents = hourlyRateCents ? Math.round((laborMinutes / 60) * hourlyRateCents) : 0;
  return {
    income,
    expenses,
    paidIncomeCents: paid,
    outstandingCents: outstanding,
    expenseCents,
    laborMinutes,
    hourlyRateCents,
    laborCents,
    profitCents: paid - expenseCents - laborCents,
  };
}

export async function projectLedgerTotals(ids: string[]): Promise<Map<string, { inc: number; exp: number }>> {
  await ensureFinanceTables();
  if (!ids.length) return new Map();
  const [inc, exp] = await Promise.all([
    prisma.finIncome.groupBy({ by: ["projectId"], where: { projectId: { in: ids }, status: "paid" }, _sum: { amountUsdCents: true } }),
    prisma.finExpense.groupBy({ by: ["projectId"], where: { projectId: { in: ids } }, _sum: { amountUsdCents: true } }),
  ]);
  const out = new Map<string, { inc: number; exp: number }>();
  for (const id of ids) {
    out.set(id, {
      inc: inc.find((r) => r.projectId === id)?._sum.amountUsdCents ?? 0,
      exp: exp.find((r) => r.projectId === id)?._sum.amountUsdCents ?? 0,
    });
  }
  return out;
}

// ── Reports: P&L and taxes ───────────────────────────────────────────────────

export async function profitAndLoss(year: number) {
  const totals = await monthlyTotals(`${year}-01`, `${year}-12`);
  const nowKey = monthKey(new Date());
  const months = totals.filter((t) => t.month <= nowKey);
  const sources = ["manual", ...PLATFORM_SOURCES.map((p) => p.value)].filter((k) => months.some((m) => m.incomeBySource[k]));
  const cats = EXPENSE_CATEGORIES.map((c) => c.value).filter((k) => months.some((m) => m.expensesByCategory[k]));
  return { year, months, sources, categories: cats };
}

export async function taxSummary(year: number) {
  await ensureFinanceTables();
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));
  const [inc, exp] = await Promise.all([
    prisma.$queryRaw<Array<{ q: number; label: string | null; tax: bigint; base: bigint }>>`
      SELECT EXTRACT(QUARTER FROM COALESCE("paidAt", "date"))::int AS q, "taxLabel" AS label,
        COALESCE(SUM("taxUsdCents"), 0)::bigint AS tax, COALESCE(SUM("amountUsdCents"), 0)::bigint AS base
      FROM "FinIncome" WHERE "status" = 'paid' AND COALESCE("paidAt", "date") >= ${from} AND COALESCE("paidAt", "date") < ${to} AND "taxCents" > 0
      GROUP BY 1, 2`,
    prisma.$queryRaw<Array<{ q: number; label: string | null; tax: bigint; base: bigint }>>`
      SELECT EXTRACT(QUARTER FROM "date")::int AS q, "taxLabel" AS label,
        COALESCE(SUM("taxUsdCents"), 0)::bigint AS tax, COALESCE(SUM("amountUsdCents"), 0)::bigint AS base
      FROM "FinExpense" WHERE "date" >= ${from} AND "date" < ${to} AND "taxCents" > 0
      GROUP BY 1, 2`,
  ]);
  const quarters = [1, 2, 3, 4].map((q) => {
    const collected = inc.filter((r) => r.q === q).map((r) => ({ label: r.label || "Tax", tax: num(r.tax), base: num(r.base) }));
    const paid = exp.filter((r) => r.q === q).map((r) => ({ label: r.label || "Tax", tax: num(r.tax), base: num(r.base) }));
    const c = collected.reduce((n, r) => n + r.tax, 0);
    const p = paid.reduce((n, r) => n + r.tax, 0);
    return { quarter: q, collected, paid, collectedCents: c, paidCents: p, netCents: c - p };
  });
  return { year, quarters };
}

// ── CSV ──────────────────────────────────────────────────────────────────────

/** RFC 4180 quoting, and a leading quote on cells a spreadsheet would run as a formula. */
export function csvCell(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const csv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
const dollars = (c: number) => (c / 100).toFixed(2);

export async function incomeCsv(fromKey: string, toKey: string, today: string): Promise<string> {
  const rows = await incomeList({ fromKey, toKey, today, includePlatform: true, limit: 20000 });
  const projects = await projectNames(rows.map((r) => r.projectId));
  return csv([
    ["Date", "Source", "Client", "Description", "Project", "Status", "Invoice", "Due", "Paid", "Currency", "Amount", "FX rate (USD per unit)", "Amount USD", "Tax label", "Tax", "Tax USD", "Estimate", "Entry id"],
    ...rows.map((r) => [
      r.dateKey, r.sourceLabel, r.client, r.description ?? "", r.projectId ? projects.get(r.projectId) ?? "" : "", r.status, r.invoiceNumber ?? "",
      r.dueKey ?? "", r.paidKey ?? "", r.currency, dollars(r.amountCents), r.fxRate, dollars(r.amountUsdCents), r.taxLabel ?? "",
      dollars(r.taxCents), dollars(r.taxUsdCents), r.estimate ? "yes" : "no", r.id,
    ]),
  ]);
}

export async function expenseCsv(fromKey: string, toKey: string): Promise<string> {
  const rows = await expenseList({ fromKey, toKey, includeAuto: true, limit: 20000 });
  const projects = await projectNames(rows.map((r) => r.projectId));
  return csv([
    ["Date", "Vendor", "Category", "Description", "Project", "Type", "Payment method", "Currency", "Amount", "FX rate (USD per unit)", "Amount USD", "Tax label", "Tax", "Tax USD", "Receipt", "Estimate", "Entry id"],
    ...rows.map((r) => [
      r.dateKey, r.vendor, categoryLabel(r.category), r.description ?? "", r.projectId ? projects.get(r.projectId) ?? "" : "", r.kind, r.paymentMethod ?? "",
      r.currency, dollars(r.amountCents), r.fxRate, dollars(r.amountUsdCents), r.taxLabel ?? "", dollars(r.taxCents), dollars(r.taxUsdCents),
      r.receiptId ? "uploaded" : r.receiptUrl ?? "", r.estimate ? "yes" : "no", r.id,
    ]),
  ]);
}

export async function pnlCsv(year: number): Promise<string> {
  const p = await profitAndLoss(year);
  const head = ["Line", ...p.months.map((m) => m.month), "Total"];
  const line = (label: string, get: (m: MonthTotals) => number) => {
    const vals = p.months.map(get);
    return [label, ...vals.map(dollars), dollars(vals.reduce((a, b) => a + b, 0))];
  };
  return csv([
    [`Profit and loss ${year} (USD, cash basis; subscription income and automatic expenses are estimates)`],
    head,
    ["Income"],
    ...p.sources.map((s) => line(`  ${sourceLabel(s)}`, (m) => m.incomeBySource[s] ?? 0)),
    line("Total income", (m) => m.income),
    ["Expenses"],
    ...p.categories.map((c) => line(`  ${categoryLabel(c)}`, (m) => m.expensesByCategory[c] ?? 0)),
    line("Total expenses", (m) => m.expenses),
    line("Net profit", (m) => m.net),
  ]);
}

async function projectNames(ids: Array<string | null>): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  if (!unique.length) return new Map();
  const rows = await prisma.project.findMany({ where: { id: { in: unique } }, select: { id: true, name: true } });
  return new Map(rows.map((r) => [r.id, r.name]));
}

export function convert(amountCents: number, currency: Currency | string, fxRate: number) {
  const rate = currency === "USD" ? 1 : fxRate;
  const usd = Math.round(amountCents * rate);
  return { fxRate: rate, usd };
}

export type { PlatformSource };
