import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { canAccessTrack, getAccess, getStudent } from "@/lib/learn/session";
import { enforceYouthGate } from "@/lib/learn/youth-gate";
import TrackPaywall from "@/components/learn/TrackPaywall";
import { trackPriceCents } from "@/lib/learn/pricing";
import { getTrackProgress, getTrackGates } from "@/lib/learn/progress";
import type { Metadata } from "next";
import { LAB_TYPE_META, type LabType } from "@/lib/learn/labs/types";
import ProgressRing from "@/components/learn/ProgressRing";
import { handsOnMinutes } from "@/lib/learn/catalog";
import { fmtBreakdown, fmtMinutes, fmtPrice } from "@/lib/learn/format";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadTrackSources, localizedTrack, trackText } from "@/lib/i18n/sources/learn";
import { POINT_VALUES } from "@/lib/learn/points";
import { moduleStars } from "@/lib/learn/badge-defs";
import { toolsForTrack } from "@/lib/learn/studio/catalog";
import QuestMap, { type QuestFinal, type QuestModule, type StageState } from "@/components/learn/game/QuestMap";
import { trackMastery } from "@/lib/learn/mastery/overview";
import { masteredLessonIds } from "@/lib/learn/mastery/testout";
import TrackMasteryPanel, { ModuleMasteryTag } from "@/components/learn/mastery/TrackMasteryPanel";
import { getResumeTarget } from "@/lib/learn/resume";
import { newLessonsInTrack } from "@/lib/learn/track-updates";
import { NewLessonsPanel, NewPill } from "@/components/learn/NewLessons";
import { resumeTitle } from "@/components/learn/ResumeCard";
import TrackCommunityCards from "@/components/learn/community/TrackCommunityCards";
import OfflineDownload from "@/components/learn/pwa/OfflineDownload";
import YoureInBanner from "@/components/learn/join/YoureInBanner";
import { isOwnerStudent } from "@/lib/learn/owner";
import TrackCases from "@/components/learn/cases/TrackCases";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [src] = await loadTrackSources({ slug });
  if (!src) return {};
  const { text } = await localizedTrack(src, await getLocale());
  return { title: text.title };
}

