// Read models for the mastery UI: one track's modules with their estimate,
// test-out state, progress and weakness (track page "Your path", the mastery
// grid), and "Strengthen" suggestions for the dashboard.
import prisma from "@/lib/prisma";
import type { Locale } from "@/lib/i18n/config";
import { loadTrackSources, localizedTracks } from "@/lib/i18n/sources/learn";
import { ensureMasteryTables } from "./db";
import { trackEstimates } from "./diagnostic";
import { minutesSaved, stepFor, type GridState, type MasteryLevel, type PathStep } from "./rules";
import { safeModuleWeakness, type ModuleWeakness } from "./weakness";

export interface ModuleMastery {
  moduleId: string;
  estimate: { level: MasteryLevel; correct: number; asked: number; score: number } | null;
  testedOut: boolean;
  lessonsTotal: number;
  lessonsDone: number;
  lessonMinutes: number;
  quizPassed: boolean;
  quizTried: boolean;
  weakness: ModuleWeakness | null;
  grid: GridState;
  step: PathStep | null;
  saved: number;
}

export function gridStateOf(m: Omit<ModuleMastery, "grid" | "step" | "saved">): GridState {
  if (m.weakness?.weak) return "weak";
  if (m.testedOut || m.quizPassed || m.estimate?.level === "mastered") return "mastered";
  if (m.estimate?.level === "partial" || m.lessonsDone > 0 || m.quizTried) return "partial";
  return "new";
}

/** Every module of the tracks given, in order, grouped by track id. */
export async function masteryForTracks(
  studentId: string,
  trackIds: string[],
  weakness?: Map<string, ModuleWeakness>,
): Promise<Map<string, ModuleMastery[]>> {
  await ensureMasteryTables().catch((err) => console.error("[mastery] tables", err));
  const [modules, done, mastered, quizAttempts, weak, estimates] = await Promise.all([
    prisma.learnModule.findMany({
      where: { trackId: { in: trackIds } },
      orderBy: { sortOrder: "asc" },
      select: { id: true, trackId: true, quiz: { select: { id: true } }, lessons: { select: { id: true, durationMinutes: true } } },
    }),
    prisma.lessonProgress.findMany({ where: { studentId, lesson: { module: { trackId: { in: trackIds } } } }, select: { lessonId: true } }),
    prisma.lessonMastery.findMany({ where: { studentId, trackId: { in: trackIds } }, select: { moduleId: true } }).catch(() => []),
    prisma.quizAttempt.findMany({
      where: { studentId, quiz: { module: { trackId: { in: trackIds } } } },
      select: { quizId: true, passed: true },
    }),
    weakness ? Promise.resolve(weakness) : safeModuleWeakness(studentId, trackIds),
    Promise.all(trackIds.map((id) => trackEstimates(studentId, id))),
  ]);
  const est = new Map(estimates.flatMap((m) => [...m.entries()]));
  const doneSet = new Set(done.map((d) => d.lessonId));
  const testedOut = new Set(mastered.map((m) => m.moduleId));
  const passed = new Set(quizAttempts.filter((a) => a.passed).map((a) => a.quizId));
  const tried = new Set(quizAttempts.map((a) => a.quizId));

  const out = new Map<string, ModuleMastery[]>(trackIds.map((id) => [id, []]));
  for (const m of modules) {
    const e = est.get(m.id) ?? null;
    const base = {
      moduleId: m.id,
      estimate: e ? { level: e.level, correct: e.correct, asked: e.asked, score: e.score } : null,
      testedOut: testedOut.has(m.id),
      lessonsTotal: m.lessons.length,
      lessonsDone: m.lessons.filter((l) => doneSet.has(l.id)).length,
      lessonMinutes: m.lessons.reduce((n, l) => n + l.durationMinutes, 0),
      quizPassed: !!m.quiz && passed.has(m.quiz.id),
      quizTried: !!m.quiz && tried.has(m.quiz.id),
      weakness: weak.get(m.id) ?? null,
    };
    const step = e ? stepFor(e.level) : null;
    out.get(m.trackId)!.push({ ...base, grid: gridStateOf(base), step, saved: step ? minutesSaved(step, base.lessonMinutes) : 0 });
  }
  return out;
}

export async function trackMastery(studentId: string, trackId: string): Promise<ModuleMastery[]> {
  return (await masteryForTracks(studentId, [trackId])).get(trackId) ?? [];
}

export interface StrengthenSuggestion {
  moduleId: string;
  moduleTitle: string;
  trackTitle: string;
  trackSlug: string;
  missedIdeas: number;
  weakness: number;
  /** Daily Review has questions from this module the learner may see. */
  reviewable: boolean;
  /** Where to go when there is nothing to review yet. */
  lessonId: string | null;
}

/** The learner's weakest modules (at most `limit`), weakest first. */
export async function strengthenSuggestions(
  studentId: string,
  locale: Locale,
  trackIds: string[] | null,
  limit = 3,
  weakness?: Map<string, ModuleWeakness>,
): Promise<StrengthenSuggestion[]> {
  const weak = [...(weakness ?? (await safeModuleWeakness(studentId, trackIds))).values()]
    .filter((w) => w.weak && (!trackIds || trackIds.includes(w.trackId)))
    .sort((a, b) => b.weakness * Math.log2(b.signals + 1) - a.weakness * Math.log2(a.signals + 1))
    .slice(0, limit);
  if (weak.length === 0) return [];
  const ids = weak.map((w) => w.moduleId);
  const [mods, microReady, quizReady] = await Promise.all([
    prisma.learnModule.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, track: { select: { id: true, slug: true, title: true, status: true } }, lessons: { orderBy: { sortOrder: "asc" }, take: 1, select: { id: true } } },
    }),
    // Same eligibility as Daily Review (lib/learn/method/review.ts): micro-
    // checks of completed lessons and questions of passed quizzes.
    prisma.microCheck.findMany({
      where: { lesson: { moduleId: { in: ids }, progress: { some: { studentId } } } },
      select: { lesson: { select: { moduleId: true } } },
    }),
    prisma.quiz.findMany({ where: { moduleId: { in: ids }, attempts: { some: { studentId, passed: true } } }, select: { moduleId: true } }),
  ]);
  const reviewable = new Set([...microReady.map((m) => m.lesson.moduleId), ...quizReady.map((q) => q.moduleId)]);
  const live = mods.filter((m) => m.track.status === "live");
  const sources = await loadTrackSources({ id: { in: [...new Set(live.map((m) => m.track.id))] } });
  const { texts } = await localizedTracks(sources, locale);
  const byId = new Map(live.map((m) => [m.id, m]));
  return weak.flatMap((w) => {
    const m = byId.get(w.moduleId);
    if (!m) return [];
    const tt = texts.get(m.track.slug);
    return [
      {
        moduleId: m.id,
        moduleTitle: tt?.modules[m.id]?.title ?? m.title,
        trackTitle: tt?.title ?? m.track.title,
        trackSlug: m.track.slug,
        missedIdeas: w.missedIdeas,
        weakness: w.weakness,
        reviewable: reviewable.has(m.id),
        lessonId: m.lessons[0]?.id ?? null,
      },
    ];
  });
}
