import prisma from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { moduleTestedOut, rateMastered } from "@/lib/learn/mastery/testout";

// On a module quiz page: explains test out when the learner is taking the
// quiz from a Mastered diagnostic, or confirms it once done.
export default async function TestOutNotice({ studentId, moduleId }: { studentId: string; moduleId: string }) {
  const [t, mastered, testedOut, total, done] = await Promise.all([
    getT(),
    rateMastered(studentId, moduleId),
    moduleTestedOut(studentId, moduleId),
    prisma.lesson.count({ where: { moduleId } }),
    prisma.lessonProgress.count({ where: { studentId, lesson: { moduleId } } }),
  ]);
  if (testedOut) {
    return (
      <p role="status" className="mb-4 rounded-xl border border-green-600 bg-green-50 p-4 text-sm font-semibold text-green-900">
        <span aria-hidden="true">★ </span>
        {t("mastery.testOut.doneBody")}
      </p>
    );
  }
  if (!mastered || done >= total) return null;
  return (
    <div className="mb-4 rounded-xl border-l-4 border-green-600 bg-green-50 p-4 text-sm">
      <p className="font-bold text-[var(--ink)]">
        <span aria-hidden="true">★ </span>
        {t("mastery.testOut.title")}
      </p>
      <p className="mt-1 leading-relaxed text-[var(--ink2)]">{t("mastery.testOut.body")}</p>
    </div>
  );
}
