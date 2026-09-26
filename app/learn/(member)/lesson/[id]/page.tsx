import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import LessonPlayer from "@/components/learn/LessonPlayer";

export const dynamic = "force-dynamic";

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

  const doneIds = new Set(completed.map((c) => c.lessonId));
  const isDone = doneIds.has(lesson.id);

  // Flatten for prev/next
  const flat = modules.flatMap((m) => m.lessons.map((l) => l.id));
  const idx = flat.indexOf(lesson.id);
  const prevId = idx > 0 ? flat[idx - 1] : null;
  const nextId = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;

  // Quiz becomes available once every lesson in the module is complete
  const moduleLessonIds = lesson.module.lessons?.map((l) => l.id) ?? [];
  const moduleComplete =
    moduleLessonIds.length > 0 && moduleLessonIds.every((lid) => doneIds.has(lid));

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[var(--ink3)]">
        <Link href={`/learn/track/${lesson.module.track.slug}`} className="hover:text-[var(--ink)]">
          {lesson.module.track.title}
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span>{lesson.module.title}</span>
      </nav>

      <LessonPlayer
        lesson={{
          id: lesson.id,
          title: lesson.title,
          bodyMd: lesson.bodyMd,
          videoUrl: lesson.videoUrl,
          contentType: lesson.contentType,
          durationMinutes: lesson.durationMinutes,
          objective: lesson.objective,
          hasPractice: lesson.hasPractice,
        }}
        resources={lesson.resources.map((r) => ({
          id: r.id,
          title: r.title,
          url: r.url,
          resourceType: r.resourceType,
          isFree: r.isFree,
          isRequired: r.isRequired,
          notes: r.notes,
        }))}
        microCheck={lesson.microCheck}
        modules={modules.map((m) => ({
          id: m.id,
          title: m.title,
          quizId: m.quiz?.id ?? null,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
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
      />
    </div>
  );
}
