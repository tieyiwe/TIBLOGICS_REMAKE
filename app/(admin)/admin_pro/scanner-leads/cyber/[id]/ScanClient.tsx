"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Link2, Loader2, RefreshCw, Send, Trash2 } from "lucide-react";
import CyberReport from "@/components/cyber/CyberReport";
import type { CyberResult } from "@/lib/cyber/types";

type Row = { id: string; token: string; url: string; domain: string; status: string; progress: string | null; deep: boolean; engagementId: string | null; company: string | null; contactName: string | null; result: CyberResult | null; error: string | null; sharedAt: string | null; sent: Array<{ to: string; at: string; by: string }> | null };
type Prev = { date: string; findings: Array<{ id: string; title: string; severity: string }> } | null;
const field = "w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-surface)] px-3 py-2 font-dm text-sm text-[var(--a-ink)]";
const btn = "inline-flex items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3 py-2 font-dm text-sm font-semibold text-[var(--a-ink)] hover:border-[var(--a-blue)] disabled:opacity-50";

export default function ScanClient({ initial, previous, senderName, site }: { initial: Row; previous: Prev; senderName: string; site: string }) {
  const router = useRouter();
  const [row, setRow] = useState<Row>(initial);
  const [shareUrl, setShareUrl] = useState<string | null>(initial.sharedAt ? `${site || ""}/security-report/${initial.token}` : null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [name, setName] = useState(initial.contactName ?? "");
  const [note, setNote] = useState(`We reviewed the security of ${initial.domain}. The results and a step-by-step fix plan are below and in the attached PDF.\n\nWe can fix these for you, starting with the most serious. Just reply to this email.`);

  useEffect(() => {
    if (row.status !== "running") return;
    const t = setInterval(async () => {
      const j = await fetch(`/api/admin/scanner-leads/cyber/${row.id}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null);
      if (j) setRow(j);
    }, 2500);
    return () => clearInterval(t);
  }, [row.status, row.id]);

  const call = async (key: string, url: string, init: RequestInit) => {
    setBusy(key);
    setMsg(null);
    try {
      const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Failed");
      return j;
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Failed" });
      return null;
    } finally {
      setBusy(null);
    }
  };

  if (row.status === "running") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-6 font-dm text-sm text-[var(--a-ink-2)]" data-testid="cyber-running">
        <Loader2 className="animate-spin text-[var(--a-orange)]" aria-hidden /> Assessing {row.domain}: {row.progress ?? "working"}… This takes about a minute.
      </div>
    );
  }
  if (row.status === "failed" || !row.result) {
    return <p className="rounded-2xl border border-red-200 bg-red-50 p-5 font-dm text-sm text-red-800" data-testid="cyber-failed">The assessment of {row.domain} failed: {row.error ?? "unknown error"}</p>;
  }
  const r = row.result;
  const now = new Set(r.findings.map((f) => f.id));
  const fixed = previous ? previous.findings.filter((f) => !now.has(f.id)) : [];
  const added = previous ? r.findings.filter((f) => !previous.findings.some((p) => p.id === f.id)) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-4" data-testid="cyber-actions">
        <a href={`/api/admin/scanner-leads/cyber/${row.id}/pdf`} className={btn} data-testid="cyber-pdf"><Download size={15} aria-hidden /> PDF report</a>
        <button type="button" className={btn} disabled={!!busy} data-testid="cyber-share" onClick={async () => {
          const j = await call("share", `/api/admin/scanner-leads/cyber/${row.id}/share`, { method: "POST", body: JSON.stringify({ on: !shareUrl }) });
          if (j) {
            setShareUrl(j.url);
            if (j.url) { await navigator.clipboard?.writeText(j.url).catch(() => {}); setMsg({ ok: true, text: "Private link on for 30 days, copied." }); } else setMsg({ ok: true, text: "Link turned off." });
          }
        }}><Link2 size={15} aria-hidden /> {shareUrl ? "Turn link off" : "Share private link"}</button>
        <button type="button" className={btn} disabled={!!busy} onClick={async () => {
          const j = await call("rescan", "/api/admin/scanner-leads/cyber", { method: "POST", body: JSON.stringify({ url: row.url, deep: row.deep, engagementId: row.engagementId, company: row.company ?? undefined }) });
          if (j) router.push(`/admin_pro/scanner-leads/cyber/${j.id}`);
        }} data-testid="cyber-rescan"><RefreshCw size={15} aria-hidden /> Re-scan</button>
        <button type="button" className={`${btn} ml-auto text-red-700`} disabled={!!busy} onClick={async () => {
          if (!confirm(`Delete this assessment of ${row.domain}?`)) return;
          if (await call("delete", `/api/admin/scanner-leads/cyber/${row.id}`, { method: "DELETE" })) router.push("/admin_pro/scanner-leads/cyber");
        }}><Trash2 size={15} aria-hidden /> Delete</button>
        {shareUrl && <p className="w-full break-all font-dm text-xs text-[var(--a-ink-3)]" data-testid="cyber-share-url">{shareUrl}</p>}
        {msg && <p role="status" className={`w-full font-dm text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
      </div>

      {previous && (
        <div className="rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-4 font-dm text-sm" data-testid="cyber-compare">
          <p className="font-semibold text-[var(--a-ink)]">Since the scan of {new Date(previous.date).toLocaleDateString("en-US", { dateStyle: "medium" })}: {fixed.length} fixed, {added.length} new.</p>
          {fixed.length > 0 && <p className="mt-1 text-green-700">Fixed: {fixed.map((f) => f.title).join("; ")}</p>}
          {added.length > 0 && <p className="mt-1 text-red-700">New: {added.map((f) => f.title).join("; ")}</p>}
        </div>
      )}

      <CyberReport r={r} mode="admin" scanId={row.id} />

      <details className="rounded-2xl border border-[var(--a-blue)] bg-[var(--a-surface)] p-5" data-testid="cyber-send">
        <summary className="cursor-pointer font-syne text-base font-bold text-[var(--a-ink)]">Send the report to the owner{row.sent?.length ? ` · sent ${row.sent.length}×` : ""}</summary>
        <form className="mt-4 space-y-3" onSubmit={async (e) => {
          e.preventDefault();
          if (!confirm(`Send the ${row.domain} security report to ${to}?`)) return;
          const j = await call("send", `/api/admin/scanner-leads/cyber/${row.id}/send`, { method: "POST", body: JSON.stringify({ to, name, note }) });
          if (j) { setMsg({ ok: true, text: `Sent to ${to}.` }); setTo(""); router.refresh(); }
        }}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block"><span className="font-dm text-xs font-semibold text-[var(--a-ink-2)]">Owner&apos;s email</span><input required type="email" name="to" value={to} onChange={(e) => setTo(e.target.value)} className={`${field} mt-1`} /></label>
            <label className="block"><span className="font-dm text-xs font-semibold text-[var(--a-ink-2)]">Name (greeting)</span><input name="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={`${field} mt-1`} /></label>
          </div>
          <label className="block"><span className="font-dm text-xs font-semibold text-[var(--a-ink-2)]">Your note</span><textarea required name="note" rows={5} value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} className={`${field} mt-1`} /></label>
          <p className="font-dm text-xs text-[var(--a-ink-3)]">The email has the grade, the most serious issues with quick tips, the PDF with every fix{shareUrl ? ", and the private link" : ""}. Replies come to you ({senderName}). The report is in English.</p>
          <button type="submit" disabled={!!busy} className="inline-flex items-center gap-2 rounded-lg bg-[var(--a-orange)] px-4 py-2.5 font-dm text-sm font-semibold text-white disabled:opacity-50" data-testid="cyber-send-submit">
            {busy === "send" ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />} Send report
          </button>
        </form>
        {!!row.sent?.length && <ul className="mt-4 space-y-1 border-t border-[var(--a-border)] pt-3 font-dm text-xs text-[var(--a-ink-3)]">{row.sent.map((s, i) => <li key={i}>{new Date(s.at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · {s.to} · by {s.by}</li>)}</ul>}
      </details>
    </div>
  );
}
