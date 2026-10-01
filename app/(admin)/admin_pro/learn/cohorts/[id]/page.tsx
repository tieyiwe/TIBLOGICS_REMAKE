import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../../_lib/admin-page-auth";
import { communityTablesReady } from "@/lib/learn/community/db";
import { announcements, cohortMemberRows, getCohort, memberProgress } from "@/lib/learn/community/cohorts";
import { dayInput } from "@/lib/learn/community/shared";
import CohortForm from "../CohortForm";
import CohortManage from "./CohortManage";

export const dynamic = "force-dynamic";

export default async function CohortAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  if (!(await communityTablesReady())) notFound();
  const cohort = await getCohort(id);
  if (!cohort) notFound();
  const [tracks, news, members, progress] = await Promise.all([
    prisma.learnTrack.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, title: true } }),
    announcements(id, 50),
    cohortMemberRows(id),
    memberProgress(id, cohort.trackId),
  ]);
  const pct = (sid: string) => (progress.total ? Math.round(((progress.done.get(sid) ?? 0) / progress.total) * 100) : 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-[var(--ink3)]">
          <Link href="/admin_pro/learn" className="underline">Learn</Link> / <Link href="/admin_pro/learn/cohorts" className="underline">Cohorts</Link>
        </p>
        <h1 className="text-xl font-black text-[var(--ink)]">{cohort.name}</h1>
        <p className="text-sm text-[var(--ink3)]">
          Learner page: <Link href={`/learn/community/cohort/${cohort.id}`} className="underline">/learn/community/cohort/{cohort.id}</Link>
        </p>
      </header>
      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="mb-4 text-sm font-bold text-[var(--ink)]">Settings</h2>
        <CohortForm
          tracks={tracks}
          cohortId={cohort.id}
          initial={{
            trackId: cohort.trackId,
            name: cohort.name,
            startDate: dayInput(cohort.startDate),
            endDate: dayInput(cohort.endDate),
            sessionWeekday: cohort.sessionWeekday,
            sessionTime: cohort.sessionTime,
            timezone: cohort.timezone,
            sessionMinutes: cohort.sessionMinutes,
            meetingUrl: cohort.meetingUrl ?? "",
            capacity: cohort.capacity,
            enrolmentOpen: cohort.enrolmentOpen,
            priceNote: cohort.priceNote ?? "",
          }}
        />
      </section>
      <CohortManage
        cohortId={cohort.id}
        announcements={news.map((a) => ({ id: a.id, bodyMd: a.bodyMd, createdAt: a.createdAt.toISOString() }))}
        recordings={cohort.recordings}
        members={members.map((m) => ({ studentId: m.studentId, name: m.name, email: m.email, joinedAt: m.joinedAt.toISOString(), percent: pct(m.studentId) }))}
      />
    </div>
  );
}
