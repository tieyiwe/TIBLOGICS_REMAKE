// "New in this track": lessons added to a module after the learner had
// finished it. Nothing about the learner changes when a track grows: their
// completed lessons stay completed, certificates already issued stay issued,
// and the percentage simply counts the new lessons as not yet done. This only
// points the new lessons out.
import prisma from "@/lib/prisma";

export interface NewLesson {
  id: string;
  title: string;
  moduleId: string;
  trackId: string;
}

/** Lessons added within this window of each other count as one update. */
const BATCH_MS = 60 * 60 * 1000;

/**
 * Per module: the lessons the learner has not done must all have been added
 * after the module's other lessons, and the learner must have completed every
 * one of those other lessons before the first new one arrived.
 */
export async function newLessonsByTrack(studentId: string, trackIds: string[]): Promise<Map<string, NewLesson[]>> {
  const out = new Map<string, NewLesson[]>();
  if (trackIds.length === 0) return out;
  try {
    const [modules, progress] = await Promise.all([
      prisma.learnModule.findMany({
        where: { trackId: { in: trackIds } },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          trackId: true,
          lessons: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, createdAt: true } },
        },
      }),
      prisma.lessonProgress.findMany({
        where: { studentId, lesson: { module: { trackId: { in: trackIds } } } },
        select: { lessonId: true, completedAt: true },
      }),
    ]);
    const doneAt = new Map(progress.map((p) => [p.lessonId, p.completedAt.getTime()]));

    for (const m of modules) {
      const undone = m.lessons.filter((l) => !doneAt.has(l.id));
      if (undone.length === 0 || undone.some((l) => !l.createdAt)) continue;
      const firstNew = Math.min(...undone.map((l) => l.createdAt!.getTime()));
      const before = m.lessons.filter((l) => !l.createdAt || l.createdAt.getTime() < firstNew - BATCH_MS);
      if (before.length === 0) continue;
      const finishedBefore = before.every((l) => (doneAt.get(l.id) ?? Infinity) < firstNew);
      if (!finishedBefore) continue;
      const list = out.get(m.trackId) ?? [];
      list.push(...undone.map((l) => ({ id: l.id, title: l.title, moduleId: m.id, trackId: m.trackId })));
      out.set(m.trackId, list);
    }
  } catch (err) {
    // A bonus, never a reason for the page to fail (e.g. before the column exists).
    console.error("[learn/track-updates]", err);
  }
  return out;
}

export async function newLessonsInTrack(studentId: string, trackId: string): Promise<NewLesson[]> {
  return (await newLessonsByTrack(studentId, [trackId])).get(trackId) ?? [];
}
