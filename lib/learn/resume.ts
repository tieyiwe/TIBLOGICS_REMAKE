// "Continue where you left off": the exact next thing for a learner.
//
// The last activity is the newest of: a lesson they were reading (its saved
// position, "pos:<lessonId>" in LearnerDraft), a lab or Code Studio draft, a
// prompt lab with sandbox runs, a final exam still running, a capstone draft
// or a Learning Studio design. If that is newer than their last completed
// lesson, they go back to it; otherwise to the next unfinished lesson.
import prisma from "@/lib/prisma";
import { draftTableReady } from "@/lib/learn/drafts/db";
import { isEmptyDraft } from "@/lib/learn/drafts/shared";
import { getTrackProgress } from "@/lib/learn/progress";
import { STUDIO_BY_ID, toolsForTrack } from "@/lib/learn/studio/catalog";

export type ResumeKind = "lesson" | "next" | "lab" | "code" | "exam" | "studio" | "capstone";

export interface ResumeTarget {
  kind: ResumeKind;
  href: string;
  /** Lesson or lab title in English; studio items carry the tool id in refId instead. */
  title: string;
  /** lessonId | labId | toolId | trackId (exam, capstone) */
  refId: string;
  trackId: string | null;
  at: Date | null;
}

interface Activity extends ResumeTarget {
  at: Date;
}

/**
 * @param scope.trackId   only this track (the track page)
 * @param scope.trackIds  only these tracks, e.g. the ones the learner can open
 */
