import Link from "next/link";
import { CheckCircle2, Globe2, LifeBuoy } from "lucide-react";
import { Badge, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { canManageLearners, requireLearnerPage } from "@/lib/learn/account-status/admin-auth";
import { adminTickets, assignableStaff, listCanned, type AdminFilters } from "@/lib/learn/support/tickets";
import { SUPPORT_STATUSES, SUPPORT_TOPICS, TOPIC_LABEL, isTopic, type SupportStatus } from "@/lib/learn/support/shared";
import { plainPreview } from "@/lib/learn/inbox/markdown";
import { dt } from "../../learn/learners/_components/format";
import { CannedPanel } from "../_components/CannedPanel";
import { PRIORITY_BADGE, STATUS_BADGE, waitingFor } from "../_components/support-format";

export const dynamic = "force-dynamic";

// Learner support: every "Need help?" request from learners (threads in
// their Inbox) and signed-out visitors (email only). Staff who can read
// learners see it; answering, notes, assignment and closing need the owner
// or an admin.

export default async function SupportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireLearnerPage("read");
  const canManage = canManageLearners(session);
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? "";
  const status: AdminFilters["status"] = (SUPPORT_STATUSES as readonly string[]).includes(one("status")) ? (one("status") as SupportStatus) : one("status") === "all" ? "all" : "open";
  const topic = isTopic(one("topic")) ? one("topic") : null;
  const assignee = one("assignee") ? one("assignee").slice(0, 254) : null;

  const [data, staff, canned] = await Promise.all([
    adminTickets({ status, topic: topic as AdminFilters["topic"], assignee }),
    assignableStaff(),
    canManage ? listCanned() : Promise.resolve([]),
  ]);
  const staffName = new Map(staff.map((s) => [s.email.toLowerCase(), s.name]));

  const qs = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const cur = { status, topic, assignee, ...patch };
    for (const [k, v] of Object.entries(cur)) if (v && !(k === "status" && v === "open")) p.set(k, v);
    const s = p.toString();
    return `/admin_pro/communications/support${s ? `?${s}` : ""}`;
  };
  const oldest = data.tickets.filter((t) => t.status === "open").reduce<Date | null>((m, t) => (!m || t.lastMessageAt < m ? t.lastMessageAt : m), null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learner support"
        subtitle="Questions and problems sent with “Need help?” from every learner page. Each new request and follow-up also emails the owner (ADMIN_NOTIFY_EMAIL)."
        breadcrumb={canManage ? [{ label: "Communications", href: "/admin_pro/communications" }, { label: "Support" }] : undefined}
        tabs={
          canManage
            ? [
                { label: "Messages", href: "/admin_pro/communications" },
                { label: "Inbox", href: "/admin_pro/communications?tab=inbox" },
                { label: "Support", href: "/admin_pro/communications/support", count: data.counts.open || null },
                { label: "Templates", href: "/admin_pro/communications?tab=templates" },
              ]
            : undefined
        }
        activeTab="/admin_pro/communications/support"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Waiting for us" value={data.counts.open} hint={oldest ? `Oldest waiting ${waitingFor(oldest)}` : "Nothing waiting"} icon={LifeBuoy} tone={data.counts.open ? "warn" : "default"} href={qs({ status: "open" })} />
        <StatCard label="Unread" value={data.counts.unread} hint="New messages not opened yet" icon={LifeBuoy} />
        <StatCard label="Answered" value={data.counts.answered} hint="Waiting for the learner" icon={CheckCircle2} tone="success" href={qs({ status: "answered" })} />
        <StatCard label="Closed" value={data.counts.closed} hint={`${data.counts.all} in total`} icon={CheckCircle2} href={qs({ status: "closed" })} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Status" className="flex flex-wrap gap-1.5">
          {(["open", "answered", "closed", "all"] as const).map((v) => (
            <Link
              key={v}
              href={qs({ status: v })}
              aria-current={v === status ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 font-dm text-[13px] font-semibold transition-colors",
                v === status ? "border-[var(--a-navy)] bg-[var(--a-navy)] text-white" : "border-[var(--a-border-strong)] bg-[var(--a-surface)] text-[var(--a-ink-2)] hover:bg-[var(--a-surface-2)]",
              )}
            >
              {v === "all" ? "All" : STATUS_BADGE[v].label}
              <span className={cn("tabular-nums text-[11.5px]", v === status ? "text-white/75" : "text-[var(--a-ink-3)]")}>{data.counts[v]}</span>
            </Link>
          ))}
        </nav>
        <form method="get" action="/admin_pro/communications/support" className="flex flex-wrap items-center gap-2">
          {status !== "open" ? <input type="hidden" name="status" value={status} /> : null}
          <label className="sr-only" htmlFor="f-topic">Topic</label>
          <select id="f-topic" name="topic" defaultValue={topic ?? ""} className="h-8 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-2 font-dm text-[13px]">
            <option value="">Any topic</option>
            {SUPPORT_TOPICS.map((k) => (
              <option key={k} value={k}>{TOPIC_LABEL[k]}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="f-assignee">Assignee</label>
          <select id="f-assignee" name="assignee" defaultValue={assignee ?? ""} className="h-8 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-2 font-dm text-[13px]">
            <option value="">Anyone</option>
            <option value="none">Unassigned</option>
            {staff.map((s) => (
              <option key={s.email} value={s.email}>{s.name} ({s.email})</option>
            ))}
          </select>
          <button type="submit" className="h-8 rounded-full bg-[var(--a-navy)] px-3 font-dm text-[13px] font-semibold text-white">Filter</button>
        </form>
      </div>

      {data.tickets.length === 0 ? (
        <div className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)]">
          <EmptyState icon={CheckCircle2} title={status === "open" ? "Nothing waiting for a reply" : "No requests here"} body="Learners and visitors send requests with the “Need help?” button. They appear here and the owner gets an email." />
        </div>
      ) : (
        <ul data-testid="support-list" className="divide-y divide-[var(--a-border)] overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]">
          {data.tickets.map((tk) => {
            const unread = tk.adminUnread > 0 && tk.status !== "closed";
            return (
              <li key={tk.id}>
                <Link
                  href={`/admin_pro/communications/support/${tk.id}`}
                  className={cn("flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[#f8fafd] sm:px-5", unread && "bg-[#FFFAF5]")}
                >
                  <span aria-hidden className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", unread ? "bg-[var(--a-orange)]" : "bg-transparent")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className={cn("min-w-0 truncate font-dm text-[14px] text-[var(--a-ink)]", unread ? "font-bold" : "font-semibold")}>
                        {tk.name}
                        <span className="ml-2 font-normal text-[var(--a-ink-3)]">{tk.email}</span>
                      </p>
                      <span className="shrink-0 font-dm text-[12px] text-[var(--a-ink-3)]" title={dt(tk.lastMessageAt)}>
                        {tk.status === "open" ? <strong className="font-semibold text-[var(--a-warn)]">waiting {waitingFor(tk.lastMessageAt)}</strong> : `${tk.status === "answered" ? "answered" : "closed"} ${waitingFor(tk.lastMessageAt)} ago`}
                      </span>
                    </div>
                    <p className="truncate font-dm text-[13px] font-medium text-[var(--a-ink-2)]">{tk.subject}</p>
                    <p className="truncate font-dm text-[12.5px] text-[var(--a-ink-3)]">{tk.lastBody ? plainPreview(tk.lastBody, 140) : ""}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge tone={STATUS_BADGE[tk.status]?.tone ?? "neutral"} dot>{STATUS_BADGE[tk.status]?.label ?? tk.status}</Badge>
                      {tk.priority !== "normal" ? <Badge tone={PRIORITY_BADGE[tk.priority]?.tone ?? "neutral"}>{PRIORITY_BADGE[tk.priority]?.label ?? tk.priority}</Badge> : null}
                      <Badge tone="info">{isTopic(tk.topic) ? TOPIC_LABEL[tk.topic] : tk.topic}</Badge>
                      {tk.kind === "visitor" ? (
                        <Badge tone="neutral"><Globe2 size={11} aria-hidden className="mr-1 inline" />Visitor</Badge>
                      ) : null}
                      <span className="font-dm text-[12px] text-[var(--a-ink-3)]">{tk.assignee ? `Assigned to ${staffName.get(tk.assignee.toLowerCase()) ?? tk.assignee}` : "Unassigned"}</span>
                      {unread ? <Badge tone="orange">{tk.adminUnread} new</Badge> : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {canManage ? <CannedPanel items={canned.map((c) => ({ id: c.id, title: c.title, body: c.body, bodyFr: c.bodyFr }))} /> : null}
    </div>
  );
}
