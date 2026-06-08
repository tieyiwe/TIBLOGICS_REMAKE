"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Eye, EyeOff, Pencil, X, Loader2, Calendar, Mail,
  Users, ToggleLeft, ToggleRight, Send, Copy, Check, ExternalLink,
  MessageSquare, ChevronDown, ChevronUp, Megaphone, UserCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface EventItem {
  id: string; title: string; slug: string; type: string;
  price: number; currency: string; location: string;
  date?: string | null; timeSlot?: string | null; description: string;
  content?: string | null; capacity?: number | null; spots?: number | null;
  coverImage?: string | null; stripePaymentLink?: string | null;
  registrationOpen: boolean; featured: boolean; published: boolean;
  tags: string[]; createdAt: string;
}

interface Registration {
  id: string; firstName: string; lastName: string; email: string;
  whatsapp?: string | null; role?: string | null; goal?: string | null;
  referral?: string | null; paymentMethod: string; price: number;
  currency: string; status: string; notes?: string | null;
  createdAt: string; eventName: string; eventSlug: string;
}

type FormData = {
  title: string; type: string; description: string; content: string;
  date: string; timeSlot: string; location: string; price: string;
  capacity: string; spots: string; coverImage: string;
  stripePaymentLink: string; registrationOpen: boolean;
  featured: boolean; published: boolean;
};

type Tab = "events" | "registrations" | "promote";

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_FORM: FormData = {
  title: "", type: "TRAINING", description: "", content: "",
  date: "", timeSlot: "", location: "Online", price: "0",
  capacity: "", spots: "", coverImage: "", stripePaymentLink: "",
  registrationOpen: true, featured: false, published: false,
};

const TYPE_COLORS: Record<string, string> = {
  TRAINING: "bg-[#2251A3]/10 text-[#2251A3]",
  EVENT: "bg-purple-100 text-purple-700",
  WORKSHOP: "bg-emerald-100 text-emerald-700",
  WEBINAR: "bg-teal-100 text-teal-700",
};

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  waitlisted:"bg-blue-100 text-blue-700",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function useCopy(text: string, ms = 1500) {
  const [copied, setCopied] = useState(false);
  return {
    copied,
    copy: () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), ms); },
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function CopyBtn({ text, label }: { text: string; label?: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <button onClick={copy} className="inline-flex items-center gap-1.5 text-xs font-dm font-semibold px-3 py-1.5 rounded-lg border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#2251A3] hover:text-[#2251A3] transition-colors">
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
      {copied ? "Copied!" : (label ?? "Copy")}
    </button>
  );
}

