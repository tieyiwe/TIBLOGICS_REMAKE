"use client";

import { useEffect, useState, useRef } from "react";

interface Project {
  id: string; name: string; description?: string;
  category: string; status: string; priority: string;
  progress: number; color: string;
  revenueEarned: number; revenuePotential: number;
  deadline?: string; startDate?: string; createdAt: string;
  starred: boolean; archived: boolean;
}

const CAT_COLORS: Record<string, string> = {
  SAAS: "#2251A3", CLIENT: "#F47C20", EDUCATION: "#7c3aed", INTERNAL: "#0F6E56",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function TimelinePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/projects")
      .then((r) => r.json())
      .then((d) => { setProjects(Array.isArray(d) ? d.filter((p: Project) => !p.archived) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Generate 12 months from current month
  const now = new Date();
  const months: { year: number; month: number; label: string }[] = [];
  for (let i = -1; i < 11; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}` });
  }
  const totalMonths = months.length;
  const colWidth = 100; // px per month

  function getBarStyle(p: Project): { left: string; width: string } | null {
    const start = p.startDate ? new Date(p.startDate) : new Date(p.createdAt);
    const end = p.deadline ? new Date(p.deadline) : null;
    if (!end) return null;

    const timelineStart = new Date(months[0].year, months[0].month, 1).getTime();
    const timelineEnd = new Date(months[totalMonths - 1].year, months[totalMonths - 1].month + 1, 0).getTime();
    const totalDuration = timelineEnd - timelineStart;

    const startClamped = Math.max(start.getTime(), timelineStart);
    const endClamped = Math.min(end.getTime(), timelineEnd);
    if (startClamped > timelineEnd || endClamped < timelineStart) return null;

    const left = ((startClamped - timelineStart) / totalDuration) * (totalMonths * colWidth);
    const width = Math.max(((endClamped - startClamped) / totalDuration) * (totalMonths * colWidth), 40);

    return { left: `${left}px`, width: `${width}px` };
  }

  // Today line position
  const timelineStart = new Date(months[0].year, months[0].month, 1).getTime();
  const timelineEnd = new Date(months[totalMonths - 1].year, months[totalMonths - 1].month + 1, 0).getTime();
  const todayPct = (now.getTime() - timelineStart) / (timelineEnd - timelineStart);
  const todayLeft = todayPct * totalMonths * colWidth;

  const filtered = projects.filter((p) => filter === "ALL" || p.category === filter);
  const currentMonthIndex = months.findIndex((m) => m.year === now.getFullYear() && m.month === now.getMonth());

  if (loading) return <div className="bg-[#0F2240] min-h-screen p-6 flex items-center justify-center"><p className="text-[#7A9BBF] font-dm text-sm animate-pulse">Loading…</p></div>;

  return (
    <div className="bg-[#0F2240] min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-syne font-extrabold text-xl text-[#E8EFF8]">Timeline</h1>
        <a href="/admin_pro/command-center" className="text-[#7A9BBF] text-sm font-dm hover:text-[#E8EFF8]">← Overview</a>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["ALL","SAAS","CLIENT","EDUCATION","INTERNAL"].map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-dm font-medium transition-colors ${
              filter === c ? "bg-[#F47C20] text-white" : "bg-[#162D4F] text-[#7A9BBF] border border-[#1E3A60] hover:text-[#E8EFF8]"
            }`}>
            {c}
          </button>
        ))}
      </div>

      <div className="bg-[#162D4F] border border-[#1E3A60] rounded-2xl overflow-hidden">
        <div className="flex">
          {/* Left label column */}
          <div className="w-48 shrink-0 border-r border-[#1E3A60]">
            <div className="h-10 border-b border-[#1E3A60] px-3 flex items-center">
              <span className="text-[#7A9BBF] text-xs font-dm font-medium">Project</span>
            </div>
            {filtered.map((p) => (
              <div key={p.id} className="h-12 border-b border-[#1E3A60] last:border-0 px-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CAT_COLORS[p.category] ?? p.color }} />
                <span className="text-[#E8EFF8] text-xs font-dm truncate">{p.name}</span>
              </div>
            ))}
          </div>

          {/* Scrollable timeline */}
          <div className="flex-1 overflow-x-auto" ref={scrollRef}>
            <div style={{ width: `${totalMonths * colWidth}px` }} className="relative">
              {/* Month headers */}
              <div className="flex h-10 border-b border-[#1E3A60]">
                {months.map((m, i) => (
                  <div key={i}
                    className={`shrink-0 flex items-center justify-center border-r border-[#1E3A60] last:border-0 ${
                      m.year === now.getFullYear() && m.month === now.getMonth() ? "bg-[#1E3A60]/60" : ""
                    }`}
                    style={{ width: colWidth }}>
                    <span className="text-[#7A9BBF] text-xs font-dm">{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Today vertical line */}
              {todayLeft > 0 && todayLeft < totalMonths * colWidth && (
                <div className="absolute top-0 bottom-0 w-0.5 bg-[#F47C20] opacity-80 pointer-events-none z-10"
                  style={{ left: `${todayLeft}px` }}>
                  <div className="absolute -top-0 -left-5 text-[#F47C20] text-xs font-dm bg-[#162D4F] px-1 rounded">today</div>
                </div>
              )}

              {/* Project rows */}
              {filtered.map((p) => {
                const bar = getBarStyle(p);
                return (
                  <div key={p.id} className="relative h-12 border-b border-[#1E3A60] last:border-0" style={{ width: `${totalMonths * colWidth}px` }}>
                    {/* Column backgrounds */}
                    {months.map((m, i) => (
                      <div key={i} className={`absolute top-0 bottom-0 border-r border-[#1E3A60]/40 ${
                        m.year === now.getFullYear() && m.month === now.getMonth() ? "bg-[#1E3A60]/20" : ""
                      }`} style={{ left: i * colWidth, width: colWidth }} />
                    ))}
                    {/* Bar */}
                    {bar && (
                      <div className="absolute top-3 bottom-3 rounded-md flex items-center px-2 overflow-hidden group cursor-pointer"
                        style={{ left: bar.left, width: bar.width, backgroundColor: p.color + "CC" }}>
                        <span className="text-white text-xs font-dm truncate">{p.name} {p.progress}%</span>
                        {/* Hover tooltip */}
                        <div className="absolute hidden group-hover:block bottom-full left-0 mb-1 bg-[#0F2240] border border-[#1E3A60] rounded-lg p-2 z-20 whitespace-nowrap text-xs text-[#E8EFF8] font-dm shadow-xl">
                          {p.name} · {p.progress}% · {p.deadline ? new Date(p.deadline).toLocaleDateString() : "No deadline"}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
