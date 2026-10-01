import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CircleSlash, Inbox, Mail, Send, Users, XCircle } from "lucide-react";
import { Badge, Card, PageHeader, StatCard, tableStyles, type BadgeTone } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { requireLearnerPage } from "@/lib/learn/account-status/admin-auth";
import { campaignDetail } from "@/lib/learn/inbox/campaigns";
import { renderMarkdownLite } from "@/lib/learn/inbox/markdown";
import { dt, human } from "../../learn/learners/_components/format";
import { CancelCampaign } from "./CancelCampaign";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  scheduled: { label: "Scheduled", tone: "info" },
  starting: { label: "Starting", tone: "orange" },
  sending: { label: "Sending", tone: "orange" },
  sent: { label: "Sent", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};
const R_TONE: Record<string, BadgeTone> = { sent: "success", failed: "danger", skipped: "neutral", pending: "info", sending: "orange" };

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  await requireLearnerPage("manage");
  const { id } = await params;
  if (!/^[\w-]{1,64}$/.test(id)) notFound();
  const data = await campaignDetail(id);
  if (!data) notFound();
  const { campaign: c, recipients } = data;
  const pending = recipients.filter((r) => r.status === "pending" || r.status === "sending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={c.subject}
        breadcrumb={[{ label: "Communications", href: "/admin_pro/communications" }, { label: "Message" }]}
        meta={
          <>
            <Badge tone={STATUS[c.status]?.tone ?? "neutral"} dot>{STATUS[c.status]?.label ?? c.status}</Badge>
            <Badge tone={c.kind === "marketing" ? "orange" : "info"}>{c.kind === "marketing" ? "Marketing" : "Service"}</Badge>
            {c.viaEmail ? <Badge tone="neutral"><Mail size={12} aria-hidden /> Email</Badge> : null}
            {c.viaInbox ? <Badge tone="neutral"><Inbox size={12} aria-hidden /> Inbox</Badge> : null}
            {c.bodyFr ? <Badge tone="neutral">EN + FR</Badge> : <Badge tone="neutral">EN</Badge>}
          </>
        }
        subtitle={<>{c.audienceLabel} · by {c.createdBy} · {c.status === "scheduled" ? `scheduled for ${dt(c.scheduledAt)}` : `started ${dt(c.startedAt ?? c.createdAt)}`}</>}
        actions={c.status === "scheduled" ? <CancelCampaign id={c.id} /> : null}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Recipients" value={c.recipientCount} icon={Users} tone="navy" />
        <StatCard label="Delivered" value={c.sentCount} icon={CheckCircle2} tone="success" hint={pending ? `${pending} still to send` : c.finishedAt ? `Finished ${dt(c.finishedAt)}` : undefined} />
        <StatCard label="Failed" value={c.failedCount} icon={XCircle} tone={c.failedCount ? "danger" : "default"} />
        <StatCard label="Skipped" value={c.skippedCount} icon={CircleSlash} hint="Unsubscribed, blocked or deleted" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Card title={`Recipients (${recipients.length}${recipients.length === 500 ? "+" : ""})`} icon={Send} padded={false}>
          {recipients.length === 0 ? (
            <p className="p-5 font-dm text-[13.5px] text-[var(--a-ink-3)]">Recipients are listed when the message starts sending.</p>
          ) : (
            <div className="max-h-[640px] overflow-auto">
              <table className={tableStyles.table}>
                <thead className={cn(tableStyles.thead, "sticky top-0")}>
                  <tr>
                    <th className={tableStyles.th}>Learner</th>
                    <th className={tableStyles.th}>Lang</th>
                    <th className={tableStyles.th}>Outcome</th>
                    <th className={tableStyles.th}>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((r) => (
                    <tr key={r.id} className={tableStyles.tr}>
                      <td className={tableStyles.td}>
                        <Link href={`/admin_pro/learn/learners/${r.studentId}?tab=messages`} className="font-semibold text-[var(--a-ink)] hover:underline">{r.name || r.email}</Link>
                        <span className="block text-[12px] text-[var(--a-ink-3)]">{r.email}</span>
                      </td>
                      <td className={cn(tableStyles.td, "uppercase")}>{r.locale}</td>
                      <td className={tableStyles.td}>
                        <Badge tone={R_TONE[r.status] ?? "neutral"}>{human(r.status)}</Badge>
                        <span className="mt-1 block text-[12px] text-[var(--a-ink-3)]">
                          {[r.emailed && "emailed", r.threadId && "in Inbox"].filter(Boolean).join(", ")}
                          {r.error ? ` ${r.error}` : ""}
                        </span>
                      </td>
                      <td className={cn(tableStyles.td, "whitespace-nowrap")}>{r.sentAt ? dt(r.sentAt) : "Not yet"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card title="English">
            <p className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">{c.subject}</p>
            <div
              className="mt-2 font-dm text-[13.5px] leading-relaxed text-[var(--a-ink-2)] [&_a]:text-[var(--a-blue)] [&_a]:underline [&_p+p]:mt-2.5 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: renderMarkdownLite(c.body) }}
            />
          </Card>
          {c.bodyFr ? (
            <Card title="French">
              <p className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">{c.subjectFr}</p>
              <div
                className="mt-2 font-dm text-[13.5px] leading-relaxed text-[var(--a-ink-2)] [&_a]:text-[var(--a-blue)] [&_a]:underline [&_p+p]:mt-2.5 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: renderMarkdownLite(c.bodyFr) }}
              />
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
