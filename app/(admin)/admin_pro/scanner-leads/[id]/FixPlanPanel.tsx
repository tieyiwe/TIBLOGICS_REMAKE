"use client";

import { useState } from "react";
import type { FixPlan } from "@/lib/scanner/fix-plan";

const EFFORT: Record<string, string> = { low: "Quick fix", medium: "Half a day", high: "A project" };

/** Staff only: write or rewrite the internal fix plan (one AI call) and read it. */
export default function FixPlanPanel({ id, initial }: { id: string; initial: FixPlan | null }) {
  const [plan, setPlan] = useState<FixPlan | null>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function run() {
    if (plan && !confirm("Write a new fix plan? It replaces this one (one AI call).")) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/scanner-leads/${encodeURIComponent(id)}/fix-plan`, { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.plan) throw new Error(j.error ?? "Could not write the plan");
      setPlan(j.plan);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not write the plan");
    } finally {
      setBusy(false);
    }
  }
  const hours = plan?.priorities.reduce((n, p) => n + (p.hours ?? 0), 0) ?? 0;

  return (
    <div className="rounded-2xl border-2 border-[var(--a-orange,#F47C20)] bg-[var(--a-surface)] p-5" data-testid="fix-plan-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-syne text-base font-bold text-[var(--a-ink)]">Fix plan</h2>
          <p className="font-dm text-xs text-[var(--a-ink-3)]">Internal: for preparing the call and the quote. The customer never sees it.</p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="rounded-lg bg-[#F47C20] px-4 py-2 font-dm text-sm font-bold text-white hover:brightness-105 disabled:opacity-60"
          data-testid="fix-plan-run"
        >
          {busy ? "Writing the plan… (about a minute)" : plan ? "Rewrite fix plan" : "Generate fix plan"}
        </button>
      </div>
      {err && <p role="alert" className="mt-3 font-dm text-sm text-red-700">{err}</p>}
      {plan && (
        <div className="mt-4 space-y-4 font-dm text-sm" data-testid="fix-plan">
          <p className="leading-relaxed text-[var(--a-ink)]">{plan.summary}</p>
          {plan.quickWin && (
            <p className="rounded-xl bg-green-50 p-3 text-green-950"><strong>Lead with:</strong> {plan.quickWin}</p>
          )}
          {plan.callNotes.length > 0 && (
            <div className="rounded-xl bg-[var(--a-surface-2)] p-3">
              <p className="font-semibold text-[var(--a-ink)]">Call notes</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-[var(--a-ink-2)]">{plan.callNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          )}
          <div>
            <p className="font-semibold text-[var(--a-ink)]">Work, in priority order{hours > 0 ? ` (about ${Math.round(hours)} hours in total)` : ""}</p>
            <ol className="mt-2 space-y-3">
              {plan.priorities.map((p, i) => (
                <li key={i} className="rounded-xl border border-[var(--a-border)] p-3">
                  <p className="font-semibold text-[var(--a-ink)]">
                    {i + 1}. {p.title}{" "}
                    <span className="ml-1 rounded-full bg-[var(--a-surface-2)] px-2 py-0.5 text-[11px] font-semibold text-[var(--a-ink-3)]">
                      {EFFORT[p.effort]}{p.hours ? ` · ~${p.hours} h` : ""}
                    </span>
                  </p>
                  {p.why && <p className="mt-1 text-[var(--a-ink-2)]">{p.why}</p>}
                  <ol className="mt-1.5 list-decimal space-y-0.5 pl-5 text-[var(--a-ink)]">{p.steps.map((s, j) => <li key={j}>{s}</li>)}</ol>
                </li>
              ))}
            </ol>
          </div>
          {plan.ideas.length > 0 && (
            <div>
              <p className="font-semibold text-[var(--a-ink)]">What we could build</p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {plan.ideas.map((x, i) => (
                  <li key={i} className="rounded-xl bg-[#FEF6EE] p-3">
                    <p className="font-semibold text-[var(--a-ink)]">{x.title}</p>
                    <p className="mt-0.5 text-[var(--a-ink-2)]">{x.what}</p>
                    {x.outcome && <p className="mt-1 font-semibold text-green-700">Result: {x.outcome}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[11px] text-[var(--a-ink-3)]">Written {plan.writtenAt ? new Date(plan.writtenAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : ""}{plan.writtenBy ? ` by ${plan.writtenBy}` : ""}.</p>
        </div>
      )}
    </div>
  );
}
