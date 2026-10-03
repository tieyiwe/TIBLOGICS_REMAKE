"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutGrid, List, Search, Archive, Trash2, ArchiveRestore,
  RefreshCw, X, Mail, Phone, Building2, Tag, Calendar,
  DollarSign, FileText, ChevronRight, Clock, CheckCircle2,
  AlertCircle, StickyNote, Plus
} from "lucide-react";
import { Button, DataTable, EmptyState, PageHeader, SearchInput, Segmented, Toolbar } from "@/components/admin/ui";

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
  CONTACTED:     "bg-[var(--a-info-bg)] text-[var(--a-blue)]",
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
    const payload: Partial<Prospect> & { conversationLog?: ActivityEntry[] | null } = { ...data };
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--a-border)] bg-[var(--a-surface-2)]">
          <div className="min-w-0">
            <h2 className="font-syne font-bold text-lg text-[var(--a-ink)] truncate">{prospect.name}</h2>
            <p className="font-dm text-sm text-[var(--a-ink-3)] truncate">{prospect.business}</p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {saving && <RefreshCw size={14} className="animate-spin text-[var(--a-ink-3)]" />}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#D2DCE8] transition-colors text-[var(--a-ink-3)]">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Contact Info */}
          <div className="px-6 py-4 border-b border-[var(--a-border)] space-y-2">
            <p className="font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em] mb-3">Contact Info</p>
            <div className="grid grid-cols-2 gap-3">
              {prospect.email && (
                <a href={`mailto:${prospect.email}`}
                  className="flex items-center gap-2 text-sm font-dm text-[var(--a-blue)] hover:underline col-span-2 truncate">
                  <Mail size={13} className="flex-shrink-0" /> {prospect.email}
                </a>
              )}
              {prospect.phone && (
                <a href={`tel:${prospect.phone}`}
                  className="flex items-center gap-2 text-sm font-dm text-[var(--a-ink-2)] truncate">
                  <Phone size={13} className="flex-shrink-0" /> {prospect.phone}
                </a>
              )}
              <div className="flex items-center gap-2 text-sm font-dm text-[var(--a-ink-2)]">
                <Building2 size={13} className="flex-shrink-0" /> {prospect.industry}
              </div>
              <div className="flex items-center gap-2 text-sm font-dm text-[var(--a-ink-2)]">
                <Tag size={13} className="flex-shrink-0" /> {prospect.source.replace(/_/g," ")}
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div className="px-6 py-4 border-b border-[var(--a-border)] space-y-3">
            <p className="font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em]">Pipeline</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Status */}
              <div>
                <label className="font-dm text-xs text-[var(--a-ink-3)] mb-1 block">Status</label>
                <select
                  value={status}
                  onChange={e => handleStatusChange(e.target.value as ProspectStatus)}
                  className="w-full text-sm font-dm bg-white border border-[var(--a-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)]"
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace(/_/g," ")}</option>
                  ))}
                </select>
              </div>
              {/* Deal value */}
              <div>
                <label className="font-dm text-xs text-[var(--a-ink-3)] mb-1 block">Deal Value ($)</label>
                <div className="relative">
                  <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--a-ink-3)]" />
                  <input
                    type="number"
                    value={estimatedValue}
                    onChange={e => setEstimatedValue(e.target.value)}
                    onBlur={handleValueBlur}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 text-sm font-dm bg-white border border-[var(--a-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)]"
                  />
                </div>
              </div>
              {/* Budget */}
              <div>
                <label className="font-dm text-xs text-[var(--a-ink-3)] mb-1 block">Budget (stated)</label>
                <p className="text-sm font-dm font-medium text-[var(--a-ink)] py-2">{prospect.budget || "—"}</p>
              </div>
              {/* Follow-up date */}
              <div>
                <label className="font-dm text-xs text-[var(--a-ink-3)] mb-1 block">Follow-up Date</label>
                <div className="relative">
                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--a-ink-3)]" />
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    onBlur={handleFollowUpBlur}
                    className={`w-full pl-7 pr-3 py-2 text-sm font-dm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 ${
                      fuStatus === "overdue" ? "border-red-400 text-red-600" :
                      fuStatus === "soon" ? "border-amber-400 text-amber-700" :
                      "border-[var(--a-border)]"
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
            <div className="px-6 py-4 border-b border-[var(--a-border)]">
              <p className="font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em] mb-2">Main Challenge</p>
              <p className="text-sm font-dm text-[var(--a-ink-2)] leading-relaxed">{prospect.mainChallenge}</p>
            </div>
          )}

          {/* Solutions */}
          {prospect.suggestedSolutions.length > 0 && (
            <div className="px-6 py-4 border-b border-[var(--a-border)]">
              <p className="font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em] mb-2">Suggested Solutions</p>
              <div className="flex flex-wrap gap-1.5">
                {prospect.suggestedSolutions.map(s => (
                  <span key={s} className="bg-[var(--a-info-bg)] text-[var(--a-blue)] text-xs px-2.5 py-1 rounded-full font-dm">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="px-6 py-4 border-b border-[var(--a-border)]">
            <p className="font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em] mb-2 flex items-center gap-1.5">
              <StickyNote size={12} /> Notes <span className="text-[var(--a-ink-3)] font-normal normal-case">(auto-saves)</span>
            </p>
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              rows={4}
              placeholder="Add internal notes about this prospect…"
              className="w-full text-sm font-dm text-[var(--a-ink)] bg-[var(--a-surface-2)] border border-[var(--a-border)] rounded-[var(--a-radius-control)] px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)] placeholder-[#7A8FA6]"
            />
          </div>

          {/* Activity Log */}
          <div className="px-6 py-4">
            <p className="font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em] mb-3">Activity Log</p>

            {/* Add note */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitNote()}
                placeholder="Log a call, email, or note…"
                className="flex-1 text-sm font-dm bg-white border border-[var(--a-border)] rounded-[var(--a-radius-control)] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)] placeholder-[#7A8FA6]"
              />
              <button
                onClick={submitNote}
                disabled={addingNote || !newNote.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#2251A3] text-white text-sm font-dm font-medium rounded-[var(--a-radius-control)] hover:bg-[var(--a-navy)] disabled:opacity-40 transition-colors"
              >
                {addingNote ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
                Log
              </button>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              {/* Created entry */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--a-info-bg)] flex items-center justify-center mt-0.5">
                  <CheckCircle2 size={12} className="text-[var(--a-blue)]" />
                </div>
                <div>
                  <p className="text-xs font-dm font-medium text-[var(--a-ink)]">Prospect created</p>
                  <p className="text-xs font-dm text-[var(--a-ink-3)]">{new Date(prospect.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>
                </div>
              </div>
              {activity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                    a.type === "note" ? "bg-amber-100" : "bg-[var(--a-info-bg)]"
                  }`}>
                    {a.type === "note"
                      ? <StickyNote size={11} className="text-amber-600" />
                      : <ChevronRight size={12} className="text-[var(--a-blue)]" />
                    }
                  </div>
                  <div>
                    <p className="text-xs font-dm text-[var(--a-ink)]">{a.text}</p>
                    <p className="text-xs font-dm text-[var(--a-ink-3)]">{new Date(a.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <p className="text-xs font-dm text-[var(--a-ink-3)] italic">No activity logged yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[var(--a-border)] bg-[var(--a-surface-2)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {prospect.email && (
              <a href={`mailto:${prospect.email}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[var(--a-border)] text-[var(--a-ink)] text-sm font-dm rounded-[var(--a-radius-control)] hover:bg-[var(--a-info-bg)] hover:border-[#2251A3] hover:text-[var(--a-blue)] transition-colors">
                <Mail size={13} /> Email
              </a>
            )}
            <button
              onClick={() => { onUpdate(prospect.id, { archived: !prospect.archived }); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[var(--a-border)] text-[var(--a-ink-3)] text-sm font-dm rounded-[var(--a-radius-control)] hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300 transition-colors"
            >
              {prospect.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
              {prospect.archived ? "Restore" : "Archive"}
            </button>
          </div>
          <button
            onClick={() => { onDelete(prospect.id, prospect.name); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-2 text-red-500 text-sm font-dm rounded-[var(--a-radius-control)] hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
/**
 * Prospect pipeline. `initialProspects` is the *active* (non-archived) list, read
 * from Prisma by the server component in page.tsx — the same query the mount
 * fetch of /api/admin/prospects?archived=false used to make, so the board paints
 * with its cards already in place.
 *
 * The archive toggle still fetches, because the server render only covers the
 * default view. Everything else (status moves, notes, archive, delete) is an
 * optimistic local update followed by the existing PATCH/DELETE call.
 */
export default function ProspectsClient({
  initialProspects,
}: {
  initialProspects: Prospect[];
}) {
  const [view, setView]             = useState<"kanban" | "table">("kanban");
  const [search, setSearch]         = useState("");
  const [items, setItems]           = useState<Prospect[]>(initialProspects);
  const [loading, setLoading]       = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId]         = useState<string | null>(null);
  // Global search (Cmd/Ctrl+K) links here with ?q=; seed the filter from it.
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("q");
      if (q) {
        setSearch(q);
        setView("table");
      }
    } catch {}
  }, []);
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

  // The active list is already here from the server, so the first run of this
  // effect would only re-fetch what we have. Skip it and load on toggle only.
  const archiveToggled = useRef(false);
  useEffect(() => {
    if (!archiveToggled.current) { archiveToggled.current = true; return; }
    load();
  }, [load]);

  const filtered = items.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.business.toLowerCase().includes(search.toLowerCase()) ||
    p.industry.toLowerCase().includes(search.toLowerCase()) ||
    (p.email ?? "").toLowerCase().includes(search.toLowerCase())
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

      <PageHeader
        title="Prospects"
        subtitle={loading ? "Loading prospects" : `${filtered.length} ${showArchived ? "archived" : "active"} prospects · Pipeline ${fmt(filtered.reduce((s, p) => s + (p.estimatedValue ?? 0), 0))}`}
        className="mb-0"
        actions={
          <Button
            onClick={() => setShowArchived((v) => !v)}
            variant={showArchived ? "primary" : "secondary"}
            icon={Archive}
            aria-pressed={showArchived}
          >
            {showArchived ? "Viewing archived" : "View archived"}
          </Button>
        }
      />

      <Toolbar
        className="mb-0"
        end={
          <Segmented
            ariaLabel="Layout"
            value={view}
            onChange={(v) => setView(v as typeof view)}
            options={[
              { value: "kanban", label: <><LayoutGrid size={14} aria-hidden /> Board</> },
              { value: "table", label: <><List size={14} aria-hidden /> Table</> },
            ]}
          />
        }
      >
        <SearchInput label="Search prospects" placeholder="Search prospects" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Toolbar>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={18} className="animate-spin text-[var(--a-ink-3)]" />
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
                          <span className="font-syne font-bold text-sm text-[var(--a-ink)]">{col.label}</span>
                          <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: col.color + "20", color: col.color }}>
                            {cards.length}
                          </span>
                        </div>
                        {val > 0 && (
                          <p className="text-xs font-dm text-[var(--a-ink-3)] mt-1 flex items-center gap-1">
                            <DollarSign size={10} /> {fmt(val)} potential
                          </p>
                        )}
                      </div>
                      <div className="bg-[var(--a-surface-2)] rounded-b-xl p-2 space-y-2 min-h-[120px]">
                        {cards.length === 0 && (
                          <p className="text-center text-xs font-dm text-[var(--a-ink-3)] py-6">No prospects</p>
                        )}
                        {cards.map(p => {
                          const fu = followUpStatus(p.followUpDate);
                          return (
                            <div key={p.id}
                              onClick={() => setSelected(p)}
                              className="bg-white border border-[var(--a-border)] rounded-[var(--a-radius-control)] p-3 space-y-2 cursor-pointer hover:border-[#2251A3]/40 hover:shadow-sm transition-all group">
                              {fu && (
                                <div className={`flex items-center gap-1 text-xs font-dm px-2 py-0.5 rounded-full w-fit ${
                                  fu === "overdue" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
                                }`}>
                                  <Clock size={10} /> {fu === "overdue" ? "Follow-up overdue" : "Follow-up soon"}
                                </div>
                              )}
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  <p className="font-dm font-semibold text-sm text-[var(--a-ink)] leading-tight truncate group-hover:text-[var(--a-blue)]">{p.name}</p>
                                  <p className="font-dm text-xs text-[var(--a-ink-3)] truncate">{p.business}</p>
                                </div>
                                <span className="text-xs font-dm text-[var(--a-ink-3)] whitespace-nowrap flex-shrink-0">
                                  {daysAgo(p.createdAt)}d
                                </span>
                              </div>
                              <p className="text-xs font-dm text-[var(--a-ink-3)]">{p.industry} · {p.budget}</p>
                              {p.estimatedValue && (
                                <p className="text-xs font-dm font-semibold text-[#0F6E56] flex items-center gap-1">
                                  <DollarSign size={10} /> {p.estimatedValue.toLocaleString()} deal
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {p.suggestedSolutions.slice(0, 2).map(s => (
                                  <span key={s} className="bg-[var(--a-info-bg)] text-[var(--a-blue)] text-xs px-1.5 py-0.5 rounded-full font-dm">{s}</span>
                                ))}
                              </div>
                              <div className="flex items-center justify-between gap-2 pt-1" onClick={e => e.stopPropagation()}>
                                {!showArchived && p.status !== "CLOSED_WON" && (
                                  <button onClick={() => moveToNext(p.id)}
                                    className="flex-1 text-xs font-dm font-medium text-[var(--a-blue)] border border-[var(--a-border)] rounded-lg py-1.5 hover:bg-[var(--a-info-bg)] transition-colors">
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
            <DataTable
              caption="Prospects"
              rows={filtered}
              rowKey={(p) => p.id}
              onRowClick={(p) => setSelected(p)}
              empty={<EmptyState title={showArchived ? "No archived prospects" : "No prospects found"} body="Prospects come from the website advisor and your own entries." />}
              columns={[
                {
                  key: "name",
                  header: "Name",
                  primary: true,
                  render: (p) => (
                    <div className="min-w-0">
                      <p className="font-dm text-sm font-semibold text-[var(--a-ink)]">{p.name}</p>
                      {p.email && <p className="break-all font-dm text-xs font-normal text-[var(--a-ink-3)]">{p.email}</p>}
                      {p.notes && <p className="mt-0.5 line-clamp-1 font-dm text-xs font-normal italic text-[var(--a-ink-3)]"><FileText size={10} className="mr-1 inline" aria-hidden />{p.notes}</p>}
                    </div>
                  ),
                },
                { key: "business", header: "Business", render: (p) => <span className="text-[var(--a-ink)]">{p.business}</span> },
                { key: "industry", header: "Industry", render: (p) => p.industry },
                { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
                {
                  key: "value",
                  header: "Deal value",
                  align: "right",
                  render: (p) => (p.estimatedValue ? <span className="font-semibold text-[var(--a-success)] tabular-nums">${p.estimatedValue.toLocaleString()}</span> : <span className="text-[var(--a-ink-3)]">None</span>),
                },
                {
                  key: "followup",
                  header: "Follow-up",
                  render: (p) => {
                    const fu = followUpStatus(p.followUpDate);
                    return p.followUpDate ? (
                      <span className={`flex items-center gap-1 font-dm text-xs ${fu === "overdue" ? "text-[var(--a-danger)]" : fu === "soon" ? "text-[var(--a-warn)]" : "text-[var(--a-ink-3)]"}`}>
                        <Clock size={11} aria-hidden />
                        {new Date(p.followUpDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--a-ink-3)]">None</span>
                    );
                  },
                },
                { key: "added", header: "Added", render: (p) => <span className="text-xs text-[var(--a-ink-3)] tabular-nums">{daysAgo(p.createdAt)}d ago</span> },
              ]}
            />
          )}
        </>
      )}
    </div>
  );
}
