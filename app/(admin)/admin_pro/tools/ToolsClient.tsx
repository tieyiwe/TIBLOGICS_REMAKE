"use client";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { Globe, Brain, Calculator, MailCheck, CalendarCheck, Bot, DollarSign, ShieldCheck } from "lucide-react";
import { Card, PageHeader, Segmented, StatCard } from "@/components/admin/ui";
import type { ToolUsageData } from "@/lib/admin/metrics";

type TabId = "agentReady" | "scanner" | "calculator" | "advisor";

const TABS: { id: TabId; label: string; icon: typeof Globe; color: string }[] = [
  { id: "agentReady", label: "AI Agent Readiness", icon: Bot, color: "#0E7C66" },
  { id: "scanner", label: "Website Scanner", icon: Globe, color: "#2251A3" },
  { id: "calculator", label: "Cost Calculator", icon: Calculator, color: "#F47C20" },
  { id: "advisor", label: "AI Project Advisor", icon: Brain, color: "#7c3aed" },
];

function UsageChart({ data, color }: { data: { week: string; uses: number }[]; color: string }) {
  return (
    <Card title="Usage over time" subtitle="Last 6 weeks, by week starting">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#E3E9F1" />
          <XAxis dataKey="week" tick={{ fill: "#5A6E84", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#5A6E84", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
          <Tooltip
            formatter={(v: number) => [v, "Uses"]}
            contentStyle={{ borderRadius: 10, border: "1px solid #E3E9F1", boxShadow: "0 12px 32px rgba(13,27,42,.14)", fontSize: 13 }}
          />
          <Area
            type="monotone"
            dataKey="uses"
            stroke={color}
            strokeWidth={2}
            fill={`url(#fill-${color.replace("#", "")})`}
            dot={{ fill: color, strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default function ToolsClient({ data }: { data: ToolUsageData }) {
  const [activeTab, setActiveTab] = useState<TabId>("agentReady");
  const tab = TABS.find((t) => t.id === activeTab)!;
  const usage = data.tools.find((t) => t.tool === activeTab)!;
  const pct = (v: number | null) => (v == null ? "n/a" : `${v}%`);
  const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tool analytics"
        subtitle="Recorded uses of each tool. Only what is actually tracked is shown. AI Agent Readiness counts customer checks (not staff)."
        className="mb-0"
      />

      <Segmented
        ariaLabel="Tool"
        value={activeTab}
        onChange={(v) => setActiveTab(v as TabId)}
        options={TABS.map((t) => {
          const Icon = t.icon;
          return {
            value: t.id,
            label: (
              <>
                <Icon size={14} aria-hidden /> {t.label}
              </>
            ),
          };
        })}
      />

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Uses, all time" value={usage.allTime.toLocaleString()} icon={tab.icon} tone="navy" />
        <StatCard
          label="Uses, last 6 weeks"
          value={usage.last6Weeks.toLocaleString()}
          icon={tab.icon}
          spark={usage.trend.map((t) => t.uses)}
        />
        {activeTab === "agentReady" ? (
          <>
            <StatCard label="Bought a report or kit" value={pct(data.agentReady.paidRate)} hint={`${data.agentReady.paid} paid, ${data.agentReady.kits} kits`} icon={ShieldCheck} tone="success" />
            <StatCard label="Revenue" value={money(data.agentReady.revenueCents)} hint={data.agentReady.avgScore != null ? `average score ${data.agentReady.avgScore}/100` : undefined} icon={DollarSign} tone="orange" />
          </>
        ) : activeTab === "calculator" ? (
          <>
            <StatCard label="Full Plans sold" value={data.calculator.plansSold.toLocaleString()} icon={ShieldCheck} tone="success" />
            <StatCard label="Full Plan revenue" value={money(data.calculator.revenueCents)} icon={DollarSign} tone="orange" />
          </>
        ) : activeTab === "scanner" ? (
          <>
            <StatCard label="Email capture" value={pct(data.scanner.emailCaptureRate)} hint="of saved scans" icon={MailCheck} tone="success" />
            <StatCard label="Booked a call" value={pct(data.scanner.bookingRate)} hint="of saved scans" icon={CalendarCheck} tone="orange" />
          </>
        ) : null}
      </div>
      {activeTab === "scanner" && (
        <p className="-mt-3 font-dm text-[12.5px] text-[var(--a-ink-3)]">
          {data.scanner.savedScans} scans were saved with details
          {data.scanner.avgScore != null ? `, averaging ${data.scanner.avgScore}/100` : ""}. Rates are out of saved scans, not every scan run.
        </p>
      )}
      {activeTab === "agentReady" && (
        <p className="-mt-3 font-dm text-[12.5px] text-[var(--a-ink-3)]">
          Every check and sale is listed in <Link href="/admin_pro/scanner-leads/agent-ready" className="text-[var(--a-blue)] hover:underline">Scanner Leads &gt; AI Agent Readiness</Link>.
        </p>
      )}
      {activeTab === "advisor" && (
        <p className="-mt-3 font-dm text-[12.5px] text-[var(--a-ink-3)]">
          The advisor is hidden from the public tools page in production, so new uses here are expected to be rare.
        </p>
      )}

      <UsageChart data={usage.trend} color={tab.color} />

      {activeTab === "calculator" && (
        <Card title="Recent Full Plans" subtitle="Buyers of the calculator's paid plan (refunded plans stop working).">
          {data.calculator.recent.length === 0 ? (
            <p className="font-dm text-sm text-[var(--a-ink-3)]">No Full Plans sold yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] font-dm text-sm" data-testid="calc-plans">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[.08em] text-[var(--a-ink-3)]">
                    <th className="py-2 pr-3">Email</th><th className="py-2 pr-3">Paid</th><th className="py-2 pr-3">Amount</th><th className="py-2 pr-3">Access until</th><th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--a-border)]">
                  {data.calculator.recent.map((p, i) => (
                    <tr key={i}>
                      <td className="break-all py-2 pr-3 text-[var(--a-ink)]">{p.email ?? "—"}</td>
                      <td className="py-2 pr-3 text-[var(--a-ink-3)]">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-US", { dateStyle: "medium" }) : "—"}</td>
                      <td className="py-2 pr-3">{money(p.amountPaid)}</td>
                      <td className="py-2 pr-3 text-[var(--a-ink-3)]">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("en-US", { dateStyle: "medium" }) : "—"}</td>
                      <td className="py-2">{p.status === "refunded" ? <span className="text-red-600">Refunded</span> : p.expiresAt && new Date(p.expiresAt).getTime() < Date.now() ? <span className="text-[var(--a-ink-3)]">Expired</span> : <span className="text-green-700">Active</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
