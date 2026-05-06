"use client";

import { useEffect, useState } from "react";
import { Users, Mail } from "lucide-react";

type Entry = { id: string; email: string; product: string; createdAt: string };

export default function WaitlistPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((d) => { setEntries(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const products = ["all", ...Array.from(new Set(entries.map((e) => e.product)))];
  const filtered = filter === "all" ? entries : entries.filter((e) => e.product === filter);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-2xl text-[#0D1B2A]">Product Waitlist</h1>
        <p className="font-dm text-sm text-[#7A8FA6] mt-1">{entries.length} total sign-ups across {products.length - 1} products</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {products.map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-dm font-semibold transition-colors ${
              filter === p ? "bg-[#1B3A6B] text-white" : "bg-[#F4F7FB] text-[#7A8FA6] hover:bg-[#EBF0FA]"
            }`}
          >
            {p === "all" ? "All Products" : p}
            {p !== "all" && (
              <span className="ml-1.5 opacity-60">
                ({entries.filter((e) => e.product === p).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-[#F4F7FB] rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#7A8FA6] font-dm">No sign-ups yet.</div>
      ) : (
        <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F4F7FB]">
                <th className="text-left px-5 py-3 font-dm text-xs text-[#7A8FA6] font-semibold uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 font-dm text-xs text-[#7A8FA6] font-semibold uppercase tracking-wide">Product</th>
                <th className="text-left px-5 py-3 font-dm text-xs text-[#7A8FA6] font-semibold uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFBFD]"}>
                  <td className="px-5 py-3 font-dm text-sm text-[#0D1B2A] flex items-center gap-2">
                    <Mail size={13} className="text-[#7A8FA6]" /> {e.email}
                  </td>
                  <td className="px-5 py-3">
                    <span className="bg-[#EBF0FA] text-[#2251A3] text-xs font-dm font-semibold px-2 py-0.5 rounded-full">{e.product}</span>
                  </td>
                  <td className="px-5 py-3 font-dm text-xs text-[#7A8FA6]">
                    {new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
