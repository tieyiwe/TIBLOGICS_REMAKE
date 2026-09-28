import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { getAllTrackProgress } from "@/lib/learn/progress";
import { computeStreak, getTotalPoints, levelFor } from "@/lib/learn/points";
import { fmtDate, fmtMinutes, fmtNumber, rankName } from "@/lib/learn/format";
import ProgressRing from "@/components/learn/ProgressRing";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadTrackSources, localizedTracks } from "@/lib/i18n/sources/learn";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.dash.metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function LearnDashboard() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  const [rawTracks, total, streak, certificates, t, locale] = await Promise.all([
    getAllTrackProgress(student.id),
    getTotalPoints(student.id),
    computeStreak(student.id),
    prisma.learnCertificate
      .findMany({
        where: { studentId: student.id, revoked: false },
        orderBy: { issuedAt: "desc" },
        select: { id: true, certificateName: true, verificationId: true, distinction: true, issuedAt: true },
      })
      .catch(() => []),
    getT(),
    getLocale(),
  ]);

  // Track titles in the learner's language (cached translations; any not
  // ready yet show in English and are queued).
  const { texts, pending } = await localizedTracks(
    locale === "en" ? [] : await loadTrackSources({ id: { in: rawTracks.map((x) => x.track.id) } }),
    locale,
  );
  const tracks = rawTracks.map((x) => ({ ...x, track: { ...x.track, title: texts.get(x.track.slug)?.title ?? x.track.title } }));

  const level = levelFor(total);
  const started = tracks.filter((t) => t.progress.completedLessons > 0);
  const continueWith = started.sort((a, b) => b.progress.percent - a.progress.percent)[0] ?? tracks[0];

  return (
    <div className="space-y-8">
      {/* Greeting + stats */}
      <section>
        <h1 className="text-2xl font-black text-[var(--ink)]">
          {t(started.length > 0 ? "learn.dash.welcomeBack" : "learn.dash.welcome", { name: student.name.split(" ")[0] })}
        </h1>
        {pending && (
          <p role="status" className="mt-2 text-xs text-[var(--ink3)]">
            {t("common.translationPending")}
          </p>
        )}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{t("learn.dash.points")}</p>
            <p className="mt-1 text-2xl font-black text-[var(--ink)]">{fmtNumber(total, locale)}</p>
            <p className="mt-2 text-xs text-[var(--ink2)]">
              <strong>{rankName(t, level.index)}</strong>
              {level.next != null && ` · ${t("learn.dash.toNextLevel", { n: fmtNumber(level.pointsToNext, locale) })}`}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--s3)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738]"
                style={{ width: `${Math.round(level.progress * 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{t("learn.dash.streak")}</p>
            <p className="mt-1 text-2xl font-black text-[var(--ink)]">
              {t(streak === 1 ? "learn.dash.days.one" : "learn.dash.days.other", { n: streak })}
            </p>
            <p className="mt-2 text-xs text-[var(--ink2)]">
              {streak === 0
                ? t("learn.dash.streakNone")
                : streak < 7
                ? t(7 - streak === 1 ? "learn.dash.streakMore.one" : "learn.dash.streakMore.other", { n: 7 - streak })
                : t("learn.dash.streakBonusEarned")}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">
              {t("learn.dash.certificates")}
            </p>
            <p className="mt-1 text-2xl font-black text-[var(--ink)]">{certificates.length}</p>
            <p className="mt-2 text-xs text-[var(--ink2)]">
              {certificates.length === 0 ? t("learn.dash.earnFirstCertificate") : t("learn.dash.certificatesPermanent")}
            </p>
          </div>
        </div>
      </section>

      {/* Continue learning */}
      {continueWith && continueWith.progress.nextLessonId && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--ink)] p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-wide text-white/50">
            {continueWith.progress.completedLessons > 0 ? t("learn.dash.continueLearning") : t("learn.dash.startHere")}
          </p>
          <h2 className="mt-2 text-xl font-bold">{continueWith.track.title}</h2>
          <p className="mt-1 text-sm text-white/60">
            {t("learn.dash.lessonsDone", { done: continueWith.progress.completedLessons, total: continueWith.progress.totalLessons })} ·{" "}
            {t("learn.time.remaining", { time: fmtMinutes(t, continueWith.progress.minutesRemaining) })}
          </p>
          <Link
            href={`/learn/lesson/${continueWith.progress.nextLessonId}`}
            className="mt-5 inline-block rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-6 py-3 text-sm font-bold text-[var(--ink)] transition-opacity hover:opacity-90"
          >
            {continueWith.progress.completedLessons > 0 ? t("learn.dash.resume") : t("learn.dash.begin")} →
          </Link>
        </section>
      )}

      {/* Track progress */}
      <section>
        <h2 className="text-lg font-bold text-[var(--ink)]">{t("learn.dash.yourTracks")}</h2>
        {tracks.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--ink3)]">
            {t("learn.dash.noTracks")}
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map(({ track, progress }) => (
              <Link
                key={track.id}
                href={`/learn/track/${track.slug}`}
                className="flex min-w-0 items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 transition-shadow hover:shadow-md"
              >
                <ProgressRing percent={progress.percent} color={track.accentColor} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[var(--ink)]">
                    {track.title}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--ink3)]">
                    {t("learn.dash.lessonsFraction", { done: progress.completedLessons, total: progress.totalLessons })}
                  </span>
                  {progress.minutesRemaining > 0 && (
                    <span className="mt-0.5 block text-xs text-[var(--ink3)]">
                      {t("learn.time.left", { time: fmtMinutes(t, progress.minutesRemaining) })}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Certificate shelf */}
      {certificates.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-[var(--ink)]">{t("learn.dash.yourCertificates")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {certificates.map((c) => (
              <Link
                key={c.id}
                href={`/certificates/${c.verificationId}`}
                className="rounded-2xl border border-[var(--border)] bg-white p-5 transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-bold text-[var(--ink)]">{c.certificateName}</p>
                <p className="mt-1 text-xs text-[var(--ink3)]">
                  {t("learn.cert.issuedOn", { date: fmtDate(c.issuedAt, locale) })}
                  {c.distinction && (
                    <span className="ml-2 rounded bg-[var(--orange-light)] px-1.5 py-0.5 font-bold text-[var(--orange2)]">
                      {t("learn.cert.withDistinction")}
                    </span>
                  )}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
