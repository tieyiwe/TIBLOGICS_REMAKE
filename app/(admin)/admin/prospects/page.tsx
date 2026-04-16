"use client";
import { useState } from "react";
import { LayoutGrid, List, Search } from "lucide-react";

type ProspectStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL_SENT" | "CLOSED_WON";

interface Prospect {
  id: string;
  name: string;
  business: string;
  industry: string;
  source: string;
  budget: string;
  status: ProspectStatus;
  solutions: string[];
  daysAgo: number;
}

const INITIAL_PROSPECTS: Prospect[] = [
  { id: "1", name: "Marcus Johnson", business: "TechFlow Inc", industry: "SaaS", source: "Website Scanner", budget: "$5k–$10k", status: "NEW", solutions: ["AI Implementation", "Workflow Automation"], daysAgo: 1 },
  { id: "2", name: "Aisha Diallo", business: "DigiLearn Africa", industry: "EdTech", source: "Referral", budget: "$2k–$5k", status: "NEW", solutions: ["AI Strategy", "Web Dev"], daysAgo: 3 },
  { id: "3", name: "Robert Kim", business: "HealthBridge", industry: "Healthcare", source: "LinkedIn", budget: "$10k+", status: "CONTACTED", solutions: ["CareFlow AI", "AI Agents"], daysAgo: 5 },
  { id: "4", name: "Priya Nair", business: "NairTech", industry: "Fintech", source: "Website Scanner", budget: "$5k–$10k", status: "CONTACTED", solutions: ["AI Readiness Audit"], daysAgo: 7 },
  { id: "5", name: "Carlos Mendez", business: "FoodTech MX", industry: "Food & Beverage", source: "Direct", budget: "$2k–$5k", status: "QUALIFIED", solutions: ["AI Strategy Session", "Web Transformation"], daysAgo: 10 },
  { id: "6", name: "Fatou Balde", business: "EduBridge West", industry: "EdTech", source: "Referral", budget: "$5k–$10k", status: "PROPOSAL_SENT", solutions: ["AI Implementation"], daysAgo: 14 },
  { id: "7", name: "James Okafor", business: "HealthNow NG", industry: "Healthcare", source: "LinkedIn", budget: "$10k+", status: "PROPOSAL_SENT", solutions: ["CareFlow AI", "Workflow Automation"], daysAgo: 18 },
  { id: "8", name: "Mei-Lin Zhou", business: "RetailOS Asia", industry: "Retail", source: "Website Scanner", budget: "$10k+", status: "CLOSED_WON", solutions: ["AI Agents", "Web Dev", "AI Strategy"], daysAgo: 22 },
];

const COLUMNS: { status: ProspectStatus; label: string; color: string }[] = [
  { status: "NEW", label: "New", color: "#F47C20" },
  { status: "CONTACTED", label: "Contacted", color: "#2251A3" },
  { status: "QUALIFIED", label: "Qualified", color: "#0F6E56" },
  { status: "PROPOSAL_SENT", label: "Proposal Sent", color: "#7c3aed" },
  { status: "CLOSED_WON", label: "Closed Won", color: "#16a34a" },
];

