"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Star, ChevronRight, AlertCircle } from "lucide-react";

interface ProjectTask { id: string; text: string; done: boolean; }
interface Project {
  id: string; name: string; description?: string;
  category: string; status: string; priority: string;
  progress: number; color: string;
  revenueEarned: number; revenuePotential: number; monthlyRecurring: number;
  deadline?: string; starred: boolean; archived: boolean;
  tasks: ProjectTask[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

const CAT_COLORS: Record<string, string> = {
  SAAS: "#2251A3", CLIENT: "#F47C20", EDUCATION: "#7c3aed", INTERNAL: "#0F6E56",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#2251A3", PAUSED: "#F47C20", CONCEPT: "#7A9BBF", COMPLETED: "#0F6E56", ARCHIVED: "#4A6A8A",
};

function DaysChip({ deadline }: { deadline?: string }) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  const color = days < 0 ? "text-red-400" : days <= 7 ? "text-red-400" : days <= 14 ? "text-[#F47C20]" : "text-[#2251A3]";
  const label = days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`;
  return <span className={`text-xs font-dm font-medium ${color}`}>{label}</span>;
}

function CategoryBadge({ cat }: { cat: string }) {
  return (
    <span className="text-xs font-dm px-2 py-0.5 rounded-full" style={{ backgroundColor: (CAT_COLORS[cat] ?? "#2251A3") + "30", color: CAT_COLORS[cat] ?? "#2251A3" }}>
      {cat}
    </span>
  );
}

export default function CommandCenterPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/projects")
      .then((r) => r.json())
      .then((data) => { setProjects(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const active = projects.filter((p) => !p.archived);
  const earned = active.reduce((s, p) => s + p.revenueEarned, 0);
  const pipeline = active.reduce((s, p) => s + p.revenuePotential, 0);
  const mrr = active.reduce((s, p) => s + p.monthlyRecurring, 0);
  const goal = 1_000_000;
  const pct = Math.min((earned / goal) * 100, 100);

  const starred = active.filter((p) => p.starred);
  const byCategory = ["SAAS", "CLIENT", "EDUCATION", "INTERNAL"].map((cat) => {
    const ps = active.filter((p) => p.category === cat);
    return { cat, count: ps.length, earned: ps.reduce((s, p) => s + p.revenueEarned, 0), pipeline: ps.reduce((s, p) => s + p.revenuePotential, 0), projects: ps };
  });

  const barData = byCategory.map((c) => ({ name: c.cat, Earned: c.earned, Pipeline: c.pipeline }));
  const statusCounts = ["ACTIVE","PAUSED","CONCEPT","COMPLETED"].map((s) => ({
    name: s, value: active.filter((p) => p.status === s).length,
  }));

  const upcoming = active
    .filter((p) => p.deadline)
    .map((p) => ({ ...p, daysLeft: Math.ceil((new Date(p.deadline!).getTime() - Date.now()) / 86400000) }))
    .filter((p) => p.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (loading) {
    return (
      <div className="bg-[#0F2240] min-h-screen p-6 flex items-center justify-center">
        <div className="text-[#7A9BBF] font-dm text-sm animate-pulse">Loading Command Center…</div>
      </div>
    );
  }

  return (
    <div className="bg-[#0F2240] min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-extrabold text-2xl text-[#E8EFF8]">Command Center</h1>
          <p className="text-[#7A9BBF] text-sm font-dm mt-0.5">TIBLOGICS Portfolio</p>
        </div>
        <div className="flex items-center gap-2">
          {(["kanban","timeline","list","sync"] as const).map((v) => (
            <Link key={v} href={`/admin_pro/command-center/${v}`}
              className="px-3 py-1.5 rounded-lg text-xs font-dm text-[#7A9BBF] border border-[#1E3A60] hover:bg-[#162D4F] hover:text-[#E8EFF8] transition-colors capitalize">
              {v}
            </Link>
          ))}
          <Link href="/admin_pro/command-center/kanban"
            className="px-4 py-2 bg-[#F47C20] hover:bg-[#E05F00] text-white rounded-lg text-sm font-dm font-semibold transition-colors ml-2">
            + New Project
          </Link>
        </div>
      </div>

      {/* $1M Goal Tracker */}
      <div className="bg-[#162D4F] border border-[#1E3A60] rounded-2xl p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[#7A9BBF] text-xs font-dm uppercase tracking-wider">Annual Revenue Goal</p>
            <h2 className="font-syne font-extrabold text-3xl text-[#E8EFF8] mt-0.5">
              {fmt(earned)} <span className="text-[#7A9BBF] text-lg font-normal">/ {fmt(goal)}</span>
            </h2>
          </div>
          <div className="text-right">
            <p className="font-syne font-bold text-[#F47C20] text-2xl">{pct.toFixed(1)}%</p>
            <p className="text-[#7A9BBF] text-xs font-dm">Pipeline: {fmt(pipeline)}</p>
          </div>
        </div>
        <div className="h-5 bg-[#1E3A60] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, #F47C20, #E05F00)" }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[#7A9BBF] text-xs font-dm">$0</span>
          <span className="text-[#7A9BBF] text-xs font-dm">$1,000,000</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Active Projects", value: active.filter(p => p.status === "ACTIVE").length },
          { label: "Revenue Earned", value: fmt(earned) },
          { label: "Pipeline Value", value: fmt(pipeline) },
          { label: "MRR", value: fmt(mrr) },
          { label: "Total Projects", value: active.length },
        ].map((m) => (
          <div key={m.label} className="bg-[#162D4F] border border-[#1E3A60] rounded-2xl p-4">
            <p className="text-[#7A9BBF] text-xs font-dm mb-1">{m.label}</p>
            <p className="font-syne font-extrabold text-xl text-[#E8EFF8]">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Starred Projects */}
      {starred.length > 0 && (
        <div>
          <h3 className="font-syne font-bold text-[#E8EFF8] text-base mb-3 flex items-center gap-2">
            <Star size={16} className="text-[#F47C20]" fill="#F47C20" /> Starred Projects
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {starred.map((p) => (
              <div key={p.id} className="bg-[#162D4F] border border-[#1E3A60] rounded-xl p-4 min-w-[220px] relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: p.color }} />
                <div className="pl-2">
                  <CategoryBadge cat={p.category} />
                  <p className="font-syne font-bold text-sm text-[#E8EFF8] mt-1.5 leading-tight">{p.name}</p>
                  <div className="h-1 bg-[#1E3A60] rounded-full mt-2 overflow-hidden">
                    <div className="h-full rounded-full bg-[#F47C20]" style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[#7A9BBF] text-xs font-dm">{p.progress}%</span>
                    <DaysChip deadline={p.deadline} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By Category */}
      <div>
        <h3 className="font-syne font-bold text-[#E8EFF8] text-base mb-3">By Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {byCategory.map(({ cat, count, earned: ce, pipeline: cp, projects: ps }) => (
            <div key={cat} className="bg-[#162D4F] border border-[#1E3A60] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <CategoryBadge cat={cat} />
                <span className="text-[#7A9BBF] text-xs font-dm">{count} projects</span>
              </div>
              <p className="text-[#7A9BBF] text-xs font-dm">Pipeline: {fmt(cp)}</p>
              <div className="mt-3 space-y-1.5">
                {ps.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-[#E8EFF8] text-xs font-dm truncate flex-1">{p.name}</span>
                    <span className="text-[#7A9BBF] text-xs">{p.progress}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#162D4F] border border-[#1E3A60] rounded-2xl p-5">
          <h3 className="font-syne font-bold text-[#E8EFF8] text-sm mb-4">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: "#7A9BBF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#7A9BBF", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [fmt(v), ""]} contentStyle={{ backgroundColor: "#162D4F", border: "1px solid #1E3A60", borderRadius: "8px", color: "#E8EFF8" }} />
              <Bar dataKey="Earned" fill="#2251A3" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pipeline" fill="#F47C2066" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#162D4F] border border-[#1E3A60] rounded-2xl p-5">
          <h3 className="font-syne font-bold text-[#E8EFF8] text-sm mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusCounts} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name} ${value}`}
                labelLine={false} fontSize={10}>
                {statusCounts.map((s) => (
                  <Cell key={s.name} fill={STATUS_COLORS[s.name] ?? "#7A9BBF"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#162D4F", border: "1px solid #1E3A60", borderRadius: "8px", color: "#E8EFF8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {upcoming.length > 0 && (
        <div className="bg-[#162D4F] border border-[#1E3A60] rounded-2xl p-5">
          <h3 className="font-syne font-bold text-[#E8EFF8] text-sm mb-4 flex items-center gap-2">
            <AlertCircle size={15} className="text-[#F47C20]" /> Upcoming Deadlines (30 days)
          </h3>
          <div className="space-y-2">
            {upcoming.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-[#1E3A60] last:border-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="font-dm text-sm text-[#E8EFF8] flex-1">{p.name}</span>
                <CategoryBadge cat={p.category} />
                <DaysChip deadline={p.deadline} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
