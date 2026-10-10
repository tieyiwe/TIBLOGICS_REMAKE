"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export type Entry = { id: string; email: string; product: string; createdAt: string };

export default function WaitlistClient({ entries }: { entries: Entry[] }) {
  const [filter, setFilter] = useState("all");

  const products = ["all", ...Array.from(new Set(entries.map((e) => e.product)))];
  const filtered = filter === "all" ? entries : entries.filter((e) => e.product === filter);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-syne font-bold text-[24px] leading-tight sm:text-[26px] text-[var(--a-ink)]">Product Waitlist</h1>
        <p className="font-dm text-sm text-[var(--a-ink-3)] mt-1">{entries.length} total sign-ups across {products.length - 1} products</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {products.map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-dm font-semibold transition-colors ${
              filter === p ? "bg-[var(--a-navy)] text-white" : "bg-[var(--a-surface-2)] text-[var(--a-ink-3)] hover:bg-[var(--a-info-bg)]"
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

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--a-ink-3)] font-dm">No sign-ups yet.</div>
      ) : (
        <div className="a-table-scroll bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--a-border)]">
                <th className="text-left px-5 py-3 font-dm text-xs text-[var(--a-ink-3)] font-semibold uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 font-dm text-xs text-[var(--a-ink-3)] font-semibold uppercase tracking-wide">Product</th>
                <th className="text-left px-5 py-3 font-dm text-xs text-[var(--a-ink-3)] font-semibold uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFBFD]"}>
                  <td className="px-5 py-3 font-dm text-sm text-[var(--a-ink)] flex items-center gap-2">
                    <Mail size={13} className="text-[var(--a-ink-3)]" /> {e.email}
                  </td>
                  <td className="px-5 py-3">
                    <span className="bg-[var(--a-info-bg)] text-[var(--a-blue)] text-xs font-dm font-semibold px-2 py-0.5 rounded-full">{e.product}</span>
                  </td>
                  <td className="px-5 py-3 font-dm text-xs text-[var(--a-ink-3)]">
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
