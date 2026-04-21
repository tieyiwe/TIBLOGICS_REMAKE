"use client";
import { useState, useEffect, useCallback } from "react";
import { LayoutGrid, List, Search, Archive, Trash2, ArchiveRestore, RefreshCw } from "lucide-react";

type ProspectStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL_SENT" | "NEGOTIATING" | "CLOSED_WON" | "CLOSED_LOST" | "ON_HOLD";

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
  email?: string | null;
  notes?: string | null;
  archived: boolean;
}

const COLUMNS: { status: ProspectStatus; label: string; color: string }[] = [
  { status: "NEW",           label: "New",           color: "#F47C20" },
  { status: "CONTACTED",     label: "Contacted",     color: "#2251A3" },
  { status: "QUALIFIED",     label: "Qualified",     color: "#0F6E56" },
  { status: "PROPOSAL_SENT", label: "Proposal Sent", color: "#7c3aed" },
  { status: "CLOSED_WON",    label: "Closed Won",    color: "#16a34a" },
];

const STATUS_ORDER: ProspectStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "CLOSED_WON"];

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

export default function ProspectsPage() {
  const [view, setView]             = useState<"kanban" | "table">("kanban");
  const [search, setSearch]         = useState("");
  const [items, setItems]           = useState<Prospect[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId]         = useState<string | null>(null);

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

  async function patch(id: string, data: Partial<Prospect>) {
    setBusyId(id);
    setItems(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    await fetch(`/api/admin/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusyId(null);
    // Remove from current list if archived state changed
    if ("archived" in data) {
      setItems(prev => prev.filter(p => p.id !== id));
    }
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

  const actionButtons = (p: Prospect) => (
    <div className="flex items-center gap-1">
      <button
        disabled={busyId === p.id}
        onClick={() => patch(p.id, { archived: !p.archived })}
        title={p.archived ? "Restore" : "Archive"}
        className="p-1.5 rounded-lg transition-colors text-[#7A8FA6] hover:text-amber-600 hover:bg-amber-50 disabled:opacity-40"
      >
        {p.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
      </button>
      <button
        disabled={busyId === p.id}
        onClick={() => deleteProspect(p.id, p.name)}
        title="Delete permanently"
        className="p-1.5 rounded-lg transition-colors text-[#7A8FA6] hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
      >
        {busyId === p.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Prospects</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">
            {loading ? "Loading…" : `${filtered.length} ${showArchived ? "archived" : "active"} prospects`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-dm transition-colors ${
              showArchived
                ? "bg-amber-100 border-amber-300 text-amber-700"
                : "bg-white border-[#D2DCE8] text-[#7A8FA6] hover:bg-[#F4F7FB]"
            }`}
          >
            <Archive size={14} /> {showArchived ? "Viewing Archived" : "View Archived"}
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors ${
              view === "kanban" ? "bg-[#1B3A6B] border-[#1B3A6B] text-white" : "bg-white border-[#D2DCE8] text-[#7A8FA6] hover:bg-[#F4F7FB]"
            }`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView("table")}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors ${
              view === "table" ? "bg-[#1B3A6B] border-[#1B3A6B] text-white" : "bg-white border-[#D2DCE8] text-[#7A8FA6] hover:bg-[#F4F7FB]"
            }`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
        <input
          type="text"
          placeholder="Search prospects…"
          value={search}
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
                      </div>
                      <div className="bg-[#F4F7FB] rounded-b-xl p-2 space-y-2 min-h-[120px]">
                        {cards.length === 0 && (
                          <p className="text-center text-xs font-dm text-[#7A8FA6] py-6">No prospects</p>
                        )}
                        {cards.map(p => (
                          <div key={p.id} className="bg-white border border-[#D2DCE8] rounded-xl p-3 space-y-2">
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0">
                                <p className="font-dm font-semibold text-sm text-[#0D1B2A] leading-tight truncate">{p.name}</p>
                                <p className="font-dm text-xs text-[#7A8FA6] truncate">{p.business}</p>
                              </div>
                              <span className="text-xs font-dm text-[#7A8FA6] whitespace-nowrap flex-shrink-0">
                                {daysAgo(p.createdAt)}d ago
                              </span>
                            </div>
                            <p className="text-xs font-dm text-[#7A8FA6]">{p.industry} · {p.budget}</p>
                            <div className="flex flex-wrap gap-1">
                              {p.suggestedSolutions.slice(0, 2).map(s => (
                                <span key={s} className="bg-[#EBF0FA] text-[#2251A3] text-xs px-1.5 py-0.5 rounded-full font-dm">{s}</span>
                              ))}
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-1">
                              {!showArchived && p.status !== "CLOSED_WON" && (
                                <button onClick={() => moveToNext(p.id)}
                                  className="flex-1 text-xs font-dm font-medium text-[#2251A3] border border-[#D2DCE8] rounded-lg py-1.5 hover:bg-[#EBF0FA] transition-colors">
                                  Move → {COLUMNS[STATUS_ORDER.indexOf(p.status) + 1]?.label}
                                </button>
                              )}
                              {actionButtons(p)}
                            </div>
                          </div>
                        ))}
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
                      <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Source</th>
                      <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Budget</th>
                      <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Status</th>
                      <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Added</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F7FB]">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 font-dm text-sm text-[#7A8FA6]">
                          No prospects found.
                        </td>
                      </tr>
                    ) : (
                      filtered.map(p => (
                        <tr key={p.id} className="hover:bg-[#F4F7FB]/60 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-dm text-sm font-medium text-[#0D1B2A]">{p.name}</p>
                            {p.email && <p className="font-dm text-xs text-[#7A8FA6]">{p.email}</p>}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.suggestedSolutions.slice(0, 2).map(s => (
                                <span key={s} className="bg-[#EBF0FA] text-[#2251A3] text-xs px-1.5 py-0.5 rounded-full font-dm">{s}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-dm text-sm text-[#0D1B2A]">{p.business}</td>
                          <td className="px-5 py-4 font-dm text-sm text-[#7A8FA6]">{p.industry}</td>
                          <td className="px-5 py-4 font-dm text-sm text-[#7A8FA6]">{p.source.replace(/_/g, " ")}</td>
                          <td className="px-5 py-4 font-dm text-sm font-semibold text-[#0D1B2A]">{p.budget}</td>
                          <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                          <td className="px-5 py-4 font-dm text-xs text-[#7A8FA6]">{daysAgo(p.createdAt)}d ago</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {!showArchived && p.status !== "CLOSED_WON" && (
                                <button onClick={() => moveToNext(p.id)}
                                  className="text-xs font-dm text-[#2251A3] hover:underline whitespace-nowrap">
                                  Move →
                                </button>
                              )}
                              {actionButtons(p)}
                            </div>
                          </td>
                        </tr>
                      ))
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
