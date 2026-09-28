import { DollarSign, TrendingUp, Calendar, Repeat } from "lucide-react";
import MetricCard from "@/components/admin/MetricCard";
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
  ];
  const maxSource = Math.max(1, ...sources.map((s) => s.cents));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Revenue</h1>
        <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">
          Money actually received: paid store orders, paid event registrations and paid bookings.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Paid Revenue, All Time" value={money(r.allTime.total)} icon={DollarSign} iconColor="#1B3A6B" />
        <MetricCard label="This Month" value={money(r.thisMonth.total)} change={pct(r.thisMonth.total, r.lastMonth.total)} icon={TrendingUp} iconColor="#F47C20" />
        <MetricCard label="Last Month" value={money(r.lastMonth.total)} icon={Calendar} iconColor="#2251A3" />
        <MetricCard
          label={`Est. Learn MRR (${r.mrr.activeSubscribers} active)`}
          value={money(r.mrr.cents)}
          icon={Repeat}
          iconColor="#0F6E56"
        />
      </div>
      <p className="-mt-3 font-dm text-xs text-[#7A8FA6]">
        Learn MRR is estimated from active subscriptions at today&apos;s plan prices. Founding rates and discounts are
        not stored per subscriber, so check Stripe for the exact figure.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
          <h3 className="font-syne font-bold text-base text-[#0D1B2A] mb-4">By Source, All Time</h3>
          <ul className="space-y-4">
            {sources.map((s) => (
              <li key={s.label}>
                <div className="flex justify-between font-dm text-sm">
                  <span className="text-[#3A4A5C]">{s.label}</span>
                  <span className="font-semibold text-[#0D1B2A]">{money(s.cents)}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-[#F4F7FB] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(s.cents / maxSource) * 100}%`, background: s.color }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-2">
          <RevenueChart data={r.trend} title="Monthly Trend" subtitle="Last 12 months" />
        </div>
      </div>

      <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
        <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Recent Paid Orders</h3>
        {r.recentOrders.length === 0 ? (
          <p className="py-8 text-center font-dm text-sm text-[#7A8FA6]">No paid store orders yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm font-dm">
              <thead>
                <tr className="border-b border-[#F4F7FB] text-left text-xs uppercase tracking-wider text-[#7A8FA6]">
                  <th className="py-2 pr-4 font-semibold">Order</th>
                  <th className="py-2 pr-4 font-semibold">Customer</th>
                  <th className="py-2 pr-4 font-semibold">Items</th>
                  <th className="py-2 pr-4 font-semibold">Date</th>
                  <th className="py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {r.recentOrders.map((o) => {
                  const items = Array.isArray(o.items) ? (o.items as Array<{ name?: string }>) : [];
                  return (
                    <tr key={o.id} className="border-b border-[#F4F7FB] last:border-0">
                      <td className="py-3 pr-4 font-medium text-[#0D1B2A]">{o.orderNumber}</td>
                      <td className="py-3 pr-4 text-[#3A4A5C]">{o.email}</td>
                      <td className="py-3 pr-4 text-[#3A4A5C]">{items.map((i) => i.name).filter(Boolean).join(", ") || "—"}</td>
                      <td className="py-3 pr-4 text-[#7A8FA6]">{o.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="py-3 text-right font-semibold text-[#0D1B2A]">{money(o.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
