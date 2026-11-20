import { requireAdminPage } from "../../_lib/admin-page-auth";
import { teamTablesReady } from "@/lib/learn/team/db";
import { getTeamPricing, listTeamsForAdmin, teamMrr } from "@/lib/learn/team/admin";
import { CompTeamForm, DefaultsForm } from "./TeamsAdminForms";
import { Building2, DollarSign, Gift, UsersRound } from "lucide-react";
import { Badge, Card, DataTable, EmptyState, Notice, PageHeader, StatCard, type BadgeTone } from "@/components/admin/ui";
import { LEARN_TABS } from "../tabs";

const TEAM_TONE: Record<string, BadgeTone> = { active: "success", trialing: "info", past_due: "warn", canceled: "neutral", incomplete: "warn" };

export const dynamic = "force-dynamic";

const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default async function TeamsAdminPage() {
  await requireAdminPage();
  const ready = await teamTablesReady();
  const [teams, pricing, mrr] = ready ? await Promise.all([listTeamsForAdmin(), getTeamPricing(), teamMrr()]) : [[], await getTeamPricing(), { cents: 0, teams: 0, seats: 0 }];

  type Team = (typeof teams)[number];
  const comped = teams.filter((t) => t.comped).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        subtitle="Company plans: seats with every track, billed monthly per seat."
        breadcrumb={[{ label: "ARFA · AI Academy", href: "/admin_pro/learn" }, { label: "Teams" }]}
        tabs={LEARN_TABS}
        activeTab="/admin_pro/learn/teams"
        className="mb-0"
      />
      {!ready && <Notice tone="warn" title="Team tables unavailable">The team tables could not be created. Check the database connection.</Notice>}

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Team MRR" value={money(mrr.cents)} icon={DollarSign} tone="success" />
        <StatCard label="Paying teams" value={mrr.teams} icon={Building2} tone="navy" />
        <StatCard label="Paid seats" value={mrr.seats} icon={UsersRound} />
        <StatCard label="Comped teams" value={comped} icon={Gift} />
      </div>

      <DataTable<Team>
        caption="All teams"
        rows={teams}
        rowKey={(t) => t.id}
        rowHref={(t) => `/admin_pro/learn/teams/${t.id}`}
        empty={
          <EmptyState
            icon={UsersRound}
            title="No teams yet"
            body="Teams appear when a company buys seats, or when you comp one below for a partner or pilot."
            action={
              <a href="#comp-team" className="font-dm text-[13.5px] font-semibold text-[var(--a-blue)] hover:underline">
                Comp a team
              </a>
            }
          />
        }
        columns={[
          { key: "name", header: "Team", primary: true, render: (t) => <span className="font-semibold text-[var(--a-ink)]">{t.name}</span> },
          { key: "owner", header: "Owner", render: (t) => <span className="break-all">{t.owner?.email ?? t.ownerStudentId}</span> },
          {
            key: "status",
            header: "Status",
            render: (t) => (
              <Badge tone={t.comped ? "orange" : (TEAM_TONE[t.status] ?? "neutral")} dot className="capitalize">
                {t.comped ? "comped" : t.status.replace("_", " ")}
                {t.cancelAtPeriodEnd ? " (cancelling)" : ""}
              </Badge>
            ),
          },
          {
            key: "seats",
            header: "Seats",
            align: "right",
            render: (t) => (
              <span className="tabular-nums">
                <span className="font-semibold text-[var(--a-ink)]">{t.seats}</span>{" "}
                <span className="text-[12px] text-[var(--a-ink-3)]">
                  ({t.activeMembers} active / {t.invited} invited)
                </span>
              </span>
            ),
          },
          { key: "price", header: "Seat price", align: "right", hideOnMobile: true, render: (t) => <span className="tabular-nums">{money(t.seatPrice)}</span> },
          { key: "mrr", header: "MRR", align: "right", render: (t) => <span className="font-semibold tabular-nums text-[var(--a-ink)]">{money(t.mrrCents)}</span> },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          title="Defaults for new teams"
          subtitle="Existing teams keep the price they bought at (change one on its page). If STRIPE_LEARN_TEAM_PRICE_ID is set, Stripe bills that Price for the base band (keep the two equal); volume bands are always billed at the band price."
        >
          <div className="font-dm text-[13px] font-semibold text-[var(--a-ink-2)]">
            <DefaultsForm seatPriceCents={pricing.seatPriceCents} minSeats={pricing.minSeats} tiers={pricing.tiers} />
          </div>
        </Card>
        <Card
          id="comp-team"
          title="Comp a team"
          subtitle="Free seats for partners and pilots. The owner needs a learner account; they invite their people from /learn/team."
        >
          <div className="font-dm text-[13px] font-semibold text-[var(--a-ink-2)]">
            <CompTeamForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
