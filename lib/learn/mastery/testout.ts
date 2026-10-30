// Test out: a learner whose diagnostic rates a module Mastered may take the
// module quiz straight away. Passing it records the module's unfinished
// lessons as "mastered" (LessonMastery, not LessonProgress) and the module
// then counts as complete for its lab and, through the passed quiz, for the
// final exam. Certificate rules do not change (lib/learn/assessments.ts).
//
// Must not import lib/learn/progress.ts (progress imports this file).
import prisma from "@/lib/prisma";
import { awardPoints } from "@/lib/learn/points";
import { ensureMasteryTables } from "./db";

/** The diagnostic rates this module Mastered for this learner. */
export async function rateMastered(studentId: string, moduleId: string): Promise<boolean> {
  try {
    await ensureMasteryTables();
    const e = await prisma.masteryEstimate.findUnique({
      where: { studentId_moduleId: { studentId, moduleId } },
      select: { level: true },
    });
    return e?.level === "mastered";
  } catch (err) {
    console.error("[mastery] estimate", err);
    return false;
  }
}

/** The learner has tested out of this module. */
export async function moduleTestedOut(studentId: string, moduleId: string): Promise<boolean> {
  try {
    await ensureMasteryTables();
    return (await prisma.lessonMastery.count({ where: { studentId, moduleId } })) > 0;
  } catch (err) {
    console.error("[mastery] tested out", err);
    return false;
  }
}

/** Test out is open: rated Mastered and the module's lessons not all done. */
export async function testOutOpen(studentId: string, moduleId: string | null | undefined): Promise<boolean> {
  if (!moduleId) return false;
  return rateMastered(studentId, moduleId);
}

/** Lesson ids recorded as mastered (tested out), for one track or all. */
export async function masteredLessonIds(studentId: string, trackId?: string): Promise<Set<string>> {
  try {
    await ensureMasteryTables();
    const rows = await prisma.lessonMastery.findMany({
      where: { studentId, ...(trackId ? { trackId } : {}) },
      select: { lessonId: true },
    });
    return new Set(rows.map((r) => r.lessonId));
  } catch (err) {
    console.error("[mastery] mastered lessons", err);
    return new Set();
  }
}

export async function lessonMastered(studentId: string, lessonId: string): Promise<boolean> {
  try {
    await ensureMasteryTables();
    return !!(await prisma.lessonMastery.findUnique({
      where: { studentId_lessonId: { studentId, lessonId } },
      select: { lessonId: true },
    }));
  } catch {
    return false;
  }
}

/**
 * Called after a PASSED module quiz. When the learner is rated Mastered and
 * still has unfinished lessons in the module, those lessons are recorded as
 * mastered and a single "tested out" award is made (no per-lesson XP).
 * Idempotent; never throws.
 */
export async function applyTestOut(
  studentId: string,
  moduleId: string,
): Promise<{ testedOut: boolean; testOutPoints: number }> {
  const none = { testedOut: false, testOutPoints: 0 };
  try {
    if (!(await rateMastered(studentId, moduleId))) return none;
    const [mod, done] = await Promise.all([
      prisma.learnModule.findUnique({
        where: { id: moduleId },
        select: { trackId: true, lessons: { select: { id: true } } },
      }),
      prisma.lessonProgress.findMany({ where: { studentId, lesson: { moduleId } }, select: { lessonId: true } }),
    ]);
    if (!mod) return none;
    const doneSet = new Set(done.map((d) => d.lessonId));
    const open = mod.lessons.filter((l) => !doneSet.has(l.id));
    if (open.length === 0) return none; // studied it all: nothing to test out of
    await prisma.lessonMastery.createMany({
      data: open.map((l) => ({ studentId, lessonId: l.id, moduleId, trackId: mod.trackId, source: "test_out" })),
      skipDuplicates: true,
    });
    const testOutPoints = await awardPoints(studentId, "module_tested_out", moduleId);
    return { testedOut: true, testOutPoints };
  } catch (err) {
    console.error("[mastery] test out", err);
    return none;
  }
}
