import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/server";
import { accessibleTrackIds } from "@/lib/learn/session";
import { communityTablesReady } from "@/lib/learn/community/db";
import { cohortEnded, listCohorts, myCohorts } from "@/lib/learn/community/cohorts";
import { threadCounts } from "@/lib/learn/community/discussion";
import { nextSession } from "@/lib/learn/community/shared";
import JoinCohortButton from "./JoinCohortButton";
import SessionTime from "./SessionTime";

// Track page: the learner's cohort (or open cohorts to join) and the track's
// discussion. Never breaks the track page: on any failure it renders nothing.
export default async function TrackCommunityCards({
  studentId,
  trackId,
  slug,
  accent,
}: {
  studentId: string;
  trackId: string;
  slug: string;
  accent: string;
}) {
  if (!(await communityTablesReady())) return null;
  try {
    const open = await accessibleTrackIds(studentId);
    const tracks = open === "all" ? "all" : open;
    const [t, locale, mine, all, counts] = await Promise.all([
      getT(),
      getLocale(),
      myCohorts(studentId, trackId),
      listCohorts({ trackId }),
      threadCounts(studentId, tracks, trackId),
    ]);
    const mineIds = new Set(mine.map((c) => c.id));
    const joinable = all.filter((c) => !mineIds.has(c.id) && c.enrolmentOpen && !cohortEnded(c)).slice(0, 3);
    const fmt = (d: Date) => d.toLocaleDateString(locale, { timeZone: "UTC", day: "numeric", month: "short" });

    return (
      <section className="grid gap-4 sm:grid-cols-2" aria-label={t("community.nav")}>
        <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">
            <span aria-hidden="true">👥 </span>
            {t("community.cohort.cardTitle")}
          </p>
          {mine.length > 0 ? (
            <div className="mt-2 space-y-3">
              {mine.map((c) => {
                const s = nextSession(c);
                return (
                  <div key={c.id}>
                    <p className="text-sm font-bold text-[var(--ink)]">{c.name}</p>
                    {s && (
                      <p className="mt-0.5 text-xs text-[var(--ink2)]">
                        {t("community.cohort.nextSession")}: <SessionTime iso={s.start.toISOString()} timezone={c.timezone} withLocal={false} />
                      </p>
                    )}
                    <Link
                      href={`/learn/community/cohort/${c.id}`}
                      className="mt-2 inline-flex min-h-[40px] items-center rounded-full px-5 py-2 text-sm font-bold text-white"
                      style={{ background: accent }}
                    >
                      {t("community.cohort.open")} →
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : joinable.length > 0 ? (
            <ul className="mt-2 space-y-3">
              {joinable.map((c) => {
                const full = c.memberCount >= c.capacity;
                return (
                  <li key={c.id} className="rounded-xl border border-[var(--border)] p-3">
                    <p className="text-sm font-bold text-[var(--ink)]">
                      <Link href={`/learn/community/cohort/${c.id}`} className="hover:underline">
                        {c.name}
                      </Link>
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--ink3)]">
                      {fmt(c.startDate)} – {fmt(c.endDate)} ·{" "}
                      {full ? t("community.cohort.full") : t("community.cohort.seatsLeft", { n: c.capacity - c.memberCount })}
                    </p>
                    {c.priceNote && <p className="mt-0.5 text-xs text-[var(--ink2)]">{c.priceNote}</p>}
                    <div className="mt-2">
                      <JoinCohortButton cohortId={c.id} member={false} disabled={full} goTo={`/learn/community/cohort/${c.id}`} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--ink2)]">{t("community.cohort.noneOpen")}</p>
          )}
        </div>

        <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">
            <span aria-hidden="true">💬 </span>
            {t("community.discussion")}
          </p>
          <p className="mt-1 text-xl font-black text-[var(--ink)]">
            {t(counts.total === 1 ? "community.threads.one" : "community.threads.other", { n: counts.total })}
          </p>
          <p className="mt-1 text-xs text-[var(--ink2)]">
            {counts.unanswered > 0 ? t("community.unansweredCount", { n: counts.unanswered }) : t("community.trackCardBody")}
          </p>
          <Link
            href={`/learn/community/track/${slug}`}
            className="mt-4 inline-flex min-h-[40px] w-fit items-center rounded-full border border-[var(--border)] px-5 py-2 text-sm font-semibold text-[var(--ink)] hover:border-[var(--ink3)]"
          >
            {t("community.openDiscussion")} →
          </Link>
        </div>
      </section>
    );
  } catch (err) {
    console.error("[community] track cards", err);
    return null;
  }
}
