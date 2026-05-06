"use client";

import { useEffect, useState } from "react";
import { Star, Plus, X, Check, Trash2 } from "lucide-react";

interface ProjectTask { id: string; text: string; done: boolean; }
interface Project {
  id: string; name: string; description?: string; notes?: string;
  category: string; status: string; priority: string;
  progress: number; color: string;
  revenueEarned: number; revenuePotential: number; monthlyRecurring: number;
  deadline?: string; starred: boolean; archived: boolean;
  tasks: ProjectTask[];
}

const COLUMNS = [
  { key: "CONCEPT",   label: "Concept",   headerColor: "#7A9BBF" },
  { key: "ACTIVE",    label: "Active",    headerColor: "#2251A3" },
  { key: "PAUSED",    label: "Paused",    headerColor: "#F47C20" },
  { key: "COMPLETED", label: "Completed", headerColor: "#0F6E56" },
];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-500/20 text-red-400",
  HIGH:     "bg-[#FEF0E3] text-[#F47C20]",
  MEDIUM:   "bg-[#EBF0FA] text-[#2251A3]",
  LOW:      "bg-[#162D4F] text-[#7A9BBF]",
};

const CAT_COLORS: Record<string, string> = {
  SAAS: "#2251A3", CLIENT: "#F47C20", EDUCATION: "#7c3aed", INTERNAL: "#0F6E56",
};

const COLOR_OPTIONS = [
  "#2251A3","#F47C20","#0F6E56","#7c3aed",
  "#e11d48","#0891b2","#ca8a04","#374151",
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

function DaysChip({ deadline }: { deadline?: string }) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  const color = days < 0 ? "text-red-400" : days <= 7 ? "text-red-400" : days <= 14 ? "text-[#F47C20]" : "text-[#7A9BBF]";
  return <span className={`text-xs font-dm ${color}`}>{days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}</span>;
}

