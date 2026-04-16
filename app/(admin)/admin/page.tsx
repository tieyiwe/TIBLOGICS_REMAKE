"use client";
import Link from "next/link";
import { Calendar, Users, BarChart2, DollarSign } from "lucide-react";
import MetricCard from "@/components/admin/MetricCard";
import RevenueChart from "@/components/admin/RevenueChart";

const mockAppointments = [
  { id: "1", date: "Apr 18, 2026", time: "10:00 AM", name: "Marcus Johnson", service: "AI Strategy Session", status: "CONFIRMED", amount: 29700 },
  { id: "2", date: "Apr 19, 2026", time: "2:00 PM", name: "Sarah Obi", service: "AI Readiness Audit", status: "PENDING", amount: 49700 },
  { id: "3", date: "Apr 22, 2026", time: "11:00 AM", name: "David Chen", service: "Project Discovery Call", status: "CONFIRMED", amount: 0 },
];

const mockProspects = [
  { id: "1", name: "Marcus Johnson", business: "TechFlow Inc", industry: "SaaS", status: "NEW", solutions: ["AI Implementation", "Workflow Automation"] },
  { id: "2", name: "Aisha Diallo", business: "DigiLearn Africa", industry: "EdTech", status: "CONTACTED", solutions: ["AI Strategy", "Web Dev"] },
  { id: "3", name: "Robert Kim", business: "HealthBridge", industry: "Healthcare", status: "QUALIFIED", solutions: ["CareFlow AI", "AI Agents"] },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-[#FEF0E3] text-[#F47C20]",
    CONFIRMED: "bg-[#EBF0FA] text-[#2251A3]",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-500",
    NEW: "bg-[#FEF0E3] text-[#F47C20]",
    CONTACTED: "bg-[#EBF0FA] text-[#2251A3]",
    QUALIFIED: "bg-green-100 text-green-700",
    PROPOSAL_SENT: "bg-purple-100 text-purple-700",
    CLOSED_WON: "bg-green-100 text-green-700",
  };
  return (
    <span className={`${map[status] ?? "bg-gray-100 text-gray-500"} text-xs font-medium px-2 py-0.5 rounded-full font-dm`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Appointments This Month" value={3} change={50} icon={Calendar} iconColor="#2251A3" />
        <MetricCard label="Revenue This Month" value="$791" change={22} icon={DollarSign} iconColor="#F47C20" prefix="" />
        <MetricCard label="New Prospects" value={7} icon={Users} iconColor="#0F6E56" />
        <MetricCard label="Tool Uses Today" value={12} icon={BarChart2} iconColor="#7c3aed" />
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Upcoming Appointments</h3>
            <Link href="/admin/appointments" className="text-xs text-[#2251A3] font-dm hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {mockAppointments.map(a => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2 border-b border-[#F4F7FB] last:border-0"
              >
                <div>
                  <p className="font-dm font-medium text-sm text-[#0D1B2A]">{a.name}</p>
                  <p className="font-dm text-xs text-[#7A8FA6]">{a.service} · {a.date} {a.time}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Prospects */}
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Recent Prospects</h3>
            <Link href="/admin/prospects" className="text-xs text-[#2251A3] font-dm hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {mockProspects.map(p => (
              <div
                key={p.id}
                className="flex items-start justify-between py-2 border-b border-[#F4F7FB] last:border-0"
              >
                <div>
                  <p className="font-dm font-medium text-sm text-[#0D1B2A]">{p.name}</p>
                  <p className="font-dm text-xs text-[#7A8FA6]">{p.business} · {p.industry}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {p.solutions.map(s => (
                      <span key={s} className="bg-[#EBF0FA] text-[#2251A3] text-xs px-2 py-0.5 rounded-full font-dm">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue chart */}
      <RevenueChart />
    </div>
  );
}
