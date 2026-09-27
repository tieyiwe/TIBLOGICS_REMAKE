// Progress + completion logic for the member area.
import prisma from "@/lib/prisma";
import { awardPoints } from "./points";
import { certificationStatus } from "./assessments";

/**
 * Idempotent lesson completion. Returns the next lesson id in the track
 * (or null at the end) so the player can deep-link "continue".
 */
export async function markLessonComplete(studentId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, moduleId: true, sortOrder: true, module: { select: { trackId: true, sortOrder: true } } },
  });
  if (!lesson) return { ok: false as const, error: "Lesson not found" };

  await prisma.lessonProgress
    .upsert({
      where: { studentId_lessonId: { studentId, lessonId } },
      create: { studentId, lessonId },
      update: {}, // keep the original completedAt
    })
    .catch(() => {});

  // Awarding points and looking up the next lesson share no data — the second
  // only needs `lesson`, which is already in hand.
  const [pointsAwarded, nextLessonId] = await Promise.all([
    awardPoints(studentId, "lesson_complete", lessonId),
    findNextLesson(lesson.module.trackId, lesson.module.sortOrder, lesson.sortOrder),
  ]);

  return { ok: true as const, pointsAwarded, nextLessonId };
}

async function findNextLesson(trackId: string, moduleOrder: number, lessonOrder: number) {
  // Next lesson in the same module
  const sameModule = await prisma.lesson.findFirst({
    where: { module: { trackId, sortOrder: moduleOrder }, sortOrder: { gt: lessonOrder } },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  if (sameModule) return sameModule.id;

  // First lesson of the next module
  const nextModule = await prisma.lesson.findFirst({
    where: { module: { trackId, sortOrder: { gt: moduleOrder } } },
    orderBy: [{ module: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: { id: true },
  });
  return nextModule?.id ?? null;
}

export interface TrackProgress {
  trackId: string;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  minutesRemaining: number;
  nextLessonId: string | null;
}

/** Progress + "hours remaining" for a single track. */
export async function getTrackProgress(studentId: string, trackId: string): Promise<TrackProgress> {
  // Scoping the progress rows through the lesson→module relation instead of an
  // `in:` list of lesson ids drops the dependency between the two queries, so
  // both go out at once. Identical row set either way — same track filter.
  // Matters here because getAllTrackProgress fans this out per track.
  const [lessons, done] = await Promise.all([
    prisma.lesson.findMany({
      where: { module: { trackId } },
      orderBy: [{ module: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      select: { id: true, durationMinutes: true },
    }),
    prisma.lessonProgress.findMany({
      where: { studentId, lesson: { module: { trackId } } },
      select: { lessonId: true },
    }),
  ]);
  const doneSet = new Set(done.map((d) => d.lessonId));
  const remaining = lessons.filter((l) => !doneSet.has(l.id));

  return {
    trackId,
    totalLessons: lessons.length,
    completedLessons: doneSet.size,
    percent: lessons.length === 0 ? 0 : Math.round((doneSet.size / lessons.length) * 100),
    minutesRemaining: remaining.reduce((n, l) => n + l.durationMinutes, 0),
    nextLessonId: remaining[0]?.id ?? null,
  };
}

/** Progress across every live track — powers the dashboard. */
export async function getAllTrackProgress(studentId: string) {
  const tracks = await prisma.learnTrack.findMany({
    where: { status: "live" },
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, title: true, accentColor: true, certificateName: true, estimatedHours: true },
  });
  return Promise.all(
    tracks.map(async (t) => ({ track: t, progress: await getTrackProgress(studentId, t.id) })),
  );
}

/** Per-track gate summary for the track home screen. */
export async function getTrackGates(studentId: string, trackId: string) {
  return certificationStatus(studentId, trackId);
}
