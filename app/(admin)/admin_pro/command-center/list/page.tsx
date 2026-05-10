"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, Star, MoreHorizontal } from "lucide-react";

interface ProjectTask { id: string; text: string; done: boolean; }
interface Project {
  id: string; name: string; description?: string;
  category: string; status: string; priority: string;
  progress: number; color: string;
  revenueEarned: number; revenuePotential: number; monthlyRecurring: number;
  deadline?: string; starred: boolean; archived: boolean;
  tasks: ProjectTask[];
}

const CAT_COLORS: Record<string, string> = { SAAS: "#2251A3", CLIENT: "#F47C20", EDUCATION: "#7c3aed", INTERNAL: "#0F6E56" };
const STATUS_COLORS: Record<string, string> = { ACTIVE: "bg-[#EBF0FA] text-[#2251A3]", PAUSED: "bg-[#FEF0E3] text-[#F47C20]", CONCEPT: "bg-[#162D4F] text-[#7A9BBF]", COMPLETED: "bg-green-900/40 text-green-400", ARCHIVED: "bg-[#162D4F] text-[#4A6A8A]" };
const PRIORITY_COLORS: Record<string, string> = { CRITICAL: "text-red-400", HIGH: "text-[#F47C20]", MEDIUM: "text-[#2251A3]", LOW: "text-[#7A9BBF]" };

type SortKey = "name" | "deadline" | "progress" | "revenueEarned" | "revenuePotential" | "priority";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

function DaysChip({ deadline }: { deadline?: string }) {
  if (!deadline) return <span className="text-[#4A6A8A] text-xs font-dm">—</span>;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  const color = days < 0 ? "text-red-400" : days <= 7 ? "text-red-400" : days <= 14 ? "text-[#F47C20]" : "text-[#7A9BBF]";
  return <span className={`text-xs font-dm ${color}`}>{days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`}</span>;
}

export default function ListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("deadline");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/projects")
      .then((r) => r.json())
      .then((d) => { setProjects(Array.isArray(d) ? d.filter((p: Project) => !p.archived) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function toggleStar(id: string, starred: boolean) {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, starred: !starred } : p));
    await fetch(`/api/admin/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ starred: !starred }) });
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const PRIORITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

  const sorted = [...projects]
    .filter((p) => categoryFilter === "ALL" || p.category === categoryFilter)
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "deadline") cmp = (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity);
      else if (sortKey === "progress") cmp = a.progress - b.progress;
      else if (sortKey === "revenueEarned") cmp = a.revenueEarned - b.revenueEarned;
      else if (sortKey === "revenuePotential") cmp = a.revenuePotential - b.revenuePotential;
      else if (sortKey === "priority") cmp = (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
      return sortDir === "asc" ? cmp : -cmp;
    });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={12} className="text-[#4A6A8A]" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-[#F47C20]" /> : <ChevronDown size={12} className="text-[#F47C20]" />;
  }

  function Th({ col, label }: { col: SortKey; label: string }) {
    return (
      <th onClick={() => handleSort(col)} className="px-4 py-3 text-left text-xs font-dm text-[#7A9BBF] cursor-pointer hover:text-[#E8EFF8] whitespace-nowrap select-none">
        <div className="flex items-center gap-1">{label} <SortIcon col={col} /></div>
      </th>
    );
  }

  if (loading) return <div className="bg-[#0F2240] min-h-screen p-6 flex items-center justify-center"><p className="text-[#7A9BBF] font-dm text-sm animate-pulse">Loading…</p></div>;

  return (
    <div className="bg-[#0F2240] min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-syne font-extrabold text-xl text-[#E8EFF8]">All Projects</h1>
        <a href="/admin_pro/command-center" className="text-[#7A9BBF] text-sm font-dm hover:text-[#E8EFF8]">← Overview</a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="flex gap-2">
          {["ALL","SAAS","CLIENT","EDUCATION","INTERNAL"].map((c) => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-dm font-medium transition-colors ${
                categoryFilter === c ? "bg-[#F47C20] text-white" : "bg-[#162D4F] text-[#7A9BBF] border border-[#1E3A60] hover:text-[#E8EFF8]"
              }`}>
              {c}
            </button>
          ))}
        </div>
        <input
          className="bg-[#162D4F] border border-[#1E3A60] rounded-lg px-3 py-1.5 text-xs text-[#E8EFF8] placeholder:text-[#4A6A8A] outline-none focus:border-[#2251A3] font-dm ml-auto"
          placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-[#7A9BBF] text-xs font-dm">{sorted.length} projects</span>
      </div>

      <div className="bg-[#162D4F] border border-[#1E3A60] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#1E3A60]">
              <tr>
                <th className="px-3 py-3 w-8" />
                <Th col="name" label="Project" />
                <th className="px-4 py-3 text-left text-xs font-dm text-[#7A9BBF]">Category</th>
                <th className="px-4 py-3 text-left text-xs font-dm text-[#7A9BBF]">Status</th>
                <Th col="priority" label="Priority" />
                <Th col="progress" label="Progress" />
                <Th col="revenueEarned" label="Earned" />
                <Th col="revenuePotential" label="Pipeline" />
                <Th col="deadline" label="Deadline" />
                <th className="px-4 py-3 text-left text-xs font-dm text-[#7A9BBF]">Tasks</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const done = p.tasks.filter((t) => t.done).length;
                return (
                  <tr key={p.id} className="border-b border-[#1E3A60] last:border-0 hover:bg-[#1E3A60]/30 transition-colors">
                    <td className="px-3 py-3">
                      <button onClick={() => toggleStar(p.id, p.starred)}>
                        <Star size={13} fill={p.starred ? "#F47C20" : "none"} color={p.starred ? "#F47C20" : "#4A6A8A"} />
                      </button>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        <div>
                          <p className="font-syne font-bold text-sm text-[#E8EFF8] truncate">{p.name}</p>
                          {p.description && <p className="text-[#7A9BBF] text-xs font-dm truncate max-w-[160px]">{p.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-dm px-2 py-0.5 rounded-full" style={{ backgroundColor: (CAT_COLORS[p.category] ?? "#2251A3") + "30", color: CAT_COLORS[p.category] ?? "#2251A3" }}>{p.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-dm px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? ""}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-dm font-medium ${PRIORITY_COLORS[p.priority]}`}>{p.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <div className="h-1.5 bg-[#1E3A60] rounded-full flex-1 overflow-hidden">
                          <div className="h-full bg-[#F47C20] rounded-full" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-[#7A9BBF] text-xs font-dm w-8 text-right">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#E8EFF8] text-xs font-dm">{fmt(p.revenueEarned)}</td>
                    <td className="px-4 py-3 text-[#7A9BBF] text-xs font-dm">{fmt(p.revenuePotential)}</td>
                    <td className="px-4 py-3"><DaysChip deadline={p.deadline} /></td>
                    <td className="px-4 py-3 text-[#7A9BBF] text-xs font-dm">{done}/{p.tasks.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