export default async function TrackHome({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { slug } = await params;
  // ?welcome=1: just paid (app/api/learn/checkout/confirm): "You're in".
  const welcome = (await searchParams).welcome === "1";
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  // The track, its sources (for translations), the owner check and access
  // are independent: one round trip.
  const [track, t, locale, [src], owner, access] = await Promise.all([
    prisma.learnTrack
      .findUnique({
        where: { slug },
        include: {
          modules: {
            orderBy: { sortOrder: "asc" },
            include: {
              lessons: {
                orderBy: { sortOrder: "asc" },
                select: { id: true, title: true, durationMinutes: true, isPreview: true, microCheck: { select: { id: true } } },
              },
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
              estimatedMinutes: true, points: true, moduleId: true, lesson: { select: { moduleId: true } },
            },
          },
        },
      })
      .catch(() => null),
    getT(),
    getLocale(),
    loadTrackSources({ slug }),
    isOwnerStudent(student.id),
    getAccess(student.id),
  ]);

  if (!track) notFound();
  // AI-Empowered Youth: birth year, parent email and (under 13) the parent's OK first.
  await enforceYouthGate(student.id, access, track.slug);

  const { text, pending } = src
    ? locale === "en"
      ? { text: trackText(src), pending: false }
      : await localizedTrack(src, locale)
    : { text: null, pending: false };

  // Per-track access. Without it the outline stays visible as a preview,
  // lessons are locked (free-preview ones excepted) and the two ways to
  // unlock are offered.
  if (!canAccessTrack(access, track.id)) {
    return (
      <div className="space-y-8">
        <header className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: track.accentColor }}>
            🔒 {t("learn.locked.badge")}
          </p>
          <h1 className="mt-1 text-xl font-black text-[var(--ink)]">{text?.title ?? track.title}</h1>
          <p className="mt-2 text-sm text-[var(--ink2)]">{t("learn.locked.outline")}</p>
        </header>
        <TrackPaywall trackId={track.id} compact />
        <section>
          <h2 className="text-base font-bold text-[var(--ink)]">{t("learn.catalog.modules")}</h2>
          <div className="mt-4 space-y-4">
            {track.modules.map((m, mi) => (
              <div key={m.id} className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  {mi + 1}. {text?.modules[m.id]?.title ?? m.title}
                </h3>
                <ul className="mt-3 space-y-1">
                  {m.lessons.map((l) => {
                    const title = text?.lessons[l.id]?.title ?? l.title;
                    return (
                      <li key={l.id}>
                        {l.isPreview ? (
                          <Link
                            href={`/learn/lesson/${l.id}`}
                            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-[var(--ink2)] hover:bg-[var(--s2)]"
                          >
                            <span aria-hidden="true" style={{ color: track.accentColor }}>▶</span>
                            <span className="min-w-0 flex-1 truncate">{title}</span>
                            <span className="shrink-0 rounded-full bg-[var(--s2)] px-2 py-0.5 text-[11px] font-bold text-[var(--ink2)]">
                              {t("learn.catalog.freePreview")}
                            </span>
                          </Link>
                        ) : (
                          <span className="flex items-center gap-2.5 px-2 py-1.5 text-sm text-[var(--ink3)]">
                            <span aria-hidden="true">🔒</span>
                            <span className="min-w-0 flex-1 truncate">{title}</span>
                            <span className="sr-only">{t("learn.locked.badge")}</span>
                            <span className="shrink-0 text-xs">{fmtMinutes(t, l.durationMinutes)}</span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }
  // A subscriber who has not bought this track can keep it for life.
  const keepForever =
    canAccessTrack(access, track.id) && !access.purchased.includes(track.id) && track.status === "live" && access.entitlement.status !== "comped"
      ? fmtPrice(trackPriceCents(track.level, track.priceCents), locale)
      : null;

  const time = {
    lessonMinutes: track.modules.reduce((n, m) => n + m.lessons.reduce((a, l) => a + l.durationMinutes, 0), 0),
    handsOnMinutes: handsOnMinutes({
      labMinutes: track.labs.map((l) => l.estimatedMinutes),
      quizCount: track.modules.filter((m) => m.quiz).length,
      examMinutes: track.finalExam?.timeLimitMinutes,
      hasCapstone: !!track.capstone,
    }),
    estimatedHours: track.estimatedHours,
  };

  // Everything about this learner in this track, in one round trip.
  const [progress, gates, done, quizPasses, cert, labPasses, mastery, masteredIds, resume, newLessons] = await Promise.all([
    getTrackProgress(student.id, track.id),
    getTrackGates(student.id, track.id),
    prisma.lessonProgress.findMany({
      where: { studentId: student.id, lesson: { module: { trackId: track.id } } },
      select: { lessonId: true },
    }),
    prisma.quizAttempt.findMany({
      where: { studentId: student.id, quiz: { module: { trackId: track.id } } },
      select: { quizId: true, passed: true },
    }),
    prisma.learnCertificate.findFirst({
      where: { studentId: student.id, trackId: track.id, revoked: false },
      select: { verificationId: true, distinction: true },
    }),
    prisma.labAttempt
      .findMany({
        where: { studentId: student.id, passed: true, lab: { trackId: track.id } },
        select: { labId: true },
        distinct: ["labId"],
      })
      .catch(() => []),
    // Mastery paths: diagnostic estimates, tested-out modules and lessons.
    trackMastery(student.id, track.id).catch((err) => {
      console.error("[track] mastery", err);
      return [];
    }),
    masteredLessonIds(student.id, track.id),
    // "Continue where you left off" (the exact next thing in this track) and
    // lessons added to modules the learner had already finished.
    getResumeTarget(student.id, { trackId: track.id }).catch(() => null),
    newLessonsInTrack(student.id, track.id),
  ]);

  const passedLabIds = new Set(labPasses.map((l) => l.labId));

  const doneIds = new Set(done.map((d) => d.lessonId));
  const passedQuizIds = new Set(quizPasses.filter((q) => q.passed).map((q) => q.quizId));
  // A quiz already attempted stays open even if a lesson was added since.
  const triedQuizIds = new Set(quizPasses.map((q) => q.quizId));
  const masteryOf = new Map(mastery.map((m) => [m.moduleId, m]));

  const quest = await buildQuest({
    studentId: student.id,
    track,
    titles: { modules: text?.modules ?? {}, exam: text?.examTitle ?? track.finalExam?.title ?? "" },
    doneIds: new Set([...doneIds, ...masteredIds]),
    passedQuizIds,
    passedLabIds,
    nextLessonId: progress.nextLessonId,
    gates,
    capstoneTitle: t("learn.trackHome.capstone"),
  }).catch((err) => {
    // The map is a bonus: without it the page still has everything below.
    console.error("[track] quest map", err);
    return null;
  });
  // Mastery paths: tested-out modules show as mastered on the map.
  for (const qm of quest?.modules ?? []) qm.mastered = !!masteryOf.get(qm.id)?.testedOut;

  const newIds = new Set(newLessons.map((l) => l.id));
  const resumeHref = resume?.href ?? (progress.nextLessonId ? `/learn/lesson/${progress.nextLessonId}` : null);

  const GATES = [
    { key: "microChecks", label: t("learn.gates.microChecks"), ok: gates.microChecks },
    { key: "quizzes", label: t("learn.gates.quizzes"), ok: gates.quizzes },
    { key: "exam", label: t("learn.gates.exam"), ok: gates.exam },
    { key: "capstone", label: t("learn.gates.capstone"), ok: gates.capstone },
  ];

  const firstLessonId = track.modules[0]?.lessons[0]?.id ?? null;

  return (
    <div className="space-y-8">
      {welcome && (
        <YoureInBanner
          trackTitle={text?.title ?? track.title}
          startHref={resumeHref ?? (firstLessonId ? `/learn/lesson/${firstLessonId}` : `/learn/track/${track.slug}`)}
          closeHref={`/learn/track/${track.slug}`}
          accent={track.accentColor}
          lifetime={access.purchased.includes(track.id)}
        />
      )}
      <header className="flex flex-wrap items-center gap-6 rounded-2xl border border-[var(--border)] bg-white p-6">
        <ProgressRing percent={progress.percent} color={track.accentColor} size={76} />
        <div className="min-w-0 flex-1" style={{ flexBasis: 180 }}>
          <h1 className="text-xl font-black text-[var(--ink)]">{text?.title ?? track.title}</h1>
          <p className="mt-1 text-sm text-[var(--ink3)]">
            {t("learn.dash.lessonsDone", { done: progress.completedLessons, total: progress.totalLessons })} ·{" "}
            {t("learn.time.remaining", { time: fmtMinutes(t, progress.minutesRemaining) })}
          </p>
          <p className="mt-1 text-xs text-[var(--ink3)]">{fmtBreakdown(t, locale, time)}</p>
          {pending && (
            <p role="status" className="mt-2 text-xs text-[var(--ink3)]">
              {t("common.translationPending")}
            </p>
          )}
          {resume && (progress.completedLessons > 0 || resume.kind !== "next") && (
            <p className="mt-2 text-xs text-[var(--ink2)]" data-resume-kind={resume.kind}>
              <span className="font-semibold text-[var(--ink)]">{t("resume.title")}</span>
              {" · "}
              {t(`resume.kind.${resume.kind}`)}: {resumeTitle(t, resume, text?.lessons)}
            </p>
          )}
        </div>
        {resumeHref && (
          <Link
            href={resumeHref}
            className="rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: track.accentColor }}
          >
            {progress.completedLessons > 0 || (resume && resume.kind !== "next") ? t("learn.dash.resume") : t("learn.ladder.start")} →
          </Link>
        )}
      </header>

      <NewLessonsPanel t={t} lessons={newLessons} titles={text?.lessons} accentColor={track.accentColor} />

      {keepForever && (
        <p className="-mt-4 text-right text-xs text-[var(--ink3)]">
          <Link href={`/learn/subscribe?track=${track.slug}`} className="font-semibold text-[var(--blue2)] underline" title={t("learn.locked.keepForeverBody")}>
            {t("learn.locked.keepForever", { price: keepForever })}
          </Link>
        </p>
      )}

      <TrackMasteryPanel
        studentId={student.id}
        trackId={track.id}
        slug={track.slug}
        accent={track.accentColor}
        mastery={mastery}
        modules={track.modules.map((m) => ({
          id: m.id,
          title: text?.modules[m.id]?.title ?? m.title,
          summary: text?.modules[m.id]?.summary ?? m.summary,
          quizId: m.quiz?.id ?? null,
          lessonId: (m.lessons.find((l) => !doneIds.has(l.id) && !masteredIds.has(l.id)) ?? m.lessons[0])?.id ?? null,
        }))}
      />

      {quest && <QuestMap {...quest} accent={track.accentColor} />}

      {/* Cohorts and discussion (components/learn/community) */}
      <TrackCommunityCards studentId={student.id} trackId={track.id} slug={track.slug} accent={track.accentColor} />

      {toolsForTrack(track.slug).length > 0 && (
        <Link
          href={`/learn/studio?track=${track.slug}`}
          className="flex items-center justify-between gap-4 rounded-2xl border-2 bg-white p-5 transition-shadow hover:shadow-md"
          style={{ borderColor: track.accentColor }}
        >
          <span>
            <span className="block text-base font-bold text-[var(--ink)]">🧪 {t("studio.trackCta")}</span>
            <span className="mt-1 block text-sm text-[var(--ink2)]">{t("studio.trackCtaBody")}</span>
          </span>
          <span className="flex shrink-0 gap-1 text-2xl" aria-hidden="true">
            {toolsForTrack(track.slug).slice(0, 4).map((x) => <span key={x.id}>{x.icon}</span>)}
          </span>
        </Link>
      )}

      {/* Certificate gates */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-base font-bold text-[var(--ink)]">{t("learn.gates.title")}</h2>
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
            {t("learn.trackHome.viewCertificate")} →
          </Link>
        ) : (
          gates.eligible && (
            <p className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
              {t("learn.gates.allMet")}
            </p>
          )
        )}
      </section>

      {/* Download for offline (components/learn/pwa, public/sw.js) */}
      <OfflineDownload
        trackSlug={track.slug}
        trackTitle={text?.title ?? track.title}
        accentColor={track.accentColor}
        modules={track.modules.map((m) => ({
          id: m.id,
          title: text?.modules[m.id]?.title ?? m.title,
          lessons: m.lessons.map((l) => ({ id: l.id, title: text?.lessons[l.id]?.title ?? l.title })),
        }))}
      />

      {/* Modules */}
      <section>
        <h2 className="text-base font-bold text-[var(--ink)]">{t("learn.catalog.modules")}</h2>
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
                    {mi + 1}. {text?.modules[m.id]?.title ?? m.title}
                  </h3>
                  <span className="flex items-center gap-3">
                    <a
                      href={`/api/learn/cheatsheet/${m.id}`}
                      download
                      data-testid="module-cheatsheet"
                      aria-label={t("learn.cheat.linkLabel", { module: text?.modules[m.id]?.title ?? m.title })}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-bold text-[var(--blue2)] hover:bg-[var(--s2)]"
                    >
                      <span aria-hidden="true">⬇</span> {t("learn.cheat.link")}
                    </a>
                    <span className="text-xs font-semibold text-[var(--ink3)]">
                      {t("learn.dash.lessonsFraction", { done: complete, total })}
                    </span>
                  </span>
                </div>
                <ModuleMasteryTag t={t} mastery={masteryOf.get(m.id)} quizId={m.quiz?.id ?? null} quizPassed={quizPassed} allDone={allDone} />

                <ul className="mt-3 space-y-1">
                  {m.lessons.map((l) => (
                    <li key={l.id}>
                      <Link
                        href={`/learn/lesson/${l.id}`}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-[var(--ink2)] hover:bg-[var(--s2)]"
                      >
                        <span
                          aria-hidden="true"
                          style={{ color: doneIds.has(l.id) || masteredIds.has(l.id) ? "#22A387" : "var(--ink3)" }}
                        >
                          {doneIds.has(l.id) ? "✓" : masteredIds.has(l.id) ? "★" : "○"}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{text?.lessons[l.id]?.title ?? l.title}</span>
                        {newIds.has(l.id) && <NewPill t={t} accentColor={track.accentColor} />}
                        <span className="sr-only">{doneIds.has(l.id) ? t("learn.lesson.completed") : masteredIds.has(l.id) ? t("mastery.lessonMastered") : ""}</span>
                        <span className="shrink-0 text-xs text-[var(--ink3)]">
                          {fmtMinutes(t, l.durationMinutes)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>

                {m.quiz && (
                  <div className="mt-3 border-t border-[var(--border)] pt-3">
                    {quizPassed ? (
                      <p className="text-xs font-semibold text-green-700">
                        ✓ {t("learn.trackHome.quizPassed")}{" "}
                        <Link href={`/learn/quiz/${m.quiz.id}`} className="underline">
                          {t("learn.trackHome.retake")}
                        </Link>
                      </p>
                    ) : allDone || triedQuizIds.has(m.quiz.id) ? (
                      <Link
                        href={`/learn/quiz/${m.quiz.id}`}
                        className="text-xs font-bold text-[var(--blue2)] underline"
                      >
                        {t("learn.trackHome.takeQuiz", { score: m.quiz.passScore })} →
                      </Link>
                    ) : (
                      <p className="text-xs text-[var(--ink3)]">
                        {t("learn.trackHome.quizLocked")}
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
          <h2 className="text-base font-bold text-[var(--ink)]">{t("learn.trackHome.labs")}</h2>
          <p className="mt-1 text-sm text-[var(--ink3)]">{t("learn.trackHome.labsIntro")}</p>
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
                      <span aria-hidden="true">{meta.icon}</span> {t(`learn.labType.${lab.labType in LAB_TYPE_META ? lab.labType : "prompt"}`)}
                    </span>
                    {passed && (
                      <span className="shrink-0 text-xs font-bold text-green-700">✓ {t("learn.trackHome.passed")}</span>
                    )}
                  </div>
                  <h3 className="mt-2.5 text-sm font-bold text-[var(--ink)]">{lab.title}</h3>
                  <p className="mt-1 text-xs text-[var(--ink3)]">
                    ~{fmtMinutes(t, lab.estimatedMinutes)} · {t("learn.trackHome.pts", { n: lab.points })}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Illustrative business cases (lib/learn/cases) */}
      <TrackCases t={t} locale={locale} slug={track.slug} accent={track.accentColor} />

      {/* Final exam + capstone */}
      <section className="grid gap-4 sm:grid-cols-2">
        {track.finalExam && (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <h3 className="text-sm font-bold text-[var(--ink)]">{text?.examTitle ?? track.finalExam.title}</h3>
            <p className="mt-1 text-xs text-[var(--ink3)]">
              {t("learn.trackHome.examMeta", {
                n: track.finalExam.questionsServed,
                time: fmtMinutes(t, track.finalExam.timeLimitMinutes),
                score: track.finalExam.passScore,
              })}
            </p>
            {gates.exam ? (
              <p className="mt-3 text-xs font-semibold text-green-700">✓ {t("learn.trackHome.passed")}</p>
            ) : gates.quizzes || owner ? (
              <Link
                href={`/learn/exam/${track.slug}`}
                className="mt-3 inline-block rounded-full bg-[var(--ink)] px-5 py-2 text-xs font-bold text-white"
              >
                {t("learn.trackHome.startExam")} →
              </Link>
            ) : (
              <p className="mt-3 text-xs text-[var(--ink3)]">
                {t("learn.trackHome.examLocked")}
              </p>
            )}
          </div>
        )}

        {track.capstone && (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <h3 className="text-sm font-bold text-[var(--ink)]">{t("learn.trackHome.capstone")}</h3>
            <p className="mt-1 text-xs text-[var(--ink3)]">{t("learn.trackHome.capstoneIntro")}</p>
            {gates.capstone ? (
              <p className="mt-3 text-xs font-semibold text-green-700">✓ {t("learn.trackHome.approved")}</p>
            ) : (
              <Link
                href={`/learn/capstone/${track.slug}`}
                className="mt-3 inline-block rounded-full bg-[var(--ink)] px-5 py-2 text-xs font-bold text-white"
              >
                {t("learn.trackHome.viewBrief")} →
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Quest map data ─────────────────────────────────────────────────────────

interface QuestTrack {
  id: string;
  slug: string;
  modules: Array<{
    id: string;
    title: string;
    lessons: Array<{ id: string; microCheck: { id: string } | null }>;
    quiz: { id: string } | null;
  }>;
  labs: Array<{ id: string; slug: string; points: number; moduleId: string | null; lesson: { moduleId: string } | null }>;
  finalExam: { id: string } | null;
  capstone: { id: string } | null;
}

async function buildQuest({
  studentId,
  track,
  titles,
  doneIds,
  passedQuizIds,
  passedLabIds,
  nextLessonId,
  gates,
  capstoneTitle,
}: {
  studentId: string;
  track: QuestTrack;
  titles: { modules: Record<string, { title?: string } | undefined>; exam: string };
  doneIds: Set<string>;
  passedQuizIds: Set<string>;
  passedLabIds: Set<string>;
  nextLessonId: string | null;
  gates: { exam: boolean; capstone: boolean };
  capstoneTitle: string;
}): Promise<{ modules: QuestModule[]; finals: QuestFinal[]; xp: { earned: number; available: number } }> {
  const labModule = (l: QuestTrack["labs"][number]) => l.moduleId ?? l.lesson?.moduleId ?? null;

  // Every ledger reference that belongs to this track, for "track XP".
  const lessonIds = track.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const microIds = track.modules.flatMap((m) => m.lessons.map((l) => l.microCheck?.id).filter(Boolean) as string[]);
  const quizIds = track.modules.map((m) => m.quiz?.id).filter(Boolean) as string[];
  const refs = [...lessonIds, ...microIds, ...quizIds, ...track.labs.map((l) => l.id), track.id];
  // Mastery paths: the "tested out" award is keyed on the module id.
  refs.push(...track.modules.map((m) => m.id));
  if (track.finalExam) refs.push(track.finalExam.id);
  const earnedSum = await prisma.pointsLedger.aggregate({
    where: { studentId, refId: { in: refs }, source: { not: "streak_bonus" } },
    _sum: { points: true },
  });
  const earned = earnedSum._sum.points ?? 0;
  const available =
    lessonIds.length * POINT_VALUES.lesson_complete +
    microIds.length * POINT_VALUES.micro_check_pass +
    quizIds.length * POINT_VALUES.quiz_perfect +
    track.labs.reduce((n, l) => n + l.points, 0) +
    (track.finalExam ? POINT_VALUES.final_exam_distinction : 0) +
    (track.capstone ? POINT_VALUES.capstone_pass : 0) +
    POINT_VALUES.track_complete;

  // Modules and their stars.
  const raw = track.modules.map((m) => {
    const labs = track.labs.filter((l) => labModule(l) === m.id);
    const lessonsDone = m.lessons.filter((l) => doneIds.has(l.id)).length;
    const quizPassed = m.quiz ? passedQuizIds.has(m.quiz.id) : false;
    const passedLab = labs.find((l) => passedLabIds.has(l.id));
    const stars = moduleStars({
      lessonsTotal: m.lessons.length,
      lessonsDone,
      hasQuiz: !!m.quiz,
      quizPassed,
      hasLab: labs.length > 0,
      labPassed: !!passedLab,
    });
    // Link to the next thing to do in this module.
    const nextLesson = m.lessons.find((l) => !doneIds.has(l.id));
    const href = nextLesson
      ? `/learn/lesson/${nextLesson.id}`
      : m.quiz && !quizPassed
      ? `/learn/quiz/${m.quiz.id}`
      : labs.length > 0 && !passedLab
      ? `/learn/lab/${labs[0].slug}`
      : m.lessons[0]
      ? `/learn/lesson/${m.lessons[0].id}`
      : `/learn/track/${track.slug}`;
    return {
      id: m.id,
      title: titles.modules[m.id]?.title ?? m.title,
      href,
      lessonsDone,
      lessonsTotal: m.lessons.length,
      stars,
      hasNext: !!nextLessonId && m.lessons.some((l) => l.id === nextLessonId),
    };
  });

  // "You are here": the module holding the next lesson, else the first
  // module still short of three stars, else the exam, else the capstone.
  let currentIdx = raw.findIndex((m) => m.hasNext);
  if (currentIdx < 0) currentIdx = raw.findIndex((m) => m.stars.count < 3);

  const modules: QuestModule[] = raw.map((m, i) => {
    const state: StageState =
      i === currentIdx ? "current" : m.stars.count === 3 ? "complete" : m.lessonsDone > 0 || m.stars.count > 0 ? "started" : "future";
    return { id: m.id, title: m.title, href: m.href, lessonsDone: m.lessonsDone, lessonsTotal: m.lessonsTotal, stars: m.stars, state };
  });

  const finals: QuestFinal[] = [];
  let hereTaken = currentIdx >= 0;
  if (track.finalExam) {
    const state: StageState = gates.exam ? "complete" : !hereTaken ? "current" : "future";
    if (state === "current") hereTaken = true;
    finals.push({ kind: "exam", title: titles.exam, href: `/learn/exam/${track.slug}`, state });
  }
  if (track.capstone) {
    const state: StageState = gates.capstone ? "complete" : !hereTaken ? "current" : "future";
    finals.push({ kind: "capstone", title: capstoneTitle, href: `/learn/capstone/${track.slug}`, state });
  }

  return { modules, finals, xp: { earned, available } };
}
