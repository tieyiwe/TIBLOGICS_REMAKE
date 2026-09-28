import { checkRateLimit } from "@/lib/rate-limit";

// One daily ceiling on model calls per learner, shared by the practice pad,
// prompt-lab runs, the Code Studio pair programmer and lab grading. The
// per-route hourly limits smooth bursts; this caps what one account can cost
// in a day, whatever mix of features it uses. LEARN_AI_DAILY overrides it.
const DEFAULT_DAILY = 150;

export async function withinDailyAiBudget(studentId: string): Promise<boolean> {
  const n = Number(process.env.LEARN_AI_DAILY);
  const limit = Number.isInteger(n) && n > 0 ? n : DEFAULT_DAILY;
  return checkRateLimit(`learn-ai-day:${studentId}`, limit, 86_400_000);
}
