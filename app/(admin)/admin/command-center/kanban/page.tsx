"use client";

import { useEffect, useState } from "react";
import { Star, MoreHorizontal, GripVertical } from "lucide-react";

interface ProjectTask { id: string; text: string; done: boolean; }
interface Project {
  id: string; name: string; description?: string;
  category: string; status: string; priority: string;
  progress: number; color: string;
  revenueEarned: number; revenuePotential: number; monthlyRecurring: number;
  deadline?: string; starred: boolean; archived: boolean;
  tasks: ProjectTask[];
}

const COLUMNS: { key: string; label: string; headerColor: string }[] = [
  { key: "CONCEPT", label: "Concept", headerColor: "#7A9BBF" },
  { key: "ACTIVE", label: "Active", headerColor: "#2251A3" },
  { key: "PAUSED", label: "Paused", headerColor: "#F47C20" },
  { key: "COMPLETED", label: "Completed", headerColor: "#0F6E56" },
];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-500/20 text-red-400",
  HIGH: "bg-[#FEF0E3] text-[#F47C20]",
  MEDIUM: "bg-[#EBF0FA] text-[#2251A3]",
  LOW: "bg-[#162D4F] text-[#7A9BBF]",
};

const CAT_COLORS: Record<string, string> = {
  SAAS: "#2251A3", CLIENT: "#F47C20", EDUCATION: "#7c3aed", INTERNAL: "#0F6E56",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

function DaysChip({ deadline }: { deadline?: string }) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  const color = days < 0 ? "text-red-400" : days <= 7 ? "text-red-400" : days <= 14 ? "text-[#F47C20]" : "text-[#7A9BBF]";
  return <span className={`text-xs font-dm ${color}`}>{days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}</span>;
}

export default function KanbanPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/projects")
      .then((r) => r.json())
      .then((d) => { setProjects(Array.isArray(d) ? d.filter((p: Project) => !p.archived) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function moveProject(id: string, newStatus: string) {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, status: newStatus } : p));
    await fetch(`/api/admin/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  async function toggleStar(id: string, starred: boolean) {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, starred: !starred } : p));
    await fetch(`/api/admin/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starred: !starred }),
    });
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(e: React.DragEvent, col: string) {
    e.preventDefault();
    if (draggingId) moveProject(draggingId, col);
    setDraggingId(null);
    setDragOverCol(null);
  }

  if (loading) return <div className="bg-[#0F2240] min-h-screen p-6 flex items-center justify-center"><p className="text-[#7A9BBF] font-dm text-sm animate-pulse">Loading…</p></div>;

  return (
    <div className="bg-[#0F2240] min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-syne font-extrabold text-xl text-[#E8EFF8]">Kanban Board</h1>
        <a href="/admin/command-center" className="text-[#7A9BBF] text-sm font-dm hover:text-[#E8EFF8]">← Overview</a>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colProjects = projects.filter((p) => p.status === col.key);
          const colEarned = colProjects.reduce((s, p) => s + p.revenueEarned, 0);
          const isDragOver = dragOverCol === col.key;

          return (
            <div
              key={col.key}
              className={`flex-shrink-0 w-72 flex flex-col rounded-xl transition-colors ${isDragOver ? "bg-[#1E3A60]/60" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.headerColor }} />
                  <span className="font-syne font-bold text-sm text-[#E8EFF8]">{col.label}</span>
                  <span className="bg-[#1E3A60] text-[#7A9BBF] text-xs px-1.5 py-0.5 rounded-full font-dm">{colProjects.length}</span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-3 flex-1 min-h-24">
                {colProjects.map((p) => {
                  const doneTasks = p.tasks.filter((t) => t.done).length;
                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, p.id)}
                      className={`bg-[#162D4F] border border-[#1E3A60] rounded-xl p-4 cursor-grab active:cursor-grabbing relative overflow-hidden transition-opacity ${draggingId === p.id ? "opacity-50" : "opacity-100"}`}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: p.color }} />
                      <div className="pl-2">
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="text-xs font-dm px-1.5 py-0.5 rounded-full" style={{ backgroundColor: (CAT_COLORS[p.category] ?? "#2251A3") + "30", color: CAT_COLORS[p.category] ?? "#2251A3" }}>
                            {p.category}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${PRIORITY_COLORS[p.priority]}`}>{p.priority}</span>
                            <button onClick={() => toggleStar(p.id, p.starred)} className="text-[#7A9BBF] hover:text-[#F47C20] transition-colors">
                              <Star size={13} fill={p.starred ? "#F47C20" : "none"} color={p.starred ? "#F47C20" : "currentColor"} />
                            </button>
                          </div>
                        </div>
                        <p className="font-syne font-bold text-sm text-[#E8EFF8] leading-tight mb-1">{p.name}</p>
                        {p.description && <p className="text-[#7A9BBF] text-xs font-dm line-clamp-2 mb-2">{p.description}</p>}
                        <div className="h-1 bg-[#1E3A60] rounded-full mb-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-[#F47C20]" style={{ width: `${p.progress}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#7A9BBF] font-dm">{fmt(p.revenueEarned)} / {fmt(p.revenuePotential)}</span>
                          <DaysChip deadline={p.deadline} />
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[#4A6A8A] text-xs font-dm">{doneTasks}/{p.tasks.length} tasks</span>
                          <span className="text-[#7A9BBF] text-xs font-dm">{p.progress}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Column footer */}
              <div className="px-3 py-2 mt-2 border-t border-[#1E3A60]">
                <span className="text-[#4A6A8A] text-xs font-dm">{fmt(colEarned)} earned</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
