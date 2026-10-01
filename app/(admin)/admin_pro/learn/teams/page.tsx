import Link from "next/link";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { teamTablesReady } from "@/lib/learn/team/db";
import { getTeamPricing, listTeamsForAdmin, teamMrr } from "@/lib/learn/team/admin";
import { CompTeamForm, DefaultsForm } from "./TeamsAdminForms";

export const dynamic = "force-dynamic";

const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default async function TeamsAdminPage() {
  await requireAdminPage();
  const ready = await teamTablesReady();
  const [teams, pricing, mrr] = ready ? await Promise.all([listTeamsForAdmin(), getTeamPricing(), teamMrr()]) : [[], await getTeamPricing(), { cents: 0, teams: 0, seats: 0 }];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-[var(--ink3)]">
          <Link href="/admin_pro/learn" className="underline">Learn</Link> / Teams
        </p>
        <h1 className="text-xl font-black text-[var(--ink)]">Teams</h1>
        <p className="text-sm text-[var(--ink3)]">
          Company plans: seats with every track, billed monthly per seat. Team MRR {money(mrr.cents)} from {mrr.teams} paying teams ({mrr.seats} seats).
        </p>
      </header>
      {!ready && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">The team tables could not be created. Check the database connection.</p>}

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">All teams</h2>
        {teams.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">No teams yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--ink3)]">
                  <th className="py-2 pr-3">Team</th>
                  <th className="py-2 pr-3">Owner</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Seats (active / invited)</th>
                  <th className="py-2 pr-3">Seat price</th>
                  <th className="py-2">MRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {teams.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 pr-3 font-semibold">
                      <Link href={`/admin_pro/learn/teams/${t.id}`} className="text-[var(--blue2)] underline">{t.name}</Link>
                    </td>
                    <td className="py-2 pr-3">{t.owner?.email ?? t.ownerStudentId}</td>
                    <td className="py-2 pr-3">{t.comped ? "comped" : t.status}{t.cancelAtPeriodEnd ? " (cancelling)" : ""}</td>
                    <td className="py-2 pr-3">{t.seats} ({t.activeMembers} / {t.invited})</td>
                    <td className="py-2 pr-3">{money(t.seatPrice)}</td>
                    <td className="py-2">{money(t.mrrCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Defaults for new teams</h2>
        <p className="mb-3 mt-1 text-xs text-[var(--ink3)]">
          Existing teams keep the price they bought at (change one on its page). If STRIPE_LEARN_TEAM_PRICE_ID is set, Stripe bills that Price instead; keep the two equal.
        </p>
        <DefaultsForm seatPriceCents={pricing.seatPriceCents} minSeats={pricing.minSeats} />
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Comp a team</h2>
        <p className="mb-3 mt-1 text-xs text-[var(--ink3)]">Free seats for partners and pilots. The owner needs a learner account; they invite their people from /learn/team.</p>
        <CompTeamForm />
      </section>
    </div>
  );
}
