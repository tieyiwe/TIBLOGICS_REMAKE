"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, ChevronDown, Copy, Lightbulb, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { CATEGORY_LABEL, SEVERITIES, type Category, type CyberResult, type Finding, type Severity } from "@/lib/cyber/types";

// The security report, for the team (mode "admin": tailored AI fixes) and for
// the client through a shared link (mode "public"). Everything shown comes
// from the stored result; React escapes it all.

const SEV_STYLE: Record<Severity, string> = {
  critical: "bg-[#B42318] text-white",
  high: "bg-[#DC6803] text-white",
  medium: "bg-[#FEF0C7] text-[#93370D]",
  low: "bg-[#EEF2F6] text-[#344054]",
  info: "bg-[#F2F4F7] text-[#667085]",
};
const gradeTone = (g: string) => (g === "A" || g === "B" ? "#16a34a" : g === "C" ? "#F47C20" : "#dc2626");

export function SeverityChip({ s }: { s: Severity }) {
  return <span className={`inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${SEV_STYLE[s]}`}>{s}</span>;
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}
      className="inline-flex items-center gap-1 rounded-md border border-[#D2DCE8] bg-white px-2 py-1 text-[11px] font-semibold text-[#1B3A6B]"
    >
      {done ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />} {done ? "Copied" : "Copy"}
    </button>
  );
}

