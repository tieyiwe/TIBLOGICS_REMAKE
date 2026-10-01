import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { communityTablesReady } from "@/lib/learn/community/db";
import { cohortEnded, listCohorts } from "@/lib/learn/community/cohorts";
import { nextSession } from "@/lib/learn/community/shared";
import CohortForm from "./CohortForm";

export const dynamic = "force-dynamic";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function CohortsAdminPage() {
  await requireAdminPage();
  const ready = await communityTablesReady();
  const tracks = await prisma.learnTrack.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, title: true } }).catch(() => []);
  const cohorts = ready ? await listCohorts() : [];
  const title = new Map(tracks.map((t) => [t.id, t.title]));
  const day = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--ink3)]">
            <Link href="/admin_pro/learn" className="underline">Learn</Link> / Cohorts
          </p>
          <h1 className="text-xl font-black text-[var(--ink)]">Cohorts</h1>
          <p className="text-sm text-[var(--ink3)]">Groups taking a track together, with a weekly live session. Learners with access to the track join from the track page.</p>
        </div>
        <Link href="/admin_pro/learn/community" className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold">
          Community moderation →
        </Link>
      </header>

      {!ready && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">The community tables could not be created. Check the database connection.</p>}

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">All cohorts</h2>
        {cohorts.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">No cohorts yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--ink3)]">
                  <th className="py-2 pr-3">Cohort</th>
                  <th className="py-2 pr-3">Track</th>
                  <th className="py-2 pr-3">Dates</th>
                  <th className="py-2 pr-3">Live</th>
                  <th className="py-2 pr-3">Members</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {cohorts.map((c) => {
                  const s = nextSession(c);
                  return (
                    <tr key={c.id}>
                      <td className="py-2 pr-3 font-semibold">
                        <Link href={`/admin_pro/learn/cohorts/${c.id}`} className="text-[var(--blue2)] underline">{c.name}</Link>
                      </td>
                      <td className="py-2 pr-3">{title.get(c.trackId) ?? c.trackId}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{day(c.startDate)} → {day(c.endDate)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {DAYS[c.sessionWeekday]} {c.sessionTime} {c.timezone}
                        {s && <span className="block text-xs text-[var(--ink3)]">next {s.start.toISOString().slice(0, 16).replace("T", " ")} UTC</span>}
                      </td>
                      <td className="py-2 pr-3">{c.memberCount} / {c.capacity}</td>
                      <td className="py-2">{cohortEnded(c) ? "Ended" : c.enrolmentOpen ? "Open" : "Closed"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="mb-4 text-sm font-bold text-[var(--ink)]">New cohort</h2>
        <CohortForm tracks={tracks} />
      </section>
    </div>
  );
}
