import prisma from "@/lib/prisma";
import type { AiTask } from "@/lib/claude";

// Platform-wide Claude spending caps (security checklist, door 20).
//
// Every model call goes through lib/claude.ts, which logs its estimated cost
// in the AiUsage table (lib/ai-usage.ts). Before each call, this module
// compares today's and this month's spend with two budgets:
//
//   AI_DAILY_BUDGET_USD    default 25
//   AI_MONTHLY_BUDGET_USD  default 400
//
//   - Below 100% of both: everything runs.
//   - At 100% of either: non-essential work (sales chat, Advisor, practice
//     pad, sandbox, tips, growth content, translations, lead tasks, admin
//     drafting...) is refused with a friendly "temporarily unavailable".
//     Essential work keeps going: grading, the Tutor and Code Studio for
//     paying learners, and products a customer has already paid for.
//   - At 150% (AI_HARD_CAP_MULTIPLIER): everything stops until the day or
//     month rolls over, or the budget is raised.
//   - At 80% (AI_ALERT_AT, a fraction): one email a day to
//     ADMIN_NOTIFY_EMAIL.
//
// The spend is read at most once a minute per process. The figures are
// estimates from list prices (lib/ai-usage.ts); the hard limit that cannot be
// exceeded is the spend limit set in the Anthropic console (see
// docs/SECURITY-CHECKLIST.md, door 20).

/** Work that keeps running between 100% and the hard cap. */
const ESSENTIAL: ReadonlySet<AiTask> = new Set<AiTask>([
  "grade-code",
  "grade-prompt",
  "grade-work",
  "tutor",
  "tutor-summary",
  "code-assist",
  "review-draft",
  // Paid products: the customer has already paid for the result.
  "blueprint",
  "toolkit-write",
  "compliance-review",
  // Community safety checks stay on.
  "moderation",
]);

export function isEssentialTask(task: AiTask): boolean {
  return ESSENTIAL.has(task);
}

