import Link from "next/link";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { communityTablesReady } from "@/lib/learn/community/db";
import { openReports, recentPeerReviews, recentThreads, suspendedLearners, threadForStaff } from "@/lib/learn/community/admin";
import { LiftSuspension, PeerToggle, ReportRow, StaffThread } from "./ModerationClient";

export const dynamic = "force-dynamic";

export default async function CommunityModerationPage({ searchParams }: { searchParams: Promise<{ thread?: string }> }) {
  await requireAdminPage();
  const { thread: threadId } = await searchParams;
  if (!(await communityTablesReady())) {
    return <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">The community tables could not be created. Check the database connection.</p>;
  }
  const [reports, threads, suspended, peer, inspected] = await Promise.all([
    openReports(),
    recentThreads(),
    suspendedLearners(),
    recentPeerReviews(),
    threadId ? threadForStaff(threadId) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--ink3)]">
            <Link href="/admin_pro/learn" className="underline">Learn</Link> / Community
          </p>
          <h1 className="text-xl font-black text-[var(--ink)]">Community moderation</h1>
          <p className="text-sm text-[var(--ink3)]">
            Reports, threads, suspensions and peer reviews. A post reported by 3 learners is hidden automatically until you decide.
          </p>
        </div>
        <Link href="/admin_pro/learn/cohorts" className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold">
          Cohorts →
        </Link>
      </header>

      {inspected && (
        <StaffThread
          data={{
            thread: { ...inspected.thread, createdAt: inspected.thread.createdAt.toISOString() },
            posts: inspected.posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
          }}
        />
      )}

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Report queue ({reports.length})</h2>
        {reports.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">No open reports.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {reports.map((r) => (
              <ReportRow key={r.targetId} r={{ ...r, firstAt: r.firstAt.toISOString() }} />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Recent threads</h2>
        {threads.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">No threads yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--ink3)]">
                  <th className="py-2 pr-3">Thread</th>
                  <th className="py-2 pr-3">Where</th>
                  <th className="py-2 pr-3">Author</th>
                  <th className="py-2 pr-3">Replies</th>
                  <th className="py-2">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {threads.map((th) => (
                  <tr key={th.id}>
                    <td className="py-2 pr-3">
                      <Link href={`/admin_pro/learn/community?thread=${th.id}`} className="font-semibold text-[var(--blue2)] underline">{th.title}</Link>
                    </td>
                    <td className="py-2 pr-3 text-xs">
                      {th.trackTitle}
                      {th.lessonTitle && ` · ${th.lessonTitle}`}
                      {th.cohortName && ` · cohort: ${th.cohortName}`}
                    </td>
                    <td className="py-2 pr-3 text-xs">{th.authorName}<br />{th.authorEmail}</td>
                    <td className="py-2 pr-3">{Number(th.replyCount)}</td>
                    <td className="py-2 text-xs">{th.hidden ? "hidden" : th.answerPostId ? "answered" : "open"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Suspended from posting ({suspended.length})</h2>
        {suspended.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">Nobody is suspended.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {suspended.map((s) => (
              <li key={s.studentId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  <strong>{s.name}</strong> ({s.email}) until {s.suspendedUntil.toISOString().slice(0, 10)}
                  {s.suspendReason && <span className="text-[var(--ink3)]"> · {s.suspendReason}</span>}
                </span>
                <LiftSuspension studentId={s.studentId} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Capstone peer reviews</h2>
        <p className="text-xs text-[var(--ink3)]">Advisory only: the official grade comes from the staff review. Learners see each other anonymously.</p>
        {peer.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">No peer reviews yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {peer.map((r) => (
              <li key={r.id} className="rounded-xl border border-[var(--border)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-[var(--ink3)]">
                    {r.trackTitle} · reviewer {r.reviewerName} ({r.reviewerEmail}) → {r.authorName} ({r.authorEmail}) · {r.status}
                    {r.helpful && " · marked helpful"}
                    {r.hidden && " · hidden"}
                  </p>
                  {r.status === "submitted" && <PeerToggle reviewId={r.id} hidden={r.hidden} />}
                </div>
                {Array.isArray(r.feedback) && r.feedback.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs">
                    {(r.feedback as Array<{ criterion: string; rating: number | null; text: string }>).map((f, i) => (
                      <li key={i}>
                        <strong>{f.criterion}</strong>
                        {f.rating ? ` (${f.rating}/5)` : ""}: {f.text}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
