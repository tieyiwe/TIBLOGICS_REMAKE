import { checkRateLimit, rateLimitStatus } from "@/lib/rate-limit";
import { getMembership } from "@/lib/learn/team/access";
import prisma from "@/lib/prisma";

// One daily ceiling on model calls per learner, shared by the practice pad,
// prompt-lab runs, the Code Studio pair programmer and lab grading. The
// per-route hourly limits smooth bursts; this caps what one account can cost
// in a day, whatever mix of features it uses. LEARN_AI_DAILY overrides it.
const DEFAULT_DAILY = 150;
const DAY_MS = 86_400_000;

export function dailyAiLimit(): number {
  const n = Number(process.env.LEARN_AI_DAILY);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_DAILY;
}

// Team plans: members of an active team share one pooled allowance, the sum
// of their per-learner limits (limit x active seats), so a heavy user can draw
// on what colleagues leave unused. The manager sees the pool's use (only the
// total, never who spent it on what).
const teamKey = (teamId: string) => `learn-ai-team:${teamId}`;

async function activeSeatCount(teamId: string): Promise<number> {
  return prisma.teamMember.count({ where: { teamId, status: "active" } }).catch(() => 1);
}

export async function withinDailyAiBudget(studentId: string): Promise<boolean> {
  const limit = dailyAiLimit();
  const m = await getMembership(studentId);
  if (m?.entitled) {
    const seats = Math.max(1, await activeSeatCount(m.team.id));
    return checkRateLimit(teamKey(m.team.id), limit * seats, DAY_MS);
  }
  return checkRateLimit(`learn-ai-day:${studentId}`, limit, DAY_MS);
}

/** The team's pooled allowance for today: used, limit and when it resets. */
export async function teamAiPool(teamId: string): Promise<{ used: number; limit: number; resetAt: Date | null }> {
  const [status, seats] = await Promise.all([rateLimitStatus(teamKey(teamId)), activeSeatCount(teamId)]);
  return { used: status?.count ?? 0, limit: dailyAiLimit() * Math.max(1, seats), resetAt: status?.resetAt ?? null };
}
