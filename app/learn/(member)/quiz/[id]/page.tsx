import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import QuizRunner from "@/components/learn/QuizRunner";

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
            title: true,
            track: { select: { slug: true, title: true, accentColor: true } },
          },
        },
      },
    })
    .catch(() => null);

  if (!quiz) notFound();

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
          {quiz.module.track.title}
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span>{quiz.module.title}</span>
      </nav>

      <QuizRunner
        quizId={quiz.id}
        moduleTitle={quiz.module.title}
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