function envNumber(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function budgets() {
  return {
    dailyUsd: envNumber("AI_DAILY_BUDGET_USD", 25),
    monthlyUsd: envNumber("AI_MONTHLY_BUDGET_USD", 400),
    hardCap: envNumber("AI_HARD_CAP_MULTIPLIER", 1.5),
    alertAt: Math.min(envNumber("AI_ALERT_AT", 0.8), 1),
  };
}

export interface SpendState {
  dayUsd: number;
  monthUsd: number;
  /** Highest share of either budget used (1 = 100%). */
  ratio: number;
  at: number;
}

const CACHE_MS = 60_000;
let cached: SpendState | null = null;
let inFlight: Promise<SpendState> | null = null;

async function readSpend(): Promise<SpendState> {
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  let dayCents = 0;
  let monthCents = 0;
  try {
    const rows = await prisma.$queryRaw<Array<{ day: number | null; month: number | null }>>`
      SELECT
        COALESCE(SUM("costCents") FILTER (WHERE "createdAt" >= ${dayStart}), 0)::float8 AS day,
        COALESCE(SUM("costCents"), 0)::float8 AS month
      FROM "AiUsage" WHERE "createdAt" >= ${monthStart}`;
    dayCents = Number(rows[0]?.day ?? 0);
    monthCents = Number(rows[0]?.month ?? 0);
  } catch {
    // No AiUsage table yet (nothing spent) or the database is unreachable:
    // the model call itself will fail in the second case anyway.
  }
  const b = budgets();
  const dayUsd = dayCents / 100;
  const monthUsd = monthCents / 100;
  return { dayUsd, monthUsd, ratio: Math.max(dayUsd / b.dailyUsd, monthUsd / b.monthlyUsd), at: Date.now() };
}

/** Today's and this month's estimated spend, cached for a minute. */
export async function currentSpend(): Promise<SpendState> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached;
  inFlight ??= readSpend()
    .then((s) => (cached = s))
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Forget the cached spend (tests, or right after the budget env changes). */
export function resetSpendCache(): void {
  cached = null;
}

export class AiBudgetExceeded extends Error {
  readonly code = "ai_budget";
  constructor(readonly task: AiTask) {
    super("This AI feature is temporarily unavailable. Please try again later.");
  }
}

export type BudgetDecision = { ok: true } | { ok: false; reason: "budget" | "hard_cap" };

/** Pure decision from a spend ratio (exported for tests). */
export function decide(task: AiTask, ratio: number, hardCap = budgets().hardCap): BudgetDecision {
  if (ratio >= hardCap) return { ok: false, reason: "hard_cap" };
  if (ratio >= 1 && !isEssentialTask(task)) return { ok: false, reason: "budget" };
  return { ok: true };
}

/**
 * Throws AiBudgetExceeded when `task` may not run now. Called by lib/claude.ts
 * before every model call; routes may call it first to answer with a friendly
 * 503 instead of a generic error.
 */
export async function assertAiBudget(task: AiTask): Promise<void> {
  const s = await currentSpend();
  if (s.ratio >= budgets().alertAt) void maybeAlert(s);
  const d = decide(task, s.ratio);
  if (!d.ok) {
    console.warn(`[ai-budget] refused ${task}: ${d.reason} (day $${s.dayUsd.toFixed(2)}, month $${s.monthUsd.toFixed(2)})`);
    throw new AiBudgetExceeded(task);
  }
}

/** The same check for the synchronous stream helper: uses the cached figure only. */
export function assertAiBudgetCached(task: AiTask): void {
  if (!cached) {
    void currentSpend().catch(() => {});
    return;
  }
  if (Date.now() - cached.at >= CACHE_MS) void currentSpend().catch(() => {});
  const d = decide(task, cached.ratio);
  if (!d.ok) throw new AiBudgetExceeded(task);
}

export function isAiBudgetError(err: unknown): err is AiBudgetExceeded {
  return err instanceof AiBudgetExceeded || (err as { code?: string } | null)?.code === "ai_budget";
}

// ── Alert ──────────────────────────────────────────────────────────────────
// One email a day, across every instance: the day's AdminSettings row is
// created once (unique key), and only the instance whose insert succeeds
// sends.

let alertedDay: string | null = null;

async function maybeAlert(s: SpendState): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  if (alertedDay === day) return;
  alertedDay = day;
  try {
    await prisma.adminSettings.create({ data: { key: `ai_budget_alert:${day}`, value: new Date().toISOString() } });
  } catch {
    return; // already sent today (another instance or an earlier process)
  }
  try {
    const b = budgets();
    const { default: mail } = await import("@/lib/resend");
    const to = process.env.ADMIN_NOTIFY_EMAIL?.trim() || "info@tiblogics.com";
    const pct = Math.round(s.ratio * 100);
    const state =
      s.ratio >= b.hardCap
        ? "All AI features are paused (hard cap reached)."
        : s.ratio >= 1
          ? "Non-essential AI features are paused. Grading, the Tutor and paid products keep running."
          : "Nothing is paused yet.";
    await mail.emails.send({
      to,
      subject: `AI spend at ${pct}% of budget`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px">
        <h2 style="color:#0D1B2A">Claude spend alert</h2>
        <p>Estimated spend today: <strong>$${s.dayUsd.toFixed(2)}</strong> of $${b.dailyUsd} (AI_DAILY_BUDGET_USD).</p>
        <p>Estimated spend this month: <strong>$${s.monthUsd.toFixed(2)}</strong> of $${b.monthlyUsd} (AI_MONTHLY_BUDGET_USD).</p>
        <p>${state}</p>
        <p>Details by feature: /admin_pro/ai-usage. To raise a budget, change the secret in Replit and republish.</p>
        <p style="color:#7A8FA6;font-size:12px">You get at most one of these a day.</p>
      </div>`,
    });
  } catch (err) {
    console.error("[ai-budget] alert email failed", err instanceof Error ? err.message : err);
  }
}

/**
 * For routes: null when `task` may run, otherwise a 503 with a friendly
 * message (code "ai_budget") to return as is.
 */
export async function aiBudgetBlock(task: AiTask, message?: string): Promise<Response | null> {
  try {
    await assertAiBudget(task);
    return null;
  } catch (err) {
    if (!isAiBudgetError(err)) throw err;
    return Response.json(
      { error: message ?? "This AI feature is temporarily unavailable. Please try again later.", code: "ai_budget" },
      { status: 503 },
    );
  }
}
