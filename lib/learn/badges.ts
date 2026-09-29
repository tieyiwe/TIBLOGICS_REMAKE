// Badges, computed from what the learner has already done. No badge table:
// everything is derived from LessonProgress, attempts, the points ledger and
// certificates, so a badge can never drift out of step with the record, and
// awarding stays as idempotent as the ledger itself.
//
// Two batched rounds of queries whatever the learner's history, never one per
// track or module.
import prisma from "@/lib/prisma";
import { BADGES, moduleStars, type GameDelta } from "./badge-defs";
import { getTotalPoints, levelFor } from "./points";

export interface BadgeStatus {
  id: string;
  earned: boolean;
  /** Progress toward the badge's target, capped at the target. */
  current: number;
  target: number;
}

const DAY = 86_400_000;
const dayKey = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

/** Longest run of consecutive days with a completed lesson, ever. */
function longestStreak(dates: Date[]): number {
  const days = [...new Set(dates.map(dayKey))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of days) {
    // A DST change makes a "day" 23 or 25 hours; round to whole days.
    run = prev != null && Math.round((d - prev) / DAY) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export async function computeBadges(studentId: string): Promise<BadgeStatus[]> {
  const [lessons, quizPasses, labPasses, ledger, certs] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { studentId },
      select: { lessonId: true, completedAt: true, lesson: { select: { moduleId: true, module: { select: { trackId: true } } } } },
    }),
    prisma.quizAttempt.findMany({
      where: { studentId, passed: true },
      select: { quizId: true, quiz: { select: { moduleId: true } } },
      distinct: ["quizId"],
    }),
    prisma.labAttempt.findMany({
      where: { studentId, passed: true },
      select: {
        labId: true,
        submission: true,
        lab: { select: { labType: true, moduleId: true, lesson: { select: { moduleId: true } } } },
      },
    }),
    prisma.pointsLedger.findMany({
      where: { studentId, source: { in: ["quiz_perfect", "final_exam_distinction"] } },
      select: { source: true },
    }),
    prisma.learnCertificate.findMany({
      where: { studentId, revoked: false },
      select: { trackId: true, distinction: true },
    }),
  ]);

  const trackIds = [...new Set(lessons.map((l) => l.lesson.module.trackId))];

  // Round two: the shape of the tracks this learner has touched.
  const [modules, labs] = trackIds.length
    ? await Promise.all([
        prisma.learnModule.findMany({
          where: { trackId: { in: trackIds } },
          select: { id: true, trackId: true, _count: { select: { lessons: true } }, quiz: { select: { id: true } } },
        }),
        prisma.lab.findMany({
          where: { trackId: { in: trackIds }, isPublished: true },
          select: { id: true, moduleId: true, lesson: { select: { moduleId: true } } },
        }),
      ])
    : [[], []];

  // ── Derived facts ────────────────────────────────────────────────────────
  const doneByModule = new Map<string, number>();
  const doneByTrack = new Map<string, number>();
  for (const l of lessons) {
    doneByModule.set(l.lesson.moduleId, (doneByModule.get(l.lesson.moduleId) ?? 0) + 1);
    doneByTrack.set(l.lesson.module.trackId, (doneByTrack.get(l.lesson.module.trackId) ?? 0) + 1);
  }
  const totalByTrack = new Map<string, number>();
  for (const m of modules) totalByTrack.set(m.trackId, (totalByTrack.get(m.trackId) ?? 0) + m._count.lessons);

  const passedQuizModules = new Set(quizPasses.map((q) => q.quiz.moduleId));
  const labModuleOf = (l: { moduleId: string | null; lesson: { moduleId: string } | null }) => l.moduleId ?? l.lesson?.moduleId ?? null;
  const modulesWithLab = new Set(labs.map(labModuleOf).filter(Boolean) as string[]);
  const passedLabModules = new Set(labPasses.map((a) => labModuleOf(a.lab)).filter(Boolean) as string[]);

  let bestModuleStars = 0;
  for (const m of modules) {
    const s = moduleStars({
      lessonsTotal: m._count.lessons,
      lessonsDone: doneByModule.get(m.id) ?? 0,
      hasQuiz: !!m.quiz,
      quizPassed: passedQuizModules.has(m.id),
      hasLab: modulesWithLab.has(m.id),
      labPassed: passedLabModules.has(m.id),
    });
    bestModuleStars = Math.max(bestModuleStars, s.count);
  }

  let bestTrackPercent = 0;
  const completedTracks = new Set(certs.map((c) => c.trackId));
  for (const id of trackIds) {
    const total = totalByTrack.get(id) ?? 0;
    const pct = total ? Math.round(((doneByTrack.get(id) ?? 0) / total) * 100) : 0;
    bestTrackPercent = Math.max(bestTrackPercent, pct);
    if (total > 0 && pct >= 100) completedTracks.add(id);
  }

  const labTypes = new Set(labPasses.map((a) => a.lab.labType));
  const shippedCode = labPasses.some((a) => {
    if (a.lab.labType !== "code") return false;
    const checks = (a.submission as { checkResults?: Array<{ pass?: boolean }> } | null)?.checkResults;
    return Array.isArray(checks) && checks.length > 0 && checks.every((c) => c.pass === true);
  });
  const sources = new Set(ledger.map((l) => l.source));
  const streak = longestStreak(lessons.map((l) => l.completedAt));

  const current: Record<string, number> = {
    first_steps: lessons.length,
    streak_3: streak,
    streak_7: streak,
    streak_30: streak,
    perfect_score: sources.has("quiz_perfect") ? 1 : 0,
    quiz_master: quizPasses.length,
    prompt_crafter: labTypes.has("prompt") ? 1 : 0,
    bug_hunter: labTypes.has("critique") ? 1 : 0,
    code_shipper: shippedCode ? 1 : 0,
    systems_thinker: labTypes.has("workbench") ? 1 : 0,
    module_champion: bestModuleStars,
    halfway: bestTrackPercent,
    track_finisher: certs.length,
    distinction: sources.has("final_exam_distinction") || certs.some((c) => c.distinction) ? 1 : 0,
    track_explorer: trackIds.length,
    polymath: completedTracks.size,
  };

  return BADGES.map((b) => {
    const n = current[b.id] ?? 0;
    return { id: b.id, earned: n >= b.target, current: Math.min(n, b.target), target: b.target };
  });
}

// ── Before/after diff for the award APIs ──────────────────────────────────

export interface GameSnapshot {
  total: number;
  earned: Set<string>;
}

/** Never throws: gamification must not break the flow it decorates. */
export async function gameSnapshot(studentId: string): Promise<GameSnapshot | null> {
  try {
    const [total, badges] = await Promise.all([getTotalPoints(studentId), computeBadges(studentId)]);
    return { total, earned: new Set(badges.filter((b) => b.earned).map((b) => b.id)) };
  } catch (err) {
    console.error("[badges] snapshot failed", err);
    return null;
  }
}

export function gameDelta(before: GameSnapshot | null, after: GameSnapshot | null): GameDelta {
  if (!before || !after) return { newBadges: [], levelUp: null };
  const from = levelFor(before.total);
  const to = levelFor(after.total);
  return {
    newBadges: [...after.earned].filter((id) => !before.earned.has(id)),
    levelUp: to.index > from.index ? { index: to.index } : null,
  };
}
