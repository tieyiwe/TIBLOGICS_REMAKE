import { DollarSign, TrendingUp, Calendar, Repeat, ShoppingBag } from "lucide-react";
import { Button, Card, DataTable, EmptyState, PageHeader, SectionTitle, StatCard } from "@/components/admin/ui";
import RevenueChart from "@/components/admin/RevenueChart";
import { requireAdminPage } from "../_lib/admin-page-auth";
import { getRevenue } from "@/lib/admin/metrics";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

// This page used to be entirely hardcoded: "$24,700 all time", "$549 MRR", a
// twelve-month curve and five paid appointments from five invented clients.
// It now reads what was actually paid. Learn subscription revenue is shown as
// an estimate, because subscriptions do not record each person's actual price.

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function pct(now: number, before: number): number | undefined {
  return before === 0 ? undefined : Math.round(((now - before) / before) * 100);
}

export default async function RevenuePage() {
  await requireAdminPage();
  const r = await getRevenue();

  const sources = [
    { label: "Store", cents: r.allTime.store, color: "#1B3A6B" },
    { label: "Events & training", cents: r.allTime.events, color: "#F47C20" },
    { label: "Paid bookings", cents: r.allTime.bookings, color: "#0F6E56" },
    { label: "Automation Blueprints", cents: r.allTime.blueprints, color: "#7c3aed" },
    { label: "ARFA track purchases (one-time)", cents: r.allTime.learnTracks, color: "#0EA5E9" },
  ];
  const maxSource = Math.max(1, ...sources.map((s) => s.cents));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue"
        subtitle="Money actually received: paid store orders, event registrations, bookings, Automation Blueprints and ARFA · AI Academy track purchases."
        className="mb-0"
      />

      <div>
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Paid revenue, all time" value={money(r.allTime.total)} icon={DollarSign} tone="navy" />
          <StatCard
            label="This month"
            value={money(r.thisMonth.total)}
            delta={pct(r.thisMonth.total, r.lastMonth.total) ?? null}
            deltaLabel={pct(r.thisMonth.total, r.lastMonth.total) === undefined ? undefined : "vs last month"}
            icon={TrendingUp}
            tone="orange"
          />
          <StatCard label="Last month" value={money(r.lastMonth.total)} icon={Calendar} />
          <StatCard
            label="Est. Learn MRR"
            value={money(r.mrr.cents)}
            hint={`${r.mrr.activeSubscribers} active, ${r.mrr.activeTeams} teams`}
            icon={Repeat}
            tone="success"
          />
        </div>
        <p className="mt-2 font-dm text-xs text-[var(--a-ink-3)]">
          Learn MRR is estimated from active subscriptions at today&apos;s plan prices. Founding rates and discounts are
          not stored per subscriber, so check Stripe for the exact figure. Includes {money(r.mrr.teamCents)} from{" "}
          {r.mrr.teamSeats} team seats.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="By source, all time">
          <ul className="space-y-4">
            {sources.map((s) => (
              <li key={s.label}>
                <div className="flex justify-between gap-3 font-dm text-sm">
                  <span className="text-[var(--a-ink-2)]">{s.label}</span>
                  <span className="font-semibold text-[var(--a-ink)] tabular-nums">{money(s.cents)}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--a-surface-2)]">
                  <div className="h-full rounded-full" style={{ width: `${(s.cents / maxSource) * 100}%`, background: s.color }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <div className="min-w-0 lg:col-span-2">
          <RevenueChart data={r.trend} title="Monthly trend" subtitle="Last 12 months" />
        </div>
      </div>

      <div>
        <SectionTitle
          action={
            <Button href="/admin_pro/shop" variant="ghost" size="sm">
              Open store
            </Button>
          }
        >
          Recent paid orders
        </SectionTitle>
        <DataTable
          caption="Recent paid orders"
          rows={r.recentOrders}
          rowKey={(o) => o.id}
          empty={<EmptyState icon={ShoppingBag} title="No paid store orders yet" body="Paid and fulfilled orders show up here." />}
          columns={[
            { key: "order", header: "Order", primary: true, render: (o) => o.orderNumber },
            { key: "customer", header: "Customer", render: (o) => <span className="break-all">{o.email}</span> },
            {
              key: "items",
              header: "Items",
              render: (o) => {
                const items = Array.isArray(o.items) ? (o.items as Array<{ name?: string }>) : [];
                return items.map((i) => i.name).filter(Boolean).join(", ") || "None";
              },
            },
            {
              key: "date",
              header: "Date",
              render: (o) => (
                <span className="text-[var(--a-ink-3)] tabular-nums">
                  {o.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              ),
            },
            { key: "amount", header: "Amount", align: "right", render: (o) => <span className="font-semibold text-[var(--a-ink)] tabular-nums">{money(o.total)}</span> },
          ]}
        />
      </div>
    </div>
  );
}
