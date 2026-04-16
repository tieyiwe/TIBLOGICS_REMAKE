"use client";
import { useState } from "react";
import { MoreVertical, Download, Search } from "lucide-react";

const appointments = [
  { id: "1", date: new Date("2026-04-18T10:00:00"), name: "Marcus Johnson", email: "marcus@techflow.io", service: "AI Strategy Session", duration: "60 min", amount: 29700, status: "CONFIRMED", paymentStatus: "paid" },
  { id: "2", date: new Date("2026-04-19T14:00:00"), name: "Sarah Obi", email: "sarah@fintech.ng", service: "AI Readiness Audit", duration: "90 min + PDF", amount: 49700, status: "PENDING", paymentStatus: "unpaid" },
  { id: "3", date: new Date("2026-04-22T11:00:00"), name: "David Chen", email: "dchen@startup.co", service: "Project Discovery Call", duration: "30 min", amount: 0, status: "CONFIRMED", paymentStatus: "free" },
  { id: "4", date: new Date("2026-04-25T09:00:00"), name: "Amara Diallo", email: "amara@diaspora.org", service: "Website AI Transformation", duration: "45 min", amount: 19700, status: "PENDING", paymentStatus: "unpaid" },
  { id: "5", date: new Date("2026-04-10T15:00:00"), name: "Michael Torres", email: "mike@restaurant.com", service: "AI Strategy Session", duration: "60 min", amount: 29700, status: "COMPLETED", paymentStatus: "paid" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-[#FEF0E3] text-[#F47C20]",
    CONFIRMED: "bg-[#EBF0FA] text-[#2251A3]",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`${map[status] ?? "bg-gray-100 text-gray-500"} text-xs font-medium px-2 py-0.5 rounded-full font-dm`}>
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    unpaid: "bg-[#FEF0E3] text-[#F47C20]",
    free: "bg-[#EBF0FA] text-[#2251A3]",
  };
  return (
    <span className={`${map[status] ?? "bg-gray-100 text-gray-500"} text-xs font-medium px-2 py-0.5 rounded-full font-dm`}>
      {status}
    </span>
  );
}

function ActionMenu({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F4F7FB] text-[#7A8FA6]"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 bg-white border border-[#D2DCE8] rounded-xl shadow-lg z-10 min-w-[140px] py-1">
          <button
            className="w-full text-left px-4 py-2 text-sm font-dm text-[#0D1B2A] hover:bg-[#F4F7FB]"
            onClick={() => setOpen(false)}
          >
            View Details
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm font-dm text-[#0D1B2A] hover:bg-[#F4F7FB]"
            onClick={() => setOpen(false)}
          >
            Add Zoom Link
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm font-dm text-red-500 hover:bg-red-50"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

const STATUS_OPTIONS = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

export default function AppointmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = appointments.filter(a => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.service.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Appointments</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">Manage all client bookings</p>
        </div>
        <button className="flex items-center gap-2 border border-[#D2DCE8] bg-white rounded-xl px-4 py-2 text-sm font-dm text-[#0D1B2A] hover:bg-[#F4F7FB] transition-colors">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
          <input
            type="text"
            placeholder="Search by name, email or service…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-[#D2DCE8] rounded-xl px-4 py-2.5 text-sm font-dm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D2DCE8] bg-[#F4F7FB]">
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Date & Time</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Service</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Duration</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Payment</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F7FB]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 font-dm text-sm text-[#7A8FA6]">
                    No appointments match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map(a => (
                  <tr key={a.id} className="hover:bg-[#F4F7FB]/60 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-dm text-sm font-medium text-[#0D1B2A]">{formatDate(a.date)}</p>
                      <p className="font-dm text-xs text-[#7A8FA6]">{formatTime(a.date)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-dm text-sm font-medium text-[#0D1B2A]">{a.name}</p>
                      <p className="font-dm text-xs text-[#7A8FA6]">{a.email}</p>
                    </td>
                    <td className="px-5 py-4 font-dm text-sm text-[#0D1B2A]">{a.service}</td>
                    <td className="px-5 py-4 font-dm text-sm text-[#7A8FA6]">{a.duration}</td>
                    <td className="px-5 py-4 font-dm text-sm font-semibold text-[#0D1B2A]">
                      {a.amount === 0 ? "Free" : `$${(a.amount / 100).toFixed(0)}`}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-4"><PaymentBadge status={a.paymentStatus} /></td>
                    <td className="px-5 py-4"><ActionMenu id={a.id} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
