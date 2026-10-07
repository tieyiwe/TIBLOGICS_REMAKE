import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { canManageLearners, requireLearnerPage } from "@/lib/learn/account-status/admin-auth";
import { adminThread } from "@/lib/learn/inbox/threads";
import { readAccountState } from "@/lib/learn/account-status";
import { SUPPORT_THREAD_MARK } from "@/lib/learn/support/tickets";
import { Conversation } from "../../_components/Conversation";
import { dt } from "../../../learn/learners/_components/format";

export const dynamic = "force-dynamic";

// One support conversation (a learner replied to a message). Opening it
// marks it read for the team.
export default async function InboxThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const session = await requireLearnerPage("read", "communications");
  const { threadId } = await params;
  if (!/^[\w-]{1,64}$/.test(threadId)) notFound();
  const data = await adminThread(threadId, true);
  if (!data) notFound();
  // "Need help?" requests have their own page (topic, notes, assignee).
  if (data.thread.campaignId === SUPPORT_THREAD_MARK) redirect(`/admin_pro/communications/support/${threadId}`);
  const { thread, messages, student } = data;
  const state = student ? await readAccountState(student.id) : null;
  const name = student?.name ?? "Learner";

  return (
    <div className="space-y-6">
      <PageHeader
        title={thread.subject}
        breadcrumb={[{ label: "Communications", href: "/admin_pro/communications" }, { label: "Inbox", href: "/admin_pro/communications?tab=inbox" }, { label: name }]}
        meta={
          <>
            <Badge tone={thread.status === "closed" ? "neutral" : "success"} dot>{thread.status === "closed" ? "Resolved" : "Open"}</Badge>
            {state && state.status !== "active" ? <Badge tone={state.status === "suspended" ? "warn" : "danger"}>Account {state.status}</Badge> : null}
            {student ? <Badge tone="neutral">{student.locale.toUpperCase()}</Badge> : null}
          </>
        }
        subtitle={<>Started {dt(thread.createdAt)} · last message {dt(thread.lastMessageAt)}</>}
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <Conversation
            threadId={thread.id}
            status={thread.status}
            learnerName={name}
            canManage={canManageLearners(session, "communications")}
            messages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
          />
        </Card>
        {student ? (
          <Card title="Learner">
            <p className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">{student.name}</p>
            <p className="font-dm text-[13px] text-[var(--a-ink-3)]">{student.email}</p>
            <Link href={`/admin_pro/learn/learners/${student.id}`} className="mt-3 inline-flex items-center gap-1 font-dm text-[13px] font-semibold text-[var(--a-blue)] hover:underline">
              Open profile <ExternalLink size={12} aria-hidden />
            </Link>
            <p className="mt-4 font-dm text-[12px] text-[var(--a-ink-3)]">Your reply appears in their ARFA Inbox and, unless you untick it, by email from arfa_edu@tiblogics.com.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
