import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { canAccessTrack, getAccess, getStudent } from "@/lib/learn/session";
import { trackPrices } from "@/lib/learn/catalog";
import { fmtPrice } from "@/lib/learn/format";
import { getAllTrackProgress } from "@/lib/learn/progress";
import { computeStreak, getTotalPoints, levelFor } from "@/lib/learn/points";
import { fmtDate, fmtMinutes, fmtNumber, rankName } from "@/lib/learn/format";
import ProgressRing from "@/components/learn/ProgressRing";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadTrackSources, localizedTracks } from "@/lib/i18n/sources/learn";
import type { Metadata } from "next";
import { computeBadges, type BadgeStatus } from "@/lib/learn/badges";
import { rankIcon } from "@/lib/learn/badge-defs";
import DailyPanel from "@/components/learn/game/DailyPanel";
import BadgeShelf from "@/components/learn/game/BadgeShelf";
import MethodDashboardCards from "@/components/learn/method/MethodDashboardCards";
import DashboardCommunityCards from "@/components/learn/community/DashboardCommunityCards";
import DashboardLiveCard from "@/components/learn/live/DashboardLiveCard";
import MasteryDashboard from "@/components/learn/mastery/MasteryDashboard";
import ResumeCard from "@/components/learn/ResumeCard";
import { NewLessonsChip } from "@/components/learn/NewLessons";
import { newLessonsByTrack } from "@/lib/learn/track-updates";
import TeamDashboardCard from "@/components/learn/team/TeamDashboardCard";
import YoureInBanner from "@/components/learn/join/YoureInBanner";
import PendingEnrollmentCard from "@/components/learn/join/PendingEnrollmentCard";
import InstallHint from "@/components/learn/pwa/InstallHint";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.dash.metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function LearnDashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  // ?welcome=1: just paid (app/api/learn/checkout/confirm): "You're in".
  const welcome = (await searchParams).welcome === "1";
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  // Gamification reads are independent of everything else here and of each
  // other, so they join the same batch; each falls back to "nothing yet" so a
  // failure never takes the dashboard down with it.
  const since = new Date(Date.now() - 8 * 86_400_000);
  const [access, prices] = await Promise.all([getAccess(student.id), trackPrices()]);
  const [rawTracks, total, streak, certificates, t, locale, badges, recentLessons, recentXp] = await Promise.all([
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
    computeBadges(student.id).catch((err): BadgeStatus[] | null => {
      console.error("[dashboard] badges", err);
      return null;
    }),
    prisma.lessonProgress
      .findMany({ where: { studentId: student.id, completedAt: { gte: since } }, select: { completedAt: true } })
      .catch(() => []),
    prisma.pointsLedger
      .findMany({ where: { studentId: student.id, createdAt: { gte: since } }, select: { createdAt: true } })
      .catch(() => []),
  ]);

  // Track titles in the learner's language (cached translations; any not
  // ready yet show in English and are queued).
  const { texts, pending } = await localizedTracks(
    locale === "en" ? [] : await loadTrackSources({ id: { in: rawTracks.map((x) => x.track.id) } }),
    locale,
  );
  const tracks = rawTracks.map((x) => ({
    ...x,
    open: canAccessTrack(access, x.track.id),
    track: { ...x.track, title: texts.get(x.track.slug)?.title ?? x.track.title },
  }));
  // Open tracks first; locked ones follow with their price.
  tracks.sort((a, b) => Number(b.open) - Number(a.open));

  const level = levelFor(total);
  const openTracks = tracks.filter((x) => x.open);
  const started = openTracks.filter((t) => t.progress.completedLessons > 0);
  const continueWith = [...started].sort((a, b) => b.progress.percent - a.progress.percent)[0] ?? openTracks[0];
  // Lessons added to modules the learner had finished ("New" on the cards),
  // and localized lesson titles for the resume card.
  const newByTrack = await newLessonsByTrack(student.id, openTracks.map((x) => x.track.id));
  const lessonTitles = new Map([...texts].map(([slug, tx]) => [slug, tx.lessons]));

  return (
    <div className="space-y-8">
      {welcome && (
        <YoureInBanner
          trackTitle={access.all ? null : openTracks[0]?.track.title ?? null}
          startHref={access.all ? "/learn/tracks" : openTracks[0] ? `/learn/track/${openTracks[0].track.slug}` : "/learn/tracks"}
          closeHref="/learn"
          lifetime={!access.all}
        />
      )}
      {/* One-page join flow: a plan chosen but not paid yet (nothing otherwise). */}
      <PendingEnrollmentCard studentId={student.id} />
      {/* Greeting + stats */}
      <section>
        <h1 className="text-2xl font-black text-[var(--ink)]">
          {t(started.length > 0 ? "learn.dash.welcomeBack" : "learn.dash.welcome", { name: student.name.split(" ")[0] })}
        </h1>
        {/* First visit: a quiet link to install the app (nothing once installed). */}
        {started.length === 0 && <InstallHint />}
        {pending && (
          <p role="status" className="mt-2 text-xs text-[var(--ink3)]">
            {t("common.translationPending")}
          </p>
        )}
        {/* Team plans: "Your team learning plan", at the top (nothing without a team) */}
        <div className="mt-5 empty:hidden">
          <TeamDashboardCard studentId={student.id} />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{t("learn.dash.points")}</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-black text-[var(--ink)]">
              <span aria-hidden="true" className="text-xl">{rankIcon(level.index)}</span>
              {t("game.xp", { n: fmtNumber(total, locale) })}
            </p>
            <p className="mt-2 text-xs text-[var(--ink2)]">
              <strong>{t("game.rank.current", { rank: rankName(t, level.index) })}</strong>
              {level.next != null
                ? ` · ${t("game.rank.toNext", { n: fmtNumber(level.pointsToNext, locale), rank: rankName(t, level.index + 1) })}`
                : ` · ${t("game.rank.max")}`}
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


      {/* Daily goal + last 7 days */}
      <section aria-label={t("game.daily.section")}>
        <DailyPanel
          lessonTimes={recentLessons.map((r) => r.completedAt.toISOString())}
          activityTimes={recentXp.map((r) => r.createdAt.toISOString())}
        />
        <p className="mt-2 text-right text-xs">
          <Link href="/learn/leaderboard" className="font-semibold text-[var(--blue2)] underline">
            {t("game.board.link")} →
          </Link>
        </p>
      </section>

      {/* Daily Review + Portfolio (the TIBLOGICS Learn method) */}
      <MethodDashboardCards studentId={student.id} />

      {/* Cohorts and community (components/learn/community) */}
      {/* Next live expert session (components/learn/live) */}
      <DashboardLiveCard studentId={student.id} />

      <DashboardCommunityCards studentId={student.id} />

      {/* Weak spots + "My mastery" (mastery paths) */}
      <MasteryDashboard studentId={student.id} />

      {/* Continue where you left off: the exact next thing (lesson part-read,
          lab, exam or Studio design in progress, else the next lesson) */}
      <ResumeCard studentId={student.id} tracks={openTracks} fallback={continueWith} lessonTitles={lessonTitles} />

      {/* Track progress */}
      <section>
        <h2 className="text-lg font-bold text-[var(--ink)]">{t("learn.dash.yourTracks")}</h2>
        {tracks.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--ink3)]">
            {t("learn.dash.noTracks")}
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map(({ track, progress, open }) => (
              <Link
                key={track.id}
                href={`/learn/track/${track.slug}`}
                className={`flex min-w-0 items-center gap-4 rounded-2xl border bg-white p-5 transition-shadow hover:shadow-md ${
                  open ? "border-[var(--border)]" : "border-dashed border-[var(--border)]"
                }`}
              >
                <ProgressRing percent={progress.percent} color={open ? track.accentColor : "#9AA8B8"} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[var(--ink)]">
                    {track.title}
                  </span>
                  {!open && (
                    <span className="mt-1 block text-xs font-semibold text-[var(--ink2)]">
                      🔒 {t("learn.locked.badge")} · {t("learn.offer.trackLine", { price: fmtPrice(prices.get(track.id) ?? 0, locale) })}
                    </span>
                  )}
                  <span className="mt-1 block text-xs text-[var(--ink3)]">
                    {t("learn.dash.lessonsFraction", { done: progress.completedLessons, total: progress.totalLessons })}
                  </span>
                  {progress.minutesRemaining > 0 && (
                    <span className="mt-0.5 block text-xs text-[var(--ink3)]">
                      {t("learn.time.left", { time: fmtMinutes(t, progress.minutesRemaining) })}
                    </span>
                  )}
                  {open && (
                    <NewLessonsChip
                      t={t}
                      lessons={newByTrack.get(track.id) ?? []}
                      titles={texts.get(track.slug)?.lessons}
                      accentColor={track.accentColor}
                    />
                  )}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Badges */}
      {badges && <BadgeShelf badges={badges} />}

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
