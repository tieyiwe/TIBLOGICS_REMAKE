"use client";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Globe, Brain, Calculator } from "lucide-react";
import MetricCard from "@/components/admin/MetricCard";

// ── Mock Data ──────────────────────────────────────────────────────────────

const scannerData = {
  totalScans: 48,
  avgScore: 52,
  emailCapture: 38,
  bookingRate: 12,
  trend: [
    { week: "W1", uses: 4 },
    { week: "W2", uses: 7 },
    { week: "W3", uses: 11 },
    { week: "W4", uses: 9 },
    { week: "W5", uses: 14 },
    { week: "W6", uses: 3 },
  ],
};

const advisorData = {
  totalSessions: 23,
  avgDuration: "4.2 min",
  completionRate: 78,
  leadCapture: 35,
  trend: [
    { week: "W1", uses: 2 },
    { week: "W2", uses: 3 },
    { week: "W3", uses: 6 },
    { week: "W4", uses: 5 },
    { week: "W5", uses: 4 },
    { week: "W6", uses: 3 },
  ],
};

const calculatorData = {
  totalUses: 91,
  avgProjectValue: "$8,400",
  mostCommonService: "AI Implementation",
  estimateRequests: 28,
  trend: [
    { week: "W1", uses: 9 },
    { week: "W2", uses: 14 },
    { week: "W3", uses: 18 },
    { week: "W4", uses: 22 },
    { week: "W5", uses: 16 },
    { week: "W6", uses: 12 },
  ],
};

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = "scanner" | "advisor" | "calculator";

const TABS: { id: TabId; label: string; icon: typeof Globe }[] = [
  { id: "scanner", label: "Website Scanner", icon: Globe },
  { id: "advisor", label: "AI Project Advisor", icon: Brain },
  { id: "calculator", label: "Cost Calculator", icon: Calculator },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function UsageChart({ data, color }: { data: { week: string; uses: number }[]; color: string }) {
  return (
    <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Usage Over Time</h3>
        <span className="text-[#7A8FA6] text-xs font-dm">Last 6 weeks</span>
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

// ── Panels ─────────────────────────────────────────────────────────────────

function ScannerPanel() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Scans" value={scannerData.totalScans} icon={Globe} iconColor="#2251A3" />
        <MetricCard label="Avg Overall Score" value={scannerData.avgScore} suffix="/100" icon={Globe} iconColor="#7c3aed" />
        <MetricCard label="Email Capture Rate" value={scannerData.emailCapture} suffix="%" icon={Globe} iconColor="#0F6E56" />
        <MetricCard label="Booking Conversion" value={scannerData.bookingRate} suffix="%" icon={Globe} iconColor="#F47C20" />
      </div>
      <UsageChart data={scannerData.trend} color="#2251A3" />
    </div>
  );
}

function AdvisorPanel() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Sessions" value={advisorData.totalSessions} icon={Brain} iconColor="#7c3aed" />
        <MetricCard label="Avg Duration" value={advisorData.avgDuration} icon={Brain} iconColor="#2251A3" />
        <MetricCard label="Completion Rate" value={advisorData.completionRate} suffix="%" icon={Brain} iconColor="#0F6E56" />
        <MetricCard label="Lead Capture Rate" value={advisorData.leadCapture} suffix="%" icon={Brain} iconColor="#F47C20" />
      </div>
      <UsageChart data={advisorData.trend} color="#7c3aed" />
    </div>
  );
}

function CalculatorPanel() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Uses" value={calculatorData.totalUses} icon={Calculator} iconColor="#F47C20" />
        <MetricCard label="Avg Project Value" value={calculatorData.avgProjectValue} icon={Calculator} iconColor="#2251A3" />
        <MetricCard label="Top Service" value={calculatorData.mostCommonService} icon={Calculator} iconColor="#0F6E56" />
        <MetricCard label="Estimate Requests" value={calculatorData.estimateRequests} icon={Calculator} iconColor="#7c3aed" />
      </div>
      <UsageChart data={calculatorData.trend} color="#F47C20" />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("scanner");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Tool Analytics</h1>
        <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">Usage stats for your public-facing AI tools</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F4F7FB] p-1 rounded-xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-dm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-[#0D1B2A] shadow-sm"
                  : "text-[#7A8FA6] hover:text-[#0D1B2A]"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      {activeTab === "scanner" && <ScannerPanel />}
      {activeTab === "advisor" && <AdvisorPanel />}
      {activeTab === "calculator" && <CalculatorPanel />}
    </div>
  );
}
