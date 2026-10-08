import Link from "next/link";
import { trackMonthlyCents } from "@/lib/learn/track-monthly";
import { redirect } from "next/navigation";
import { canAccessTrack, getAccess, getStudent } from "@/lib/learn/session";
import { PLANS } from "@/lib/payments/provider";
import { fmtPrice } from "@/lib/learn/format";
import { getAllTrackProgress } from "@/lib/learn/progress";
import type { Metadata } from "next";
import { fmtBreakdown, fmtMinutes } from "@/lib/learn/format";
import { getCatalog } from "@/lib/learn/catalog";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadTrackSources, localizedTracks } from "@/lib/i18n/sources/learn";
import ProgressRing from "@/components/learn/ProgressRing";
import CertificationLadder from "@/components/learn/CertificationLadder";
import { LEVEL_SLUGS } from "@/lib/learn/levels";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.tracks.metaTitle") };
}

export default async function MyTracksPage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  const [access, rawTracks, certs, catalog, t, locale] = await Promise.all([
    getAccess(student.id),
    getAllTrackProgress(student.id),
    prisma.learnCertificate.findMany({
      where: { studentId: student.id, revoked: false },
      select: { track: { select: { slug: true } } },
    }),
    getCatalog(),
    getT(),
    getLocale(),
  ]);
  const { texts, pending } = await localizedTracks(
    locale === "en" ? [] : await loadTrackSources({ id: { in: rawTracks.map((x) => x.track.id) } }),
    locale,
  );
  const tracks = rawTracks.map((x) => ({
    ...x,
    open: canAccessTrack(access, x.track.id),
    track: { ...x.track, title: texts.get(x.track.slug)?.title ?? x.track.title },
  }));
  // Lesson and hands-on minutes, for "About X hours: Y of lessons, Z hands-on".
  const time = new Map(catalog.map((c) => [c.slug, c]));
  const certified = new Set(certs.map((c) => c.track.slug));
  const progress = Object.fromEntries(
    tracks.map(({ track, progress: pr }) => [
      track.slug,
      { percent: pr.percent, started: pr.completedLessons > 0, certified: certified.has(track.slug) },
    ]),
  );
  // The three levels are shown as a path; anything else is listed below it.
  const others = tracks.filter(({ track }) => !LEVEL_SLUGS.has(track.slug));

  return (
    <div>
      <h1 className="text-2xl font-black text-[var(--ink)]">{t("learn.nav.myTracks")}</h1>
      <p className="mt-1 text-sm text-[var(--ink3)]">{t(access.all ? "learn.tracks.intro" : "learn.tracks.introSome")}</p>
      {pending && (
        <p role="status" className="mt-2 text-xs text-[var(--ink3)]">
          {t("common.translationPending")}
        </p>
      )}

      <div className="mt-6">
        <CertificationLadder
          mode="learner"
          progress={progress}
          monthlyCents={PLANS.monthly.amount}
          tracks={tracks.map(({ track, open }) => ({
            locked: !open,
            priceCents: time.get(track.slug)?.priceCents,
            slug: track.slug,
            title: track.title,
            accentColor: track.accentColor,
            certificateName: track.certificateName,
            estimatedHours: track.estimatedHours,
            lessonMinutes: time.get(track.slug)?.lessonMinutes,
            handsOnMinutes: time.get(track.slug)?.handsOnMinutes,
          }))}
        />
      </div>

      {others.length > 0 && <h2 className="mt-10 text-lg font-bold text-[var(--ink)]">{t("learn.tracks.more")}</h2>}

      {others.length > 0 && (
        <div className="mt-4 space-y-4">
          {others.map(({ track, progress, open }) => (
            <Link
              key={track.id}
              href={`/learn/track/${track.slug}`}
              className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-[var(--border)] bg-white p-5 transition-shadow hover:shadow-md"
            >
              <ProgressRing percent={progress.percent} color={track.accentColor} size={64} />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-[var(--ink)]">{track.title}</h2>
                <p className="mt-1 text-xs text-[var(--ink3)]">
                  {t("learn.dash.lessonsFraction", { done: progress.completedLessons, total: progress.totalLessons })}
                  {progress.minutesRemaining > 0 &&
                    ` · ${t("learn.time.remaining", { time: fmtMinutes(t, progress.minutesRemaining) })}`}
                </p>
                {time.get(track.slug) && (
                  <p className="mt-1 text-xs text-[var(--ink3)]">{fmtBreakdown(t, locale, time.get(track.slug)!)}</p>
                )}
                <p className="mt-1 text-xs text-[var(--ink3)]">{track.certificateName}</p>
                {!open && time.get(track.slug) && (
                  <p className="mt-2 text-xs font-semibold text-[var(--ink2)]">
                    🔒 {t("learn.locked.badge")} · {t("learn.offer.trackLine", { price: fmtPrice(time.get(track.slug)!.priceCents, locale) })} ·{" "}
                    {trackMonthlyCents(track.slug) != null
                      ? t("learn.offer.orMonthlyLine", { price: fmtPrice(trackMonthlyCents(track.slug) as number, locale) })
                      : t("learn.offer.orAllLine", { price: fmtPrice(PLANS.monthly.amount, locale) })}
                  </p>
                )}
              </div>
              <span className="w-full text-sm font-bold sm:w-auto" style={{ color: track.accentColor }}>
                {!open
                  ? t("learn.locked.unlock")
                  : progress.completedLessons === 0
                    ? t("learn.ladder.start")
                    : t("learn.ladder.continue")}{" "}
                →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