function StatusBadge({ status, onChange }: { status: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1 text-xs font-dm font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"}`}
      >
        {status} <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute left-0 top-7 z-20 bg-white border border-[#D2DCE8] rounded-xl shadow-lg overflow-hidden min-w-[120px]">
          {["pending", "confirmed", "cancelled", "waitlisted"].map(s => (
            <button key={s} onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-dm hover:bg-[#F4F7FB] ${s === status ? "font-semibold text-[#2251A3]" : "text-[#3A4A5C]"}`}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminEventsPage() {
  const [tab, setTab] = useState<Tab>("events");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [regsLoading, setRegsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [regFilter, setRegFilter] = useState("all");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [eventRegs, setEventRegs] = useState<Record<string, Registration[]>>({});
  const [msgModal, setMsgModal] = useState<EventItem | null>(null);
  const [msgForm, setMsgForm] = useState({ subject: "", body: "", recipients: "all" });
  const [msgStatus, setMsgStatus] = useState<"idle"|"sending"|"done"|"error">("idle");
  const [msgResult, setMsgResult] = useState("");

  // ── Loaders ──────────────────────────────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) setEvents((await res.json()).events ?? []);
    } finally { setLoading(false); }
  }, []);

  const loadAllRegs = useCallback(async () => {
    setRegsLoading(true);
    try {
      const res = await fetch("/api/events/register");
      if (res.ok) setRegistrations((await res.json()).registrations ?? []);
    } finally { setRegsLoading(false); }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => { if (tab === "registrations") loadAllRegs(); }, [tab, loadAllRegs]);

  // ── Event registrations expand ────────────────────────────────────────────
  async function toggleEventRegs(event: EventItem) {
    if (expandedEvent === event.id) { setExpandedEvent(null); return; }
    setExpandedEvent(event.id);
    if (!eventRegs[event.id]) {
      const res = await fetch(`/api/admin/events/${event.id}/registrations`);
      if (res.ok) {
        const data = await res.json();
        setEventRegs(r => ({ ...r, [event.id]: data.registrations ?? [] }));
      }
    }
  }

  // ── Registration status update ────────────────────────────────────────────
  async function updateRegStatus(eventId: string, registrationId: string, status: string) {
    await fetch(`/api/admin/events/${eventId}/registrations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, status }),
    });
    const res = await fetch(`/api/admin/events/${eventId}/registrations`);
    if (res.ok) {
      const data = await res.json();
      setEventRegs(r => ({ ...r, [eventId]: data.registrations ?? [] }));
    }
    if (tab === "registrations") loadAllRegs();
  }

  // ── Quick toggles ─────────────────────────────────────────────────────────
  async function togglePublished(event: EventItem) {
    setTogglingId(event.id + "-pub");
    try {
      await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !event.published }),
      });
      await loadEvents();
    } finally { setTogglingId(null); }
  }

  async function toggleRegistration(event: EventItem) {
    setTogglingId(event.id + "-reg");
    try {
      await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationOpen: !event.registrationOpen }),
      });
      await loadEvents();
    } finally { setTogglingId(null); }
  }

  // ── Create / Edit ─────────────────────────────────────────────────────────
  function openCreate() { setEditId(null); setForm(EMPTY_FORM); setShowModal(true); }
  function openEdit(e: EventItem) {
    setEditId(e.id);
    setForm({
      title: e.title, type: e.type, description: e.description,
      content: e.content ?? "", date: e.date ? new Date(e.date).toISOString().slice(0, 16) : "",
      timeSlot: e.timeSlot ?? "", location: e.location, price: String(e.price),
      capacity: e.capacity != null ? String(e.capacity) : "",
      spots: e.spots != null ? String(e.spots) : "",
      coverImage: e.coverImage ?? "", stripePaymentLink: e.stripePaymentLink ?? "",
      registrationOpen: e.registrationOpen, featured: e.featured, published: e.published,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(), type: form.type,
        description: form.description.trim(), content: form.content.trim() || null,
        date: form.date || null, timeSlot: form.timeSlot.trim() || null,
        location: form.location.trim() || "Online",
        price: parseInt(form.price) || 0,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        spots: form.spots ? parseInt(form.spots) : null,
        coverImage: form.coverImage.trim() || null,
        stripePaymentLink: form.stripePaymentLink.trim() || null,
        registrationOpen: form.registrationOpen, featured: form.featured,
        published: form.published, tags: [],
      };
      await fetch(editId ? `/api/admin/events/${editId}` : "/api/admin/events", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setShowModal(false);
      await loadEvents();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      await loadEvents();
    } finally { setDeletingId(null); }
  }

  // ── Message send ──────────────────────────────────────────────────────────
  async function sendMessage() {
    if (!msgModal || !msgForm.subject.trim() || !msgForm.body.trim()) return;
    setMsgStatus("sending");
    try {
      const res = await fetch(`/api/admin/events/${msgModal.id}/message`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msgForm),
      });
      const data = await res.json();
      if (res.ok) {
        setMsgStatus("done");
        setMsgResult(`✅ Sent to ${data.sent} of ${data.total} participants.`);
      } else {
        setMsgStatus("error");
        setMsgResult(data.error ?? "Failed to send.");
      }
    } catch {
      setMsgStatus("error");
      setMsgResult("Network error. Try again.");
    }
  }

  // ── Filtered registrations ────────────────────────────────────────────────
  const filteredRegs = regFilter === "all"
    ? registrations
    : registrations.filter(r => r.status === regFilter);

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = [
    { label: "Events", value: events.length, color: "text-[#1B3A6B]" },
    { label: "Published", value: events.filter(e => e.published).length, color: "text-green-600" },
    { label: "Registrations", value: registrations.length, color: "text-[#F47C20]" },
    { label: "Open Now", value: events.filter(e => e.registrationOpen && e.published).length, color: "text-emerald-600" },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Events &amp; Training</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">Create, manage, promote events — and communicate with participants</p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#F47C20] hover:bg-[#e06a10] text-white font-dm font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">
          <Plus size={16} /> New Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-[#D2DCE8] rounded-2xl p-4 text-center">
            <p className={`font-syne font-bold text-2xl ${s.color}`}>{s.value}</p>
            <p className="font-dm text-xs text-[#7A8FA6] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#D2DCE8] mb-6">
        {([
          { id: "events", label: "Events", icon: Calendar },
          { id: "registrations", label: "Registrations", icon: Users },
          { id: "promote", label: "Promote", icon: Megaphone },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-dm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? "border-[#F47C20] text-[#F47C20]"
                : "border-transparent text-[#7A8FA6] hover:text-[#3A4A5C]"
            }`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── EVENTS TAB ──────────────────────────────────────────────────────── */}
      {tab === "events" && (
        loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#2251A3]" />
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-16 text-center">
            <Calendar size={40} className="text-[#D2DCE8] mx-auto mb-4" />
            <h3 className="font-syne font-bold text-lg text-[#0D1B2A] mb-2">No events yet</h3>
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 bg-[#F47C20] hover:bg-[#e06a10] text-white font-dm font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors mt-4">
              <Plus size={16} /> Create First Event
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map(event => {
              const regs = eventRegs[event.id] ?? [];
              const isExpanded = expandedEvent === event.id;
              return (
                <div key={event.id} className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
                  {/* Event row */}
                  <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-dm font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[event.type] ?? "bg-gray-100 text-gray-700"}`}>
                          {event.type}
                        </span>
                        {event.featured && <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-[#F47C20]/10 text-[#F47C20]">Featured</span>}
                        <p className="font-dm font-semibold text-sm text-[#0D1B2A] truncate">{event.title}</p>
                      </div>
                      <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">
                        {event.date ? fmtDate(event.date) : "No date"} · {event.location}
                        {event.price > 0 ? ` · $${(event.price / 100).toFixed(0)}` : " · Free"}
                      </p>
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Publish toggle */}
                      <button onClick={() => togglePublished(event)}
                        disabled={togglingId === event.id + "-pub"}
                        title={event.published ? "Click to unpublish" : "Click to publish"}
                        className={`inline-flex items-center gap-1.5 text-xs font-dm font-semibold px-2.5 py-1.5 rounded-full transition-colors ${
                          event.published ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}>
                        {togglingId === event.id + "-pub" ? <Loader2 size={10} className="animate-spin" /> : event.published ? <Eye size={10} /> : <EyeOff size={10} />}
                        {event.published ? "Live" : "Draft"}
                      </button>

                      {/* Registration toggle */}
                      <button onClick={() => toggleRegistration(event)}
                        disabled={togglingId === event.id + "-reg"}
                        title={event.registrationOpen ? "Click to close registration" : "Click to open registration"}
                        className={`inline-flex items-center gap-1.5 text-xs font-dm font-semibold px-2.5 py-1.5 rounded-full transition-colors ${
                          event.registrationOpen ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-red-100 text-red-600 hover:bg-red-200"
                        }`}>
                        {togglingId === event.id + "-reg"
                          ? <Loader2 size={10} className="animate-spin" />
                          : event.registrationOpen ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                        {event.registrationOpen ? "Reg Open" : "Reg Closed"}
                      </button>

                      {/* View link */}
                      <a href={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-dm text-[#2251A3] hover:text-[#1B3A6B] px-2 py-1.5 rounded-lg hover:bg-[#EBF0FA] transition-colors">
                        <ExternalLink size={11} /> View
                      </a>

                      {/* Registrations expand */}
                      <button onClick={() => toggleEventRegs(event)}
                        className="inline-flex items-center gap-1.5 text-xs font-dm font-semibold px-2.5 py-1.5 rounded-lg border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#2251A3] hover:text-[#2251A3] transition-colors">
                        <UserCheck size={11} />
                        {isExpanded ? "Hide" : "Registrations"}
                        {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </button>

                      {/* Message */}
                      <button onClick={() => { setMsgModal(event); setMsgStatus("idle"); setMsgForm({ subject: "", body: "", recipients: "all" }); setMsgResult(""); }}
                        className="inline-flex items-center gap-1.5 text-xs font-dm font-semibold px-2.5 py-1.5 rounded-lg border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#F47C20] hover:text-[#F47C20] transition-colors">
                        <MessageSquare size={11} /> Message
                      </button>

                      {/* Edit */}
                      <button onClick={() => openEdit(event)}
                        className="p-1.5 rounded-lg text-[#7A8FA6] hover:text-[#2251A3] hover:bg-[#EBF0FA] transition-colors">
                        <Pencil size={14} />
                      </button>

                      {/* Delete */}
                      <button onClick={() => handleDelete(event.id)} disabled={deletingId === event.id}
                        className="p-1.5 rounded-lg text-[#7A8FA6] hover:text-red-600 hover:bg-red-50 transition-colors">
                        {deletingId === event.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded registrations panel */}
                  {isExpanded && (
                    <div className="border-t border-[#D2DCE8] bg-[#F8FAFD]">
                      {!eventRegs[event.id] ? (
                        <div className="flex items-center justify-center py-6"><Loader2 size={18} className="animate-spin text-[#2251A3]" /></div>
                      ) : regs.length === 0 ? (
                        <div className="py-6 text-center">
                          <p className="font-dm text-sm text-[#7A8FA6]">No registrations yet for this event.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-[#D2DCE8]">
                                {["Name", "Email", "WhatsApp", "Payment", "Status", "Date", ""].map(h => (
                                  <th key={h} className="text-left font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider px-4 py-2">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8EEF5]">
                              {regs.map(r => (
                                <tr key={r.id} className="hover:bg-white transition-colors">
                                  <td className="px-4 py-2.5 font-dm text-sm font-medium text-[#0D1B2A]">{r.firstName} {r.lastName}</td>
                                  <td className="px-4 py-2.5">
                                    <a href={`mailto:${r.email}`} className="font-dm text-xs text-[#2251A3] hover:underline flex items-center gap-1">
                                      <Mail size={11} />{r.email}
                                    </a>
                                  </td>
                                  <td className="px-4 py-2.5 font-dm text-xs text-[#3A4A5C]">{r.whatsapp || "—"}</td>
                                  <td className="px-4 py-2.5">
                                    <span className="font-dm text-xs text-[#3A4A5C] capitalize">{r.paymentMethod}</span>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <StatusBadge status={r.status} onChange={s => updateRegStatus(event.id, r.id, s)} />
                                  </td>
                                  <td className="px-4 py-2.5 font-dm text-xs text-[#7A8FA6]">{fmtDateTime(r.createdAt)}</td>
                                  <td className="px-4 py-2.5">
                                    <a href={`mailto:${r.email}`} className="p-1 rounded text-[#7A8FA6] hover:text-[#2251A3] inline-flex">
                                      <Send size={12} />
                                    </a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="px-4 py-2.5 border-t border-[#D2DCE8] flex items-center gap-4">
                            <span className="font-dm text-xs text-[#7A8FA6]">{regs.length} registration{regs.length !== 1 ? "s" : ""}</span>
                            <span className="font-dm text-xs text-green-700">{regs.filter(r => r.status === "confirmed").length} confirmed</span>
                            <span className="font-dm text-xs text-yellow-700">{regs.filter(r => r.status === "pending").length} pending</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── REGISTRATIONS TAB ───────────────────────────────────────────────── */}
      {tab === "registrations" && (
        <div>
          {/* Filters */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {["all", "pending", "confirmed", "cancelled", "waitlisted"].map(f => (
              <button key={f} onClick={() => setRegFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-dm font-medium transition-colors capitalize ${
                  regFilter === f ? "bg-[#1B3A6B] text-white" : "bg-white border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#2251A3]"
                }`}>
                {f === "all" ? `All (${registrations.length})` : `${f} (${registrations.filter(r => r.status === f).length})`}
              </button>
            ))}
            <button onClick={loadAllRegs} className="ml-auto p-1.5 rounded-lg text-[#7A8FA6] hover:text-[#2251A3] hover:bg-[#EBF0FA] transition-colors">
              <Loader2 size={14} className={regsLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {regsLoading ? (
            <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#2251A3]" /></div>
          ) : filteredRegs.length === 0 ? (
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-12 text-center">
              <Users size={36} className="text-[#D2DCE8] mx-auto mb-3" />
              <p className="font-dm text-[#7A8FA6]">No registrations found.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#D2DCE8] bg-[#F4F7FB]">
                      {["Name", "Email", "WhatsApp", "Event", "Payment", "Goal", "Status", "Date"].map(h => (
                        <th key={h} className="text-left font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D2DCE8]">
                    {filteredRegs.map(r => {
                      const eventObj = events.find(e => e.slug === r.eventSlug);
                      return (
                        <tr key={r.id} className="hover:bg-[#F4F7FB] transition-colors">
                          <td className="px-4 py-3 font-dm text-sm font-semibold text-[#0D1B2A]">{r.firstName} {r.lastName}</td>
                          <td className="px-4 py-3">
                            <a href={`mailto:${r.email}`} className="font-dm text-xs text-[#2251A3] hover:underline flex items-center gap-1">
                              <Mail size={11} />{r.email}
                            </a>
                          </td>
                          <td className="px-4 py-3 font-dm text-xs text-[#3A4A5C]">{r.whatsapp || "—"}</td>
                          <td className="px-4 py-3">
                            <p className="font-dm text-xs text-[#3A4A5C] max-w-[140px] truncate">{r.eventName}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-dm text-xs capitalize text-[#3A4A5C]">{r.paymentMethod}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-dm text-xs text-[#7A8FA6] max-w-[140px] truncate" title={r.goal ?? ""}>{r.goal || "—"}</p>
                          </td>
                          <td className="px-4 py-3">
                            {eventObj ? (
                              <StatusBadge status={r.status} onChange={s => updateRegStatus(eventObj.id, r.id, s)} />
                            ) : (
                              <span className={`text-xs font-dm font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>{r.status}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-dm text-xs text-[#7A8FA6] whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PROMOTE TAB ─────────────────────────────────────────────────────── */}
      {tab === "promote" && (
        <div className="flex flex-col gap-6">
          {events.filter(e => e.published).length === 0 ? (
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-12 text-center">
              <Megaphone size={36} className="text-[#D2DCE8] mx-auto mb-3" />
              <p className="font-dm text-[#7A8FA6]">Publish an event to get promotion tools.</p>
            </div>
          ) : events.filter(e => e.published).map(event => {
            const origin = typeof window !== "undefined" ? window.location.origin : "https://tiblogics.com";
            const url = `${origin}/events/${event.slug}`;
            const socialCaption = `🚀 ${event.title}\n\n${event.description.slice(0, 180)}${event.description.length > 180 ? "…" : ""}\n\n📅 ${event.date ? fmtDate(event.date) : "Coming Soon"} · ${event.location}\n${event.price > 0 ? `💰 $${(event.price / 100).toFixed(0)}` : "🎉 Free"}\n\n🔗 Register: ${url}`;
            const emailBlurb = `Hi {{First Name}},\n\nWe have an upcoming ${event.type.toLowerCase()} you won't want to miss:\n\n${event.title}\n\n${event.description}\n\n📅 Date: ${event.date ? fmtDate(event.date) : "TBD"}\n📍 Location: ${event.location}\n${event.price > 0 ? `💰 Price: $${(event.price / 100).toFixed(0)}` : "🎉 Free"}\n\nSpots are limited — register now:\n${url}\n\nBest,\nTIBLOGICS Team`;
            const whatsappMsg = `*${event.title}*\n\n${event.description.slice(0, 200)}\n\n📅 ${event.date ? fmtDate(event.date) : "Coming Soon"}\n📍 ${event.location}\n${event.price > 0 ? `💰 $${(event.price / 100).toFixed(0)}` : "🎉 Free"}\n\n👉 Register here: ${url}`;

            return (
              <div key={event.id} className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-syne font-bold text-base text-[#0D1B2A]">{event.title}</h3>
                    <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">{event.date ? fmtDate(event.date) : "No date set"} · {event.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-dm text-[#2251A3] hover:text-[#1B3A6B] px-2.5 py-1.5 rounded-lg border border-[#D2DCE8] hover:border-[#2251A3] transition-colors">
                      <ExternalLink size={11} /> Open Page
                    </a>
                    <button onClick={() => { setMsgModal(event); setMsgStatus("idle"); setMsgForm({ subject: `Update: ${event.title}`, body: "", recipients: "all" }); setMsgResult(""); }}
                      className="inline-flex items-center gap-1.5 text-xs font-dm font-semibold text-white bg-[#F47C20] hover:bg-[#e06a10] px-2.5 py-1.5 rounded-lg transition-colors">
                      <Send size={11} /> Email Participants
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Registration link */}
                  <div className="bg-[#F4F7FB] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-dm font-semibold text-xs text-[#0D1B2A]">Registration Link</span>
                      <CopyBtn text={url} />
                    </div>
                    <p className="font-dm text-xs text-[#2251A3] break-all">{url}</p>
                  </div>

                  {/* Social caption */}
                  <div className="bg-[#F4F7FB] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-dm font-semibold text-xs text-[#0D1B2A]">Social Media Caption</span>
                      <CopyBtn text={socialCaption} label="Copy Caption" />
                    </div>
                    <p className="font-dm text-xs text-[#7A8FA6] whitespace-pre-line line-clamp-4">{socialCaption}</p>
                  </div>

                  {/* WhatsApp message */}
                  <div className="bg-[#F4F7FB] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-dm font-semibold text-xs text-[#0D1B2A]">WhatsApp Message</span>
                      <CopyBtn text={whatsappMsg} label="Copy" />
                    </div>
                    <p className="font-dm text-xs text-[#7A8FA6] whitespace-pre-line line-clamp-4">{whatsappMsg}</p>
                  </div>

                  {/* Email blurb */}
                  <div className="bg-[#F4F7FB] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-dm font-semibold text-xs text-[#0D1B2A]">Email Blurb</span>
                      <CopyBtn text={emailBlurb} label="Copy Blurb" />
                    </div>
                    <p className="font-dm text-xs text-[#7A8FA6] whitespace-pre-line line-clamp-4">{emailBlurb}</p>
                  </div>
                </div>

                {/* Quick stats */}
                {eventRegs[event.id] && (
                  <div className="mt-4 flex gap-4 pt-4 border-t border-[#D2DCE8]">
                    <span className="font-dm text-xs text-[#7A8FA6]">{eventRegs[event.id].length} total registrations</span>
                    <span className="font-dm text-xs text-green-700">{eventRegs[event.id].filter(r => r.status === "confirmed").length} confirmed</span>
                    <span className="font-dm text-xs text-yellow-700">{eventRegs[event.id].filter(r => r.status === "pending").length} pending</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#D2DCE8]">
              <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">{editId ? "Edit Event" : "New Event"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-[#7A8FA6] hover:bg-[#F4F7FB] transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. AI Practical Training — Cohort 2"
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
              </div>
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]">
                  <option value="TRAINING">Training</option>
                  <option value="EVENT">Event</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="WEBINAR">Webinar</option>
                </select>
              </div>
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description shown on listing..." rows={3}
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Start Date</label>
                  <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
                </div>
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Time Slot</label>
                  <input type="text" value={form.timeSlot} onChange={e => setForm(f => ({ ...f, timeSlot: e.target.value }))}
                    placeholder="9:30AM – 1PM ET (Saturdays)"
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
                </div>
              </div>
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Location</label>
                <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Live on Zoom / City, State"
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Price (cents)</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="64900 = $649"
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
                  <p className="text-xs font-dm text-[#7A8FA6] mt-0.5">0 = free</p>
                </div>
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Capacity</label>
                  <input type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                    placeholder="30"
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
                </div>
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Spots Left</label>
                  <input type="number" min="0" value={form.spots} onChange={e => setForm(f => ({ ...f, spots: e.target.value }))}
                    placeholder="30"
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
                </div>
              </div>
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Cover Image URL <span className="text-[#7A8FA6] font-normal">(optional)</span></label>
                <input type="url" value={form.coverImage} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
              </div>
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Payment Link <span className="text-[#7A8FA6] font-normal">(Stripe, PayPal, etc.)</span></label>
                <input type="url" value={form.stripePaymentLink} onChange={e => setForm(f => ({ ...f, stripePaymentLink: e.target.value }))}
                  placeholder="https://buy.stripe.com/..."
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
              </div>
              <div className="flex flex-wrap gap-6 pt-1">
                {([
                  { key: "registrationOpen", label: "Registration Open" },
                  { key: "featured", label: "Featured" },
                  { key: "published", label: "Published (visible to public)" },
                ] as { key: keyof FormData; label: string }[]).map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={Boolean(form[key])}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-[#D2DCE8] text-[#2251A3] focus:ring-[#2251A3]/30" />
                    <span className="font-dm text-sm text-[#3A4A5C]">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#D2DCE8]">
              <button onClick={() => setShowModal(false)}
                className="font-dm text-sm text-[#7A8FA6] hover:text-[#3A4A5C] px-4 py-2 rounded-xl hover:bg-[#F4F7FB] transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.title.trim()}
                className="inline-flex items-center gap-2 bg-[#F47C20] hover:bg-[#e06a10] disabled:opacity-50 disabled:cursor-not-allowed text-white font-dm font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {editId ? "Save Changes" : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MESSAGE MODAL ────────────────────────────────────────────────────── */}
      {msgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#D2DCE8]">
              <div>
                <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">Message Participants</h2>
                <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">{msgModal.title}</p>
              </div>
              <button onClick={() => setMsgModal(null)} className="p-2 rounded-xl text-[#7A8FA6] hover:bg-[#F4F7FB]"><X size={18} /></button>
            </div>

            {msgStatus === "done" || msgStatus === "error" ? (
              <div className="p-8 text-center">
                <div className="text-3xl mb-3">{msgStatus === "done" ? "✅" : "❌"}</div>
                <p className="font-dm text-sm text-[#0D1B2A]">{msgResult}</p>
                <button onClick={() => { setMsgStatus("idle"); setMsgResult(""); }}
                  className="mt-5 inline-flex items-center gap-2 border border-[#D2DCE8] text-[#3A4A5C] font-dm font-semibold text-sm px-4 py-2 rounded-xl hover:bg-[#F4F7FB] transition-colors">
                  Compose Another
                </button>
              </div>
            ) : (
              <div className="p-6 flex flex-col gap-4">
                {/* Recipients */}
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-2">Send to</label>
                  <div className="flex gap-2">
                    {[
                      { id: "all", label: "All registrants" },
                      { id: "confirmed", label: "Confirmed only" },
                      { id: "pending", label: "Pending only" },
                    ].map(r => (
                      <button key={r.id} onClick={() => setMsgForm(f => ({ ...f, recipients: r.id }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-dm font-medium transition-colors ${
                          msgForm.recipients === r.id ? "bg-[#1B3A6B] text-white" : "bg-[#F4F7FB] border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#2251A3]"
                        }`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Subject *</label>
                  <input type="text" value={msgForm.subject} onChange={e => setMsgForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Session 1 details — Saturday June 20"
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
                </div>

                {/* Body */}
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Message *</label>
                  <textarea value={msgForm.body} onChange={e => setMsgForm(f => ({ ...f, body: e.target.value }))}
                    placeholder={"Hi {{firstName}},\n\nYour Zoom link for Session 1 is:\nhttps://zoom.us/...\n\nSee you Saturday!\n\nTIBLOGICS Team"}
                    rows={10}
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3] resize-none" />
                  <p className="font-dm text-xs text-[#7A8FA6] mt-1">Use <code className="bg-[#F4F7FB] px-1 rounded">{"{{firstName}}"}</code> to personalise each message.</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button onClick={() => setMsgModal(null)}
                    className="font-dm text-sm text-[#7A8FA6] hover:text-[#3A4A5C] px-4 py-2 rounded-xl hover:bg-[#F4F7FB] transition-colors">
                    Cancel
                  </button>
                  <button onClick={sendMessage} disabled={msgStatus === "sending" || !msgForm.subject.trim() || !msgForm.body.trim()}
                    className="inline-flex items-center gap-2 bg-[#F47C20] hover:bg-[#e06a10] disabled:opacity-50 disabled:cursor-not-allowed text-white font-dm font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">
                    {msgStatus === "sending" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {msgStatus === "sending" ? "Sending…" : "Send Message"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
