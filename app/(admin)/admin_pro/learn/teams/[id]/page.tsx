import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../_lib/admin-page-auth";
import { adminTeamDetail } from "@/lib/learn/team/admin";
import { TeamAdminForm } from "../TeamsAdminForms";

export const dynamic = "force-dynamic";

const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "–");

export default async function TeamAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const d = await adminTeamDetail((await params).id);
  if (!d) notFound();
  const { team } = d;
  const name = new Map(d.students.map((s) => [s.id, s]));
  const owner = name.get(team.ownerStudentId);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-[var(--ink3)]">
          <Link href="/admin_pro/learn" className="underline">Learn</Link> / <Link href="/admin_pro/learn/teams" className="underline">Teams</Link> / {team.name}
        </p>
        <h1 className="text-xl font-black text-[var(--ink)]">{team.name}</h1>
        <p className="text-sm text-[var(--ink3)]">
          Owner {owner ? `${owner.name} (${owner.email})` : team.ownerStudentId} · {team.comped ? "comped" : team.status} · {d.used} of {team.seats} seats in use ·{" "}
          {money(d.seatPrice)} per seat · MRR {team.status === "active" && !team.comped ? money(d.seatPrice * team.seats) : "$0"}
        </p>
        <p className="text-xs text-[var(--ink3)]">
          Stripe: {team.stripeSubscriptionId ?? "no subscription"} {team.stripeCustomerId ? `· ${team.stripeCustomerId}` : ""} · period end {day(team.currentPeriodEnd)}
          {team.graceUntil ? ` · grace until ${day(team.graceUntil)}` : ""}
          {team.cancelAtPeriodEnd ? " · cancels at period end" : ""}
        </p>
      </header>

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="mb-3 text-sm font-bold text-[var(--ink)]">Billing</h2>
        <TeamAdminForm
          id={team.id}
          comped={team.comped}
          seats={team.seats}
          seatPriceCents={team.seatPriceCents}
          defaultPriceCents={d.pricing.seatPriceCents}
          billed={!!team.stripeSubscriptionId}
        />
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Members</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--ink3)]">
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Invited</th>
                <th className="py-2">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {d.members.map((m) => (
                <tr key={m.id}>
                  <td className="py-2 pr-3">{m.email}</td>
                  <td className="py-2 pr-3">{m.studentId ? name.get(m.studentId)?.name ?? "" : ""}</td>
                  <td className="py-2 pr-3">{m.role}</td>
                  <td className="py-2 pr-3">
                    {m.status}
                    {m.status === "invited" && m.inviteExpiresAt && m.inviteExpiresAt < new Date() ? " (expired)" : ""}
                  </td>
                  <td className="py-2 pr-3">{day(m.invitedAt)}</td>
                  <td className="py-2">{day(m.joinedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
