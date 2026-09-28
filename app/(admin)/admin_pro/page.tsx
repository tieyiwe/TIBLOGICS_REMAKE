import Link from "next/link";
import { Calendar, Users, BarChart2, DollarSign } from "lucide-react";
import MetricCard from "@/components/admin/MetricCard";
import RevenueChart from "@/components/admin/RevenueChart";
import { requireAdminPage } from "./_lib/admin-page-auth";
import { getDashboard } from "@/lib/admin/metrics";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

// The dashboard used to be a client component with hardcoded figures: three
// invented upcoming appointments with invented clients, three invented
// prospects, "$791 revenue this month" and a six-month revenue curve, none of it
// from the database. Every number below is read from records, and an empty
// state says so rather than showing a sample.

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

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const d = await getDashboard();

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Appointments This Month" value={d.appointmentsThisMonth} change={d.appointmentsChange} icon={Calendar} iconColor="#2251A3" />
        <MetricCard label="Paid Revenue This Month" value={money(d.revenueThisMonth)} change={d.revenueChange} icon={DollarSign} iconColor="#F47C20" />
        <MetricCard label="New Prospects This Month" value={d.newProspectsThisMonth} icon={Users} iconColor="#0F6E56" />
        <MetricCard label="Tool Uses Today" value={d.toolUsesToday} icon={BarChart2} iconColor="#7c3aed" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Upcoming Appointments</h3>
            <Link href="/admin_pro/appointments" className="text-xs text-[#2251A3] font-dm hover:underline">
              View All →
            </Link>
          </div>
          {d.upcoming.length === 0 ? (
            <p className="py-6 text-center font-dm text-sm text-[#7A8FA6]">No upcoming appointments.</p>
          ) : (
            <div className="space-y-3">
              {d.upcoming.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-[#F4F7FB] last:border-0">
                  <div>
                    <p className="font-dm font-medium text-sm text-[#0D1B2A]">{a.firstName} {a.lastName}</p>
                    <p className="font-dm text-xs text-[#7A8FA6]">
                      {a.serviceType} · {a.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} {a.timeSlot}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Prospects */}
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Recent Prospects</h3>
            <Link href="/admin_pro/prospects" className="text-xs text-[#2251A3] font-dm hover:underline">
              View All →
            </Link>
          </div>
          {d.recentProspects.length === 0 ? (
            <p className="py-6 text-center font-dm text-sm text-[#7A8FA6]">No prospects yet.</p>
          ) : (
            <div className="space-y-3">
              {d.recentProspects.map((p) => (
                <div key={p.id} className="flex items-start justify-between py-2 border-b border-[#F4F7FB] last:border-0">
                  <div>
                    <p className="font-dm font-medium text-sm text-[#0D1B2A]">{p.name}</p>
                    <p className="font-dm text-xs text-[#7A8FA6]">{p.business} · {p.industry}</p>
                    {p.suggestedSolutions.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {p.suggestedSolutions.slice(0, 3).map((sol) => (
                          <span key={sol} className="bg-[#EBF0FA] text-[#2251A3] text-xs px-2 py-0.5 rounded-full font-dm">{sol}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <RevenueChart data={d.trend} />
    </div>
  );
}
