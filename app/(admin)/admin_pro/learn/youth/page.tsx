import Link from "next/link";
import { Badge, EmptyState, PageHeader, type BadgeTone } from "@/components/admin/ui";
import { LEARN_TABS } from "../tabs";
import { canManageLearners, requireLearnerPage } from "@/lib/learn/account-status/admin-auth";
import { listSponsorships } from "@/lib/learn/youth-sponsor";
import { ResendSponsorship } from "./ResendSponsorship";

export const dynamic = "force-dynamic";

// AI-Empowered Youth: sponsored places (lib/learn/youth-sponsor.ts). Who paid,
// their relationship to the young person, the child and where it stands.
// "Resend" sends the child's welcome again, or the parent's consent email
// while the parent has not confirmed.

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  active: { label: "Active", tone: "success" },
  awaiting_consent: { label: "Waiting for parent", tone: "warn" },
  fulfilling: { label: "Processing", tone: "info" },
  canceled: { label: "Canceled", tone: "neutral" },
};
const REL: Record<string, string> = {
  parent: "Parent", guardian: "Guardian", grandparent: "Grandparent", auntUncle: "Aunt or uncle", sibling: "Older sibling",
  godparent: "Godparent", friend: "Family friend", mentor: "Mentor or coach", teacher: "Teacher", other: "Other",
};

export default async function YouthSponsorshipsPage() {
  const session = await requireLearnerPage("read");
  const canManage = canManageLearners(session);
  const rows = await listSponsorships().catch(() => []);
  return (
    <div className="space-y-5">
      <PageHeader
        title="AI-Empowered Youth: sponsorships"
        subtitle="Places paid for by a parent, a relative, a mentor or anybody else. The child's welcome waits for the parent's consent under 13."
        breadcrumb={[{ label: "ARFA · AI Academy", href: "/admin_pro/learn" }, { label: "Youth sponsorships" }]}
        tabs={LEARN_TABS}
        activeTab="/admin_pro/learn/youth"
      />
      {rows.length === 0 ? (
        <EmptyState title="No sponsorships yet" body="Paid sponsorships from /sponsor-youth appear here." />
      ) : (
        <div className="overflow-x-auto rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)]">
          <table className="w-full min-w-[760px] font-dm text-[13.5px]" data-testid="admin-sponsorships">
            <thead>
              <tr className="border-b border-[var(--a-border)] text-left text-[12px] text-[var(--a-ink-3)]">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Sponsor</th>
                <th className="px-4 py-2">Relationship</th>
                <th className="px-4 py-2">Young person</th>
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = STATUS[r.status] ?? { label: r.status, tone: "neutral" as BadgeTone };
                return (
                  <tr key={r.id} className="border-b border-[var(--a-border)] align-top last:border-0">
                    <td className="whitespace-nowrap px-4 py-2">{new Date(r.createdAt).toISOString().slice(0, 10)}</td>
                    <td className="px-4 py-2"><span className="font-semibold">{r.sponsorName}</span><br /><span className="text-[12px] text-[var(--a-ink-3)]">{r.sponsorEmail}</span></td>
                    <td className="px-4 py-2">{r.relationship === "other" ? `Other: ${r.relationshipOther ?? ""}` : REL[r.relationship] ?? r.relationship}</td>
                    <td className="px-4 py-2">
                      {r.childStudentId ? <Link href={`/admin_pro/learn/learners/${r.childStudentId}`} className="font-semibold text-[var(--a-blue)] hover:underline">{r.childFirstName}</Link> : r.childFirstName}
                      <span className="text-[12px] text-[var(--a-ink-3)]"> · {r.childAge} · {r.lane.endsWith("explorer") ? "Explorer" : "Builder"} · {r.childLocale.toUpperCase()}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">{r.plan === "monthly" ? "Monthly" : "Lifetime"} · ${(Number(r.amountCents) / 100).toFixed(2)}{Number(r.siblingPct) ? ` (−${r.siblingPct}%)` : ""}</td>
                    <td className="px-4 py-2"><Badge tone={st.tone}>{st.label}</Badge>{r.childEmailSentAt ? <span className="block text-[11px] text-[var(--a-ink-3)]">Child emailed</span> : null}</td>
                    <td className="px-4 py-2">{canManage && r.childStudentId ? <ResendSponsorship id={r.id} /> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
