import Link from "next/link";
import { CalendarClock, CheckCircle2, Inbox, Mail, MessageSquare, PenSquare, Send } from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, StatCard, tableStyles, type BadgeTone } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { requireLearnerPage } from "@/lib/learn/account-status/admin-auth";
import { ensureCommsTables } from "@/lib/learn/inbox/db";
import { listCampaigns, hourlyCap } from "@/lib/learn/inbox/campaigns";
import { adminInbox, type InboxView } from "@/lib/learn/inbox/threads";
import { plainPreview } from "@/lib/learn/inbox/markdown";
import { ago, dt } from "../learn/learners/_components/format";
import { TemplatesPanel } from "./_components/TemplatesPanel";
import { waitingCount } from "@/lib/learn/support/tickets";

export const dynamic = "force-dynamic";

// Communications center: messages to learners (history with outcomes), the
// support Inbox (learner replies) and saved templates. Owner or admin only.

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  scheduled: { label: "Scheduled", tone: "info" },
  starting: { label: "Starting", tone: "orange" },
  sending: { label: "Sending", tone: "orange" },
  sent: { label: "Sent", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

const TABS = ["messages", "inbox", "templates"] as const;
type Tab = (typeof TABS)[number];
const VIEWS: InboxView[] = ["open", "unread", "closed", "all"];

export default async function CommunicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireLearnerPage("read", "communications");
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined));
  const tab: Tab = (TABS as readonly string[]).includes(one("tab") ?? "") ? (one("tab") as Tab) : "messages";
  const view: InboxView = (VIEWS as string[]).includes(one("view") ?? "") ? (one("view") as InboxView) : "open";

  await ensureCommsTables();
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const [campaigns, inbox, templates, sent30, emailed1h, supportWaiting] = await Promise.all([
    listCampaigns(100),
    adminInbox(view),
    prisma.commsTemplate.findMany({ orderBy: { updatedAt: "desc" }, take: 200 }),
    prisma.commsRecipient.groupBy({ by: ["status"], where: { sentAt: { gte: since30 } }, _count: { _all: true } }),
    prisma.commsRecipient.count({ where: { emailed: true, sentAt: { gte: new Date(Date.now() - 3_600_000) } } }),
    waitingCount(),
  ]);
  const n = (s: string) => sent30.find((x) => x.status === s)?._count._all ?? 0;
  const delivered30 = n("sent");
  const attempted30 = delivered30 + n("failed");
  const scheduled = campaigns.filter((c) => c.status === "scheduled").length;

  const tabHref = (t: Tab) => (t === "messages" ? "/admin_pro/communications" : `/admin_pro/communications?tab=${t}`);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communications"
        subtitle="Write to learners by email and in their ARFA Inbox, answer their replies, and keep templates. Replies also reach arfa_edu@tiblogics.com."
        actions={<Button href="/admin_pro/communications/new" variant="primary" icon={PenSquare}>New message</Button>}
        tabs={[
          { label: "Messages", href: tabHref("messages"), count: campaigns.length },
          { label: "Inbox", href: tabHref("inbox"), count: inbox.counts.unread || null },
          // "Need help?" requests (learners and visitors): their own page.
          { label: "Support", href: "/admin_pro/communications/support", count: supportWaiting || null },
          { label: "Templates", href: tabHref("templates"), count: templates.length },
        ]}
        activeTab={tabHref(tab)}
      />

      {tab === "messages" ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Delivered (30 days)" value={delivered30.toLocaleString("en")} hint={attempted30 ? `${Math.round((delivered30 / attempted30) * 100)}% success` : "No sends yet"} icon={Send} tone="success" />
            <StatCard label="Scheduled" value={scheduled} hint="Sent by the comms job" icon={CalendarClock} tone="navy" />
            <StatCard label="Awaiting reply" value={inbox.counts.unread} hint={`${inbox.counts.open} open conversations`} icon={Inbox} tone={inbox.counts.unread ? "warn" : "default"} href={tabHref("inbox")} />
            <StatCard label="Emails this hour" value={`${emailed1h} / ${hourlyCap()}`} hint="Hourly cap (COMMS_HOURLY_CAP)" icon={Mail} />
          </div>

          {campaigns.length === 0 ? (
            <div className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)]">
              <EmptyState
                icon={MessageSquare}
                title="No messages sent yet"
                body="Write once in English (French optional), pick who receives it, preview and send or schedule."
                action={<Button href="/admin_pro/communications/new" variant="primary" icon={PenSquare}>Write the first message</Button>}
              />
            </div>
          ) : (
            <div className={tableStyles.wrap}>
              <table className={cn(tableStyles.table, "min-w-[880px]")}>
                <thead className={tableStyles.thead}>
                  <tr>
                    <th className={tableStyles.th}>Message</th>
                    <th className={tableStyles.th}>Type</th>
                    <th className={tableStyles.th}>Channels</th>
                    <th className={tableStyles.th}>Status</th>
                    <th className={cn(tableStyles.th, "text-right")}>Recipients</th>
                    <th className={cn(tableStyles.th, "text-right")}>Delivered</th>
                    <th className={tableStyles.th}>When</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className={tableStyles.tr}>
                      <td className={cn(tableStyles.td, "max-w-[360px]")}>
                        <Link href={`/admin_pro/communications/${c.id}`} className="block truncate font-semibold text-[var(--a-ink)] hover:text-[var(--a-blue)] hover:underline">
                          {c.subject}
                        </Link>
                        <span className="block truncate text-[12px] text-[var(--a-ink-3)]">{c.audienceLabel}</span>
                      </td>
                      <td className={tableStyles.td}><Badge tone={c.kind === "marketing" ? "orange" : "info"}>{c.kind === "marketing" ? "Marketing" : "Service"}</Badge></td>
                      <td className={tableStyles.td}>
                        <span className="flex items-center gap-1.5 text-[var(--a-ink-3)]">
                          {c.viaEmail ? <Mail size={15} aria-label="Email" /> : null}
                          {c.viaInbox ? <Inbox size={15} aria-label="In-app Inbox" /> : null}
                        </span>
                      </td>
                      <td className={tableStyles.td}><Badge tone={STATUS[c.status]?.tone ?? "neutral"} dot>{STATUS[c.status]?.label ?? c.status}</Badge></td>
                      <td className={cn(tableStyles.td, "text-right tabular-nums")}>{c.recipientCount}</td>
                      <td className={cn(tableStyles.td, "text-right tabular-nums")}>
                        <span className="font-semibold text-[var(--a-ink)]">{c.sentCount}</span>
                        {c.failedCount ? <span className="ml-1.5 text-[var(--a-danger)]">{c.failedCount} failed</span> : null}
                        {c.skippedCount ? <span className="ml-1.5 text-[var(--a-ink-3)]">{c.skippedCount} skipped</span> : null}
                      </td>
                      <td className={cn(tableStyles.td, "whitespace-nowrap")} title={dt(c.status === "scheduled" ? c.scheduledAt : c.startedAt ?? c.createdAt)}>
                        {c.status === "scheduled" ? `Scheduled ${ago(c.scheduledAt)}` : ago(c.startedAt ?? c.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}

      {tab === "inbox" ? (
        <div className="space-y-4">
          <nav aria-label="Inbox views" className="flex flex-wrap gap-1.5">
            {VIEWS.map((v) => (
              <Link
                key={v}
                href={`/admin_pro/communications?tab=inbox&view=${v}`}
                aria-current={v === view ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 font-dm text-[13px] font-semibold transition-colors",
                  v === view ? "border-[var(--a-navy)] bg-[var(--a-navy)] text-white" : "border-[var(--a-border-strong)] bg-[var(--a-surface)] text-[var(--a-ink-2)] hover:bg-[var(--a-surface-2)]",
                )}
              >
                {v === "open" ? "Open" : v === "unread" ? "Awaiting reply" : v === "closed" ? "Resolved" : "All"}
                <span className={cn("tabular-nums text-[11.5px]", v === view ? "text-white/75" : "text-[var(--a-ink-3)]")}>{inbox.counts[v]}</span>
              </Link>
            ))}
          </nav>
          {inbox.threads.length === 0 ? (
            <div className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)]">
              <EmptyState icon={CheckCircle2} title={view === "unread" ? "Nothing awaiting a reply" : "No conversations here"} body="When a learner replies to a message in their Inbox, the conversation appears here and arfa_edu@tiblogics.com gets an alert." />
            </div>
          ) : (
            <ul className="divide-y divide-[var(--a-border)] overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]">
              {inbox.threads.map((th) => (
                <li key={th.id}>
                  <Link href={`/admin_pro/communications/inbox/${th.id}`} className={cn("flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[#f8fafd] sm:px-5", th.adminUnread > 0 && "bg-[#FFFAF5]")}>
                    <span aria-hidden className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", th.adminUnread > 0 ? "bg-[var(--a-orange)]" : "bg-transparent")} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className={cn("truncate font-dm text-[14px] text-[var(--a-ink)]", th.adminUnread > 0 ? "font-bold" : "font-semibold")}>
                          {th.student?.name ?? "Unknown learner"}
                          <span className="ml-2 font-normal text-[var(--a-ink-3)]">{th.student?.email}</span>
                        </p>
                        <span className="shrink-0 font-dm text-[12px] text-[var(--a-ink-3)]" title={dt(th.lastMessageAt)}>{ago(th.lastMessageAt)}</span>
                      </div>
                      <p className="truncate font-dm text-[13px] font-medium text-[var(--a-ink-2)]">{th.subject}</p>
                      <p className="truncate font-dm text-[12.5px] text-[var(--a-ink-3)]">
                        {th.last?.sender === "admin" ? "You: " : ""}
                        {th.last ? plainPreview(th.last.body, 140) : ""}
                      </p>
                    </div>
                    {th.status === "closed" ? <Badge tone="neutral">Resolved</Badge> : th.adminUnread > 0 ? <Badge tone="orange">{th.adminUnread} new</Badge> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "templates" ? (
        <TemplatesPanel
          templates={templates.map((t) => ({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() }))}
        />
      ) : null}
    </div>
  );
}
