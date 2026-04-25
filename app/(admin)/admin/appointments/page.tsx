"use client";
import { useState, useEffect, useRef } from "react";
import {
  MoreVertical, Download, Search, Loader2, X, CheckCircle,
  Video, Trash2, Ban, CheckCheck, Clock, AlertCircle, ExternalLink, Send,
} from "lucide-react";

interface Appointment {
  id: string;
  date: string;
  timeSlot: string;
  timezone: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string | null;
  goalNotes?: string | null;
  serviceType: string;
  serviceDuration: number;
  servicePrice: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  zoomLink?: string | null;
  notes?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  addOnRecording: boolean;
  addOnActionPlan: boolean;
  addOnSlackAccess: boolean;
  createdAt: string;
}

function fmt(t: string) {
  return t.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function fmtMoney(cents: number) {
  return cents === 0 ? "Free" : `$${(cents / 100).toFixed(0)}`;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "bg-[#FEF0E3] text-[#F47C20]",
  CONFIRMED: "bg-[#EBF0FA] text-[#2251A3]",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  NO_SHOW:   "bg-red-100 text-red-500",
};

function Badge({ label, cls }: { label: string; cls: string }) {
  return <span className={`${cls} text-xs font-medium px-2.5 py-0.5 rounded-full font-dm`}>{label}</span>;
}

function ActionMenu({
  appt, onSelect,
}: {
  appt: Appointment;
  onSelect: (appt: Appointment) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F4F7FB] text-[#7A8FA6]"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 bg-white border border-[#D2DCE8] rounded-xl shadow-lg z-20 min-w-[160px] py-1">
          <button
            className="w-full text-left px-4 py-2.5 text-sm font-dm text-[#0D1B2A] hover:bg-[#F4F7FB] flex items-center gap-2"
            onClick={() => { onSelect(appt); setOpen(false); }}
          >
            <ExternalLink size={13} className="text-[#7A8FA6]" /> View Details
          </button>
        </div>
      )}
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  appt,
  onClose,
  onUpdated,
}: {
  appt: Appointment;
  onClose: () => void;
  onUpdated: (updated: Appointment) => void;
}) {
  const [meetingLink, setMeetingLink] = useState(appt.zoomLink ?? "");
  const [cancelReason, setCancelReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function patch(body: object) {
    const res = await fetch(`/api/appointments/${appt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res;
  }

  async function handleConfirm() {
    setBusy("confirm");
    try {
      const res = await fetch(`/api/admin/appointments/${appt.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingLink: meetingLink.trim() || null }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      onUpdated({ ...appt, ...updated, zoomLink: meetingLink.trim() || null, status: "CONFIRMED", confirmedAt: new Date().toISOString() });
      showToast("ok", "Appointment confirmed. Confirmation email sent to client.");
    } catch {
      showToast("err", "Failed to confirm appointment.");
    } finally {
      setBusy(null);
    }
  }

  async function handleComplete() {
    setBusy("complete");
    try {
      const res = await patch({ status: "COMPLETED" });
      if (!res.ok) throw new Error();
      onUpdated({ ...appt, status: "COMPLETED" });
      showToast("ok", "Marked as completed.");
    } catch {
      showToast("err", "Failed to update.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    setBusy("cancel");
    try {
      const res = await patch({ status: "CANCELLED", cancelReason: cancelReason || "Cancelled by admin" });
      if (!res.ok) throw new Error();
      onUpdated({ ...appt, status: "CANCELLED", cancelReason: cancelReason || "Cancelled by admin" });
      showToast("ok", "Appointment cancelled.");
    } catch {
      showToast("err", "Failed to cancel.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSaveMeetingLink() {
    setBusy("link");
    try {
      const res = await patch({ zoomLink: meetingLink.trim() || null });
      if (!res.ok) throw new Error();
      onUpdated({ ...appt, zoomLink: meetingLink.trim() || null });
      showToast("ok", "Meeting link saved.");
    } catch {
      showToast("err", "Failed to save link.");
    } finally {
      setBusy(null);
    }
  }

  async function handleResendEmail() {
    setBusy("resend");
    try {
      const res = await fetch(`/api/admin/appointments/${appt.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingLink: appt.zoomLink, resendOnly: true }),
      });
      if (!res.ok) throw new Error();
      showToast("ok", "Confirmation email resent to client.");
    } catch {
      showToast("err", "Failed to resend email.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete this appointment for ${appt.firstName} ${appt.lastName}? This cannot be undone.`)) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/appointments/${appt.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onUpdated({ ...appt, status: "_DELETED" });
      onClose();
    } catch {
      showToast("err", "Failed to delete.");
    } finally {
      setBusy(null);
    }
  }

  const currentAppt = appt;
  const isActive = !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(currentAppt.status);

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D2DCE8] sticky top-0 bg-white z-10">
          <div>
            <p className="font-syne font-bold text-base text-[#0D1B2A]">{appt.firstName} {appt.lastName}</p>
            <p className="font-dm text-xs text-[#7A8FA6]">{appt.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge label={appt.status} cls={STATUS_COLOR[appt.status] ?? "bg-gray-100 text-gray-500"} />
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F4F7FB] text-[#7A8FA6]">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-dm border ${
            toast.type === "ok"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}>
            {toast.type === "ok" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {toast.msg}
          </div>
        )}

        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Meeting Details */}
          <section className="bg-[#F4F7FB] rounded-2xl p-4 space-y-2">
            <p className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide mb-3">Meeting Details</p>
            <Row label="Service" value={fmt(appt.serviceType)} />
            <Row label="Duration" value={`${appt.serviceDuration} min`} />
            <Row label="Date" value={fmtDate(appt.date)} />
            <Row label="Time" value={`${appt.timeSlot} (${appt.timezone})`} />
            <Row label="Amount" value={fmtMoney(appt.totalAmount)} />
            {appt.company && <Row label="Company" value={appt.company} />}
            {appt.goalNotes && <Row label="Goals" value={appt.goalNotes} />}
            {(appt.addOnRecording || appt.addOnActionPlan || appt.addOnSlackAccess) && (
              <Row label="Add-ons" value={[
                appt.addOnRecording && "Recording",
                appt.addOnActionPlan && "Action Plan",
                appt.addOnSlackAccess && "Slack Access",
              ].filter(Boolean).join(", ")} />
            )}
          </section>

          {/* Meeting Link */}
          <section>
            <p className="font-dm text-sm font-semibold text-[#0D1B2A] mb-2 flex items-center gap-1.5">
              <Video size={14} className="text-[#2251A3]" /> Meeting Link
            </p>
            <p className="font-dm text-xs text-[#7A8FA6] mb-2">
              Paste a Jitsi Meet link or leave blank to auto-generate one. This will be included in the confirmation email.
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.jit.si/tiblogics-..."
                className="flex-1 px-3 py-2.5 text-sm font-dm border border-[#D2DCE8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3] bg-white"
              />
              <button
                onClick={handleSaveMeetingLink}
                disabled={busy === "link"}
                className="px-3 py-2.5 bg-[#EBF0FA] text-[#2251A3] text-sm font-dm rounded-xl hover:bg-[#2251A3] hover:text-white transition-colors disabled:opacity-50"
              >
                {busy === "link" ? <Loader2 size={14} className="animate-spin" /> : "Save"}
              </button>
            </div>
            {appt.zoomLink && (
              <a
                href={appt.zoomLink}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center gap-1.5 text-xs text-[#2251A3] font-dm hover:underline"
              >
                <ExternalLink size={11} /> Open link
              </a>
            )}
          </section>

          {/* Cancel reason (if cancelled) */}
          {appt.status === "CANCELLED" && appt.cancelReason && (
            <section className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="font-dm text-xs font-semibold text-red-400 uppercase mb-1">Cancellation Reason</p>
              <p className="font-dm text-sm text-red-700">{appt.cancelReason}</p>
            </section>
          )}

          {/* Actions */}
          <section className="space-y-3">
            <p className="font-dm text-sm font-semibold text-[#0D1B2A]">Actions</p>

            {/* Confirm */}
            {appt.status === "PENDING" && (
              <button
                onClick={handleConfirm}
                disabled={!!busy}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1B3A6B] text-white text-sm font-dm font-semibold rounded-xl hover:bg-[#2251A3] transition-colors disabled:opacity-60"
              >
                {busy === "confirm" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Confirm & Send Meeting Email
              </button>
            )}

            {/* Resend email */}
            {appt.status === "CONFIRMED" && (
              <button
                onClick={handleResendEmail}
                disabled={!!busy}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#EBF0FA] text-[#2251A3] text-sm font-dm font-semibold rounded-xl hover:bg-[#2251A3] hover:text-white transition-colors disabled:opacity-60"
              >
                {busy === "resend" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Resend Confirmation Email
              </button>
            )}

            {/* Complete */}
            {["CONFIRMED", "PENDING"].includes(appt.status) && (
              <button
                onClick={handleComplete}
                disabled={!!busy}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white text-sm font-dm font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {busy === "complete" ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                Mark as Completed
              </button>
            )}

            {/* Cancel */}
            {isActive && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Cancellation reason (optional)"
                  className="w-full px-3 py-2.5 text-sm font-dm border border-[#D2DCE8] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 bg-white"
                />
                <button
                  onClick={handleCancel}
                  disabled={!!busy}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-500 text-sm font-dm font-semibold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  {busy === "cancel" ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                  Cancel Appointment
                </button>
              </div>
            )}

            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={!!busy}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-600 text-sm font-dm rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              {busy === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete Record
            </button>
          </section>

          <p className="font-dm text-xs text-[#B0BEC5] pb-4">Booked on {fmtDate(appt.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="font-dm text-xs text-[#7A8FA6] shrink-0">{label}</span>
      <span className="font-dm text-sm text-[#0D1B2A] text-right">{value}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selected, setSelected] = useState<Appointment | null>(null);

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((d) => setAppointments(d.appointments ?? d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleUpdated(updated: Appointment) {
    if (updated.status === "_DELETED") {
      setAppointments((prev) => prev.filter((a) => a.id !== updated.id));
      setSelected(null);
      return;
    }
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
    setSelected((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
  }

  const filtered = appointments.filter((a) => {
    const name = `${a.firstName} ${a.lastName}`.toLowerCase();
    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.serviceType.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function exportCSV() {
    const rows = [
      ["Date", "Time", "Name", "Email", "Company", "Service", "Duration", "Amount", "Status", "Payment", "Meeting Link"],
      ...filtered.map((a) => [
        fmtDate(a.date), a.timeSlot,
        `${a.firstName} ${a.lastName}`, a.email, a.company ?? "",
        fmt(a.serviceType), `${a.serviceDuration} min`,
        fmtMoney(a.totalAmount), a.status, a.paymentStatus ?? "",
        a.zoomLink ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "appointments.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const counts = {
    PENDING: appointments.filter((a) => a.status === "PENDING").length,
    CONFIRMED: appointments.filter((a) => a.status === "CONFIRMED").length,
    COMPLETED: appointments.filter((a) => a.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-6">
      {selected && (
        <DetailPanel appt={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Appointments</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">Manage client bookings, confirm meetings, and send links</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 border border-[#D2DCE8] bg-white rounded-xl px-4 py-2 text-sm font-dm text-[#0D1B2A] hover:bg-[#F4F7FB] transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Pending", count: counts.PENDING, cls: "bg-[#FEF0E3] text-[#F47C20]", icon: <Clock size={13} /> },
          { label: "Confirmed", count: counts.CONFIRMED, cls: "bg-[#EBF0FA] text-[#2251A3]", icon: <CheckCircle size={13} /> },
          { label: "Completed", count: counts.COMPLETED, cls: "bg-green-100 text-green-700", icon: <CheckCheck size={13} /> },
        ].map(({ label, count, cls, icon }) => (
          <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-dm font-semibold ${cls}`}>
            {icon} {count} {label}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
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
                {["Date & Time", "Client", "Service", "Amount", "Status", "Meeting", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F7FB]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader2 size={20} className="animate-spin text-[#7A8FA6] mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 font-dm text-sm text-[#7A8FA6]">
                    {appointments.length === 0 ? "No appointments yet." : "No appointments match your filters."}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-[#F4F7FB]/60 transition-colors cursor-pointer"
                    onClick={() => setSelected(a)}
                  >
                    <td className="px-5 py-4">
                      <p className="font-dm text-sm font-medium text-[#0D1B2A]">{fmtDate(a.date)}</p>
                      <p className="font-dm text-xs text-[#7A8FA6]">{a.timeSlot}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-dm text-sm font-medium text-[#0D1B2A]">{a.firstName} {a.lastName}</p>
                      <p className="font-dm text-xs text-[#7A8FA6]">{a.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-dm text-sm text-[#0D1B2A]">{fmt(a.serviceType)}</p>
                      <p className="font-dm text-xs text-[#7A8FA6]">{a.serviceDuration} min</p>
                    </td>
                    <td className="px-5 py-4 font-dm text-sm font-semibold text-[#0D1B2A]">
                      {fmtMoney(a.totalAmount)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge label={a.status} cls={STATUS_COLOR[a.status] ?? "bg-gray-100 text-gray-500"} />
                    </td>
                    <td className="px-5 py-4">
                      {a.zoomLink ? (
                        <a
                          href={a.zoomLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-[#2251A3] font-dm hover:underline"
                        >
                          <Video size={12} /> Join
                        </a>
                      ) : (
                        <span className="text-xs text-[#B0BEC5] font-dm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <ActionMenu appt={a} onSelect={setSelected} />
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
