import prisma from "@/lib/prisma";

// Progress of scholars on the tracks they unlocked with a scholarship:
// lessons done and in the track, certificate issued, best exam. One round of
// queries for any number of (learner, track) pairs.

export interface TrackProgress {
  done: number;
  total: number;
  certified: boolean;
  examBest: number | null;
  examPassed: boolean;
}

const key = (studentId: string, trackId: string) => `${studentId}:${trackId}`;

export async function progressFor(pairs: Array<{ studentId: string; trackId: string }>, since?: Date): Promise<{ get: (studentId: string, trackId: string) => TrackProgress; recent: (studentId: string) => number }> {
  const tracks = [...new Set(pairs.map((p) => p.trackId))];
  const students = [...new Set(pairs.map((p) => p.studentId))];
  if (!tracks.length) return { get: () => ({ done: 0, total: 0, certified: false, examBest: null, examPassed: false }), recent: () => 0 };
  const [totals, done, exams, certs, recent] = await Promise.all([
    prisma.$queryRaw<Array<{ trackId: string; n: bigint }>>`
      SELECT m."trackId", COUNT(l."id") AS n FROM "Lesson" l JOIN "LearnModule" m ON m."id" = l."moduleId"
      WHERE m."trackId" = ANY(${tracks}) GROUP BY m."trackId"`,
    prisma.$queryRaw<Array<{ studentId: string; trackId: string; n: bigint }>>`
      SELECT p."studentId", m."trackId", COUNT(*) AS n FROM "LessonProgress" p
      JOIN "Lesson" l ON l."id" = p."lessonId" JOIN "LearnModule" m ON m."id" = l."moduleId"
      WHERE p."studentId" = ANY(${students}) AND m."trackId" = ANY(${tracks}) GROUP BY p."studentId", m."trackId"`,
    prisma.finalExamSession.findMany({
      where: { studentId: { in: students }, finalExam: { trackId: { in: tracks } } },
      select: { studentId: true, score: true, passed: true, finalExam: { select: { trackId: true } } },
    }),
    prisma.learnCertificate.findMany({ where: { studentId: { in: students }, trackId: { in: tracks }, revoked: false }, select: { studentId: true, trackId: true } }),
    since
      ? prisma.$queryRaw<Array<{ studentId: string; n: bigint }>>`
          SELECT p."studentId", COUNT(*) AS n FROM "LessonProgress" p
          JOIN "Lesson" l ON l."id" = p."lessonId" JOIN "LearnModule" m ON m."id" = l."moduleId"
          WHERE p."studentId" = ANY(${students}) AND m."trackId" = ANY(${tracks}) AND p."completedAt" >= ${since}
          GROUP BY p."studentId"`
      : Promise.resolve([] as Array<{ studentId: string; n: bigint }>),
  ]);
  const total = new Map(totals.map((r) => [r.trackId, Number(r.n)]));
  const doneMap = new Map(done.map((r) => [key(r.studentId, r.trackId), Number(r.n)]));
  const certSet = new Set(certs.map((c) => key(c.studentId, c.trackId)));
  const examMap = new Map<string, { best: number | null; passed: boolean }>();
  for (const e of exams) {
    const k = key(e.studentId, e.finalExam.trackId);
    const cur = examMap.get(k) ?? { best: null, passed: false };
    if (e.score != null) cur.best = Math.max(cur.best ?? 0, e.score);
    if (e.passed) cur.passed = true;
    examMap.set(k, cur);
  }
  const recentMap = new Map(recent.map((r) => [r.studentId, Number(r.n)]));
  return {
    get: (s, t) => ({
      done: doneMap.get(key(s, t)) ?? 0,
      total: total.get(t) ?? 0,
      certified: certSet.has(key(s, t)),
      examBest: examMap.get(key(s, t))?.best ?? null,
      examPassed: examMap.get(key(s, t))?.passed ?? false,
    }),
    recent: (s) => recentMap.get(s) ?? 0,
  };
}
