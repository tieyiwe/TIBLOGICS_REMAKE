"use client";

import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";

// "Explain this week": asks /api/admin/analytics/explain for a short summary
// written from aggregate numbers only. Shown as plain text (never as HTML).
export default function ExplainButton({ range }: { range: string }) {
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/analytics/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ range }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "The summary could not be written.");
      setText(String(j.summary ?? ""));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The summary could not be written.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        data-testid="explain-btn"
        className="inline-flex h-9 items-center gap-1.5 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 font-dm text-[13px] font-semibold text-[var(--a-ink)] hover:bg-[var(--a-surface-2)] disabled:opacity-60"
      >
        {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Sparkles size={14} aria-hidden className="text-[var(--a-orange)]" />}
        Explain this {range === "7" ? "week" : `${range} days`}
      </button>
      {(text || err) && (
        <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-lg rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-4 shadow-xl sm:absolute sm:inset-x-auto sm:right-6 sm:top-28 sm:w-[460px]" role="dialog" aria-label="Summary" data-testid="explain-out">
          <div className="flex items-start justify-between gap-3">
            <p className="font-dm text-[13px] font-semibold text-[var(--a-ink)]">Summary (AI, from aggregate numbers)</p>
            <button type="button" onClick={() => { setText(null); setErr(null); }} aria-label="Close" className="text-[var(--a-ink-3)] hover:text-[var(--a-ink)]"><X size={16} /></button>
          </div>
          {err ? <p className="mt-2 font-dm text-sm text-[var(--a-danger)]">{err}</p> : <p className="mt-2 whitespace-pre-wrap font-dm text-sm leading-relaxed text-[var(--a-ink-2)]">{text}</p>}
        </div>
      )}
    </div>
  );
}