function DarkInput({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-[#7A9BBF] font-dm block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[#0F2240] border border-[#2A4A70] rounded-lg px-3 py-2 text-sm text-[#E8EFF8] font-dm placeholder-[#4A6A8A] focus:outline-none focus:border-[#2251A3]" />
    </div>
  );
}

function DarkSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs text-[#7A9BBF] font-dm block mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-[#0F2240] border border-[#2A4A70] rounded-lg px-3 py-2 text-sm text-[#E8EFF8] font-dm focus:outline-none focus:border-[#2251A3]">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const CAT_OPTS = [{value:"SAAS",label:"SaaS"},{value:"CLIENT",label:"Client"},{value:"EDUCATION",label:"Education"},{value:"INTERNAL",label:"Internal"}];
const STATUS_OPTS = [{value:"CONCEPT",label:"Concept"},{value:"ACTIVE",label:"Active"},{value:"PAUSED",label:"Paused"},{value:"COMPLETED",label:"Completed"}];
const PRIORITY_OPTS = [{value:"LOW",label:"Low"},{value:"MEDIUM",label:"Medium"},{value:"HIGH",label:"High"},{value:"CRITICAL",label:"Critical"}];

// ── New Project Modal ──────────────────────────────────────────────────────────
function NewProjectModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (p: Project) => void;
}) {
  const [form, setForm] = useState({
    name: "", description: "", category: "CLIENT", status: "CONCEPT",
    priority: "MEDIUM", color: "#2251A3", deadline: "",
    revenueEarned: 0, revenuePotential: 0, monthlyRecurring: 0,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set(key: string, val: string | number) { setForm(prev => ({ ...prev, [key]: val })); }

  async function submit() {
    if (!form.name.trim()) { setErr("Project name is required"); return; }
    setSaving(true); setErr(null);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description || undefined,
          category: form.category,
          status: form.status,
          priority: form.priority,
          color: form.color,
          deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
          revenueEarned: Number(form.revenueEarned),
          revenuePotential: Number(form.revenuePotential),
          monthlyRecurring: Number(form.monthlyRecurring),
        }),
      });
      if (!res.ok) { setErr("Failed to create project"); setSaving(false); return; }
      onCreate(await res.json());
    } catch { setErr("Network error"); setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#162D4F] border border-[#2A4A70] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A4A70] sticky top-0 bg-[#162D4F] z-10">
          <h2 className="font-syne font-bold text-[#E8EFF8] text-lg">New Project</h2>
          <button onClick={onClose} className="text-[#7A9BBF] hover:text-[#E8EFF8]"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <DarkInput label="Project Name *" value={form.name} onChange={v => set("name", v)} placeholder="e.g. TIBLOGICS SaaS" />
          <div>
            <label className="text-xs text-[#7A9BBF] font-dm block mb-1">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
              placeholder="Brief overview…"
              className="w-full bg-[#0F2240] border border-[#2A4A70] rounded-lg px-3 py-2 text-sm text-[#E8EFF8] font-dm placeholder-[#4A6A8A] focus:outline-none focus:border-[#2251A3] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DarkSelect label="Category" value={form.category} onChange={v => set("category", v)} options={CAT_OPTS} />
            <DarkSelect label="Status"   value={form.status}   onChange={v => set("status", v)}   options={STATUS_OPTS} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DarkSelect label="Priority" value={form.priority} onChange={v => set("priority", v)} options={PRIORITY_OPTS} />
            <DarkInput  label="Deadline" value={form.deadline} onChange={v => set("deadline", v)} type="date" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <DarkInput label="Earned ($)"    value={form.revenueEarned}    onChange={v => set("revenueEarned", v)}    type="number" />
            <DarkInput label="Potential ($)" value={form.revenuePotential} onChange={v => set("revenuePotential", v)} type="number" />
            <DarkInput label="MRR ($)"       value={form.monthlyRecurring} onChange={v => set("monthlyRecurring", v)} type="number" />
          </div>
          <div>
            <label className="text-xs text-[#7A9BBF] font-dm block mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button key={c} onClick={() => set("color", c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          {err && <p className="text-red-400 text-xs font-dm">{err}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-[#2A4A70] text-[#7A9BBF] rounded-xl text-sm font-dm hover:bg-[#1E3A60]">Cancel</button>
            <button onClick={submit} disabled={saving}
              className="flex-1 px-4 py-2.5 bg-[#F47C20] text-white rounded-xl text-sm font-dm font-semibold hover:bg-[#E06810] disabled:opacity-60">
              {saving ? "Creating…" : "Create Project"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Project Detail Modal ───────────────────────────────────────────────────────
function ProjectDetailModal({ project, onClose, onUpdate }: {
  project: Project;
  onClose: () => void;
  onUpdate: (p: Project) => void;
}) {
  const [form, setForm] = useState({
    name:             project.name,
    description:      project.description ?? "",
    notes:            project.notes ?? "",
    category:         project.category,
    status:           project.status,
    priority:         project.priority,
    color:            project.color,
    progress:         project.progress,
    deadline:         project.deadline ? project.deadline.slice(0, 10) : "",
    revenueEarned:    project.revenueEarned,
    revenuePotential: project.revenuePotential,
    monthlyRecurring: project.monthlyRecurring,
  });
  const [tasks, setTasks] = useState<ProjectTask[]>(project.tasks);
  const [newTask, setNewTask] = useState("");
  const [saving, setSaving] = useState(false);
  const [taskAdding, setTaskAdding] = useState(false);

  function setF(key: string, val: string | number) { setForm(prev => ({ ...prev, [key]: val })); }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:             form.name.trim(),
          description:      form.description || null,
          notes:            form.notes || null,
          category:         form.category,
          status:           form.status,
          priority:         form.priority,
          color:            form.color,
          progress:         Number(form.progress),
          deadline:         form.deadline ? new Date(form.deadline).toISOString() : null,
          revenueEarned:    Number(form.revenueEarned),
          revenuePotential: Number(form.revenuePotential),
          monthlyRecurring: Number(form.monthlyRecurring),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate({ ...updated, tasks });
      }
    } finally { setSaving(false); }
  }

  async function addTask() {
    if (!newTask.trim()) return;
    setTaskAdding(true);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTask.trim() }),
      });
      if (res.ok) { const task = await res.json(); setTasks(prev => [...prev, task]); setNewTask(""); }
    } finally { setTaskAdding(false); }
  }

  async function toggleTask(tid: string, done: boolean) {
    setTasks(prev => prev.map(t => t.id === tid ? { ...t, done: !done } : t));
    await fetch(`/api/admin/projects/${project.id}/tasks/${tid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !done }),
    });
  }

  async function deleteTask(tid: string) {
    setTasks(prev => prev.filter(t => t.id !== tid));
    await fetch(`/api/admin/projects/${project.id}/tasks/${tid}`, { method: "DELETE" });
  }

  const doneTasks = tasks.filter(t => t.done).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#162D4F] border border-[#2A4A70] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A4A70] sticky top-0 bg-[#162D4F] z-10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: form.color }} />
            <h2 className="font-syne font-bold text-[#E8EFF8] text-base truncate">{form.name || "Untitled"}</h2>
          </div>
          <button onClick={onClose} className="text-[#7A9BBF] hover:text-[#E8EFF8] flex-shrink-0"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Core fields */}
          <DarkInput label="Project Name" value={form.name} onChange={v => setF("name", v)} />
          <div>
            <label className="text-xs text-[#7A9BBF] font-dm block mb-1">Description</label>
            <textarea value={form.description} onChange={e => setF("description", e.target.value)} rows={2}
              className="w-full bg-[#0F2240] border border-[#2A4A70] rounded-lg px-3 py-2 text-sm text-[#E8EFF8] font-dm placeholder-[#4A6A8A] focus:outline-none focus:border-[#2251A3] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DarkSelect label="Category" value={form.category} onChange={v => setF("category", v)} options={CAT_OPTS} />
            <DarkSelect label="Status"   value={form.status}   onChange={v => setF("status", v)}   options={STATUS_OPTS} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DarkSelect label="Priority" value={form.priority} onChange={v => setF("priority", v)} options={PRIORITY_OPTS} />
            <DarkInput  label="Deadline" value={form.deadline} onChange={v => setF("deadline", v)} type="date" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <DarkInput label="Earned ($)"    value={form.revenueEarned}    onChange={v => setF("revenueEarned", v)}    type="number" />
            <DarkInput label="Potential ($)" value={form.revenuePotential} onChange={v => setF("revenuePotential", v)} type="number" />
            <DarkInput label="MRR ($)"       value={form.monthlyRecurring} onChange={v => setF("monthlyRecurring", v)} type="number" />
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs text-[#7A9BBF] font-dm block mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button key={c} onClick={() => setF("color", c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-[#7A9BBF] font-dm">Progress (%)</label>
              <span className="text-xs text-[#E8EFF8] font-dm">{form.progress}%</span>
            </div>
            <input type="range" min={0} max={100} value={form.progress}
              onChange={e => setF("progress", e.target.value)}
              className="w-full accent-[#F47C20]" />
            <div className="h-1.5 bg-[#1E3A60] rounded-full overflow-hidden mt-2">
              <div className="h-full rounded-full bg-[#F47C20] transition-all"
                style={{ width: `${Math.min(100, Math.max(0, Number(form.progress)))}%` }} />
            </div>
          </div>

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-syne font-bold text-[#E8EFF8]">
                Tasks <span className="text-[#7A9BBF] text-xs font-dm font-normal">({doneTasks}/{tasks.length} done)</span>
              </span>
            </div>
            <div className="space-y-1.5 mb-3 max-h-52 overflow-y-auto">
              {tasks.length === 0 && (
                <p className="text-xs text-[#4A6A8A] font-dm px-3 py-2">No tasks yet.</p>
              )}
              {tasks.map(t => (
                <div key={t.id} className="flex items-center gap-2 group bg-[#1E3A60]/50 rounded-lg px-3 py-2">
                  <button onClick={() => toggleTask(t.id, t.done)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      t.done ? "bg-[#0F6E56] border-[#0F6E56]" : "border-[#4A6A8A] hover:border-[#7A9BBF]"
                    }`}>
                    {t.done && <Check size={11} className="text-white" />}
                  </button>
                  <span className={`text-sm font-dm flex-1 ${t.done ? "line-through text-[#4A6A8A]" : "text-[#E8EFF8]"}`}>{t.text}</span>
                  <button onClick={() => deleteTask(t.id)}
                    className="opacity-0 group-hover:opacity-100 text-[#4A6A8A] hover:text-red-400 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newTask} onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !taskAdding && addTask()}
                placeholder="Add a task and press Enter…"
                className="flex-1 bg-[#0F2240] border border-[#2A4A70] rounded-lg px-3 py-2 text-sm text-[#E8EFF8] font-dm placeholder-[#4A6A8A] focus:outline-none focus:border-[#2251A3]" />
              <button onClick={addTask} disabled={taskAdding || !newTask.trim()}
                className="px-3 py-2 bg-[#2251A3] text-white rounded-lg hover:bg-[#1B3A6B] disabled:opacity-50 transition-colors">
                {taskAdding ? "…" : <Plus size={15} />}
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-[#7A9BBF] font-dm block mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setF("notes", e.target.value)} rows={3}
              placeholder="Internal notes, links, reminders…"
              className="w-full bg-[#0F2240] border border-[#2A4A70] rounded-lg px-3 py-2 text-sm text-[#E8EFF8] font-dm placeholder-[#4A6A8A] focus:outline-none focus:border-[#2251A3] resize-none" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-[#2A4A70] text-[#7A9BBF] rounded-xl text-sm font-dm hover:bg-[#1E3A60] transition-colors">
              Close
            </button>
            <button onClick={save} disabled={saving}
              className="flex-1 px-4 py-2.5 bg-[#F47C20] text-white rounded-xl text-sm font-dm font-semibold hover:bg-[#E06810] disabled:opacity-60 transition-colors">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Kanban Page ───────────────────────────────────────────────────────────
export default function KanbanPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  useEffect(() => {
    fetch("/api/admin/projects")
      .then(r => r.json())
      .then(d => { setProjects(Array.isArray(d) ? d.filter((p: Project) => !p.archived) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function moveProject(id: string, newStatus: string) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    await fetch(`/api/admin/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  async function toggleStar(id: string, starred: boolean) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, starred: !starred } : p));
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
    setDraggingId(null); setDragOverCol(null);
  }

  function handleProjectCreated(p: Project) {
    setProjects(prev => [p, ...prev]);
    setShowNewModal(false);
  }

  function handleProjectUpdated(updated: Project) {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    setDetailProject(updated);
  }

  if (loading) return (
    <div className="bg-[#0F2240] min-h-screen p-6 flex items-center justify-center">
      <p className="text-[#7A9BBF] font-dm text-sm animate-pulse">Loading…</p>
    </div>
  );

  return (
    <div className="bg-[#0F2240] min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-syne font-extrabold text-xl text-[#E8EFF8]">Kanban Board</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#F47C20] text-white rounded-xl text-sm font-dm font-semibold hover:bg-[#E06810] transition-colors">
            <Plus size={15} /> New Project
          </button>
          <a href="/admin/command-center" className="text-[#7A9BBF] text-sm font-dm hover:text-[#E8EFF8]">← Overview</a>
        </div>
      </div>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colProjects = projects.filter(p => p.status === col.key);
          const colEarned = colProjects.reduce((s, p) => s + p.revenueEarned, 0);
          const isDragOver = dragOverCol === col.key;

          return (
            <div key={col.key}
              className={`flex-shrink-0 w-72 flex flex-col rounded-xl transition-colors ${isDragOver ? "bg-[#1E3A60]/60" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOverCol(col.key); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={e => handleDrop(e, col.key)}
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
                {colProjects.map(p => {
                  const doneTasks = p.tasks.filter(t => t.done).length;
                  return (
                    <div key={p.id}
                      draggable
                      onDragStart={e => { e.stopPropagation(); handleDragStart(e, p.id); }}
                      onClick={() => setDetailProject(p)}
                      className={`bg-[#162D4F] border border-[#1E3A60] rounded-xl p-4 cursor-pointer relative overflow-hidden transition-all hover:border-[#2A4A70] hover:bg-[#1A3358] ${draggingId === p.id ? "opacity-50" : "opacity-100"}`}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: p.color }} />
                      <div className="pl-2">
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="text-xs font-dm px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: (CAT_COLORS[p.category] ?? "#2251A3") + "30", color: CAT_COLORS[p.category] ?? "#2251A3" }}>
                            {p.category}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${PRIORITY_COLORS[p.priority]}`}>{p.priority}</span>
                            <button onClick={e => { e.stopPropagation(); toggleStar(p.id, p.starred); }}
                              className="text-[#7A9BBF] hover:text-[#F47C20] transition-colors">
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

      {showNewModal && <NewProjectModal onClose={() => setShowNewModal(false)} onCreate={handleProjectCreated} />}
      {detailProject && <ProjectDetailModal project={detailProject} onClose={() => setDetailProject(null)} onUpdate={handleProjectUpdated} />}
    </div>
  );
}
