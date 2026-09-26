import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { getTrackProgress, getTrackGates } from "@/lib/learn/progress";
import { formatMinutes } from "@/lib/learn/types";
import { LAB_TYPE_META, type LabType } from "@/lib/learn/labs/types";
import ProgressRing from "@/components/learn/ProgressRing";

export const dynamic = "force-dynamic";

export default async function TrackHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  const track = await prisma.learnTrack
    .findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { sortOrder: "asc" },
          include: {
            lessons: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, durationMinutes: true } },
            quiz: { select: { id: true, passScore: true } },
          },
        },
        finalExam: { select: { id: true, title: true, timeLimitMinutes: true, questionsServed: true, passScore: true } },
        capstone: { select: { id: true } },
        labs: {
          where: { isPublished: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true, slug: true, title: true, labType: true,
            estimatedMinutes: true, points: true, moduleId: true,
          },
        },
      },
    })
    .catch(() => null);

  if (!track) notFound();

  const [progress, gates, done, quizPasses, cert] = await Promise.all([
    getTrackProgress(student.id, track.id),
    getTrackGates(student.id, track.id),
    prisma.lessonProgress.findMany({
      where: { studentId: student.id, lesson: { module: { trackId: track.id } } },
      select: { lessonId: true },
    }),
    prisma.quizAttempt.findMany({
      where: { studentId: student.id, passed: true, quiz: { module: { trackId: track.id } } },
      select: { quizId: true },
      distinct: ["quizId"],
    }),
    prisma.learnCertificate.findFirst({
      where: { studentId: student.id, trackId: track.id, revoked: false },
      select: { verificationId: true, distinction: true },
    }),
  ]);

  const labPasses = await prisma.labAttempt
    .findMany({
      where: { studentId: student.id, passed: true, lab: { trackId: track.id } },
      select: { labId: true },
      distinct: ["labId"],
    })
    .catch(() => []);
  const passedLabIds = new Set(labPasses.map((l) => l.labId));

  const doneIds = new Set(done.map((d) => d.lessonId));
  const passedQuizIds = new Set(quizPasses.map((q) => q.quizId));

  const GATES = [
    { key: "microChecks", label: "Quick checks attempted", ok: gates.microChecks },
    { key: "quizzes", label: "All module quizzes passed", ok: gates.quizzes },
    { key: "exam", label: "Final exam passed", ok: gates.exam },
    { key: "capstone", label: "Capstone approved", ok: gates.capstone },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-6 rounded-2xl border border-[var(--border)] bg-white p-6">
        <ProgressRing percent={progress.percent} color={track.accentColor} size={76} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black text-[var(--ink)]">{track.title}</h1>
          <p className="mt-1 text-sm text-[var(--ink3)]">
            {progress.completedLessons} of {progress.totalLessons} lessons ·{" "}
            {formatMinutes(progress.minutesRemaining)} remaining
          </p>
        </div>
        {progress.nextLessonId && (
          <Link
            href={`/learn/lesson/${progress.nextLessonId}`}
            className="rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: track.accentColor }}
          >
            {progress.completedLessons > 0 ? "Resume →" : "Start →"}
          </Link>
        )}
      </header>

      {/* Certificate gates */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-base font-bold text-[var(--ink)]">Your path to the certificate</h2>
        <ul className="mt-4 space-y-2.5">
          {GATES.map((g) => (
            <li key={g.key} className="flex items-center gap-3 text-sm">
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  g.ok ? "bg-green-100 text-green-700" : "bg-[var(--s3)] text-[var(--ink3)]"
                }`}
              >
                {g.ok ? "✓" : "○"}
              </span>
              <span className={g.ok ? "font-semibold text-[var(--ink)]" : "text-[var(--ink2)]"}>
                {g.label}
              </span>
            </li>
          ))}
        </ul>

        {cert ? (
          <Link
            href={`/certificates/${cert.verificationId}`}
            className="mt-5 inline-block rounded-full bg-[var(--ink)] px-6 py-2.5 text-sm font-bold text-white"
          >
            View your certificate →
          </Link>
        ) : (
          gates.eligible && (
            <p className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
              All requirements met — your certificate is being issued.
            </p>
          )
        )}
      </section>

      {/* Modules */}
      <section>
        <h2 className="text-base font-bold text-[var(--ink)]">Modules</h2>
        <div className="mt-4 space-y-4">
          {track.modules.map((m, mi) => {
            const total = m.lessons.length;
            const complete = m.lessons.filter((l) => doneIds.has(l.id)).length;
            const allDone = total > 0 && complete === total;
            const quizPassed = m.quiz ? passedQuizIds.has(m.quiz.id) : false;

            return (
              <div key={m.id} className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-[var(--ink)]">
                    {mi + 1}. {m.title}
                  </h3>
                  <span className="text-xs font-semibold text-[var(--ink3)]">
                    {complete}/{total} lessons
                  </span>
                </div>

                <ul className="mt-3 space-y-1">
                  {m.lessons.map((l) => (
                    <li key={l.id}>
                      <Link
                        href={`/learn/lesson/${l.id}`}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-[var(--ink2)] hover:bg-[var(--s2)]"
                      >
                        <span
                          aria-hidden="true"
                          style={{ color: doneIds.has(l.id) ? "#22A387" : "var(--ink3)" }}
                        >
                          {doneIds.has(l.id) ? "✓" : "○"}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{l.title}</span>
                        <span className="shrink-0 text-xs text-[var(--ink3)]">
                          {formatMinutes(l.durationMinutes)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>

                {m.quiz && (
                  <div className="mt-3 border-t border-[var(--border)] pt-3">
                    {quizPassed ? (
                      <p className="text-xs font-semibold text-green-700">
                        ✓ Module quiz passed —{" "}
                        <Link href={`/learn/quiz/${m.quiz.id}`} className="underline">
                          retake for practice
                        </Link>
                      </p>
                    ) : allDone ? (
                      <Link
                        href={`/learn/quiz/${m.quiz.id}`}
                        className="text-xs font-bold text-[var(--blue2)] underline"
                      >
                        Take the module quiz ({m.quiz.passScore}% to pass) →
                      </Link>
                    ) : (
                      <p className="text-xs text-[var(--ink3)]">
                        Finish every lesson to unlock the module quiz.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Labs */}
      {track.labs.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-[var(--ink)]">Labs</h2>
          <p className="mt-1 text-sm text-[var(--ink3)]">
            Hands-on practice. Optional, but this is where the reading turns into skill.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {track.labs.map((lab) => {
              const passed = passedLabIds.has(lab.id);
              const meta = LAB_TYPE_META[lab.labType as LabType] ?? LAB_TYPE_META.prompt;
              return (
                <Link
                  key={lab.id}
                  href={`/learn/lab/${lab.slug}`}
                  className="learn-lift rounded-2xl border border-[var(--border)] bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                      style={{ background: `${track.accentColor}18`, color: track.accentColor }}
                    >
                      <span aria-hidden="true">{meta.icon}</span> {meta.label}
                    </span>
                    {passed && (
                      <span className="shrink-0 text-xs font-bold text-green-700">✓ Passed</span>
                    )}
                  </div>
                  <h3 className="mt-2.5 text-sm font-bold text-[var(--ink)]">{lab.title}</h3>
                  <p className="mt-1 text-xs text-[var(--ink3)]">
                    ~{lab.estimatedMinutes} min · {lab.points} pts
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Final exam + capstone */}
      <section className="grid gap-4 sm:grid-cols-2">
        {track.finalExam && (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <h3 className="text-sm font-bold text-[var(--ink)]">{track.finalExam.title}</h3>
            <p className="mt-1 text-xs text-[var(--ink3)]">
              {track.finalExam.questionsServed} questions ·{" "}
              {formatMinutes(track.finalExam.timeLimitMinutes)} · {track.finalExam.passScore}% to pass
            </p>
            {gates.exam ? (
              <p className="mt-3 text-xs font-semibold text-green-700">✓ Passed</p>
            ) : gates.quizzes ? (
              <Link
                href={`/learn/exam/${track.slug}`}
                className="mt-3 inline-block rounded-full bg-[var(--ink)] px-5 py-2 text-xs font-bold text-white"
              >
                Start the final exam →
              </Link>
            ) : (
              <p className="mt-3 text-xs text-[var(--ink3)]">
                Pass every module quiz to unlock this.
              </p>
            )}
          </div>
        )}

        {track.capstone && (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <h3 className="text-sm font-bold text-[var(--ink)]">Capstone project</h3>
            <p className="mt-1 text-xs text-[var(--ink3)]">
              Reviewed by a person, against a published rubric.
            </p>
            {gates.capstone ? (
              <p className="mt-3 text-xs font-semibold text-green-700">✓ Approved</p>
            ) : (
              <Link
                href={`/learn/capstone/${track.slug}`}
                className="mt-3 inline-block rounded-full bg-[var(--ink)] px-5 py-2 text-xs font-bold text-white"
              >
                View the brief →
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
