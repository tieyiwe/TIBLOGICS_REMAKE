"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { TrafficEntry } from "@/lib/ai-traffic";

const input = "w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-surface)] px-3 py-2 font-dm text-sm text-[var(--a-ink)]";

export default function TrafficEditor({ initial }: { initial: TrafficEntry[] }) {
  const [entries, setEntries] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ date: today, botsPct: "", source: "", sourceUrl: "", scope: "", growthPct: "", growthSource: "", growthUrl: "" });
  const bots = Number(f.botsPct);
  const humans = Number.isFinite(bots) && f.botsPct !== "" ? Math.round((100 - bots) * 10) / 10 : null;

  async function call(method: "POST" | "DELETE", body: unknown) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/blog/ai-traffic", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as { entries?: TrafficEntry[]; error?: string };
      if (!res.ok || !data.entries) throw new Error(data.error || "Could not save");
      setEntries(data.entries);
      setMsg({ ok: true, text: method === "POST" ? "Saved. The home page shows it within a minute." : "Removed." });
      return true;
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Could not save" });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const okd = await call("POST", {
      entry: {
        date: f.date,
        botsPct: bots,
        humansPct: humans ?? 0,
        source: f.source,
        sourceUrl: f.sourceUrl,
        scope: f.scope,
        growthPct: f.growthPct === "" ? null : Number(f.growthPct),
        growthSource: f.growthSource,
        growthUrl: f.growthUrl,
      },
    });
    if (okd) setF({ ...f, botsPct: "", source: "", sourceUrl: "", scope: "", growthPct: "", growthSource: "", growthUrl: "" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form onSubmit={add} className="space-y-3 rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-5" data-testid="traffic-form">
        <h2 className="font-syne text-lg font-bold text-[var(--a-ink)]">Add a reading</h2>
        <label className="block font-dm text-xs font-semibold text-[var(--a-ink-3)]">
          Published on
          <input type="date" required value={f.date} max={today} onChange={(e) => setF({ ...f, date: e.target.value })} className={input} />
        </label>
        <label className="block font-dm text-xs font-semibold text-[var(--a-ink-3)]">
          Bots and AI agents, % of traffic
          <input name="botsPct" type="number" required min={0} max={100} step={0.1} value={f.botsPct} onChange={(e) => setF({ ...f, botsPct: e.target.value })} className={input} placeholder="57.4" />
        </label>
        {humans !== null && <p className="font-dm text-xs text-[var(--a-ink-3)]">People: {humans}%</p>}
        <label className="block font-dm text-xs font-semibold text-[var(--a-ink-3)]">
          Source (who measured it)
          <input name="source" required value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} className={input} placeholder="Cloudflare" />
        </label>
        <label className="block font-dm text-xs font-semibold text-[var(--a-ink-3)]">
          Source link (https)
          <input name="sourceUrl" type="url" required value={f.sourceUrl} onChange={(e) => setF({ ...f, sourceUrl: e.target.value })} className={input} placeholder="https://…" />
        </label>
        <label className="block font-dm text-xs font-semibold text-[var(--a-ink-3)]">
          What was measured
          <input name="scope" value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })} className={input} placeholder="Requests to websites Cloudflare serves" />
        </label>
        <details className="rounded-lg bg-[var(--a-surface-2)] p-3">
          <summary className="cursor-pointer font-dm text-xs font-semibold text-[var(--a-ink-3)]">Optional: AI agent traffic growth over a year</summary>
          <div className="mt-2 space-y-2">
            <input type="number" step={1} value={f.growthPct} onChange={(e) => setF({ ...f, growthPct: e.target.value })} className={input} placeholder="1700 (percent)" />
            <input value={f.growthSource} onChange={(e) => setF({ ...f, growthSource: e.target.value })} className={input} placeholder="Source" />
            <input type="url" value={f.growthUrl} onChange={(e) => setF({ ...f, growthUrl: e.target.value })} className={input} placeholder="https://…" />
          </div>
        </details>
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[var(--a-blue)] px-4 py-2.5 font-dm text-sm font-semibold text-white disabled:opacity-60" data-testid="traffic-save">
          {busy && <Loader2 size={15} className="animate-spin" aria-hidden />} Save reading
        </button>
        {msg && <p role="status" className={`font-dm text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
      </form>

      <div className="rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-5">
        <h2 className="font-syne text-lg font-bold text-[var(--a-ink)]">Readings (newest is shown)</h2>
        <ul className="mt-3 divide-y divide-[var(--a-border)]" data-testid="traffic-list">
          {entries.map((e, i) => (
            <li key={e.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0 font-dm text-sm">
                <p className="font-semibold text-[var(--a-ink)]">
                  {e.date} · {e.botsPct}% bots and AI / {e.humansPct}% people {i === 0 && <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] text-green-700">shown</span>}
                </p>
                <p className="break-all text-xs text-[var(--a-ink-3)]">
                  <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--a-blue)] hover:underline">{e.source}</a>
                  {e.scope ? ` · ${e.scope}` : ""}
                  {e.growthPct !== null ? ` · AI agent growth ${e.growthPct}%` : ""}
                </p>
              </div>
              <button type="button" disabled={busy || entries.length < 2} onClick={() => confirm("Remove this reading?") && call("DELETE", { id: e.id })} className="shrink-0 rounded-lg p-2 text-[var(--a-ink-3)] hover:bg-red-50 hover:text-red-600 disabled:opacity-40" aria-label="Remove reading">
                <Trash2 size={15} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
