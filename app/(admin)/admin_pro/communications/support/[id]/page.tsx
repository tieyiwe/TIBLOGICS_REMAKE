import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Globe2 } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { canManageLearners, requireLearnerPage } from "@/lib/learn/account-status/admin-auth";
import { adminTicket, assignableStaff, listCanned } from "@/lib/learn/support/tickets";
import { CONTEXT_LABEL, TOPIC_LABEL, isTopic, type SupportContext } from "@/lib/learn/support/shared";
import { renderMarkdownLite } from "@/lib/learn/inbox/markdown";
import { readAccountState } from "@/lib/learn/account-status";
import { SupportControls, SupportThread } from "../../_components/SupportThread";
import { PRIORITY_BADGE, STATUS_BADGE, waitingFor } from "../../_components/support-format";
import { dt } from "../../../learn/learners/_components/format";

export const dynamic = "force-dynamic";

// One support request. Opening it marks it read for the team.
export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireLearnerPage("read");
  const canManage = canManageLearners(session);
  const { id } = await params;
  if (!/^[\w-]{1,64}$/.test(id)) notFound();
  const data = await adminTicket(id, true);
  if (!data) notFound();
  const { ticket, timeline } = data;
  const [staff, canned, state] = await Promise.all([
    assignableStaff(),
    canManage ? listCanned() : Promise.resolve([]),
    ticket.studentId ? readAccountState(ticket.studentId).catch(() => null) : Promise.resolve(null),
  ]);
  const ctx = ticket.context as SupportContext | null;
  const topic = isTopic(ticket.topic) ? TOPIC_LABEL[ticket.topic] : ticket.topic;

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.subject}
        breadcrumb={[
          ...(canManage ? [{ label: "Communications", href: "/admin_pro/communications" }] : []),
          { label: "Support", href: "/admin_pro/communications/support" },
          { label: ticket.name },
        ]}
        meta={
          <>
            <Badge tone={STATUS_BADGE[ticket.status]?.tone ?? "neutral"} dot>{STATUS_BADGE[ticket.status]?.label ?? ticket.status}</Badge>
            <Badge tone={PRIORITY_BADGE[ticket.priority]?.tone ?? "neutral"}>{PRIORITY_BADGE[ticket.priority]?.label ?? ticket.priority} priority</Badge>
            <Badge tone="info">{topic}</Badge>
            {ticket.kind === "visitor" ? <Badge tone="neutral"><Globe2 size={11} aria-hidden className="mr-1 inline" />Visitor</Badge> : null}
            <Badge tone="neutral">{ticket.locale.toUpperCase()}</Badge>
            {state && state.status !== "active" ? <Badge tone={state.status === "suspended" ? "warn" : "danger"}>Account {state.status}</Badge> : null}
          </>
        }
        subtitle={
          <>
            Received {dt(ticket.createdAt)} ·{" "}
            {ticket.status === "open" ? <strong>waiting {waitingFor(ticket.lastMessageAt)}</strong> : `last message ${dt(ticket.lastMessageAt)}`}
          </>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <SupportThread
            ticket={{ id: ticket.id, kind: ticket.kind, status: ticket.status, priority: ticket.priority, assignee: ticket.assignee, locale: ticket.locale, name: ticket.name }}
            items={timeline.map((m) => ({
              id: m.id,
              kind: m.kind,
              authorName: m.authorName,
              authorEmail: m.authorEmail,
              html: renderMarkdownLite(m.body),
              createdAt: m.createdAt.toISOString(),
            }))}
            staff={staff}
            canned={canned.map((c) => ({ id: c.id, title: c.title, body: c.body, bodyFr: c.bodyFr }))}
            canManage={canManage}
          />
        </Card>
        <div className="space-y-5">
          <Card title="Request">
            <SupportControls ticket={{ id: ticket.id, status: ticket.status, priority: ticket.priority, assignee: ticket.assignee }} staff={staff} canManage={canManage} />
          </Card>
          <Card title={ticket.kind === "visitor" ? "Visitor" : "Learner"}>
            <p className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">{ticket.name}</p>
            <p className="break-all font-dm text-[13px] text-[var(--a-ink-3)]">{ticket.email}</p>
            {ticket.studentId ? (
              <Link href={`/admin_pro/learn/learners/${ticket.studentId}`} className="mt-3 inline-flex items-center gap-1 font-dm text-[13px] font-semibold text-[var(--a-blue)] hover:underline" data-testid="support-profile">
                Open learner profile <ExternalLink size={12} aria-hidden />
              </Link>
            ) : (
              <p className="mt-3 font-dm text-[12px] text-[var(--a-ink-3)]">Not signed in when writing. Replies go by email only.</p>
            )}
          </Card>
          <Card title="Context">
            {ctx ? (
              <dl className="space-y-2 font-dm text-[13px]" data-testid="support-context">
                {(Object.keys(CONTEXT_LABEL) as Array<keyof SupportContext>)
                  .filter((k) => ctx[k])
                  .map((k) => (
                    <div key={k}>
                      <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--a-ink-3)]">{CONTEXT_LABEL[k]}</dt>
                      <dd className="break-words text-[var(--a-ink)]">{String(ctx[k])}</dd>
                    </div>
                  ))}
              </dl>
            ) : (
              <p className="font-dm text-[12.5px] text-[var(--a-ink-3)]">The {ticket.kind === "visitor" ? "visitor" : "learner"} chose not to include page context.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
