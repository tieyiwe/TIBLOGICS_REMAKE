import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { allModuleQuizzesPassed } from "@/lib/learn/assessments";
import ExamRunner from "@/components/learn/ExamRunner";
import { getLocale, translatorFor, type T } from "@/lib/i18n/server";
import { loadTrackSources, localizedTrack } from "@/lib/i18n/sources/learn";
import { localizeExamInstructions } from "@/lib/i18n/sources/labs";

export const dynamic = "force-dynamic";

function minutes(t: T, mins: number): string {
  if (mins < 60) return t("labs.time.min", { n: mins });
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? t(h === 1 ? "labs.time.hr.one" : "labs.time.hr.other", { n: h }) : t("labs.time.hrMin", { h, m });
}

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
  const locale = await getLocale();
  const t = translatorFor(locale);

  // Track, module and exam titles come with the track's translation; the
  // instructions are their own unit. English meanwhile.
  const [source] = await loadTrackSources({ id: track.id });
  const trackText = source ? (await localizedTrack(source, locale)).text : null;
  const instructions = await localizeExamInstructions(track.finalExam, locale);
  const exam = {
    ...track.finalExam,
    title: trackText?.examTitle ?? track.finalExam.title,
    instructionsMd: instructions.instructionsMd,
  };
  const trackTitle = trackText?.title ?? track.title;
  const modules = source ? source.modules.map((m) => ({ id: m.id, title: trackText?.modules[m.id]?.title ?? m.title })) : [];

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
          {t("labs.exam.lockedBody")}
        </p>
        <Link
          href={`/learn/track/${track.slug}`}
          className="mt-6 inline-block rounded-full px-6 py-2.5 text-sm font-bold text-white"
          style={{ background: track.accentColor }}
        >
          {t("labs.exam.backToTrack")}
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
          {trackTitle}
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
        modules={modules}
      />

      {finished.length > 0 && (
        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t("labs.exam.yourAttempts")}</h2>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {finished.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-[var(--ink2)]">
                  {t("labs.exam.attempt", { n: s.attemptNumber })}
                  {s.status === "expired" && (
                    <span className="ml-2 text-xs text-[var(--ink3)]">{t("labs.exam.timeExpired")}</span>
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
            {t("labs.exam.summary", { time: minutes(t, exam.timeLimitMinutes), pass: exam.passScore, dist: exam.distinctionScore })}
          </p>
        </section>
      )}
    </div>
  );
}