const STATUS_ORDER: ProspectStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "CLOSED_WON"];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    NEW: "bg-[#FEF0E3] text-[#F47C20]",
    CONTACTED: "bg-[#EBF0FA] text-[#2251A3]",
    QUALIFIED: "bg-green-100 text-green-700",
    PROPOSAL_SENT: "bg-purple-100 text-purple-700",
    CLOSED_WON: "bg-green-100 text-green-700",
  };
  return (
    <span className={`${map[status] ?? "bg-gray-100 text-gray-500"} text-xs font-medium px-2 py-0.5 rounded-full font-dm`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function ProspectsPage() {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Prospect[]>(INITIAL_PROSPECTS);

  const filtered = items.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.business.toLowerCase().includes(search.toLowerCase()) ||
    p.industry.toLowerCase().includes(search.toLowerCase())
  );

  function moveToNext(id: string) {
    setItems(prev => prev.map(p => {
      if (p.id !== id) return p;
      const idx = STATUS_ORDER.indexOf(p.status);
      if (idx === STATUS_ORDER.length - 1) return p;
      return { ...p, status: STATUS_ORDER[idx + 1] };
    }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Prospects</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">{items.length} total prospects in pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("kanban")}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors ${
              view === "kanban"
                ? "bg-[#1B3A6B] border-[#1B3A6B] text-white"
                : "bg-white border-[#D2DCE8] text-[#7A8FA6] hover:bg-[#F4F7FB]"
            }`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView("table")}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors ${
              view === "table"
                ? "bg-[#1B3A6B] border-[#1B3A6B] text-white"
                : "bg-white border-[#D2DCE8] text-[#7A8FA6] hover:bg-[#F4F7FB]"
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

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {COLUMNS.map(col => {
              const cards = filtered.filter(p => p.status === col.status);
              return (
                <div key={col.status} className="w-64 flex-shrink-0">
                  {/* Column header */}
                  <div
                    className="rounded-t-xl px-4 py-3 border-t-4"
                    style={{ borderColor: col.color, backgroundColor: col.color + "10" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-syne font-bold text-sm text-[#0D1B2A]">{col.label}</span>
                      <span
                        className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: col.color + "20", color: col.color }}
                      >
                        {cards.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="bg-[#F4F7FB] rounded-b-xl p-2 space-y-2 min-h-[120px]">
                    {cards.length === 0 && (
                      <p className="text-center text-xs font-dm text-[#7A8FA6] py-6">No prospects</p>
                    )}
                    {cards.map(p => (
                      <div key={p.id} className="bg-white border border-[#D2DCE8] rounded-xl p-3 space-y-2">
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <p className="font-dm font-semibold text-sm text-[#0D1B2A] leading-tight">{p.name}</p>
                            <p className="font-dm text-xs text-[#7A8FA6]">{p.business}</p>
                          </div>
                          <span className="text-xs font-dm text-[#7A8FA6] whitespace-nowrap">{p.daysAgo}d ago</span>
                        </div>
                        <p className="text-xs font-dm text-[#7A8FA6]">{p.industry} · {p.budget}</p>
                        <div className="flex flex-wrap gap-1">
                          {p.solutions.map(s => (
                            <span
                              key={s}
                              className="bg-[#EBF0FA] text-[#2251A3] text-xs px-1.5 py-0.5 rounded-full font-dm"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                        {p.status !== "CLOSED_WON" && (
                          <button
                            onClick={() => moveToNext(p.id)}
                            className="w-full mt-1 text-xs font-dm font-medium text-[#2251A3] border border-[#D2DCE8] rounded-lg py-1.5 hover:bg-[#EBF0FA] transition-colors"
                          >
                            Move → {COLUMNS[STATUS_ORDER.indexOf(p.status) + 1]?.label}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table View */}
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
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F7FB]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 font-dm text-sm text-[#7A8FA6]">
                      No prospects found.
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => (
                    <tr key={p.id} className="hover:bg-[#F4F7FB]/60 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-dm text-sm font-medium text-[#0D1B2A]">{p.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.solutions.map(s => (
                            <span
                              key={s}
                              className="bg-[#EBF0FA] text-[#2251A3] text-xs px-1.5 py-0.5 rounded-full font-dm"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-dm text-sm text-[#0D1B2A]">{p.business}</td>
                      <td className="px-5 py-4 font-dm text-sm text-[#7A8FA6]">{p.industry}</td>
                      <td className="px-5 py-4 font-dm text-sm text-[#7A8FA6]">{p.source}</td>
                      <td className="px-5 py-4 font-dm text-sm font-semibold text-[#0D1B2A]">{p.budget}</td>
                      <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                      <td className="px-5 py-4">
                        {p.status !== "CLOSED_WON" && (
                          <button
                            onClick={() => moveToNext(p.id)}
                            className="text-xs font-dm text-[#2251A3] hover:underline"
                          >
                            Move →
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
