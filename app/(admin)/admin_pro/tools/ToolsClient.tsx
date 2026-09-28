"use client";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Globe, Brain, Calculator } from "lucide-react";
import MetricCard from "@/components/admin/MetricCard";
import type { ToolUsageData } from "@/lib/admin/metrics";

type TabId = "scanner" | "calculator" | "advisor";

const TABS: { id: TabId; label: string; icon: typeof Globe; color: string }[] = [
  { id: "scanner", label: "Website Scanner", icon: Globe, color: "#2251A3" },
  { id: "calculator", label: "Cost Calculator", icon: Calculator, color: "#F47C20" },
  { id: "advisor", label: "AI Project Advisor", icon: Brain, color: "#7c3aed" },
];

function UsageChart({ data, color }: { data: { week: string; uses: number }[]; color: string }) {
  return (
    <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Usage Over Time</h3>
        <span className="text-[#7A8FA6] text-xs font-dm">Last 6 weeks, by week starting</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EFF8" />
          <XAxis dataKey="week" tick={{ fill: "#7A8FA6", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#7A8FA6", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip formatter={(v: number) => [v, "Uses"]} />
          <Area
            type="monotone"
            dataKey="uses"
            stroke={color}
            strokeWidth={2}
            fill={`url(#fill-${color.replace("#", "")})`}
            dot={{ fill: color, strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ToolsClient({ data }: { data: ToolUsageData }) {
  const [activeTab, setActiveTab] = useState<TabId>("scanner");
  const tab = TABS.find((t) => t.id === activeTab)!;
  const usage = data.tools.find((t) => t.tool === activeTab)!;
  const pct = (v: number | null) => (v == null ? "—" : `${v}%`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Tool Analytics</h1>
        <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">
          Recorded uses of each free tool. Only what is actually tracked is shown: which tool, and when.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-dm font-semibold transition-colors ${
                activeTab === t.id ? "bg-[#1B3A6B] text-white" : "bg-white border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#1B3A6B]"
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Uses, All Time" value={usage.allTime} icon={tab.icon} iconColor={tab.color} />
        <MetricCard label="Uses, Last 6 Weeks" value={usage.last6Weeks} icon={tab.icon} iconColor={tab.color} />
        {activeTab === "scanner" ? (
          <>
            <MetricCard label="Email Capture (saved scans)" value={pct(data.scanner.emailCaptureRate)} icon={Globe} iconColor="#0F6E56" />
            <MetricCard label="Booked a Call (saved scans)" value={pct(data.scanner.bookingRate)} icon={Globe} iconColor="#F47C20" />
          </>
        ) : null}
      </div>
      {activeTab === "scanner" && (
        <p className="-mt-3 font-dm text-xs text-[#7A8FA6]">
          {data.scanner.savedScans} scans were saved with details
          {data.scanner.avgScore != null ? `, averaging ${data.scanner.avgScore}/100` : ""}. Rates are out of saved scans, not every scan run.
        </p>
      )}
      {activeTab === "advisor" && (
        <p className="-mt-3 font-dm text-xs text-[#7A8FA6]">
          The advisor is hidden from the public tools page in production, so new uses here are expected to be rare.
        </p>
      )}

      <UsageChart data={usage.trend} color={tab.color} />
    </div>
  );
}
