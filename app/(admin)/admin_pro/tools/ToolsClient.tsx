"use client";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Globe, Brain, Calculator, MailCheck, CalendarCheck } from "lucide-react";
import { Card, PageHeader, Segmented, StatCard } from "@/components/admin/ui";
import type { ToolUsageData } from "@/lib/admin/metrics";

type TabId = "scanner" | "calculator" | "advisor";

const TABS: { id: TabId; label: string; icon: typeof Globe; color: string }[] = [
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
  const [activeTab, setActiveTab] = useState<TabId>("scanner");
  const tab = TABS.find((t) => t.id === activeTab)!;
  const usage = data.tools.find((t) => t.tool === activeTab)!;
  const pct = (v: number | null) => (v == null ? "n/a" : `${v}%`);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tool analytics"
        subtitle="Recorded uses of each free tool. Only what is actually tracked is shown: which tool, and when."
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
        {activeTab === "scanner" ? (
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
      {activeTab === "advisor" && (
        <p className="-mt-3 font-dm text-[12.5px] text-[var(--a-ink-3)]">
          The advisor is hidden from the public tools page in production, so new uses here are expected to be rare.
        </p>
      )}

      <UsageChart data={usage.trend} color={tab.color} />
    </div>
  );
}
