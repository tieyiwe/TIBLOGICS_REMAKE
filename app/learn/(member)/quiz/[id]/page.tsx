import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import QuizRunner from "@/components/learn/QuizRunner";
import { getLocale } from "@/lib/i18n/server";
import { loadTrackSources, localizedTrack } from "@/lib/i18n/sources/learn";

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  const quiz = await prisma.quiz
    .findUnique({
      where: { id },
      select: {
        id: true,
        passScore: true,
        questionsServed: true,
        module: {
          select: {
            id: true,
            title: true,
            track: { select: { slug: true, title: true, accentColor: true } },
          },
        },
      },
    })
    .catch(() => null);

  if (!quiz) notFound();

  // Track and module names come with the track's translation (English meanwhile).
  const locale = await getLocale();
  const [source] = await loadTrackSources({ slug: quiz.module.track.slug });
  const text = source ? (await localizedTrack(source, locale)).text : null;
  const trackTitle = text?.title ?? quiz.module.track.title;
  const moduleTitle = text?.modules[quiz.module.id]?.title ?? quiz.module.title;

  const best = await prisma.quizAttempt
    .findFirst({
      where: { studentId: student.id, quizId: id },
      orderBy: { score: "desc" },
      select: { score: true, passed: true },
    })
    .catch(() => null);

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[var(--ink3)]">
        <Link href={`/learn/track/${quiz.module.track.slug}`} className="hover:text-[var(--ink)]">
          {trackTitle}
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span>{moduleTitle}</span>
      </nav>

      <QuizRunner
        quizId={quiz.id}
        moduleTitle={moduleTitle}
        passScore={quiz.passScore}
        questionsServed={quiz.questionsServed}
        accentColor={quiz.module.track.accentColor}
        trackSlug={quiz.module.track.slug}
        bestScore={best?.score ?? null}
        alreadyPassed={best?.passed ?? false}
      />
    </div>
  );
}
