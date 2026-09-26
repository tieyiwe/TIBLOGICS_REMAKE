// Single source of truth for point awards (Part B rule 2).
// The ledger is append-only and awards are idempotent via the
// unique(studentId, source, refId) constraint — never store a mutable total.
import prisma from "@/lib/prisma";
import type { PointSource } from "./types";

export const POINT_VALUES: Record<PointSource, number> = {
  lesson_complete: 10,
  micro_check_pass: 5,
  quiz_pass: 50,
  quiz_perfect: 75,          // replaces quiz_pass on a first-attempt perfect score
  final_exam_pass: 200,
  final_exam_distinction: 300, // replaces final_exam_pass
  capstone_pass: 300,
  track_complete: 500,
  streak_bonus: 25,
  // Labs carry a per-lab value, passed to awardPoints as an override.
  lab_pass: 40,
};

export const LEVELS = [
  "Explorer",
  "Practitioner",
  "Implementer",
  "Architect",
  "TIBLOGICS Master",
] as const;

export const POINTS_PER_LEVEL = 500;

export function levelFor(total: number) {
  const idx = Math.min(LEVELS.length - 1, Math.floor(total / POINTS_PER_LEVEL));
  const name = LEVELS[idx];
  const isMax = idx === LEVELS.length - 1;
  const floor = idx * POINTS_PER_LEVEL;
  const next = isMax ? null : (idx + 1) * POINTS_PER_LEVEL;
  const progress = isMax ? 1 : (total - floor) / POINTS_PER_LEVEL;
  return { index: idx, name, floor, next, progress, pointsToNext: next == null ? 0 : next - total };
}

/**
 * Award points once. Safe to call repeatedly — a duplicate
 * (studentId, source, refId) is silently ignored.
 * Returns the points actually awarded (0 if already granted).
 */
export async function awardPoints(
  studentId: string,
  source: PointSource,
  refId: string | null,
  overrideAmount?: number,
): Promise<number> {
  const points = overrideAmount ?? POINT_VALUES[source];
  try {
    await prisma.pointsLedger.create({
      data: { studentId, source, refId, points },
    });
    return points;
  } catch {
    // Unique violation → already awarded. Idempotent by design.
    return 0;
  }
}

export async function getTotalPoints(studentId: string): Promise<number> {
  const agg = await prisma.pointsLedger
    .aggregate({ where: { studentId }, _sum: { points: true } })
    .catch(() => null);
  return agg?._sum.points ?? 0;
}

/**
 * Consecutive days (ending today or yesterday) with at least one completed
 * lesson. Awards a +25 bonus once per completed 7-day run.
 */
export async function computeStreak(studentId: string): Promise<number> {
  const rows = await prisma.lessonProgress
    .findMany({
      where: { studentId },
      select: { completedAt: true },
      orderBy: { completedAt: "desc" },
      take: 400,
    })
    .catch(() => []);
  if (rows.length === 0) return 0;

  const dayKey = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  const days = new Set(rows.map((r) => dayKey(r.completedAt)));
  const DAY = 86_400_000;

  const today = dayKey(new Date());
  // Streak may end today or yesterday and still be "live"
  let cursor = days.has(today) ? today : days.has(today - DAY) ? today - DAY : null;
  if (cursor == null) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor -= DAY;
  }

  // Award one bonus per completed 7-day run
  const runs = Math.floor(streak / 7);
  for (let i = 1; i <= runs; i++) {
    await awardPoints(studentId, "streak_bonus", `${studentId}:run:${i}`);
  }
  return streak;
}
