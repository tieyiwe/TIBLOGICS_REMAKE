import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getAccess, getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { communityTablesReady } from "@/lib/learn/community/db";
import { cohortEnded, listCohorts, myCohorts } from "@/lib/learn/community/cohorts";
import { threadCounts } from "@/lib/learn/community/discussion";
import { nextSession } from "@/lib/learn/community/shared";
import { trackTexts } from "@/lib/learn/community/text";
import JoinCohortButton from "@/components/learn/community/JoinCohortButton";
import SessionTime from "@/components/learn/community/SessionTime";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("community.hub.title") };
}

// The community hub: your cohorts, cohorts open to join in your tracks, and
// each track's discussion.
export default async function CommunityHub() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const [t, locale, access] = await Promise.all([getT(), getLocale(), getAccess(student.id)]);

  if (!(await communityTablesReady())) {
    return <p className="rounded-2xl bg-white p-6 text-sm text-[var(--ink2)]">{t("community.err.unavailable")}</p>;
  }

  const tracks = await prisma.learnTrack.findMany({
    where: { status: "live", ...(access.all ? {} : { id: { in: access.purchased } }) },
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, title: true, accentColor: true },
  });
  const scope = access.all ? ("all" as const) : access.purchased;
  const [mine, all, texts, counts] = await Promise.all([
    myCohorts(student.id),
    listCohorts({ trackIds: tracks.map((x) => x.id) }),
    trackTexts(tracks.map((x) => x.id), locale),
    Promise.all(tracks.map((x) => threadCounts(student.id, scope, x.id))),
  ]);
  const mineIds = new Set(mine.map((c) => c.id));
  const open = all.filter((c) => !mineIds.has(c.id) && c.enrolmentOpen && !cohortEnded(c));
  const title = (id: string) => texts.get(id)?.title ?? tracks.find((x) => x.id === id)?.title ?? "";
  const fmt = (d: Date) => d.toLocaleDateString(locale, { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-black text-[var(--ink)]">{t("community.hub.title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink2)]">{t("community.hub.intro")}</p>
      </header>

      <section>
        <h2 className="text-base font-bold text-[var(--ink)]">{t("community.hub.myCohorts")}</h2>
        {mine.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--ink2)]">{t("community.hub.noCohorts")}</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {mine.map((c) => {
              const s = nextSession(c);
              return (
                <li key={c.id}>
                  <Link href={`/learn/community/cohort/${c.id}`} className="learn-lift block rounded-2xl border border-[var(--border)] bg-white p-5">
                    <p className="text-sm font-bold text-[var(--ink)]">{c.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--ink3)]">
                      {title(c.trackId)} · {fmt(c.startDate)} – {fmt(c.endDate)}
                    </p>
                    {s && (
                      <p className="mt-2 text-xs text-[var(--ink2)]">
                        {t("community.cohort.nextSession")}: <SessionTime iso={s.start.toISOString()} timezone={c.timezone} withLocal={false} />
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {open.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-[var(--ink)]">{t("community.hub.openCohorts")}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {open.map((c) => {
              const full = c.memberCount >= c.capacity;
              return (
                <li key={c.id} className="rounded-2xl border border-[var(--border)] bg-white p-5">
                  <p className="text-sm font-bold text-[var(--ink)]">
                    <Link href={`/learn/community/cohort/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--ink3)]">
                    {title(c.trackId)} · {fmt(c.startDate)} – {fmt(c.endDate)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink2)]">
                    {full ? t("community.cohort.full") : t("community.cohort.seatsLeft", { n: c.capacity - c.memberCount })}
                    {c.priceNote && <> · {c.priceNote}</>}
                  </p>
                  <div className="mt-3">
                    <JoinCohortButton cohortId={c.id} member={false} disabled={full} goTo={`/learn/community/cohort/${c.id}`} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-base font-bold text-[var(--ink)]">{t("community.hub.discussions")}</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {tracks.map((tr, i) => (
            <li key={tr.id}>
              <Link
                href={`/learn/community/track/${tr.slug}`}
                className="learn-lift flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white p-5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[var(--ink)]">{title(tr.id)}</span>
                  <span className="mt-0.5 block text-xs text-[var(--ink3)]">
                    {t(counts[i].total === 1 ? "community.threads.one" : "community.threads.other", { n: counts[i].total })}
                    {counts[i].unanswered > 0 && <> · {t("community.unansweredCount", { n: counts[i].unanswered })}</>}
                  </span>
                </span>
                <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ background: tr.accentColor }} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-[var(--ink3)]">{t("community.hub.rules")}</p>
    </div>
  );
}