/** Minimal Markdown: headings, numbered/bullet lines, fenced code. */
function Markdown({ text }: { text: string }) {
  const parts = text.split(/```[a-zA-Z0-9]*\n?/);
  return (
    <div className="space-y-2 font-dm text-sm text-[#3A4A5C]">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <div key={i} className="relative">
            <pre className="overflow-x-auto rounded-lg bg-[#0D1B2A] p-3 text-[12px] leading-relaxed text-[#E4EAF2]"><code>{part.trimEnd()}</code></pre>
            <div className="absolute right-2 top-2"><CopyButton text={part.trimEnd()} /></div>
          </div>
        ) : (
          part.split("\n").filter((l) => l.trim()).map((l, j) => {
            const h = /^#{1,4}\s+(.*)/.exec(l);
            if (h) return <p key={`${i}-${j}`} className="pt-1 font-syne text-sm font-bold text-[#0D1B2A]">{h[1]}</p>;
            return <p key={`${i}-${j}`}>{l.replace(/\*\*(.*?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1")}</p>;
          })
        ),
      )}
    </div>
  );
}

function FindingCard({ f, mode, scanId, aiFix }: { f: Finding; mode: "admin" | "public"; scanId?: string; aiFix?: string }) {
  const [open, setOpen] = useState(f.severity === "critical" || f.severity === "high");
  const [tab, setTab] = useState(0);
  const [fix, setFix] = useState<string | null>(aiFix ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function generate() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/scanner-leads/cyber/${scanId}/fix`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ findingId: f.id }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Could not generate");
      setFix(j.fix);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not generate");
    } finally {
      setBusy(false);
    }
  }
  return (
    <li className="rounded-xl border border-[#E4EAF2] bg-white" data-testid="cyber-finding" data-id={f.id}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start gap-3 p-4 text-left">
        <SeverityChip s={f.severity} />
        <span className="min-w-0 flex-1">
          <span className="block font-dm text-sm font-semibold text-[#0D1B2A]">{f.title}</span>
          <span className="block font-dm text-[11.5px] text-[#7A8FA6]">{CATEGORY_LABEL[f.category]} · {f.effort === "minutes" ? "quick fix" : `effort: ${f.effort}`}</span>
        </span>
        <ChevronDown size={16} className={`mt-0.5 shrink-0 text-[#7A8FA6] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div className="space-y-3 border-t border-[#EEF2F7] px-4 pb-4 pt-3">
          {f.tip && (
            <p className="flex items-start gap-2 rounded-lg bg-[#FFF6EE] px-3 py-2 font-dm text-sm text-[#7A3E00]" data-testid="cyber-tip">
              <Lightbulb size={16} className="mt-0.5 shrink-0" aria-hidden /> <span><strong>Quick tip:</strong> {f.tip}</span>
            </p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <div><p className="font-dm text-[11px] font-semibold uppercase tracking-wide text-[#7A8FA6]">What we saw</p><p className="mt-0.5 break-words font-dm text-sm text-[#3A4A5C]">{f.evidence}</p></div>
            <div><p className="font-dm text-[11px] font-semibold uppercase tracking-wide text-[#7A8FA6]">Why it matters</p><p className="mt-0.5 font-dm text-sm text-[#3A4A5C]">{f.impact}</p></div>
          </div>
          <div>
            <p className="font-dm text-[11px] font-semibold uppercase tracking-wide text-[#7A8FA6]">How to fix it</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 font-dm text-sm text-[#3A4A5C]">{f.fix.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </div>
          {!!f.snippets?.length && (
            <div>
              <div className="flex flex-wrap gap-1" role="tablist">
                {f.snippets.map((s, i) => (
                  <button key={s.label} type="button" role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={`rounded-md px-2 py-1 font-dm text-[11.5px] font-semibold ${tab === i ? "bg-[#1B3A6B] text-white" : "bg-[#EEF2F6] text-[#344054]"}`}>{s.label}</button>
                ))}
              </div>
              <div className="relative mt-1.5">
                <pre className="overflow-x-auto rounded-lg bg-[#0D1B2A] p-3 text-[12px] leading-relaxed text-[#E4EAF2]"><code>{f.snippets[tab]?.code}</code></pre>
                <div className="absolute right-2 top-2"><CopyButton text={f.snippets[tab]?.code ?? ""} /></div>
              </div>
            </div>
          )}
          {!!f.refs?.length && (
            <p className="font-dm text-xs text-[#7A8FA6]">
              More: {f.refs.map((r, i) => <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="mr-2 text-[#2251A3] underline">{r.label}</a>)}
              {f.standard ? <span className="ml-1">· {f.standard}</span> : null}
            </p>
          )}
          {mode === "admin" && scanId && (
            <div className="rounded-lg border border-dashed border-[#C9D8EE] p-3">
              {fix ? (
                <div data-testid="cyber-ai-fix"><p className="mb-2 flex items-center gap-1.5 font-dm text-xs font-semibold text-[#1B3A6B]"><Sparkles size={14} aria-hidden /> Tailored fix</p><Markdown text={fix} /></div>
              ) : (
                <button type="button" onClick={generate} disabled={busy} className="inline-flex items-center gap-1.5 font-dm text-sm font-semibold text-[#2251A3] disabled:opacity-50" data-testid="cyber-generate-fix">
                  {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Sparkles size={14} aria-hidden />}
                  {busy ? "Writing a fix for this site…" : "Generate a tailored fix for this site"}
                </button>
              )}
              {err && <p className="mt-1 font-dm text-xs text-red-600">{err}</p>}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default function CyberReport({ r, mode, scanId }: { r: CyberResult & { aiFixes?: Record<string, string> }; mode: "admin" | "public"; scanId?: string }) {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const shown = useMemo(() => (filter === "all" ? r.findings : r.findings.filter((f) => f.severity === filter)), [r.findings, filter]);
  const byId = new Map(r.findings.map((f) => [f.id, f]));
  const passed = r.checks.filter((c) => c.status === "pass");
  const p = r.platform;
  const card = "rounded-2xl border border-[#D2DCE8] bg-white p-5";

  return (
    <div className="space-y-5" data-testid="cyber-report">
      <div className={`${card} flex flex-col gap-5 sm:flex-row sm:items-center`}>
        <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl border-4" style={{ borderColor: gradeTone(r.grade), color: gradeTone(r.grade) }} data-testid="cyber-grade">
          <span className="font-syne text-5xl font-extrabold leading-none">{r.grade}</span>
          <span className="font-dm text-xs font-semibold">{r.score}/100</span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="break-all font-syne text-xl font-bold text-[#0D1B2A]">{r.domain}</h2>
          <p className="font-dm text-xs text-[#7A8FA6]">
            {new Date(r.finishedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · {r.deep ? "Authorised assessment (passive and active)" : "Passive assessment"}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5" data-testid="cyber-counts">
            {SEVERITIES.map((s) => <li key={s} className={`rounded-md px-2 py-0.5 font-dm text-xs font-semibold ${SEV_STYLE[s]}`}>{r.counts[s]} {s}</li>)}
          </ul>
          <p className="mt-2 font-dm text-xs text-[#3A4A5C]">Platform: {[p.cms && `${p.cms}${p.cmsVersion ? ` ${p.cmsVersion}` : ""}`, p.server, p.cdn && `behind ${p.cdn}`].filter(Boolean).join(" · ") || "not identified"}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className={card}>
          <h3 className="font-syne text-base font-bold text-[#0D1B2A]">Scores by area</h3>
          <ul className="mt-3 space-y-2">
            {(Object.entries(r.categoryScores) as [Category, number][]).map(([c, v]) => (
              <li key={c}>
                <div className="flex justify-between font-dm text-xs text-[#3A4A5C]"><span>{CATEGORY_LABEL[c]}</span><span className="font-semibold">{v}</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-[#EEF2F6]"><div className="h-1.5 rounded-full" style={{ width: `${v}%`, background: v >= 80 ? "#16a34a" : v >= 60 ? "#F47C20" : "#dc2626" }} /></div>
              </li>
            ))}
          </ul>
        </div>
        <div className={card} data-testid="cyber-plan">
          <h3 className="font-syne text-base font-bold text-[#0D1B2A]">Fix plan</h3>
          {([["now", "This week: critical and high", ShieldAlert], ["next", "This month: medium", AlertTriangle], ["later", "Hardening: low and advice", CheckCircle2]] as const).map(([k, title, Icon]) =>
            r.plan[k].length ? (
              <div key={k} className="mt-3">
                <p className="flex items-center gap-1.5 font-dm text-xs font-semibold uppercase tracking-wide text-[#7A8FA6]"><Icon size={13} aria-hidden /> {title}</p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-5 font-dm text-sm text-[#0D1B2A]">
                  {r.plan[k].slice(0, 10).map((id) => { const f = byId.get(id); return f ? <li key={id}>{f.title}{f.effort === "minutes" ? <span className="ml-1 text-xs text-[#16a34a]">quick fix</span> : null}</li> : null; })}
                </ol>
              </div>
            ) : null,
          )}
          {!r.findings.length && <p className="mt-2 font-dm text-sm text-[#166534]">Nothing to fix. Well done.</p>}
        </div>
      </div>

      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-syne text-base font-bold text-[#0D1B2A]">Findings ({r.findings.length})</h3>
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter by severity">
            {(["all", ...SEVERITIES] as const).map((s) => (
              <button key={s} type="button" role="tab" aria-selected={filter === s} onClick={() => setFilter(s)} className={`rounded-md px-2 py-1 font-dm text-xs font-semibold ${filter === s ? "bg-[#1B3A6B] text-white" : "bg-[#EEF2F6] text-[#344054]"}`}>
                {s === "all" ? "All" : `${s} (${r.counts[s]})`}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-3 space-y-2">{shown.map((f) => <FindingCard key={f.id} f={f} mode={mode} scanId={scanId} aiFix={r.aiFixes?.[f.id]} />)}</ul>
      </div>

      {r.subdomains.length > 0 && (
        <details className={card}>
          <summary className="cursor-pointer font-syne text-base font-bold text-[#0D1B2A]">Attack surface: {r.subdomains.length} subdomains in public certificate logs</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] font-dm text-xs">
              <thead><tr className="text-left text-[#7A8FA6]"><th className="py-1 pr-3">Name</th><th className="py-1 pr-3">Status</th><th className="py-1">Points to</th></tr></thead>
              <tbody>
                {r.subdomains.map((s) => (
                  <tr key={s.name} className="border-t border-[#EEF2F7]">
                    <td className="py-1.5 pr-3 font-mono text-[#0D1B2A]">{s.name}{s.sensitive ? <span className="ml-1 rounded bg-[#FEF0C7] px-1 text-[10px] text-[#93370D]">non-prod/admin</span> : null}</td>
                    <td className={`py-1.5 pr-3 ${s.status === "dangling" ? "font-bold text-red-700" : "text-[#3A4A5C]"}`}>{s.status}</td>
                    <td className="py-1.5 font-mono text-[#7A8FA6]">{s.cname ?? s.addresses.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <details className={card}>
        <summary className="cursor-pointer font-syne text-base font-bold text-[#0D1B2A]">Checks passed ({passed.length})</summary>
        <ul className="mt-3 grid gap-1 sm:grid-cols-2">
          {passed.map((c, i) => <li key={`${c.id}-${i}`} className="flex items-start gap-1.5 font-dm text-xs text-[#3A4A5C]"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[#16a34a]" aria-hidden />{c.title}{c.note ? <span className="text-[#7A8FA6]"> · {c.note}</span> : null}</li>)}
        </ul>
      </details>

      {r.notes.length > 0 && (
        <div className="rounded-xl bg-[#F4F7FB] p-4 font-dm text-xs text-[#5B6B7F]">
          {r.notes.map((n, i) => <p key={i}>{n}</p>)}
        </div>
      )}
    </div>
  );
}
