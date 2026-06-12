"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, Trash2, Eye, EyeOff, Pencil, X, Loader2, Calendar, Mail,
  Users, ToggleLeft, ToggleRight, Send, Copy, Check, ExternalLink,
  MessageSquare, ChevronDown, ChevronUp, Megaphone, UserCheck,
  Phone, Briefcase, Target, Share2, StickyNote, Download,
  Search, Layers, AlertCircle, Tag, Clock, Type,
} from "lucide-react";
import ContentEditor from "./ContentEditor";
import { DEFAULT_TRAINING_CONTENT, mergeContent, type TrainingContent } from "@/lib/training-content";

// ─── Types ────────────────────────────────────────────────────────────────────
interface EventItem {
  id: string; title: string; slug: string; type: string;
  price: number; currency: string; location: string;
  date?: string | null; endDate?: string | null; timeSlot?: string | null;
  description: string; content?: string | null;
  capacity?: number | null; spots?: number | null;
  coverImage?: string | null; stripePaymentLink?: string | null;
  zoomLink?: string | null;
  registrationOpen: boolean; featured: boolean; published: boolean;
  tags: string[]; createdAt: string;
}

interface Registration {
  id: string; firstName: string; lastName: string; email: string;
  whatsapp?: string | null; role?: string | null; goal?: string | null;
  referral?: string | null; paymentMethod: string; price: number;
  currency: string; status: string; notes?: string | null;
  createdAt: string; eventName: string; eventSlug: string;
  confirmationNumber?: string | null;
}

interface RegCountItem { eventSlug: string; status: string; _count: { id: number } }

type FormData = {
  title: string; type: string; description: string; content: string;
  date: string; endDate: string; timeSlot: string; location: string;
  price: string; capacity: string; spots: string; coverImage: string;
  stripePaymentLink: string; zoomLink: string; tags: string;
  registrationOpen: boolean; featured: boolean; published: boolean;
};

type Tab = "events" | "registrations" | "promote";

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_FORM: FormData = {
  title: "", type: "TRAINING", description: "", content: "",
  date: "", endDate: "", timeSlot: "", location: "Online", price: "0",
  capacity: "", spots: "", coverImage: "", stripePaymentLink: "", zoomLink: "", tags: "",
  registrationOpen: true, featured: false, published: false,
};

