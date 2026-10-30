import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { communityTablesReady } from "@/lib/learn/community/db";
import { myCohorts } from "@/lib/learn/community/cohorts";
import { nextSession } from "@/lib/learn/community/shared";
import prisma from "@/lib/prisma";
import SessionTime from "./SessionTime";

// Dashboard: the learner's cohorts with their next live session, and a way
// into the community. Renders nothing on failure.
export default async function DashboardCommunityCards({ studentId }: { studentId: string }) {
  if (!(await communityTablesReady())) return null;
  try {
    const [t, cohorts] = await Promise.all([getT(), myCohorts(studentId)]);
    const upcoming = cohorts
      .map((c) => ({ c, s: nextSession(c) }))
      .filter((x) => x.s)
      .sort((a, b) => a.s!.start.getTime() - b.s!.start.getTime());
    const first = upcoming[0] ?? (cohorts[0] ? { c: cohorts[0], s: null } : null);
    const track = first ? await prisma.learnTrack.findUnique({ where: { id: first.c.trackId }, select: { title: true } }) : null;

    return (
      <section className="grid gap-4 sm:grid-cols-2" aria-label={t("community.nav")}>
        <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">
            <span aria-hidden="true">👥 </span>
            {t("community.cohort.cardTitle")}
          </p>
          {first ? (
            <>
              <p className="mt-1 text-xl font-black text-[var(--ink)]">{first.c.name}</p>
              {track && <p className="text-xs text-[var(--ink3)]">{track.title}</p>}
              {first.s && (
                <p className="mt-1 text-xs text-[var(--ink2)]">
                  {t("community.cohort.nextSession")}: <SessionTime iso={first.s.start.toISOString()} timezone={first.c.timezone} withLocal={false} />
                </p>
              )}
              <Link
                href={`/learn/community/cohort/${first.c.id}`}
                className="mt-4 inline-flex min-h-[44px] w-fit items-center rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-5 py-2.5 text-sm font-bold text-[var(--ink)] transition-opacity hover:opacity-90"
              >
                {t("community.cohort.open")} →
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("community.dash.cohortBody")}</p>
              <Link
                href="/learn/community"
                className="mt-4 inline-flex min-h-[44px] w-fit items-center rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] hover:border-[var(--ink3)]"
              >
                {t("community.dash.findCohort")} →
              </Link>
            </>
          )}
        </div>
        <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">
            <span aria-hidden="true">💬 </span>
            {t("community.nav")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("community.dash.discussBody")}</p>
          <Link
            href="/learn/community"
            className="mt-4 inline-flex min-h-[44px] w-fit items-center rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] hover:border-[var(--ink3)]"
          >
            {t("community.dash.open")} →
          </Link>
        </div>
      </section>
    );
  } catch (err) {
    console.error("[community] dashboard cards", err);
    return null;
  }
}
