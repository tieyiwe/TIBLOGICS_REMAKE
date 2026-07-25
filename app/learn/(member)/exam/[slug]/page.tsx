import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { allModuleQuizzesPassed } from "@/lib/learn/assessments";
import { formatMinutes } from "@/lib/learn/types";
import ExamRunner from "@/components/learn/ExamRunner";

export const dynamic = "force-dynamic";

export default async function ExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  const track = await prisma.learnTrack
    .findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        accentColor: true,
        finalExam: {
          select: {
            id: true, title: true, timeLimitMinutes: true, questionsServed: true,
            passScore: true, distinctionScore: true, maxAttempts: true,
            cooldownHours: true, instructionsMd: true,
          },
        },
      },
    })
    .catch(() => null);

  if (!track?.finalExam) notFound();
  const exam = track.finalExam;

  const [unlocked, sessions, profile] = await Promise.all([
    allModuleQuizzesPassed(student.id, track.id),
    prisma.finalExamSession.findMany({
      where: { studentId: student.id, finalExamId: exam.id },
      orderBy: { startedAt: "desc" },
      select: { id: true, status: true, score: true, passed: true, submittedAt: true, attemptNumber: true },
    }),
    prisma.student.findUnique({
      where: { id: student.id },
      select: { accessibilityMode: true },
    }),
  ]);

  const passed = sessions.find((s) => s.passed);
  const finished = sessions.filter((s) => s.status !== "in_progress");
  const inProgress = sessions.find((s) => s.status === "in_progress");

  // Locked — quizzes not all passed
  if (!unlocked && !passed) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-white p-8 text-center">
        <h1 className="text-xl font-black text-[var(--ink)]">{exam.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--ink2)]">
          The final exam unlocks once you've passed the quiz in every module. That's deliberate — it
          means you arrive here already knowing the material, not hoping to guess your way through.
        </p>
        <Link
          href={`/learn/track/${track.slug}`}
          className="mt-6 inline-block rounded-full px-6 py-2.5 text-sm font-bold text-white"
          style={{ background: track.accentColor }}
        >
          Back to the track →
        </Link>
      </div>
    );
  }

  const attemptsLeft = Math.max(0, exam.maxAttempts - finished.length);
  const last = finished[0];
  const cooldownUntil =
    last?.submittedAt && !passed
      ? new Date(last.submittedAt.getTime() + exam.cooldownHours * 3600_000)
      : null;
  const inCooldown = cooldownUntil != null && cooldownUntil.getTime() > Date.now();

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[var(--ink3)]">
        <Link href={`/learn/track/${track.slug}`} className="hover:text-[var(--ink)]">
          {track.title}
        </Link>
      </nav>

      <ExamRunner
        trackSlug={track.slug}
        accentColor={track.accentColor}
        exam={{
          title: exam.title,
          timeLimitMinutes: exam.timeLimitMinutes,
          questionsServed: exam.questionsServed,
          passScore: exam.passScore,
          distinctionScore: exam.distinctionScore,
          maxAttempts: exam.maxAttempts,
          cooldownHours: exam.cooldownHours,
          instructionsMd: exam.instructionsMd,
        }}
        history={finished.map((s) => ({
          attemptNumber: s.attemptNumber,
          score: s.score,
          passed: s.passed,
          status: s.status,
          submittedAt: s.submittedAt?.toISOString() ?? null,
        }))}
        alreadyPassed={!!passed}
        hasInProgress={!!inProgress}
        attemptsLeft={attemptsLeft}
        cooldownUntil={inCooldown ? cooldownUntil!.toISOString() : null}
        extendedTime={profile?.accessibilityMode ?? false}
      />

      {finished.length > 0 && (
        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-sm font-bold text-[var(--ink)]">Your attempts</h2>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {finished.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-[var(--ink2)]">
                  Attempt {s.attemptNumber}
                  {s.status === "expired" && (
                    <span className="ml-2 text-xs text-[var(--ink3)]">(time expired)</span>
                  )}
                </span>
                <span className="font-bold" style={{ color: s.passed ? "#22A387" : "var(--ink2)" }}>
                  {s.score != null ? `${s.score}%` : "—"}
                  {s.passed && " ✓"}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--ink3)]">
            {formatMinutes(exam.timeLimitMinutes)} per attempt · {exam.passScore}% to pass ·{" "}
            {exam.distinctionScore}%+ earns Distinction
          </p>
        </section>
      )}
    </div>
  );
}