const TYPE_COLORS: Record<string, string> = {
  TRAINING: "bg-[#2251A3]/10 text-[#2251A3]",
  EVENT: "bg-purple-100 text-purple-700",
  WORKSHOP: "bg-emerald-100 text-emerald-700",
  WEBINAR: "bg-teal-100 text-teal-700",
};

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  confirmed:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
  waitlisted: "bg-blue-100 text-blue-700",
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
  const [regCounts, setRegCounts] = useState<RegCountItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [regsLoading, setRegsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [pageContent, setPageContent] = useState<TrainingContent>(DEFAULT_TRAINING_CONTENT);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [regFilter, setRegFilter] = useState("all");
  const [regSearch, setRegSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [eventRegs, setEventRegs] = useState<Record<string, Registration[]>>({});
  const [msgModal, setMsgModal] = useState<EventItem | null>(null);
  const [msgForm, setMsgForm] = useState({ subject: "", body: "", recipients: "all" });
  const [msgStatus, setMsgStatus] = useState<"idle"|"sending"|"done"|"error">("idle");
  const [msgResult, setMsgResult] = useState("");
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [regNotes, setRegNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [selectedRegIds, setSelectedRegIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [reminderModal, setReminderModal] = useState<EventItem | null>(null);
  const [reminderSession, setReminderSession] = useState(1);
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderResult, setReminderResult] = useState("");
  type WaitlistEntry = { id: string; email: string; firstName: string | null; whatsapp: string | null; subscribedAt: string };
  const [eventWaitlists, setEventWaitlists] = useState<Record<string, WaitlistEntry[]>>({});
  const [waitlistLoading, setWaitlistLoading] = useState<Record<string, boolean>>({});

  async function loadWaitlist(eventId: string, slug: string) {
    setWaitlistLoading(w => ({ ...w, [eventId]: true }));
    try {
      const res = await fetch(`/api/events/notify?slug=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        setEventWaitlists(w => ({ ...w, [eventId]: data.subscribers ?? [] }));
      }
    } finally {
      setWaitlistLoading(w => ({ ...w, [eventId]: false }));
    }
  }

  const EXPORT_COLUMNS = [
    { key: "name",    label: "Full Name" },
    { key: "email",   label: "Email" },
    { key: "whatsapp",label: "WhatsApp" },
    { key: "role",    label: "Role / Job" },
    { key: "goal",    label: "Goal" },
    { key: "referral",label: "Referral" },
    { key: "event",   label: "Event" },
    { key: "payment", label: "Payment Method" },
    { key: "amount",  label: "Amount" },
    { key: "status",  label: "Status" },
    { key: "conf",    label: "Confirmation #" },
    { key: "date",    label: "Date" },
  ] as const;
  type ExportKey = typeof EXPORT_COLUMNS[number]["key"];
  const [exportCols, setExportCols] = useState<Set<ExportKey>>(
    new Set(["name","email","whatsapp","event","payment","amount","status","conf","date"])
  );

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function getEventCounts(slug: string) {
    const rows = regCounts.filter(r => r.eventSlug === slug);
    const total = rows.reduce((s, r) => s + r._count.id, 0);
    const confirmed = rows.find(r => r.status === "confirmed")?._count.id ?? 0;
    const pending = rows.find(r => r.status === "pending")?._count.id ?? 0;
    return { total, confirmed, pending };
  }

  // ── Loaders ──────────────────────────────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
        setRegCounts(data.regCounts ?? []);
      }
    } finally { setLoading(false); }
  }, []);

  const loadAllRegs = useCallback(async () => {
    setRegsLoading(true);
    try {
      const res = await fetch("/api/admin/registrations");
      if (res.ok) setRegistrations((await res.json()).registrations ?? []);
    } finally { setRegsLoading(false); }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => { if (tab === "registrations") loadAllRegs(); }, [tab, loadAllRegs]);

  async function syncDatabase() {
    setSyncing(true); setSyncLog([]);
    try {
      const res = await fetch("/api/admin/events/sync-db", { method: "POST" });
      const data = await res.json();
      setSyncLog(data.log ?? []);
      if (data.ok) await loadEvents();
    } catch { setSyncLog(["❌ Network error — check console"]); }
    finally { setSyncing(false); }
  }

  // ── Computed ──────────────────────────────────────────────────────────────────
  const filteredEvents = useMemo(() =>
    eventSearch.trim()
      ? events.filter(e => e.title.toLowerCase().includes(eventSearch.toLowerCase()) || e.type.toLowerCase().includes(eventSearch.toLowerCase()))
      : events,
    [events, eventSearch]);

  const filteredRegs = useMemo(() => {
    // "all" tab shows active registrations only — cancelled live under their own tab
    let regs = regFilter === "all"
      ? registrations.filter(r => r.status !== "cancelled")
      : registrations.filter(r => r.status === regFilter);
    if (regSearch.trim()) {
      const q = regSearch.toLowerCase();
      regs = regs.filter(r =>
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.eventName.toLowerCase().includes(q) ||
        (r.whatsapp ?? "").includes(q)
      );
    }
    return regs;
  }, [registrations, regFilter, regSearch]);

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
    // For coming-soon events, also load the waitlist
    if (!event.registrationOpen && !eventWaitlists[event.id]) {
      loadWaitlist(event.id, event.slug);
    }
  }

  // ── Registration status updates ───────────────────────────────────────────
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

  async function updateRegGlobal(id: string, data: { status?: string; notes?: string }) {
    await fetch("/api/admin/registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    setRegistrations(regs => regs.map(r => r.id === id ? { ...r, ...data } : r));
  }

  async function bulkUpdateRegs(status: string) {
    if (selectedRegIds.size === 0) return;
    setBulkUpdating(true);
    try {
      await Promise.all([...selectedRegIds].map(id =>
        fetch("/api/admin/registrations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        })
      ));
      setRegistrations(regs => regs.map(r => selectedRegIds.has(r.id) ? { ...r, status } : r));
      setSelectedRegIds(new Set());
    } finally { setBulkUpdating(false); }
  }

  // ── Session reminder ──────────────────────────────────────────────────────
  async function sendReminder() {
    if (!reminderModal) return;
    setReminderSending(true); setReminderResult("");
    try {
      const res = await fetch(`/api/admin/events/${reminderModal.id}/reminder`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionNumber: reminderSession }),
      });
      const data = await res.json();
      setReminderResult(res.ok ? `✅ Sent to ${data.sent} participant${data.sent !== 1 ? "s" : ""}.` : `❌ ${data.error ?? "Failed"}`);
    } catch { setReminderResult("❌ Network error."); }
    finally { setReminderSending(false); }
  }

  // ── Export CSV ────────────────────────────────────────────────────────────
  function exportCSV() {
    const colMap: Record<ExportKey, { header: string; value: (r: Registration) => string }> = {
      name:     { header: "Full Name",         value: r => `${r.firstName} ${r.lastName}` },
      email:    { header: "Email",             value: r => r.email },
      whatsapp: { header: "WhatsApp",          value: r => r.whatsapp ?? "" },
      role:     { header: "Role",              value: r => r.role ?? "" },
      goal:     { header: "Goal",              value: r => r.goal ?? "" },
      referral: { header: "Referral",          value: r => r.referral ?? "" },
      event:    { header: "Event",             value: r => r.eventName },
      payment:  { header: "Payment Method",    value: r => r.paymentMethod },
      amount:   { header: "Amount",            value: r => r.price > 0 ? `$${(r.price / 100).toFixed(0)}` : "0" },
      status:   { header: "Status",            value: r => r.status },
      conf:     { header: "Confirmation #",    value: r => r.confirmationNumber ?? "" },
      date:     { header: "Date",              value: r => fmtDateTime(r.createdAt) },
    };
    const cols = EXPORT_COLUMNS.filter(c => exportCols.has(c.key));
    const headers = cols.map(c => colMap[c.key].header);
    const rows = filteredRegs.map(r => cols.map(c => colMap[c.key].value(r).replace(/"/g, '""')));
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "registrations.csv"; a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
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

  // ── Create / Edit / Clone ─────────────────────────────────────────────────
  function openCreate() {
    setEditId(null); setForm(EMPTY_FORM);
    setPageContent(DEFAULT_TRAINING_CONTENT); setShowContentEditor(false);
    setShowModal(true);
  }

  function openEdit(e: EventItem) {
    setEditId(e.id);
    setPageContent(mergeContent(e.content));
    setShowContentEditor(false);
    setForm({
      title: e.title, type: e.type, description: e.description,
      content: e.content ?? "",
      date: e.date ? new Date(e.date).toISOString().slice(0, 16) : "",
      endDate: e.endDate ? new Date(e.endDate).toISOString().slice(0, 16) : "",
      timeSlot: e.timeSlot ?? "", location: e.location, price: String(e.price),
      capacity: e.capacity != null ? String(e.capacity) : "",
      spots: e.spots != null ? String(e.spots) : "",
      coverImage: e.coverImage ?? "",
      stripePaymentLink: e.stripePaymentLink ?? "",
      zoomLink: e.zoomLink ?? "",
      tags: Array.isArray(e.tags) ? e.tags.join(", ") : "",
      registrationOpen: e.registrationOpen, featured: e.featured, published: e.published,
    });
    setShowModal(true);
  }

  function cloneEvent(e: EventItem) {
    setEditId(null);
    setPageContent(mergeContent(e.content));
    setShowContentEditor(false);
    setForm({
      title: `${e.title} (Copy)`, type: e.type, description: e.description,
      content: e.content ?? "",
      date: "", endDate: "",
      timeSlot: e.timeSlot ?? "", location: e.location, price: String(e.price),
      capacity: e.capacity != null ? String(e.capacity) : "",
      spots: e.spots != null ? String(e.spots) : "",
      coverImage: e.coverImage ?? "",
      stripePaymentLink: e.stripePaymentLink ?? "",
      zoomLink: e.zoomLink ?? "",
      tags: Array.isArray(e.tags) ? e.tags.join(", ") : "",
      registrationOpen: false, featured: false, published: false,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(), type: form.type,
        description: form.description.trim(),
        content: JSON.stringify(pageContent),
        date: form.date || null, endDate: form.endDate || null,
        timeSlot: form.timeSlot.trim() || null,
        location: form.location.trim() || "Online",
        price: parseInt(form.price) || 0,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        spots: form.spots ? parseInt(form.spots) : null,
        coverImage: form.coverImage.trim() || null,
        stripePaymentLink: form.stripePaymentLink.trim() || null,
        zoomLink: form.zoomLink.trim() || null,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        registrationOpen: form.registrationOpen, featured: form.featured,
        published: form.published,
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

  // ─── Stats ────────────────────────────────────────────────────────────────
  const totalRegs = regCounts.reduce((s, r) => s + r._count.id, 0);
  const stats = [
    { label: "Events", value: events.length, color: "text-[#1B3A6B]" },
    { label: "Published", value: events.filter(e => e.published).length, color: "text-green-600" },
    { label: "Registrations", value: totalRegs, color: "text-[#F47C20]" },
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
            {t.id === "registrations" && totalRegs > 0 && (
              <span className="ml-0.5 bg-[#F47C20]/10 text-[#F47C20] text-xs font-semibold px-1.5 py-0.5 rounded-full">{totalRegs}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── EVENTS TAB ──────────────────────────────────────────────────────── */}
      {tab === "events" && (
        loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#2251A3]" />
          </div>
        ) : (
          <>
            {/* Event search + Sync DB */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
                <input
                  type="text" value={eventSearch} onChange={e => setEventSearch(e.target.value)}
                  placeholder="Search events…"
                  className="w-full pl-9 pr-3 py-2 text-sm font-dm border border-[#D2DCE8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
                />
              </div>
              <span className="font-dm text-xs text-[#7A8FA6]">{filteredEvents.length} of {events.length}</span>
              <button onClick={syncDatabase} disabled={syncing}
                className="inline-flex items-center gap-1.5 text-xs font-dm font-semibold px-3 py-2 rounded-xl border border-[#D2DCE8] hover:bg-[#F4F7FB] text-[#1B3A6B] transition-colors disabled:opacity-60 whitespace-nowrap">
                {syncing ? <Loader2 size={13} className="animate-spin" /> : <AlertCircle size={13} />}
                {syncing ? "Syncing…" : "Sync DB"}
              </button>
            </div>
            {syncLog.length > 0 && (
              <div className="mb-4 bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl p-3 max-h-40 overflow-y-auto">
                {syncLog.map((l, i) => (
                  <p key={i} className="font-mono text-xs text-[#3A4A5C] leading-relaxed">{l}</p>
                ))}
              </div>
            )}

            {events.length === 0 ? (
              <div className="bg-white border border-[#D2DCE8] rounded-2xl p-12 text-center">
                <Calendar size={40} className="text-[#D2DCE8] mx-auto mb-4" />
                <h3 className="font-syne font-bold text-lg text-[#0D1B2A] mb-2">No events showing</h3>
                <p className="font-dm text-sm text-[#7A8FA6] mb-6 max-w-sm mx-auto">
                  Click <strong>Sync Database</strong> to load the current event and sync the database schema. Only needed once.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button onClick={syncDatabase} disabled={syncing}
                    className="inline-flex items-center gap-2 bg-[#1B3A6B] hover:bg-[#162f5a] text-white font-dm font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                    {syncing ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                    {syncing ? "Syncing…" : "Sync Database"}
                  </button>
                  <button onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-[#F47C20] hover:bg-[#e06a10] text-white font-dm font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">
                    <Plus size={16} /> Create New Event
                  </button>
                </div>
                {syncLog.length > 0 && (
                  <div className="mt-6 text-left bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl p-4 max-w-lg mx-auto">
                    {syncLog.map((l, i) => (
                      <p key={i} className="font-mono text-xs text-[#3A4A5C] leading-relaxed">{l}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredEvents.map(event => {
                  const regs = eventRegs[event.id] ?? [];
                  const isExpanded = expandedEvent === event.id;
                  const counts = getEventCounts(event.slug);
                  const isSoldOut = event.spots != null && event.spots === 0;
                  const isUpcoming = event.date && new Date(event.date) > new Date();
                  const isPast = event.date && new Date(event.date) < new Date();

                  return (
                    <div key={event.id} className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
                        {/* Info — click anywhere here to open registrations + details */}
                        <div className="flex-1 min-w-0 cursor-pointer group" onClick={() => toggleEventRegs(event)} title="Click to view registrations & details">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isExpanded
                              ? <ChevronUp size={15} className="text-[#2251A3] shrink-0" />
                              : <ChevronDown size={15} className="text-[#7A8FA6] shrink-0 group-hover:text-[#2251A3]" />}
                            <span className={`text-xs font-dm font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[event.type] ?? "bg-gray-100 text-gray-700"}`}>
                              {event.type}
                            </span>
                            {event.featured && <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-[#F47C20]/10 text-[#F47C20]">Featured</span>}
                            {isSoldOut && <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Sold Out</span>}
                            {isPast && !isSoldOut && <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Past</span>}
                            {isUpcoming && <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Upcoming</span>}
                            <p className="font-dm font-semibold text-sm text-[#0D1B2A] truncate group-hover:text-[#2251A3] transition-colors">{event.title}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <p className="font-dm text-xs text-[#7A8FA6]">
                              {event.date ? fmtDate(event.date) : "No date"} · {event.location}
                              {event.price > 0 ? ` · $${(event.price / 100).toFixed(0)}` : " · Free"}
                            </p>
                            {counts.total > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="font-dm text-xs font-semibold text-[#3A4A5C]">{counts.total} registered</span>
                                {counts.confirmed > 0 && <span className="font-dm text-xs text-green-700">({counts.confirmed} confirmed)</span>}
                                {counts.pending > 0 && <span className="font-dm text-xs text-yellow-700">({counts.pending} pending)</span>}
                              </div>
                            )}
                            {Array.isArray(event.tags) && event.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Tag size={10} className="text-[#7A8FA6]" />
                                <span className="font-dm text-xs text-[#7A8FA6]">{event.tags.slice(0, 3).join(", ")}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Publish toggle */}
                          <button onClick={() => togglePublished(event)} disabled={togglingId === event.id + "-pub"}
                            title={event.published ? "Click to unpublish" : "Click to publish"}
                            className={`inline-flex items-center gap-1.5 text-xs font-dm font-semibold px-2.5 py-1.5 rounded-full transition-colors ${
                              event.published ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}>
                            {togglingId === event.id + "-pub" ? <Loader2 size={10} className="animate-spin" /> : event.published ? <Eye size={10} /> : <EyeOff size={10} />}
                            {event.published ? "Live" : "Draft"}
                          </button>

                          {/* Registration toggle */}
                          <button onClick={() => toggleRegistration(event)} disabled={togglingId === event.id + "-reg"}
                            title={event.registrationOpen ? "Click to close registration" : "Click to open registration"}
                            className={`inline-flex items-center gap-1.5 text-xs font-dm font-semibold px-2.5 py-1.5 rounded-full transition-colors ${
                              event.registrationOpen ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-red-100 text-red-600 hover:bg-red-200"
                            }`}>
                            {togglingId === event.id + "-reg" ? <Loader2 size={10} className="animate-spin" /> : event.registrationOpen ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
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
                            {counts.total > 0 && !isExpanded && <span className="bg-[#2251A3]/10 text-[#2251A3] text-xs px-1.5 rounded-full">{counts.total}</span>}
                            {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                          </button>

                          {/* Message */}
                          <button onClick={() => { setMsgModal(event); setMsgStatus("idle"); setMsgForm({ subject: "", body: "", recipients: "all" }); setMsgResult(""); }}
                            className="inline-flex items-center gap-1.5 text-xs font-dm font-semibold px-2.5 py-1.5 rounded-lg border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#F47C20] hover:text-[#F47C20] transition-colors">
                            <MessageSquare size={11} /> Message
                          </button>

                          {/* Clone */}
                          <button onClick={() => cloneEvent(event)} aria-label="Duplicate event" title="Duplicate event"
                            className="p-1.5 rounded-lg text-[#7A8FA6] hover:text-[#F47C20] hover:bg-[#FEF0E3] transition-colors">
                            <Layers size={14} />
                          </button>

                          {/* Edit */}
                          <button onClick={() => openEdit(event)} aria-label="Edit event"
                            className="p-1.5 rounded-lg text-[#7A8FA6] hover:text-[#2251A3] hover:bg-[#EBF0FA] transition-colors">
                            <Pencil size={14} />
                          </button>

                          {/* Delete */}
                          <button onClick={() => handleDelete(event.id)} disabled={deletingId === event.id} aria-label="Delete event"
                            className="p-1.5 rounded-lg text-[#7A8FA6] hover:text-red-600 hover:bg-red-50 transition-colors">
                            {deletingId === event.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded panel — event details + registrations */}
                      {isExpanded && (
                        <div className="border-t border-[#D2DCE8] bg-[#F8FAFD]">
                          {/* ── Event details ── */}
                          <div className="px-4 py-4 border-b border-[#D2DCE8]">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-syne font-bold text-sm text-[#0D1B2A]">Event Details</h4>
                              <div className="flex items-center gap-2">
                                <a href={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-dm font-semibold text-[#2251A3] hover:text-[#1B3A6B] px-2 py-1 rounded-lg hover:bg-[#EBF0FA] transition-colors">
                                  <ExternalLink size={11} /> Open Page
                                </a>
                                <button onClick={() => openEdit(event)}
                                  className="inline-flex items-center gap-1 text-xs font-dm font-semibold text-[#3A4A5C] hover:text-[#2251A3] px-2 py-1 rounded-lg border border-[#D2DCE8] hover:border-[#2251A3] transition-colors">
                                  <Pencil size={11} /> Edit Text
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
                              {[
                                { icon: Calendar, label: "Start", value: event.date ? fmtDateTime(event.date) : "Not set" },
                                { icon: Calendar, label: "End", value: event.endDate ? fmtDateTime(event.endDate) : "—" },
                                { icon: Clock, label: "Time Slot", value: event.timeSlot || "—" },
                                { icon: Calendar, label: "Location", value: event.location || "—" },
                                { icon: Target, label: "Price", value: event.price > 0 ? `$${(event.price / 100).toFixed(0)} ${event.currency}` : "Free" },
                                { icon: Users, label: "Capacity", value: event.capacity != null ? String(event.capacity) : "—" },
                                { icon: UserCheck, label: "Spots Left", value: event.spots != null ? String(event.spots) : "—" },
                                { icon: Tag, label: "Slug", value: event.slug },
                                { icon: ExternalLink, label: "Zoom Link", value: event.zoomLink || "Not set" },
                              ].map((d, di) => (
                                <div key={di} className="min-w-0">
                                  <div className="flex items-center gap-1 text-[#7A8FA6] mb-0.5">
                                    <d.icon size={11} />
                                    <span className="font-dm text-[11px] uppercase tracking-wider">{d.label}</span>
                                  </div>
                                  <p className="font-dm text-xs font-medium text-[#0D1B2A] truncate" title={d.value}>{d.value}</p>
                                </div>
                              ))}
                            </div>
                            {event.description && (
                              <div className="mt-3 pt-3 border-t border-[#E8EEF5]">
                                <span className="font-dm text-[11px] uppercase tracking-wider text-[#7A8FA6]">Description</span>
                                <p className="font-dm text-xs text-[#3A4A5C] mt-1 leading-relaxed line-clamp-3">{event.description}</p>
                              </div>
                            )}
                            <div className="mt-3 flex items-center gap-3 text-xs font-dm">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${event.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {event.published ? "Published" : "Draft"}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${event.registrationOpen ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600"}`}>
                                {event.registrationOpen ? "Registration Open" : "Registration Closed"}
                              </span>
                            </div>
                          </div>

                          {/* ── Registrations ── */}
                          <div className="px-4 py-2.5 bg-white border-b border-[#D2DCE8] flex items-center justify-between gap-2 flex-wrap">
                            <h4 className="font-syne font-bold text-sm text-[#0D1B2A]">Registrations</h4>
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setReminderModal(event); setReminderSession(1); setReminderResult(""); }}
                                className="inline-flex items-center gap-1.5 text-xs font-dm font-semibold text-[#2251A3] hover:text-[#1B3A6B] px-2.5 py-1.5 rounded-lg border border-[#D2DCE8] hover:border-[#2251A3] transition-colors">
                                <Mail size={11} /> Send Reminder
                              </button>
                              <button onClick={() => { setMsgModal(event); setMsgStatus("idle"); setMsgForm({ subject: "", body: "", recipients: "all" }); setMsgResult(""); }}
                                className="inline-flex items-center gap-1.5 text-xs font-dm font-semibold text-[#F47C20] hover:text-[#e06a10] transition-colors">
                                <Send size={11} /> Email Participants
                              </button>
                            </div>
                          </div>
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
                                    {["Name", "Confirm #", "Email", "WhatsApp", "Payment", "Status", "Date", ""].map(h => (
                                      <th key={h} className="text-left font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider px-4 py-2">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E8EEF5]">
                                  {regs.map(r => (
                                    <tr key={r.id} className="hover:bg-white transition-colors">
                                      <td className="px-4 py-2.5 font-dm text-sm font-medium text-[#0D1B2A]">{r.firstName} {r.lastName}</td>
                                      <td className="px-4 py-2.5">
                                        {r.confirmationNumber ? (
                                          <span className="font-mono text-xs font-semibold text-[#2251A3] bg-[#EBF0FA] px-2 py-0.5 rounded-full whitespace-nowrap">{r.confirmationNumber}</span>
                                        ) : <span className="text-[#D2DCE8] text-xs">—</span>}
                                      </td>
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

                          {/* ── Waitlist (coming-soon events only) ── */}
                          {!event.registrationOpen && (
                            <div>
                              <div className="px-4 py-2.5 bg-white border-b border-[#D2DCE8] flex items-center justify-between gap-2">
                                <h4 className="font-syne font-bold text-sm text-[#0D1B2A]">
                                  Waitlist
                                  {eventWaitlists[event.id] && (
                                    <span className="ml-2 font-dm text-xs font-normal text-[#F47C20]">
                                      ({eventWaitlists[event.id].length} {eventWaitlists[event.id].length === 1 ? "person" : "people"})
                                    </span>
                                  )}
                                </h4>
                                <button
                                  onClick={() => loadWaitlist(event.id, event.slug)}
                                  disabled={waitlistLoading[event.id]}
                                  className="p-1.5 rounded-lg text-[#7A8FA6] hover:text-[#2251A3] hover:bg-[#EBF0FA] transition-colors"
                                  title="Refresh waitlist"
                                >
                                  <Loader2 size={13} className={waitlistLoading[event.id] ? "animate-spin" : ""} />
                                </button>
                              </div>
                              {waitlistLoading[event.id] ? (
                                <div className="flex items-center justify-center py-6">
                                  <Loader2 size={18} className="animate-spin text-[#F47C20]" />
                                </div>
                              ) : !eventWaitlists[event.id] || eventWaitlists[event.id].length === 0 ? (
                                <div className="py-6 text-center">
                                  <p className="font-dm text-sm text-[#7A8FA6]">No waitlist entries yet.</p>
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-[#D2DCE8]">
                                        {["Name", "Email", "WhatsApp", "Date"].map(h => (
                                          <th key={h} className="text-left font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider px-4 py-2">{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E8EEF5]">
                                      {eventWaitlists[event.id].map(w => (
                                        <tr key={w.id} className="hover:bg-white transition-colors">
                                          <td className="px-4 py-2.5 font-dm text-sm font-medium text-[#0D1B2A]">{w.firstName || "—"}</td>
                                          <td className="px-4 py-2.5">
                                            <a href={`mailto:${w.email}`} className="font-dm text-xs text-[#2251A3] hover:underline flex items-center gap-1">
                                              <Mail size={11} />{w.email}
                                            </a>
                                          </td>
                                          <td className="px-4 py-2.5 font-dm text-xs text-[#3A4A5C]">{w.whatsapp || "—"}</td>
                                          <td className="px-4 py-2.5 font-dm text-xs text-[#7A8FA6]">{fmtDateTime(w.subscribedAt)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  <div className="px-4 py-2.5 border-t border-[#D2DCE8]">
                                    <span className="font-dm text-xs text-[#7A8FA6]">
                                      {eventWaitlists[event.id].length} interested {eventWaitlists[event.id].length === 1 ? "person" : "people"}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )
      )}

      {/* ── REGISTRATIONS TAB ───────────────────────────────────────────────── */}
      {tab === "registrations" && (
        <div>
          {/* Filters + search */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {["all", "pending", "confirmed", "cancelled", "waitlisted"].map(f => (
              <button key={f} onClick={() => setRegFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-dm font-medium transition-colors capitalize ${
                  regFilter === f ? "bg-[#1B3A6B] text-white" : "bg-white border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#2251A3]"
                }`}>
                {f === "all"
                ? `Active (${registrations.filter(r => r.status !== "cancelled").length})`
                : `${f.charAt(0).toUpperCase() + f.slice(1)} (${registrations.filter(r => r.status === f).length})`
              }
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setShowExportModal(true)} title="Export CSV"
                className="inline-flex items-center gap-1.5 text-xs font-dm font-semibold px-3 py-1.5 rounded-lg border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#2251A3] hover:text-[#2251A3] transition-colors">
                <Download size={12} /> Export CSV
              </button>
              <button onClick={loadAllRegs} title="Refresh" className="p-1.5 rounded-lg text-[#7A8FA6] hover:text-[#2251A3] hover:bg-[#EBF0FA] transition-colors">
                <Loader2 size={14} className={regsLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
            <input
              type="text" value={regSearch} onChange={e => setRegSearch(e.target.value)}
              placeholder="Search by name, email, WhatsApp, or event…"
              className="w-full pl-9 pr-3 py-2 text-sm font-dm border border-[#D2DCE8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
            />
          </div>

          {/* Bulk actions bar */}
          {selectedRegIds.size > 0 && (
            <div className="flex items-center gap-3 mb-3 bg-[#EBF0FA] border border-[#2251A3]/20 rounded-xl px-4 py-2.5">
              <span className="font-dm text-sm font-semibold text-[#2251A3]">{selectedRegIds.size} selected</span>
              <div className="flex items-center gap-2 ml-2">
                <button onClick={() => bulkUpdateRegs("confirmed")} disabled={bulkUpdating}
                  className="inline-flex items-center gap-1.5 text-xs font-dm font-semibold px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50">
                  {bulkUpdating ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Confirm All
                </button>
                <button onClick={() => bulkUpdateRegs("cancelled")} disabled={bulkUpdating}
                  className="inline-flex items-center gap-1.5 text-xs font-dm font-semibold px-3 py-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50">
                  <X size={11} /> Cancel All
                </button>
                <button onClick={() => bulkUpdateRegs("waitlisted")} disabled={bulkUpdating}
                  className="inline-flex items-center gap-1.5 text-xs font-dm font-semibold px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50">
                  Waitlist All
                </button>
              </div>
              <button onClick={() => setSelectedRegIds(new Set())} className="ml-auto text-xs font-dm text-[#7A8FA6] hover:text-[#3A4A5C]">
                Clear selection
              </button>
            </div>
          )}

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
                      <th className="px-4 py-3 w-8">
                        <input type="checkbox"
                          checked={selectedRegIds.size === filteredRegs.length && filteredRegs.length > 0}
                          onChange={e => setSelectedRegIds(e.target.checked ? new Set(filteredRegs.map(r => r.id)) : new Set())}
                          className="rounded border-[#D2DCE8]"
                        />
                      </th>
                      {["Name", "Confirmation #", "Contact", "Event", "Payment", "Status", "Date", ""].map(h => (
                        <th key={h} className="text-left font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D2DCE8]">
                    {filteredRegs.map(r => (
                      <tr key={r.id}
                        className={`hover:bg-[#F4F7FB] transition-colors cursor-pointer ${selectedRegIds.has(r.id) ? "bg-[#EBF0FA]" : ""}`}
                        onClick={() => { setSelectedReg(r); setRegNotes(r.notes ?? ""); }}>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedRegIds.has(r.id)}
                            onChange={e => {
                              const next = new Set(selectedRegIds);
                              e.target.checked ? next.add(r.id) : next.delete(r.id);
                              setSelectedRegIds(next);
                            }}
                            className="rounded border-[#D2DCE8]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-dm text-sm font-semibold text-[#0D1B2A]">{r.firstName} {r.lastName}</p>
                          {r.role && <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">{r.role}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {r.confirmationNumber ? (
                            <span className="font-mono text-xs font-semibold text-[#2251A3] bg-[#EBF0FA] px-2 py-0.5 rounded-full whitespace-nowrap">{r.confirmationNumber}</span>
                          ) : (
                            <span className="font-dm text-xs text-[#D2DCE8]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <a href={`mailto:${r.email}`} onClick={e => e.stopPropagation()} className="font-dm text-xs text-[#2251A3] hover:underline flex items-center gap-1 mb-0.5">
                            <Mail size={10} />{r.email}
                          </a>
                          {r.whatsapp && (
                            <p className="font-dm text-xs text-[#7A8FA6] flex items-center gap-1">
                              <Phone size={10} />{r.whatsapp}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-dm text-xs text-[#3A4A5C] max-w-[140px] truncate">{r.eventName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-dm text-xs capitalize text-[#3A4A5C] block">{r.paymentMethod}</span>
                          <span className="font-dm text-xs text-[#7A8FA6]">{r.price > 0 ? `$${(r.price / 100).toFixed(0)}` : "Free"}</span>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <StatusBadge status={r.status} onChange={s => updateRegGlobal(r.id, { status: s })} />
                        </td>
                        <td className="px-4 py-3 font-dm text-xs text-[#7A8FA6] whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                        <td className="px-4 py-3">
                          <button className="p-1.5 rounded-lg text-[#7A8FA6] hover:text-[#2251A3] hover:bg-[#EBF0FA] transition-colors">
                            <Eye size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-[#D2DCE8] flex items-center gap-3">
                <span className="font-dm text-xs text-[#7A8FA6]">{filteredRegs.length} result{filteredRegs.length !== 1 ? "s" : ""}</span>
                {regSearch && <span className="font-dm text-xs text-[#2251A3]">filtered by "{regSearch}"</span>}
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
                  <div className="bg-[#F4F7FB] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-dm font-semibold text-xs text-[#0D1B2A]">Registration Link</span>
                      <CopyBtn text={url} />
                    </div>
                    <p className="font-dm text-xs text-[#2251A3] break-all">{url}</p>
                  </div>
                  <div className="bg-[#F4F7FB] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-dm font-semibold text-xs text-[#0D1B2A]">Social Media Caption</span>
                      <CopyBtn text={socialCaption} label="Copy Caption" />
                    </div>
                    <p className="font-dm text-xs text-[#7A8FA6] whitespace-pre-line line-clamp-4">{socialCaption}</p>
                  </div>
                  <div className="bg-[#F4F7FB] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-dm font-semibold text-xs text-[#0D1B2A]">WhatsApp Message</span>
                      <CopyBtn text={whatsappMsg} label="Copy" />
                    </div>
                    <p className="font-dm text-xs text-[#7A8FA6] whitespace-pre-line line-clamp-4">{whatsappMsg}</p>
                  </div>
                  <div className="bg-[#F4F7FB] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-dm font-semibold text-xs text-[#0D1B2A]">Email Blurb</span>
                      <CopyBtn text={emailBlurb} label="Copy Blurb" />
                    </div>
                    <p className="font-dm text-xs text-[#7A8FA6] whitespace-pre-line line-clamp-4">{emailBlurb}</p>
                  </div>
                </div>

                {(() => { const c = getEventCounts(event.slug); return c.total > 0 ? (
                  <div className="mt-4 flex gap-4 pt-4 border-t border-[#D2DCE8]">
                    <span className="font-dm text-xs text-[#7A8FA6]">{c.total} total registrations</span>
                    <span className="font-dm text-xs text-green-700">{c.confirmed} confirmed</span>
                    <span className="font-dm text-xs text-yellow-700">{c.pending} pending</span>
                  </div>
                ) : null; })()}
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
              <button onClick={() => setShowModal(false)} aria-label="Close" className="p-2 rounded-xl text-[#7A8FA6] hover:bg-[#F4F7FB] transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              {/* Title */}
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. AI Practical Training — Cohort 2"
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
              </div>

              {/* Type */}
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

              {/* Description */}
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description shown on listing..." rows={3}
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3] resize-none" />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Start Date</label>
                  <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
                </div>
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">End Date</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
                </div>
              </div>

              {/* Time slot + Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Time Slot</label>
                  <input type="text" value={form.timeSlot} onChange={e => setForm(f => ({ ...f, timeSlot: e.target.value }))}
                    placeholder="9:30AM – 1PM ET (Saturdays)"
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
                </div>
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Location</label>
                  <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Live on Zoom / City, State"
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
                </div>
              </div>

              {/* Price + Capacity + Spots */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Price (cents)</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="84900 = $849"
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

              {/* Tags */}
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">
                  <Tag size={13} className="inline mr-1" />Tags <span className="text-[#7A8FA6] font-normal">(comma-separated)</span>
                </label>
                <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="ai, training, cohort, zoom, live"
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Cover Image URL <span className="text-[#7A8FA6] font-normal">(optional)</span></label>
                <input type="url" value={form.coverImage} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
              </div>

              {/* Payment Link */}
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Payment Link <span className="text-[#7A8FA6] font-normal">(Stripe, PayPal, etc.)</span></label>
                <input type="url" value={form.stripePaymentLink} onChange={e => setForm(f => ({ ...f, stripePaymentLink: e.target.value }))}
                  placeholder="https://buy.stripe.com/..."
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
              </div>

              {/* Zoom Link */}
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Zoom Link <span className="text-[#7A8FA6] font-normal">(used in session reminder emails)</span></label>
                <input type="url" value={form.zoomLink} onChange={e => setForm(f => ({ ...f, zoomLink: e.target.value }))}
                  placeholder="https://us05web.zoom.us/j/..."
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
              </div>

              {/* Checkboxes */}
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

              {/* Page content (all landing-page text) */}
              <div className="border-t border-[#E2E8F0] pt-5">
                <button type="button" onClick={() => setShowContentEditor(s => !s)}
                  className="w-full flex items-center justify-between gap-2 text-left">
                  <span className="flex items-center gap-2">
                    <Type size={15} className="text-[#2251A3]" />
                    <span className="font-syne font-bold text-sm text-[#0D1B2A]">Page Content — edit any text</span>
                  </span>
                  {showContentEditor ? <ChevronUp size={16} className="text-[#7A8FA6]" /> : <ChevronDown size={16} className="text-[#7A8FA6]" />}
                </button>
                <p className="font-dm text-xs text-[#7A8FA6] mt-1">
                  Every section of the live event page — hero, sessions, pricing, FAQs, footer. Layout & styling stay standard; only the words change.
                </p>
                {showContentEditor && (
                  <div className="mt-4 bg-[#FBFCFE] border border-[#E2E8F0] rounded-xl p-3 max-h-[420px] overflow-y-auto">
                    <ContentEditor
                      value={pageContent as unknown as Record<string, never>}
                      onChange={(v) => setPageContent(v as unknown as TrainingContent)}
                    />
                    <button type="button" onClick={() => setPageContent(DEFAULT_TRAINING_CONTENT)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-dm font-semibold px-3 py-1.5 rounded-lg border border-[#D2DCE8] text-[#7A8FA6] hover:text-[#3A4A5C] hover:border-[#2251A3] transition-colors">
                      Reset to default copy
                    </button>
                  </div>
                )}
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

      {/* ── REGISTRATION DETAIL PANEL ────────────────────────────────────────── */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm" onClick={() => setSelectedReg(null)}>
          <div className="bg-white h-full w-full max-w-md shadow-2xl overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-[#D2DCE8] sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">{selectedReg.firstName} {selectedReg.lastName}</h2>
                <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">Registered {fmtDateTime(selectedReg.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedReg(null)} aria-label="Close" className="p-2 rounded-xl text-[#7A8FA6] hover:bg-[#F4F7FB] transition-colors"><X size={18} /></button>
            </div>

            <div className="p-6 flex flex-col gap-6 flex-1">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="font-dm font-semibold text-sm text-[#0D1B2A]">Status</span>
                <StatusBadge status={selectedReg.status} onChange={async s => {
                  await updateRegGlobal(selectedReg.id, { status: s });
                  setSelectedReg(r => r ? { ...r, status: s } : null);
                }} />
              </div>

              {/* Contact */}
              <div>
                <h3 className="font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider mb-3">Contact</h3>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <Mail size={14} className="text-[#7A8FA6] shrink-0" />
                    <a href={`mailto:${selectedReg.email}`} className="font-dm text-sm text-[#2251A3] hover:underline break-all">{selectedReg.email}</a>
                  </div>
                  {selectedReg.whatsapp ? (
                    <div className="flex items-center gap-2.5">
                      <Phone size={14} className="text-[#7A8FA6] shrink-0" />
                      <a href={`https://wa.me/${selectedReg.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                        className="font-dm text-sm text-[#3A4A5C] hover:text-green-700">{selectedReg.whatsapp}</a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <Phone size={14} className="text-[#D2DCE8] shrink-0" />
                      <span className="font-dm text-sm text-[#D2DCE8]">No WhatsApp provided</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional */}
              <div>
                <h3 className="font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider mb-3">Professional</h3>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <Briefcase size={14} className="text-[#7A8FA6] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-dm text-xs text-[#7A8FA6] mb-0.5">Role / Profession</p>
                      <p className="font-dm text-sm text-[#0D1B2A]">{selectedReg.role || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Target size={14} className="text-[#7A8FA6] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-dm text-xs text-[#7A8FA6] mb-0.5">Goal / What they want to achieve</p>
                      <p className="font-dm text-sm text-[#0D1B2A]">{selectedReg.goal || "—"}</p>
                    </div>
                  </div>
                  {selectedReg.referral && (
                    <div className="flex items-start gap-2.5">
                      <Share2 size={14} className="text-[#7A8FA6] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-dm text-xs text-[#7A8FA6] mb-0.5">How they heard about us</p>
                        <p className="font-dm text-sm text-[#0D1B2A]">{selectedReg.referral}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Registration Details */}
              <div>
                <h3 className="font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider mb-3">Registration Details</h3>
                <div className="bg-[#F4F7FB] rounded-xl p-4 flex flex-col gap-2.5">
                  {selectedReg.confirmationNumber && (
                    <div className="flex justify-between items-center gap-2 pb-2 border-b border-[#D2DCE8]">
                      <span className="font-dm text-xs text-[#7A8FA6]">Confirmation #</span>
                      <span className="font-mono text-xs font-bold text-[#2251A3] bg-[#EBF0FA] px-2.5 py-1 rounded-full">{selectedReg.confirmationNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-dm text-xs text-[#7A8FA6]">Event</span>
                    <span className="font-dm text-xs font-semibold text-[#0D1B2A] text-right max-w-[60%]">{selectedReg.eventName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-dm text-xs text-[#7A8FA6]">Payment Method</span>
                    <span className="font-dm text-xs font-semibold text-[#0D1B2A] capitalize">{selectedReg.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-dm text-xs text-[#7A8FA6]">Amount</span>
                    <span className="font-dm text-xs font-semibold text-[#0D1B2A]">
                      {selectedReg.price > 0 ? `$${(selectedReg.price / 100).toFixed(0)} ${selectedReg.currency}` : "Free"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-dm text-xs text-[#7A8FA6]">Date Registered</span>
                    <span className="font-dm text-xs font-semibold text-[#0D1B2A]">{fmtDateTime(selectedReg.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider mb-2">
                  <StickyNote size={11} className="inline mr-1.5" />Internal Notes
                </label>
                <textarea
                  value={regNotes} onChange={e => setRegNotes(e.target.value)}
                  placeholder="Add internal notes (payment confirmed, follow-up needed, etc.)..."
                  rows={4}
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3] resize-none"
                />
                <button
                  onClick={async () => {
                    setSavingNotes(true);
                    await updateRegGlobal(selectedReg.id, { notes: regNotes });
                    setSelectedReg(r => r ? { ...r, notes: regNotes } : null);
                    setSavingNotes(false);
                  }}
                  disabled={savingNotes}
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-dm font-semibold text-[#2251A3] hover:text-[#1B3A6B] disabled:opacity-50">
                  {savingNotes ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                  {savingNotes ? "Saving…" : "Save notes"}
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-[#D2DCE8] mt-auto">
                <a href={`mailto:${selectedReg.email}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#EBF0FA] text-[#2251A3] font-dm font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-[#D2DCE8] transition-colors">
                  <Mail size={14} /> Email
                </a>
                {selectedReg.whatsapp && (
                  <a href={`https://wa.me/${selectedReg.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#F0FFF4] text-green-700 font-dm font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-[#DCFCE7] transition-colors">
                    <Phone size={14} /> WhatsApp
                  </a>
                )}
              </div>
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
              <button onClick={() => setMsgModal(null)} aria-label="Close" className="p-2 rounded-xl text-[#7A8FA6] hover:bg-[#F4F7FB]"><X size={18} /></button>
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
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-2">Send to</label>
                  <div className="flex gap-2 flex-wrap">
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
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Subject *</label>
                  <input type="text" value={msgForm.subject} onChange={e => setMsgForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Session 1 details — Saturday June 20"
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]" />
                </div>
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

      {/* ── SESSION REMINDER MODAL ────────────────────────────────────────── */}
      {reminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#D2DCE8]">
              <div>
                <h2 className="font-syne font-bold text-base text-[#0D1B2A]">Send Session Reminder</h2>
                <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">{reminderModal.title}</p>
              </div>
              <button onClick={() => { setReminderModal(null); setReminderResult(""); }} className="p-1.5 rounded-xl text-[#7A8FA6] hover:bg-[#F4F7FB]"><X size={16} /></button>
            </div>
            <div className="px-5 py-5 flex flex-col gap-4">
              {!reminderModal.zoomLink && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs font-dm text-yellow-700">
                  ⚠️ No Zoom link saved for this event. Edit the event to add one — it will be included in the email.
                </div>
              )}
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-2">Which session?</label>
                <div className="flex flex-col gap-2">
                  {[
                    { n: 1, date: "June 27", topic: "AI Foundations" },
                    { n: 2, date: "July 4",  topic: "AI in Your Work" },
                    { n: 3, date: "July 11", topic: "Build Income with AI" },
                    { n: 4, date: "July 18", topic: "AI Agents & Vibe Coding" },
                  ].map(s => (
                    <label key={s.n} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${reminderSession === s.n ? "border-[#2251A3] bg-[#EBF0FA]" : "border-[#D2DCE8] hover:bg-[#F4F7FB]"}`}>
                      <input type="radio" name="session" value={s.n} checked={reminderSession === s.n} onChange={() => setReminderSession(s.n)} className="text-[#2251A3]" />
                      <div>
                        <span className="font-dm text-sm font-semibold text-[#0D1B2A]">Session {s.n} · {s.date}</span>
                        <span className="font-dm text-xs text-[#7A8FA6] ml-2">{s.topic}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {reminderResult && (
                <p className="font-dm text-sm text-center py-1">{reminderResult}</p>
              )}
              <div className="flex gap-3">
                <button onClick={sendReminder} disabled={reminderSending}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#2251A3] hover:bg-[#1B3A6B] text-white font-dm font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                  {reminderSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {reminderSending ? "Sending…" : "Send Reminder"}
                </button>
                <button onClick={() => { setReminderModal(null); setReminderResult(""); }}
                  className="px-4 py-2.5 rounded-xl border border-[#D2DCE8] font-dm text-sm text-[#3A4A5C] hover:bg-[#F4F7FB] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EXPORT MODAL ──────────────────────────────────────────────────── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#D2DCE8]">
              <h2 className="font-syne font-bold text-base text-[#0D1B2A]">Export CSV</h2>
              <button onClick={() => setShowExportModal(false)} className="p-1.5 rounded-xl text-[#7A8FA6] hover:bg-[#F4F7FB]"><X size={16} /></button>
            </div>

            {/* Quick presets */}
            <div className="px-5 pt-4 pb-2">
              <p className="font-dm text-xs text-[#7A8FA6] mb-2 uppercase tracking-wider font-semibold">Quick presets</p>
              <div className="flex gap-2 flex-wrap mb-4">
                {[
                  { label: "📱 WhatsApp numbers", cols: ["name","whatsapp"] as ExportKey[] },
                  { label: "📧 Email list",        cols: ["name","email"] as ExportKey[] },
                  { label: "📋 Full export",       cols: EXPORT_COLUMNS.map(c => c.key) as ExportKey[] },
                ].map(preset => (
                  <button key={preset.label} onClick={() => setExportCols(new Set(preset.cols))}
                    className="px-3 py-1.5 text-xs font-dm font-semibold rounded-full border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#2251A3] hover:text-[#2251A3] transition-colors whitespace-nowrap">
                    {preset.label}
                  </button>
                ))}
              </div>

              <p className="font-dm text-xs text-[#7A8FA6] mb-2 uppercase tracking-wider font-semibold">Select columns</p>
              <div className="grid grid-cols-2 gap-1.5 mb-5">
                {EXPORT_COLUMNS.map(col => (
                  <label key={col.key} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#D2DCE8] cursor-pointer hover:bg-[#F4F7FB] transition-colors">
                    <input type="checkbox" checked={exportCols.has(col.key)}
                      onChange={e => {
                        const next = new Set(exportCols);
                        e.target.checked ? next.add(col.key) : next.delete(col.key);
                        setExportCols(next);
                      }}
                      className="rounded border-[#D2DCE8] text-[#2251A3]"
                    />
                    <span className="font-dm text-xs text-[#0D1B2A]">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5 flex items-center gap-3">
              <button onClick={exportCSV} disabled={exportCols.size === 0}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1B3A6B] hover:bg-[#162f5a] text-white font-dm font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                <Download size={14} /> Export {filteredRegs.length} rows
              </button>
              <button onClick={() => setShowExportModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D2DCE8] font-dm text-sm text-[#3A4A5C] hover:bg-[#F4F7FB] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
