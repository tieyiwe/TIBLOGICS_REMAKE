"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutGrid, List, Search, Archive, Trash2, ArchiveRestore,
  RefreshCw, X, Mail, Phone, Building2, Tag, Calendar,
  DollarSign, FileText, ChevronRight, Clock, CheckCircle2,
  AlertCircle, StickyNote, Plus
} from "lucide-react";

type ProspectStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL_SENT" | "NEGOTIATING" | "CLOSED_WON" | "CLOSED_LOST" | "ON_HOLD";

interface ActivityEntry {
  type: "note" | "status" | "created";
  text: string;
  date: string;
}

interface Prospect {
  id: string;
  name: string;
  business: string;
  industry: string;
  source: string;
  budget: string;
  status: ProspectStatus;
  suggestedSolutions: string[];
  createdAt: string;
  updatedAt: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  mainChallenge?: string | null;
  estimatedValue?: number | null;
  followUpDate?: string | null;
  conversationLog?: ActivityEntry[] | null;
  archived: boolean;
}

const COLUMNS: { status: ProspectStatus; label: string; color: string }[] = [
  { status: "NEW",           label: "New",           color: "#F47C20" },
  { status: "CONTACTED",     label: "Contacted",     color: "#2251A3" },
  { status: "QUALIFIED",     label: "Qualified",     color: "#0F6E56" },
  { status: "PROPOSAL_SENT", label: "Proposal Sent", color: "#7c3aed" },
  { status: "CLOSED_WON",    label: "Closed Won",    color: "#16a34a" },
];

const ALL_STATUSES: ProspectStatus[] = ["NEW","CONTACTED","QUALIFIED","PROPOSAL_SENT","NEGOTIATING","CLOSED_WON","CLOSED_LOST","ON_HOLD"];
const STATUS_ORDER: ProspectStatus[] = ["NEW","CONTACTED","QUALIFIED","PROPOSAL_SENT","CLOSED_WON"];

