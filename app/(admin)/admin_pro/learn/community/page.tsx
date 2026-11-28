import Link from "next/link";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { communityTablesReady } from "@/lib/learn/community/db";
import { openReports, recentPeerReviews, recentThreads, suspendedLearners, threadForStaff } from "@/lib/learn/community/admin";
import { LiftSuspension, PeerToggle, ReportRow, StaffThread } from "./ModerationClient";
import { Ban, Flag, Layers, MessagesSquare, ShieldCheck, Star } from "lucide-react";
import { Avatar, Badge, Button, Card, EmptyState, Notice, PageHeader, StatCard, tableStyles } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { LEARN_TABS } from "../tabs";

export const dynamic = "force-dynamic";

export default async function CommunityModerationPage({ searchParams }: { searchParams: Promise<{ thread?: string }> }) {
  await requireAdminPage();
  const { thread: threadId } = await searchParams;
  if (!(await communityTablesReady())) {
    return (
      <div className="space-y-6">
        <PageHeader title="Community moderation" tabs={LEARN_TABS} activeTab="/admin_pro/learn/community" className="mb-0" />
        <Notice tone="warn" title="Community tables unavailable">The community tables could not be created. Check the database connection.</Notice>
      </div>
    );
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
      <PageHeader
        title="Community moderation"
        subtitle="Reports, threads, suspensions and peer reviews. A post reported by 3 learners is hidden automatically until you decide."
        breadcrumb={[{ label: "ARFA · AI Academy", href: "/admin_pro/learn" }, { label: "Community" }]}
        tabs={LEARN_TABS}
        activeTab="/admin_pro/learn/community"
        actions={
          <Button href="/admin_pro/learn/cohorts" variant="secondary" icon={Layers}>
            Cohorts
          </Button>
        }
        className="mb-0"
      />

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open reports" value={reports.length} icon={Flag} tone={reports.length > 0 ? "danger" : "default"} href="#reports" />
        <StatCard label="Recent threads" value={threads.length} icon={MessagesSquare} tone="navy" />
        <StatCard label="Suspended" value={suspended.length} icon={Ban} tone={suspended.length > 0 ? "warn" : "default"} />
        <StatCard label="Peer reviews" value={peer.length} icon={Star} />
      </div>

      {inspected && (
        <StaffThread
          data={{
            thread: { ...inspected.thread, createdAt: inspected.thread.createdAt.toISOString() },
            posts: inspected.posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
          }}
        />
      )}

      <Card
        id="reports"
        title="Report queue"
        icon={Flag}
        action={reports.length > 0 ? <Badge tone="danger">{reports.length} open</Badge> : null}
      >
        {reports.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No open reports" body="The community is quiet. Reported posts land here for a decision." compact />
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <ReportRow key={r.targetId} r={{ ...r, firstAt: r.firstAt.toISOString() }} />
            ))}
          </ul>
        )}
      </Card>

      <Card title="Recent threads" icon={MessagesSquare} padded={false}>
        {threads.length === 0 ? (
          <EmptyState icon={MessagesSquare} title="No threads yet" body="Learner discussions on lessons and cohorts will appear here." compact />
        ) : (
          <div className="relative overflow-x-auto">
            <table className={cn(tableStyles.table, "min-w-[640px]")}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>Thread</th>
                  <th className={tableStyles.th}>Where</th>
                  <th className={tableStyles.th}>Author</th>
                  <th className={cn(tableStyles.th, "text-right")}>Replies</th>
                  <th className={tableStyles.th}>State</th>
                </tr>
              </thead>
              <tbody>
                {threads.map((th) => (
                  <tr key={th.id} className={cn(tableStyles.tr, th.id === threadId && "bg-[var(--a-info-bg)]")}>
                    <td className={tableStyles.td}>
                      <Link href={`/admin_pro/learn/community?thread=${th.id}`} className="font-semibold text-[var(--a-blue)] hover:underline">
                        {th.title}
                      </Link>
                    </td>
                    <td className={cn(tableStyles.td, "text-[12.5px]")}>
                      {th.trackTitle}
                      {th.lessonTitle && ` · ${th.lessonTitle}`}
                      {th.cohortName && ` · cohort: ${th.cohortName}`}
                    </td>
                    <td className={tableStyles.td}>
                      <span className="flex items-center gap-2">
                        <Avatar name={th.authorName ?? th.authorEmail ?? "?"} size={26} />
                        <span className="min-w-0 text-[12.5px]">
                          <span className="block font-medium text-[var(--a-ink)]">{th.authorName}</span>
                          <span className="block text-[var(--a-ink-3)]">{th.authorEmail}</span>
                        </span>
                      </span>
                    </td>
                    <td className={cn(tableStyles.td, "text-right tabular-nums")}>{Number(th.replyCount)}</td>
                    <td className={tableStyles.td}>
                      {th.hidden ? <Badge tone="danger">Hidden</Badge> : th.answerPostId ? <Badge tone="success">Answered</Badge> : <Badge tone="info">Open</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Suspended from posting" icon={Ban} action={suspended.length > 0 ? <Badge tone="warn">{suspended.length}</Badge> : null}>
        {suspended.length === 0 ? (
          <p className="font-dm text-[13.5px] text-[var(--a-ink-3)]">Nobody is suspended.</p>
        ) : (
          <ul className="divide-y divide-[var(--a-border)]">
            {suspended.map((s) => (
              <li key={s.studentId} className="flex flex-wrap items-center justify-between gap-2 py-2.5 font-dm text-[13.5px] first:pt-0 last:pb-0">
                <span className="flex items-center gap-2.5">
                  <Avatar name={s.name ?? s.email} size={28} />
                  <span>
                    <strong className="text-[var(--a-ink)]">{s.name}</strong> <span className="text-[var(--a-ink-3)]">({s.email})</span> until{" "}
                    {s.suspendedUntil.toISOString().slice(0, 10)}
                    {s.suspendReason && <span className="text-[var(--a-ink-3)]"> · {s.suspendReason}</span>}
                  </span>
                </span>
                <LiftSuspension studentId={s.studentId} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Capstone peer reviews"
        icon={Star}
        subtitle="Advisory only: the official grade comes from the staff review. Learners see each other anonymously."
      >
        {peer.length === 0 ? (
          <p className="font-dm text-[13.5px] text-[var(--a-ink-3)]">No peer reviews yet.</p>
        ) : (
          <ul className="space-y-3">
            {peer.map((r) => (
              <li key={r.id} className="rounded-[12px] border border-[var(--a-border)] p-4 font-dm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12.5px] text-[var(--a-ink-3)]">
                    {r.trackTitle} · reviewer {r.reviewerName} ({r.reviewerEmail}) → {r.authorName} ({r.authorEmail}) · {r.status}
                    {r.helpful && " · marked helpful"}
                    {r.hidden && " · hidden"}
                  </p>
                  {r.status === "submitted" && <PeerToggle reviewId={r.id} hidden={r.hidden} />}
                </div>
                {Array.isArray(r.feedback) && r.feedback.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[12.5px] text-[var(--a-ink-2)]">
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
      </Card>
    </div>
  );
}
