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
    <div className="bg-white border border-[#D2DCE8] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-2 font-dm text-sm font-semibold text-[#0D1B2A]">
        <Languages size={16} className="text-[#2251A3]" /> Article translations
      </div>
      <div className="flex-1 grid grid-cols-2 gap-3 font-dm text-xs text-[#3A4A5C]">
        {(["fr", "sw"] as const).map((l) => (
          <div key={l}>
            <div className="flex justify-between"><span>{l === "fr" ? "Français" : "Kiswahili"}</span><span>{s[l]} / {s.total}</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-[#F4F7FB] overflow-hidden"><div className="h-full bg-[#22C55E]" style={{ width: `${bar(s[l])}%` }} /></div>
          </div>
        ))}
      </div>
      <button
        onClick={start}
        disabled={s.running || done}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#1B3A6B] text-white font-dm text-sm font-semibold disabled:opacity-50"
      >
        {s.running && <Loader2 size={14} className="animate-spin" />}
        {done ? "All translated" : s.running ? "Translating..." : "Translate all now"}
      </button>
      {error && <p className="font-dm text-xs text-red-600">{error}</p>}
    </div>
  );
}