const STATUS_COLORS: Record<string, string> = {
  NEW:           "bg-[#FEF0E3] text-[#F47C20]",
  CONTACTED:     "bg-[#EBF0FA] text-[#2251A3]",
  QUALIFIED:     "bg-green-100 text-green-700",
  PROPOSAL_SENT: "bg-purple-100 text-purple-700",
  NEGOTIATING:   "bg-yellow-100 text-yellow-700",
  CLOSED_WON:    "bg-green-100 text-green-800",
  CLOSED_LOST:   "bg-red-100 text-red-600",
  ON_HOLD:       "bg-gray-100 text-gray-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-500"} text-xs font-medium px-2 py-0.5 rounded-full font-dm`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function daysAgo(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function fmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
}

function followUpStatus(date?: string | null) {
  if (!date) return null;
  const diff = Math.floor((new Date(date).getTime() - Date.now()) / 86400000);
  if (diff < 0) return "overdue";
  if (diff <= 2) return "soon";
  return "upcoming";
}

// ── Detail Slide-Over ──────────────────────────────────────────────────────────
function ProspectPanel({
  prospect, onClose, onUpdate, onDelete,
}: {
  prospect: Prospect;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Prospect>) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const [notes, setNotes] = useState(prospect.notes ?? "");
  const [estimatedValue, setEstimatedValue] = useState(prospect.estimatedValue?.toString() ?? "");
  const [followUpDate, setFollowUpDate] = useState(
    prospect.followUpDate ? new Date(prospect.followUpDate).toISOString().split("T")[0] : ""
  );
  const [status, setStatus] = useState<ProspectStatus>(prospect.status);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const notesTimer = useRef<NodeJS.Timeout | null>(null);

  const activity: ActivityEntry[] = Array.isArray(prospect.conversationLog)
    ? (prospect.conversationLog as ActivityEntry[])
    : [];

  async function save(data: Partial<Prospect>, activityEntry?: ActivityEntry) {
    setSaving(true);
    const payload: Partial<Prospect> & { conversationLog?: ActivityEntry[] } = { ...data };
    if (activityEntry) {
      payload.conversationLog = [activityEntry, ...activity].slice(0, 50);
    }
    await fetch(`/api/admin/prospects/${prospect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    onUpdate(prospect.id, { ...payload });
    setSaving(false);
  }

  function handleNotesChange(val: string) {
    setNotes(val);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => save({ notes: val }), 1200);
  }

  async function handleStatusChange(newStatus: ProspectStatus) {
    const prev = status;
    setStatus(newStatus);
    await save({ status: newStatus }, {
      type: "status",
      text: `Status changed: ${prev.replace(/_/g," ")} → ${newStatus.replace(/_/g," ")}`,
      date: new Date().toISOString(),
    });
  }

  async function handleValueBlur() {
    const val = estimatedValue ? parseInt(estimatedValue) : null;
    await save({ estimatedValue: val });
  }

  async function handleFollowUpBlur() {
    await save({ followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null });
  }

  async function submitNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    const entry: ActivityEntry = { type: "note", text: newNote.trim(), date: new Date().toISOString() };
    await save({}, entry);
    setNewNote("");
    setAddingNote(false);
  }

  const fuStatus = followUpStatus(followUpDate ? new Date(followUpDate).toISOString() : null);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D2DCE8] bg-[#F4F7FB]">
          <div className="min-w-0">
            <h2 className="font-syne font-bold text-lg text-[#0D1B2A] truncate">{prospect.name}</h2>
            <p className="font-dm text-sm text-[#7A8FA6] truncate">{prospect.business}</p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {saving && <RefreshCw size={14} className="animate-spin text-[#7A8FA6]" />}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#D2DCE8] transition-colors text-[#7A8FA6]">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Contact Info */}
          <div className="px-6 py-4 border-b border-[#F4F7FB] space-y-2">
            <p className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide mb-3">Contact Info</p>
            <div className="grid grid-cols-2 gap-3">
              {prospect.email && (
                <a href={`mailto:${prospect.email}`}
                  className="flex items-center gap-2 text-sm font-dm text-[#2251A3] hover:underline col-span-2 truncate">
                  <Mail size={13} className="flex-shrink-0" /> {prospect.email}
                </a>
              )}
              {prospect.phone && (
                <a href={`tel:${prospect.phone}`}
                  className="flex items-center gap-2 text-sm font-dm text-[#3A4A5C] truncate">
                  <Phone size={13} className="flex-shrink-0" /> {prospect.phone}
                </a>
              )}
              <div className="flex items-center gap-2 text-sm font-dm text-[#3A4A5C]">
                <Building2 size={13} className="flex-shrink-0" /> {prospect.industry}
              </div>
              <div className="flex items-center gap-2 text-sm font-dm text-[#3A4A5C]">
                <Tag size={13} className="flex-shrink-0" /> {prospect.source.replace(/_/g," ")}
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div className="px-6 py-4 border-b border-[#F4F7FB] space-y-3">
            <p className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Pipeline</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Status */}
              <div>
                <label className="font-dm text-xs text-[#7A8FA6] mb-1 block">Status</label>
                <select
                  value={status}
                  onChange={e => handleStatusChange(e.target.value as ProspectStatus)}
                  className="w-full text-sm font-dm bg-white border border-[#D2DCE8] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace(/_/g," ")}</option>
                  ))}
                </select>
              </div>
              {/* Deal value */}
              <div>
                <label className="font-dm text-xs text-[#7A8FA6] mb-1 block">Deal Value ($)</label>
                <div className="relative">
                  <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
                  <input
                    type="number"
                    value={estimatedValue}
                    onChange={e => setEstimatedValue(e.target.value)}
                    onBlur={handleValueBlur}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 text-sm font-dm bg-white border border-[#D2DCE8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
                  />
                </div>
              </div>
              {/* Budget */}
              <div>
                <label className="font-dm text-xs text-[#7A8FA6] mb-1 block">Budget (stated)</label>
                <p className="text-sm font-dm font-medium text-[#0D1B2A] py-2">{prospect.budget || "—"}</p>
              </div>
              {/* Follow-up date */}
              <div>
                <label className="font-dm text-xs text-[#7A8FA6] mb-1 block">Follow-up Date</label>
                <div className="relative">
                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    onBlur={handleFollowUpBlur}
                    className={`w-full pl-7 pr-3 py-2 text-sm font-dm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 ${
                      fuStatus === "overdue" ? "border-red-400 text-red-600" :
                      fuStatus === "soon" ? "border-amber-400 text-amber-700" :
                      "border-[#D2DCE8]"
                    }`}
                  />
                </div>
                {fuStatus === "overdue" && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> Overdue</p>
                )}
                {fuStatus === "soon" && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><Clock size={11} /> Due soon</p>
                )}
              </div>
            </div>
          </div>

          {/* Main challenge */}
          {prospect.mainChallenge && (
            <div className="px-6 py-4 border-b border-[#F4F7FB]">
              <p className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide mb-2">Main Challenge</p>
              <p className="text-sm font-dm text-[#3A4A5C] leading-relaxed">{prospect.mainChallenge}</p>
            </div>
          )}

          {/* Solutions */}
          {prospect.suggestedSolutions.length > 0 && (
            <div className="px-6 py-4 border-b border-[#F4F7FB]">
              <p className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide mb-2">Suggested Solutions</p>
              <div className="flex flex-wrap gap-1.5">
                {prospect.suggestedSolutions.map(s => (
                  <span key={s} className="bg-[#EBF0FA] text-[#2251A3] text-xs px-2.5 py-1 rounded-full font-dm">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="px-6 py-4 border-b border-[#F4F7FB]">
            <p className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <StickyNote size={12} /> Notes <span className="text-[#7A8FA6] font-normal normal-case">(auto-saves)</span>
            </p>
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              rows={4}
              placeholder="Add internal notes about this prospect…"
              className="w-full text-sm font-dm text-[#0D1B2A] bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3] placeholder-[#7A8FA6]"
            />
          </div>

          {/* Activity Log */}
          <div className="px-6 py-4">
            <p className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide mb-3">Activity Log</p>

            {/* Add note */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitNote()}
                placeholder="Log a call, email, or note…"
                className="flex-1 text-sm font-dm bg-white border border-[#D2DCE8] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3] placeholder-[#7A8FA6]"
              />
              <button
                onClick={submitNote}
                disabled={addingNote || !newNote.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#2251A3] text-white text-sm font-dm font-medium rounded-xl hover:bg-[#1B3A6B] disabled:opacity-40 transition-colors"
              >
                {addingNote ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
                Log
              </button>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              {/* Created entry */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#EBF0FA] flex items-center justify-center mt-0.5">
                  <CheckCircle2 size={12} className="text-[#2251A3]" />
                </div>
                <div>
                  <p className="text-xs font-dm font-medium text-[#0D1B2A]">Prospect created</p>
                  <p className="text-xs font-dm text-[#7A8FA6]">{new Date(prospect.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>
                </div>
              </div>
              {activity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                    a.type === "note" ? "bg-amber-100" : "bg-[#EBF0FA]"
                  }`}>
                    {a.type === "note"
                      ? <StickyNote size={11} className="text-amber-600" />
                      : <ChevronRight size={12} className="text-[#2251A3]" />
                    }
                  </div>
                  <div>
                    <p className="text-xs font-dm text-[#0D1B2A]">{a.text}</p>
                    <p className="text-xs font-dm text-[#7A8FA6]">{new Date(a.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <p className="text-xs font-dm text-[#7A8FA6] italic">No activity logged yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[#D2DCE8] bg-[#F4F7FB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {prospect.email && (
              <a href={`mailto:${prospect.email}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D2DCE8] text-[#0D1B2A] text-sm font-dm rounded-xl hover:bg-[#EBF0FA] hover:border-[#2251A3] hover:text-[#2251A3] transition-colors">
                <Mail size={13} /> Email
              </a>
            )}
            <button
              onClick={() => { onUpdate(prospect.id, { archived: !prospect.archived }); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D2DCE8] text-[#7A8FA6] text-sm font-dm rounded-xl hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300 transition-colors"
            >
              {prospect.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
              {prospect.archived ? "Restore" : "Archive"}
            </button>
          </div>
          <button
            onClick={() => { onDelete(prospect.id, prospect.name); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-2 text-red-500 text-sm font-dm rounded-xl hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProspectsPage() {
  const [view, setView]             = useState<"kanban" | "table">("kanban");
  const [search, setSearch]         = useState("");
  const [items, setItems]           = useState<Prospect[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId]         = useState<string | null>(null);
  const [selected, setSelected]     = useState<Prospect | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/prospects?archived=${showArchived}`);
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.business.toLowerCase().includes(search.toLowerCase()) ||
    p.industry.toLowerCase().includes(search.toLowerCase())
  );

  function updateItem(id: string, data: Partial<Prospect>) {
    setItems(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...data } : null);
    if ("archived" in data) setItems(prev => prev.filter(p => p.id !== id));
  }

  async function patch(id: string, data: Partial<Prospect>) {
    setBusyId(id);
    updateItem(id, data);
    await fetch(`/api/admin/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusyId(null);
  }

  async function deleteProspect(id: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    setBusyId(id);
    setItems(prev => prev.filter(p => p.id !== id));
    await fetch(`/api/admin/prospects/${id}`, { method: "DELETE" });
    setBusyId(null);
  }

  function moveToNext(id: string) {
    const p = items.find(x => x.id === id);
    if (!p) return;
    const idx = STATUS_ORDER.indexOf(p.status);
    if (idx === -1 || idx >= STATUS_ORDER.length - 1) return;
    patch(id, { status: STATUS_ORDER[idx + 1] });
  }

  // Pipeline value per column
  function colValue(status: ProspectStatus) {
    return filtered
      .filter(p => p.status === status && p.estimatedValue)
      .reduce((sum, p) => sum + (p.estimatedValue ?? 0), 0);
  }

  return (
    <div className="space-y-6">
      {selected && (
        <ProspectPanel
          prospect={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateItem}
          onDelete={deleteProspect}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Prospects</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">
            {loading ? "Loading…" : `${filtered.length} ${showArchived ? "archived" : "active"} prospects · Pipeline: ${fmt(filtered.reduce((s,p) => s+(p.estimatedValue??0),0))}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowArchived(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-dm transition-colors ${
              showArchived ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-white border-[#D2DCE8] text-[#7A8FA6] hover:bg-[#F4F7FB]"
            }`}>
            <Archive size={14} /> {showArchived ? "Viewing Archived" : "View Archived"}
          </button>
          <button onClick={() => setView("kanban")}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors ${
              view === "kanban" ? "bg-[#1B3A6B] border-[#1B3A6B] text-white" : "bg-white border-[#D2DCE8] text-[#7A8FA6] hover:bg-[#F4F7FB]"
            }`}><LayoutGrid size={15} /></button>
          <button onClick={() => setView("table")}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors ${
              view === "table" ? "bg-[#1B3A6B] border-[#1B3A6B] text-white" : "bg-white border-[#D2DCE8] text-[#7A8FA6] hover:bg-[#F4F7FB]"
            }`}><List size={15} /></button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
        <input type="text" placeholder="Search prospects…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={18} className="animate-spin text-[#7A8FA6]" />
        </div>
      ) : (
        <>
          {/* ── Kanban View ── */}
          {view === "kanban" && (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {COLUMNS.map(col => {
                  const cards = filtered.filter(p => p.status === col.status);
                  const val = colValue(col.status);
                  return (
                    <div key={col.status} className="w-64 flex-shrink-0">
                      <div className="rounded-t-xl px-4 py-3 border-t-4"
                        style={{ borderColor: col.color, backgroundColor: col.color + "10" }}>
                        <div className="flex items-center justify-between">
                          <span className="font-syne font-bold text-sm text-[#0D1B2A]">{col.label}</span>
                          <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: col.color + "20", color: col.color }}>
                            {cards.length}
                          </span>
                        </div>
                        {val > 0 && (
                          <p className="text-xs font-dm text-[#7A8FA6] mt-1 flex items-center gap-1">
                            <DollarSign size={10} /> {fmt(val)} potential
                          </p>
                        )}
                      </div>
                      <div className="bg-[#F4F7FB] rounded-b-xl p-2 space-y-2 min-h-[120px]">
                        {cards.length === 0 && (
                          <p className="text-center text-xs font-dm text-[#7A8FA6] py-6">No prospects</p>
                        )}
                        {cards.map(p => {
                          const fu = followUpStatus(p.followUpDate);
                          return (
                            <div key={p.id}
                              onClick={() => setSelected(p)}
                              className="bg-white border border-[#D2DCE8] rounded-xl p-3 space-y-2 cursor-pointer hover:border-[#2251A3]/40 hover:shadow-sm transition-all group">
                              {fu && (
                                <div className={`flex items-center gap-1 text-xs font-dm px-2 py-0.5 rounded-full w-fit ${
                                  fu === "overdue" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
                                }`}>
                                  <Clock size={10} /> {fu === "overdue" ? "Follow-up overdue" : "Follow-up soon"}
                                </div>
                              )}
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  <p className="font-dm font-semibold text-sm text-[#0D1B2A] leading-tight truncate group-hover:text-[#2251A3]">{p.name}</p>
                                  <p className="font-dm text-xs text-[#7A8FA6] truncate">{p.business}</p>
                                </div>
                                <span className="text-xs font-dm text-[#7A8FA6] whitespace-nowrap flex-shrink-0">
                                  {daysAgo(p.createdAt)}d
                                </span>
                              </div>
                              <p className="text-xs font-dm text-[#7A8FA6]">{p.industry} · {p.budget}</p>
                              {p.estimatedValue && (
                                <p className="text-xs font-dm font-semibold text-[#0F6E56] flex items-center gap-1">
                                  <DollarSign size={10} /> {p.estimatedValue.toLocaleString()} deal
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {p.suggestedSolutions.slice(0, 2).map(s => (
                                  <span key={s} className="bg-[#EBF0FA] text-[#2251A3] text-xs px-1.5 py-0.5 rounded-full font-dm">{s}</span>
                                ))}
                              </div>
                              <div className="flex items-center justify-between gap-2 pt-1" onClick={e => e.stopPropagation()}>
                                {!showArchived && p.status !== "CLOSED_WON" && (
                                  <button onClick={() => moveToNext(p.id)}
                                    className="flex-1 text-xs font-dm font-medium text-[#2251A3] border border-[#D2DCE8] rounded-lg py-1.5 hover:bg-[#EBF0FA] transition-colors">
                                    Move → {COLUMNS[STATUS_ORDER.indexOf(p.status) + 1]?.label}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Table View ── */}
          {view === "table" && (
            <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#D2DCE8] bg-[#F4F7FB]">
                      <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Name</th>
                      <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Business</th>
                      <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Industry</th>
                      <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Status</th>
                      <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Deal Value</th>
                      <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Follow-up</th>
                      <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F7FB]">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 font-dm text-sm text-[#7A8FA6]">No prospects found.</td></tr>
                    ) : (
                      filtered.map(p => {
                        const fu = followUpStatus(p.followUpDate);
                        return (
                          <tr key={p.id}
                            onClick={() => setSelected(p)}
                            className="hover:bg-[#F4F7FB]/60 transition-colors cursor-pointer">
                            <td className="px-5 py-4">
                              <p className="font-dm text-sm font-medium text-[#0D1B2A] hover:text-[#2251A3]">{p.name}</p>
                              {p.email && <p className="font-dm text-xs text-[#7A8FA6]">{p.email}</p>}
                              {p.notes && <p className="font-dm text-xs text-[#7A8FA6] italic mt-0.5 line-clamp-1"><FileText size={10} className="inline mr-1" />{p.notes}</p>}
                            </td>
                            <td className="px-5 py-4 font-dm text-sm text-[#0D1B2A]">{p.business}</td>
                            <td className="px-5 py-4 font-dm text-sm text-[#7A8FA6]">{p.industry}</td>
                            <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                            <td className="px-5 py-4 font-dm text-sm font-semibold text-[#0F6E56]">
                              {p.estimatedValue ? `$${p.estimatedValue.toLocaleString()}` : <span className="text-[#D2DCE8]">—</span>}
                            </td>
                            <td className="px-5 py-4">
                              {p.followUpDate ? (
                                <span className={`text-xs font-dm flex items-center gap-1 ${
                                  fu === "overdue" ? "text-red-500" : fu === "soon" ? "text-amber-600" : "text-[#7A8FA6]"
                                }`}>
                                  <Clock size={11} />
                                  {new Date(p.followUpDate).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                                </span>
                              ) : <span className="text-[#D2DCE8] text-sm">—</span>}
                            </td>
                            <td className="px-5 py-4 font-dm text-xs text-[#7A8FA6]">{daysAgo(p.createdAt)}d ago</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
