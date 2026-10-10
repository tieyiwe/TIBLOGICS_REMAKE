"use client";

import { useCallback, useEffect, useState } from "react";
import { Languages, Loader2 } from "lucide-react";

interface Status { total: number; fr: number; sw: number; running: boolean }

// Blog admin: stored French and Swahili translations of published articles.
export default function ArticleTranslations() {
  const [s, setS] = useState<Status | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/blog/translations").catch(() => null);
    if (r?.ok) setS(await r.json());
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!s?.running) return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [s?.running, load]);

  async function start() {
    setError("");
    const r = await fetch("/api/admin/blog/translations", { method: "POST" }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (!r?.ok) setError(d.error ?? "Could not start");
    else setS(d);
  }

  if (!s) return null;
  const done = s.fr === s.total && s.sw === s.total;
  const bar = (n: number) => (s.total ? Math.round((n / s.total) * 100) : 100);
  return (
    <div className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-2 font-dm text-sm font-semibold text-[var(--a-ink)]">
        <Languages size={16} className="text-[var(--a-blue)]" /> Article translations
      </div>
      <div className="flex-1 grid grid-cols-2 gap-3 font-dm text-xs text-[var(--a-ink-2)]">
        {(["fr", "sw"] as const).map((l) => (
          <div key={l}>
            <div className="flex justify-between"><span>{l === "fr" ? "Français" : "Kiswahili"}</span><span>{s[l]} / {s.total}</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-[var(--a-surface-2)] overflow-hidden"><div className="h-full bg-[#22C55E]" style={{ width: `${bar(s[l])}%` }} /></div>
          </div>
        ))}
      </div>
      <button
        onClick={start}
        disabled={s.running || done}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--a-radius-control)] bg-[var(--a-navy)] text-white font-dm text-sm font-semibold disabled:opacity-50"
      >
        {s.running && <Loader2 size={14} className="animate-spin" />}
        {done ? "All translated" : s.running ? "Translating..." : "Translate all now"}
      </button>
      {error && <p className="font-dm text-xs text-red-600">{error}</p>}
    </div>
  );
}
