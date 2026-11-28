import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStudent, hasTrackAccess } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { communityTablesReady } from "@/lib/learn/community/db";
import {
  announcements,
  cohortEnded,
  getCohort,
  isMember,
  memberProgress,
  planModules,
  publicMembers,
} from "@/lib/learn/community/cohorts";
import { cohortSessions, currentWeek, expectedPercent, nextSession, weekPlan } from "@/lib/learn/community/shared";
import { trackTexts } from "@/lib/learn/community/text";
import JoinCohortButton from "@/components/learn/community/JoinCohortButton";
import SessionTime from "@/components/learn/community/SessionTime";
import DiscussionSection from "@/components/learn/community/DiscussionSection";
import PostBody from "@/components/learn/community/PostBody";
import ProgressRing from "@/components/learn/ProgressRing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = (await communityTablesReady()) ? await getCohort(id).catch(() => null) : null;
  return { title: c?.name ?? (await getT())("community.cohort.cardTitle") };
}

// A cohort: schedule (week plan from the track's modules and the dates),
// the next live session (join link for members only), announcements,
// recordings, members (first name + last initial), progress and the
// cohort's own discussion. Anyone who can open the track sees the schedule
// and can join while enrolment is open; the rest is for members.
export default async function CohortPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  if (!(await communityTablesReady())) notFound();
  const cohort = await getCohort(id);
  if (!cohort) notFound();
  const [t, locale] = await Promise.all([getT(), getLocale()]);

  if (!(await hasTrackAccess(student.id, cohort.trackId))) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[var(--border)] bg-white p-6 text-center">
        <p className="text-sm font-semibold text-[var(--ink)]">{t("community.err.trackLocked")}</p>
        <Link href="/learn/tracks" className="mt-4 inline-block text-sm font-semibold text-[var(--blue2)] underline">
          {t("community.backToTracks")}
        </Link>
      </div>
    );
  }

  const member = await isMember(cohort.id, student.id);
  const [text, mods, progress, members, news] = await Promise.all([
    trackTexts([cohort.trackId], locale).then((m) => m.get(cohort.trackId)),
    planModules(cohort.trackId),
    memberProgress(cohort.id, cohort.trackId),
    member ? publicMembers(cohort.id) : Promise.resolve([]),
    member ? announcements(cohort.id) : Promise.resolve([]),
  ]);

  const plan = weekPlan(cohort, mods);
  const sessions = cohortSessions(cohort);
  const next = nextSession(cohort);
  const week = currentWeek(cohort);
  const ended = cohortEnded(cohort);
  const full = cohort.memberCount >= cohort.capacity;
  const pct = (n: number) => (progress.total ? Math.round((n / progress.total) * 100) : 0);
  const memberPcts = [...progress.done.values()].map(pct);
  const average = cohort.memberCount ? Math.round(memberPcts.reduce((a, b) => a + b, 0) / cohort.memberCount) : 0;
  const mine = pct(progress.done.get(student.id) ?? 0);
  const expected = expectedPercent(plan, week, progress.total);
  const day = (d: Date) => d.toLocaleDateString(locale, { timeZone: "UTC", day: "numeric", month: "short" });
  const accent = "#F47C20";
  const trackTitle = text?.title ?? "";

  return (
    <div className="space-y-6">
      <nav aria-label={t("community.breadcrumb")} className="text-sm text-[var(--ink3)]">
        <Link href="/learn/community" className="hover:text-[var(--ink)]">
          {t("community.nav")}
        </Link>
        {text && (
          <>
            <span className="mx-2" aria-hidden="true">/</span>
            <Link href={`/learn/track/${text.slug}`} className="hover:text-[var(--ink)]">
              {trackTitle}
            </Link>
          </>
        )}
      </nav>

      {/* Header */}
      <header className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{t("community.cohort.cardTitle")}</p>
            <h1 className="mt-1 text-2xl font-black text-[var(--ink)] [overflow-wrap:anywhere]">{cohort.name}</h1>
            <p className="mt-1 text-sm text-[var(--ink2)]">
              {trackTitle} · {day(cohort.startDate)} – {day(cohort.endDate)} ·{" "}
              {t(plan.length === 1 ? "community.cohort.weeks.one" : "community.cohort.weeks.other", { n: plan.length })}
            </p>
            <p className="mt-1 text-xs text-[var(--ink3)]">
              {t("community.cohort.membersCount", { n: cohort.memberCount, cap: cohort.capacity })}
              {" · "}
              {ended
                ? t("community.cohort.ended")
                : cohort.enrolmentOpen
                ? full
                  ? t("community.cohort.full")
                  : t("community.cohort.enrolmentOpen")
                : t("community.cohort.enrolmentClosed")}
              {cohort.priceNote && <> · {cohort.priceNote}</>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {member && (
              <a
                href={`/api/learn/community/cohorts/${cohort.id}/ics`}
                className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink2)] hover:border-[var(--ink3)]"
              >
                📅 {t("community.cohort.addToCalendar")}
              </a>
            )}
            {(member || (!ended && cohort.enrolmentOpen)) && (
              <JoinCohortButton cohortId={cohort.id} member={member} disabled={!member && full} />
            )}
          </div>
        </div>
        {member && (
          <p role="status" className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-800">
            ✓ {t("community.cohort.youAreMember")}
          </p>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Next live session */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t("community.cohort.nextSession")}</h2>
          {next ? (
            <>
              <p className="mt-2 text-sm text-[var(--ink)]">
                <SessionTime iso={next.start.toISOString()} timezone={cohort.timezone} />
              </p>
              <p className="mt-1 text-xs text-[var(--ink3)]">
                {t("community.cohort.liveSessionWeek", { n: next.week })} · {t("community.cohort.minutes", { n: cohort.sessionMinutes })}
              </p>
              {member ? (
                cohort.meetingUrl ? (
                  <a
                    href={cohort.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-[40px] items-center rounded-full px-5 py-2 text-sm font-bold text-white"
                    style={{ background: accent }}
                  >
                    {t("community.cohort.joinLive")} ↗
                  </a>
                ) : (
                  <p className="mt-3 text-xs text-[var(--ink3)]">{t("community.cohort.linkSoon")}</p>
                )
              ) : (
                <p className="mt-3 text-xs text-[var(--ink3)]">{t("community.cohort.linkMembersOnly")}</p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-[var(--ink2)]">{t("community.cohort.noMoreSessions")}</p>
          )}
        </section>

        {/* Progress */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t("community.cohort.progress")}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-5">
            {member && (
              <div className="flex items-center gap-3">
                <ProgressRing percent={mine} color={accent} size={60} />
                <div>
                  <p className="text-xs text-[var(--ink3)]">{t("community.cohort.yourProgress")}</p>
                  <p className="text-lg font-black text-[var(--ink)]">{mine}%</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <ProgressRing percent={average} color="#3B82F6" size={60} />
              <div>
                <p className="text-xs text-[var(--ink3)]">{t("community.cohort.average")}</p>
                <p className="text-lg font-black text-[var(--ink)]">{average}%</p>
              </div>
            </div>
          </div>
          {week >= 2 && !ended && (
            <p className="mt-3 text-xs text-[var(--ink2)]">
              {t("community.cohort.expected", { n: expected })}
              {member && mine + 10 < expected && <span className="font-semibold text-amber-800"> · {t("community.cohort.behind")}</span>}
            </p>
          )}
          {week === 0 && <p className="mt-3 text-xs text-[var(--ink3)]">{t("community.cohort.notStarted")}</p>}
        </section>
      </div>

      {/* Announcements */}
      {member && news.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-sm font-bold text-[var(--ink)]">📣 {t("community.cohort.announcements")}</h2>
          <ul className="mt-3 space-y-3">
            {news.map((a) => (
              <li key={a.id} className="rounded-xl bg-[var(--s2)] p-3">
                <p className="text-xs text-[var(--ink3)]">
                  {t("community.cohort.fromTeam")} · {a.createdAt.toLocaleDateString(locale, { dateStyle: "medium" })}
                </p>
                <div className="mt-1">
                  <PostBody source={a.bodyMd} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Schedule */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">{t("community.cohort.schedule")}</h2>
        <p className="mt-1 text-xs text-[var(--ink3)]">{t("community.cohort.scheduleIntro")}</p>
        <ol className="mt-4 space-y-2">
          {plan.map((w) => {
            const s = sessions.find((x) => x.week === w.week);
            const current = w.week === week && !ended;
            return (
              <li
                key={w.week}
                aria-current={current ? "step" : undefined}
                className={`rounded-xl border p-3 ${current ? "border-[var(--orange)] bg-[var(--orange)]/5" : "border-[var(--border)]"}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-[var(--ink)]">
                    {t("community.cohort.week", { n: w.week })}
                    {current && <span className="ml-2 text-xs font-semibold text-[var(--orange)]">{t("community.cohort.thisWeek")}</span>}
                  </p>
                  <p className="text-xs text-[var(--ink3)]">
                    {day(w.from)} – {day(w.to)}
                  </p>
                </div>
                {w.modules.length > 0 ? (
                  <ul className="mt-1 text-sm text-[var(--ink2)]">
                    {w.modules.map((m) => (
                      <li key={m.id}>• {text?.modules[m.id]?.title ?? m.title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-[var(--ink3)]">{t("community.cohort.catchUp")}</p>
                )}
                {s && (
                  <p className="mt-1 text-xs text-[var(--ink3)]">
                    🎥 <SessionTime iso={s.start.toISOString()} timezone={cohort.timezone} withLocal={false} />
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {member && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Recordings */}
          <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-bold text-[var(--ink)]">{t("community.cohort.recordings")}</h2>
            {cohort.recordings.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--ink3)]">{t("community.cohort.noRecordings")}</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {cohort.recordings.map((r, i) => (
                  <li key={i} className="text-sm">
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--blue2)] underline">
                      {r.title}
                    </a>
                    <span className="ml-2 text-xs text-[var(--ink3)]">{new Date(r.addedAt).toLocaleDateString(locale, { dateStyle: "medium" })}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Members */}
          <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-bold text-[var(--ink)]">{t("community.cohort.members")}</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {members.map((m) => (
                <li
                  key={m.id}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${m.id === student.id ? "bg-[var(--ink)] text-white" : "bg-[var(--s2)] text-[var(--ink2)]"}`}
                >
                  {m.name || t("community.learner")}
                  {m.id === student.id && ` (${t("community.you")})`}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {member && (
        <DiscussionSection studentId={student.id} trackId={cohort.trackId} cohortId={cohort.id} heading={t("community.cohort.discussion")} />
      )}
    </div>
  );
}
