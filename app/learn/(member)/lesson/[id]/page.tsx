import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { canAccessTrack, getAccess, getStudent } from "@/lib/learn/session";
import TrackPaywall from "@/components/learn/TrackPaywall";
import LessonPlayer from "@/components/learn/LessonPlayer";
import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { LESSON_SOURCE, loadTrackSources, localizedLesson, localizedTrack } from "@/lib/i18n/sources/learn";
import { loadLoopState } from "@/lib/learn/method/loop";
import { POINT_VALUES } from "@/lib/learn/points";
import LearningLoop from "@/components/learn/method/LearningLoop";
import LessonReflection from "@/components/learn/method/LessonReflection";
import LessonPosition from "@/components/learn/LessonPosition";
import { readDraft } from "@/lib/learn/drafts/server";
import TutorDock from "@/components/learn/tutor/TutorDock";
import DiscussionSection from "@/components/learn/community/DiscussionSection";
import { lessonVideoFor } from "@/lib/learn/video/store";
import { isOwnerStudent } from "@/lib/learn/owner";
import { lessonRecap } from "@/lib/learn/recap";
import KeyTakeaways from "@/components/learn/recap/KeyTakeaways";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const src = await prisma.lesson.findUnique({ where: { id }, select: LESSON_SOURCE }).catch(() => null);
  if (!src) return {};
  const { text } = await localizedLesson(src, await getLocale());
  return { title: text.title };
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  const lesson = await prisma.lesson
    .findUnique({
      where: { id },
      include: {
        resources: { orderBy: { sortOrder: "asc" } },
        microCheck: { select: { id: true, passScore: true, questionsServed: true } },
        module: {
          include: {
            track: { select: { id: true, slug: true, title: true, accentColor: true } },
            quiz: { select: { id: true } },
            lessons: { select: { id: true } },
          },
        },
      },
    })
    .catch(() => null);

  if (!lesson) notFound();

  const trackId = lesson.module.track.id;

  // Per-track access: a lesson opens with its track (bought, or every track
  // with the subscription). Free-preview lessons open for any member.
  if (!lesson.isPreview && !canAccessTrack(await getAccess(student.id), trackId)) {
    return (
      <div>
        <nav className="mb-4 text-sm text-[var(--ink3)]">
          <Link href={`/learn/track/${lesson.module.track.slug}`} className="hover:text-[var(--ink)]">
            ← {lesson.module.track.title}
          </Link>
        </nav>
        <TrackPaywall trackId={trackId} />
      </div>
    );
  }

  // Outline rail: every module + lesson in the track, with completion state
  const [modules, completed] = await Promise.all([
    prisma.learnModule.findMany({
      where: { trackId },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        sortOrder: true,
        quiz: { select: { id: true } },
        lessons: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, title: true, durationMinutes: true, sortOrder: true },
        },
      },
    }),
    prisma.lessonProgress.findMany({
      where: { studentId: student.id, lesson: { module: { trackId } } },
      select: { lessonId: true },
    }),
  ]);

  // The lesson and the outline in the learner's language. Each is one cached
  // record (the outline comes from the track record, so a 40-lesson rail is
  // one translation, not 40); while either is pending the page shows English
  // and says so.
  const [t, locale, [trackSrc]] = await Promise.all([getT(), getLocale(), loadTrackSources({ id: trackId })]);
  const [{ text, pending: lessonPending }, trackLocalized] = await Promise.all([
    localizedLesson(lesson, locale),
    trackSrc ? localizedTrack(trackSrc, locale) : Promise.resolve(null),
  ]);
  const tt = trackLocalized?.text;
  const pending = lessonPending || !!trackLocalized?.pending;

  const doneIds = new Set(completed.map((c) => c.lessonId));
  const isDone = doneIds.has(lesson.id);

  // The Learning Loop (Understand, Try, Play, Apply, Reflect). Never blocks
  // the lesson: if it cannot be worked out, the strip is simply not shown.
  const loop = await loadLoopState(student.id, { id: lesson.id, moduleId: lesson.moduleId, sourceMd: lesson.bodyMd }, locale, isDone).catch(
    (err) => {
      console.error("[lesson] learning loop", err);
      return null;
    },
  );

  // Where the learner was in this lesson last time (any device), to offer
  // "Jump back to where you were". Never scrolls on its own.
  const savedPos = await readDraft(student.id, `pos:${lesson.id}`);
  const savedPct =
    savedPos && typeof (savedPos.value as { pct?: unknown })?.pct === "number"
      ? Math.round((savedPos.value as { pct: number }).pct)
      : null;

  // The lesson video (chapters, captions, the learner's place); null without one.
  const video = await lessonVideoFor(student.id, lesson, locale).catch(() => null);
  // What to remember from this lesson (lib/learn/recap); null until written.
  const recap = await lessonRecap(lesson, locale);

  // Flatten for prev/next
  const flat = modules.flatMap((m) => m.lessons.map((l) => l.id));
  const idx = flat.indexOf(lesson.id);
  const prevId = idx > 0 ? flat[idx - 1] : null;
  const nextId = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;

  // Quiz becomes available once every lesson in the module is complete
  const moduleLessonIds = lesson.module.lessons?.map((l) => l.id) ?? [];
  // The owner can open every module quiz to check it (lib/learn/owner.ts).
  const moduleComplete =
    (moduleLessonIds.length > 0 && moduleLessonIds.every((lid) => doneIds.has(lid))) || (await isOwnerStudent(student.id));

  return (
    <div>
      <nav aria-label={t("learn.lesson.breadcrumb")} className="mb-4 text-sm text-[var(--ink3)]">
        <Link href={`/learn/track/${lesson.module.track.slug}`} className="hover:text-[var(--ink)]">
          {tt?.title ?? lesson.module.track.title}
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span>{tt?.modules[lesson.moduleId]?.title ?? lesson.module.title}</span>
      </nav>
      {pending && (
        <p role="status" className="mb-4 rounded-lg bg-[var(--blue-light)] px-3 py-2 text-xs text-[var(--blue)]">
          {t("common.translationPending")}
        </p>
      )}
      <LessonPosition key={lesson.id} lessonId={lesson.id} savedPct={savedPct} accentColor={lesson.module.track.accentColor} />

      <LessonPlayer
        lesson={{
          id: lesson.id,
          title: text.title,
          bodyMd: text.bodyMd,
          sourceMd: lesson.bodyMd,
          videoUrl: lesson.videoUrl,
          video,
          contentType: lesson.contentType,
          durationMinutes: lesson.durationMinutes,
          objective: text.objective,
          hasPractice: lesson.hasPractice,
        }}
        resources={lesson.resources.map((r) => ({
          id: r.id,
          title: text.resources[r.id]?.title ?? r.title,
          url: r.url,
          resourceType: r.resourceType,
          isFree: r.isFree,
          isRequired: r.isRequired,
          notes: text.resources[r.id]?.notes ?? r.notes,
        }))}
        microCheck={lesson.microCheck}
        modules={modules.map((m) => ({
          id: m.id,
          title: tt?.modules[m.id]?.title ?? m.title,
          quizId: m.quiz?.id ?? null,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.id === lesson.id ? text.title : tt?.lessons[l.id]?.title ?? l.title,
            durationMinutes: l.durationMinutes,
            done: doneIds.has(l.id),
          })),
        }))}
        currentModuleId={lesson.moduleId}
        moduleQuizId={lesson.module.quiz?.id ?? null}
        moduleComplete={moduleComplete}
        alreadyComplete={isDone}
        prevId={prevId}
        nextId={nextId}
        trackSlug={lesson.module.track.slug}
        accentColor={lesson.module.track.accentColor}
        loop={
          loop && (
            <LearningLoop
              key="learning-loop"
              lessonId={lesson.id}
              understand={loop.understand}
              play={loop.play}
              apply={loop.apply}
              reflect={loop.reflect}
              accentColor={lesson.module.track.accentColor}
            />
          )
        }
        recap={recap ? <KeyTakeaways recap={recap} title={t("learn.recap.title")} accentColor={lesson.module.track.accentColor} /> : undefined}
        footer={
          loop && (
            <LessonReflection
              key="reflection"
              lessonId={lesson.id}
              initialText={loop.reflection?.text ?? ""}
              initialUpdatedAt={loop.reflection?.updatedAt ?? null}
              xp={POINT_VALUES.reflection}
              accentColor={lesson.module.track.accentColor}
            />
          )
        }
      />
      <div className="mt-8">
        <DiscussionSection studentId={student.id} trackId={trackId} lessonId={lesson.id} />
      </div>
      <TutorDock kind="lesson" refId={lesson.id} />
    </div>
  );
}