export async function getResumeTarget(
  studentId: string,
  scope: { trackId?: string; trackIds?: string[] } = {},
): Promise<ResumeTarget | null> {
  const allowed = scope.trackId ? [scope.trackId] : scope.trackIds;
  const inScope = (trackId: string | null) => !allowed || (trackId != null && allowed.includes(trackId));
  const now = new Date();

  const [drafts, runs, exams, lastDone] = await Promise.all([
    draftTableReady().then((ok) =>
      ok
        ? prisma.learnerDraft.findMany({
            where: { studentId },
            orderBy: { updatedAt: "desc" },
            take: 40,
            select: { key: true, value: true, updatedAt: true },
          })
        : [],
    ),
    prisma.labAttempt.findMany({
      where: { studentId, status: "in_progress", runCount: { gt: 0 } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { labId: true, updatedAt: true },
    }),
    prisma.finalExamSession.findMany({
      where: { studentId, status: "in_progress", submittedAt: null, expiresAt: { gt: now } },
      orderBy: { startedAt: "desc" },
      take: 3,
      select: { startedAt: true, finalExam: { select: { title: true, track: { select: { id: true, slug: true } } } } },
    }),
    prisma.lessonProgress.findMany({
      where: { studentId, ...(allowed ? { lesson: { module: { trackId: { in: allowed } } } } : {}) },
      orderBy: { completedAt: "desc" },
      take: 1,
      select: { completedAt: true, lesson: { select: { module: { select: { trackId: true } } } } },
    }),
  ]).catch((err) => {
    console.error("[learn/resume]", err);
    return [[], [], [], []] as const;
  });

  // Collect what each draft points at.
  const labAt = new Map<string, { at: Date; code: boolean }>();
  const lessonAt = new Map<string, Date>();
  const capstoneAt = new Map<string, Date>();
  const studio: Array<{ tool: string; challenge: string; at: Date }> = [];
  for (const d of drafts) {
    const [kind, a, b] = d.key.split(":");
    if (kind === "pos") {
      if (!lessonAt.has(a)) lessonAt.set(a, d.updatedAt);
      continue;
    }
    if (isEmptyDraft(d.value)) continue;
    if (kind === "lab" || kind === "code") {
      const cur = labAt.get(a);
      if (!cur || cur.at < d.updatedAt) labAt.set(a, { at: d.updatedAt, code: kind === "code" });
    } else if (kind === "capstone") capstoneAt.set(a, d.updatedAt);
    else if (kind === "studio" && STUDIO_BY_ID.has(a)) studio.push({ tool: a, challenge: b, at: d.updatedAt });
  }
  for (const r of runs) {
    const cur = labAt.get(r.labId);
    if (!cur || cur.at < r.updatedAt) labAt.set(r.labId, { at: r.updatedAt, code: cur?.code ?? false });
  }

  const [labs, lessons, capstones, doneLessons] = await Promise.all([
    labAt.size
      ? prisma.lab.findMany({
          where: { id: { in: [...labAt.keys()] }, isPublished: true },
          select: { id: true, slug: true, title: true, trackId: true },
        })
      : [],
    lessonAt.size
      ? prisma.lesson.findMany({
          where: { id: { in: [...lessonAt.keys()] } },
          select: { id: true, title: true, module: { select: { trackId: true } } },
        })
      : [],
    capstoneAt.size
      ? prisma.capstone.findMany({
          where: { id: { in: [...capstoneAt.keys()] } },
          select: { id: true, trackId: true, track: { select: { slug: true, title: true } } },
        })
      : [],
    lessonAt.size
      ? prisma.lessonProgress.findMany({
          where: { studentId, lessonId: { in: [...lessonAt.keys()] } },
          select: { lessonId: true },
        })
      : [],
  ]).catch((err) => {
    console.error("[learn/resume] resolve", err);
    return [[], [], [], []] as const;
  });
  const done = new Set(doneLessons.map((d) => d.lessonId));

  const acts: Activity[] = [];
  for (const l of labs) {
    const a = labAt.get(l.id)!;
    acts.push({ kind: a.code ? "code" : "lab", href: `/learn/lab/${l.slug}`, title: l.title, refId: l.id, trackId: l.trackId, at: a.at });
  }
  for (const l of lessons) {
    if (done.has(l.id)) continue; // finished: the next lesson is what is left
    acts.push({ kind: "lesson", href: `/learn/lesson/${l.id}`, title: l.title, refId: l.id, trackId: l.module.trackId, at: lessonAt.get(l.id)! });
  }
  for (const c of capstones) {
    acts.push({ kind: "capstone", href: `/learn/capstone/${c.track.slug}`, title: c.track.title, refId: c.trackId, trackId: c.trackId, at: capstoneAt.get(c.id)! });
  }
  for (const e of exams) {
    acts.push({ kind: "exam", href: `/learn/exam/${e.finalExam.track.slug}`, title: e.finalExam.title, refId: e.finalExam.track.id, trackId: e.finalExam.track.id, at: e.startedAt });
  }

  // Studio tools belong to several tracks: on a track page, only its own.
  let scopeSlug: string | null = null;
  if (scope.trackId) {
    scopeSlug = (await prisma.learnTrack.findUnique({ where: { id: scope.trackId }, select: { slug: true } }).catch(() => null))?.slug ?? null;
  }
  for (const s of studio) {
    if (scope.trackId && !(scopeSlug && toolsForTrack(scopeSlug).some((x) => x.id === s.tool))) continue;
    acts.push({
      kind: "studio",
      href: `/learn/studio/${s.tool}?c=${encodeURIComponent(s.challenge)}`,
      title: s.tool,
      refId: s.tool,
      trackId: scope.trackId ?? null,
      at: s.at,
    });
  }

  const latest = acts
    .filter((a) => a.kind === "studio" || inScope(a.trackId))
    .sort((a, b) => b.at.getTime() - a.at.getTime())[0];
  const last = lastDone[0];
  if (latest && (!last || latest.at > last.completedAt)) return latest;

  // Otherwise the next unfinished lesson, in this track or the one last worked in.
  const trackId = scope.trackId ?? last?.lesson.module.trackId ?? (latest && latest.kind !== "studio" ? latest.trackId : null);
  if (!trackId || !inScope(trackId)) return latest ?? null;
  const progress = await getTrackProgress(studentId, trackId);
  if (!progress.nextLessonId) return latest ?? null;
  const next = await prisma.lesson.findUnique({ where: { id: progress.nextLessonId }, select: { title: true } });
  return {
    kind: "next",
    href: `/learn/lesson/${progress.nextLessonId}`,
    title: next?.title ?? "",
    refId: progress.nextLessonId,
    trackId,
    at: last?.completedAt ?? null,
  };
}
