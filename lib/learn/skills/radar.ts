// Skills radar: a 0-100 score on six axes from the learner's real results.
// No AI. Read from existing records only:
//
//   module quizzes   best score per quiz            weight 1
//   labs             best graded score per lab      weight 2 (hands-on work)
//   micro-checks     best score per lesson check    weight 0.5
//
// Each result is spread over the axes of its module (lib/learn/skills/axes.ts).
// An axis score is the weighted average of its results, pulled toward 0 by a
// prior worth PRIOR results scored 0:
//
//   score = sum(w * s) / (sum(w) + PRIOR)
//
// so one lucky micro-check does not read as mastery: the score grows with the
// amount of evidence as well as its quality. A finished track (about 40
// micro-checks, 6 to 9 quizzes and 6 to 9 labs) lands close to its average.
import prisma from "@/lib/prisma";
import { SKILL_AXES, axisWeights, type SkillAxis, type SkillProfile } from "./axes";

const W_QUIZ = 1;
const W_LAB = 2;
const W_MICRO = 0.5;
const PRIOR = 4;

interface Result {
  trackSlug: string;
  moduleOrder: number | null;
  score: number;
  weight: number;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));

/** Pure: the profile from a list of results (exported for tests). */
export function scoreSkills(results: Result[]): SkillProfile {
  const sum: Record<SkillAxis, number> = { prompting: 0, data: 0, safety: 0, governance: 0, building: 0, business: 0 };
  const wsum: Record<SkillAxis, number> = { ...sum };
  const count: Record<SkillAxis, number> = { ...sum };
  for (const r of results) {
    for (const [axis, share] of axisWeights(r.trackSlug, r.moduleOrder)) {
      const w = r.weight * share;
      sum[axis] += w * clamp(r.score);
      wsum[axis] += w;
      count[axis] += 1;
    }
  }
  const axes = SKILL_AXES.map((axis) => ({
    axis,
    score: Math.round(sum[axis] / (wsum[axis] + PRIOR)),
    evidence: count[axis],
  }));
  if (results.length === 0) return { axes, results: 0, strongest: null, weakest: null };
  // Ties go to the first axis in SKILL_AXES order, so the result is stable.
  const strongest = axes.reduce((a, b) => (b.score > a.score ? b : a));
  const weakest = axes.reduce((a, b) => (b.score < a.score ? b : a));
  return {
    axes,
    results: results.length,
    strongest: strongest.score > 0 ? strongest.axis : null,
    weakest: weakest.axis !== strongest.axis ? weakest.axis : null,
  };
}

/** The learner's skills profile. Throws on a database error (callers degrade). */
export async function loadSkillProfile(studentId: string): Promise<SkillProfile> {
  const [quizBest, labBest, microBest] = await Promise.all([
    prisma.quizAttempt.groupBy({ by: ["quizId"], where: { studentId }, _max: { score: true } }),
    prisma.labAttempt.groupBy({
      by: ["labId"],
      where: { studentId, status: "submitted", score: { not: null } },
      _max: { score: true },
    }),
    prisma.microCheckAttempt.groupBy({ by: ["microCheckId"], where: { studentId }, _max: { score: true } }),
  ]);

  const [quizzes, labs, micros] = await Promise.all([
    quizBest.length
      ? prisma.quiz.findMany({
          where: { id: { in: quizBest.map((q) => q.quizId) } },
          select: { id: true, module: { select: { sortOrder: true, track: { select: { slug: true } } } } },
        })
      : Promise.resolve([]),
    labBest.length
      ? prisma.lab.findMany({
          where: { id: { in: labBest.map((l) => l.labId) } },
          select: { id: true, track: { select: { slug: true } }, module: { select: { sortOrder: true } } },
        })
      : Promise.resolve([]),
    microBest.length
      ? prisma.microCheck.findMany({
          where: { id: { in: microBest.map((m) => m.microCheckId) } },
          select: {
            id: true,
            lesson: { select: { module: { select: { sortOrder: true, track: { select: { slug: true } } } } } },
          },
        })
      : Promise.resolve([]),
  ]);

  const quizOf = new Map(quizzes.map((q) => [q.id, q]));
  const labOf = new Map(labs.map((l) => [l.id, l]));
  const microOf = new Map(micros.map((m) => [m.id, m]));
  const results: Result[] = [];
  for (const q of quizBest) {
    const meta = quizOf.get(q.quizId);
    if (meta) results.push({ trackSlug: meta.module.track.slug, moduleOrder: meta.module.sortOrder, score: q._max.score ?? 0, weight: W_QUIZ });
  }
  for (const l of labBest) {
    const meta = labOf.get(l.labId);
    if (meta) results.push({ trackSlug: meta.track.slug, moduleOrder: meta.module?.sortOrder ?? null, score: l._max.score ?? 0, weight: W_LAB });
  }
  for (const m of microBest) {
    const meta = microOf.get(m.microCheckId);
    if (meta) {
      results.push({
        trackSlug: meta.lesson.module.track.slug,
        moduleOrder: meta.lesson.module.sortOrder,
        score: m._max.score ?? 0,
        weight: W_MICRO,
      });
    }
  }
  return scoreSkills(results);
}
