"use client";
import { useState, useEffect } from "react";
import { MoreVertical, Download, Search, Loader2 } from "lucide-react";

interface Appointment {
  id: string;
  date: string;
  timeSlot: string;
  firstName: string;
  lastName: string;
  email: string;
  serviceType: string;
  serviceDuration: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  notes?: string | null;
}

function getPhone(notes?: string | null): string {
  if (!notes) return "—";
  try {
    const parsed = JSON.parse(notes);
    return parsed.phone ?? "—";
  } catch {
    return "—";
  }
}

function getSource(notes?: string | null): string {
  if (!notes) return "—";
  try {
    const parsed = JSON.parse(notes);
    return parsed.source === "echelon_chat" ? "Echelon Chat" : parsed.source ?? "—";
  } catch {
    return "—";
  }
}

function formatServiceType(t: string): string {
  return t
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-[#FEF0E3] text-[#F47C20]",
    CONFIRMED: "bg-[#EBF0FA] text-[#2251A3]",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`${map[status] ?? "bg-gray-100 text-gray-500"} text-xs font-medium px-2 py-0.5 rounded-full font-dm`}
    >
      {status}
    </span>
  );
}

function PaymentBadge({ status, amount }: { status: string; amount: number }) {
  const label = amount === 0 ? "free" : status?.toLowerCase() ?? "unpaid";
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    unpaid: "bg-[#FEF0E3] text-[#F47C20]",
    free: "bg-[#EBF0FA] text-[#2251A3]",
  };
  return (
    <span
      className={`${map[label] ?? "bg-gray-100 text-gray-500"} text-xs font-medium px-2 py-0.5 rounded-full font-dm`}
    >
      {label}
    </span>
  );
}

function ActionMenu({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/appointments");
        if (res.ok) {
          const data = await res.json();
          setAppointments(data.appointments ?? data ?? []);
        }
      } catch {
        // keep empty
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, []);

  const filtered = appointments.filter((a) => {
    const name = `${a.firstName} ${a.lastName}`.toLowerCase();
    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.serviceType.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Appointments</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">
            Manage all client bookings
          </p>
        </div>
        <button className="flex items-center gap-2 border border-[#D2DCE8] bg-white rounded-xl px-4 py-2 text-sm font-dm text-[#0D1B2A] hover:bg-[#F4F7FB] transition-colors">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]"
          />
          <input
            type="text"
            placeholder="Search by name, email or service…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-[#D2DCE8] rounded-xl px-4 py-2.5 text-sm font-dm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All Statuses" : s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D2DCE8] bg-[#F4F7FB]">
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">
                  Date & Time
                </th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">
                  Client
                </th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">
                  Phone
                </th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">
                  Service
                </th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">
                  Source
                </th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">
                  Amount
                </th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">
                  Payment
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F7FB]">
              {loadingData ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <Loader2
                      size={20}
                      className="animate-spin text-[#7A8FA6] mx-auto"
                    />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 font-dm text-sm text-[#7A8FA6]"
                  >
                    {appointments.length === 0
                      ? "No appointments yet."
                      : "No appointments match your filters."}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-[#F4F7FB]/60 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-dm text-sm font-medium text-[#0D1B2A]">
                        {formatDate(a.date)}
                      </p>
                      <p className="font-dm text-xs text-[#7A8FA6]">
                        {a.timeSlot}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-dm text-sm font-medium text-[#0D1B2A]">
                        {a.firstName} {a.lastName}
                      </p>
                      <p className="font-dm text-xs text-[#7A8FA6]">{a.email}</p>
                    </td>
                    <td className="px-5 py-4 font-dm text-sm text-[#3A4A5C]">
                      {getPhone(a.notes)}
                    </td>
                    <td className="px-5 py-4 font-dm text-sm text-[#0D1B2A]">
                      {formatServiceType(a.serviceType)}
                      <span className="block text-xs text-[#7A8FA6]">
                        {a.serviceDuration} min
                      </span>
                    </td>
                    <td className="px-5 py-4 font-dm text-xs text-[#7A8FA6]">
                      {getSource(a.notes)}
                    </td>
                    <td className="px-5 py-4 font-dm text-sm font-semibold text-[#0D1B2A]">
                      {a.totalAmount === 0
                        ? "Free"
                        : `$${(a.totalAmount / 100).toFixed(0)}`}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-4">
                      <PaymentBadge
                        status={a.paymentStatus}
                        amount={a.totalAmount}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <ActionMenu id={a.id} />
                    </td>
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
