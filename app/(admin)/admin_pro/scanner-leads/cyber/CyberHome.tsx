"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

type Row = { id: string; createdAt: string; createdBy: string; url: string; domain: string; status: string; progress: string | null; deep: boolean; company: string | null; score: number | null; grade: string | null; counts: Record<string, number> | null; sharedAt: string | null };
type Eng = { id: string; client: string; scope: string[]; startsAt: string; endsAt: string; revokedAt: string | null };
const field = "w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-surface)] px-3 py-2 font-dm text-sm text-[var(--a-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/30";
const active = (e: Eng) => !e.revokedAt && new Date(e.startsAt) <= new Date() && new Date(e.endsAt) >= new Date();
const host = (u: string) => { try { return new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`).hostname.toLowerCase(); } catch { return ""; } };

export default function CyberHome() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [engs, setEngs] = useState<Eng[]>([]);
  const [url, setUrl] = useState("");
  const [company, setCompany] = useState("");
  const [deep, setDeep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([fetch("/api/admin/scanner-leads/cyber").then((r) => r.json()).catch(() => ({})), fetch("/api/admin/scanner-leads/cyber/engagements").then((r) => r.json()).catch(() => ({}))]);
    setRows(a.scans ?? []);
    setEngs(b.engagements ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!rows.some((r) => r.status === "running")) return;
    const t = setInterval(() => void load(), 3000);
    return () => clearInterval(t);
  }, [rows, load]);

  const h = host(url);
  const covering = engs.find((e) => active(e) && e.scope.some((d) => h === d || h.endsWith(`.${d}`)));

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/scanner-leads/cyber", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, company, deep, engagementId: deep ? covering?.id ?? null : null }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Could not start");
      router.push(`/admin_pro/scanner-leads/cyber/${j.id}`);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Could not start");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={start} className="space-y-4 rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-5" data-testid="cyber-form">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <label className="block"><span className="font-dm text-xs font-semibold text-[var(--a-ink-2)]">Website</span><input required name="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="client.com" maxLength={500} className={`${field} mt-1`} /></label>
          <label className="block"><span className="font-dm text-xs font-semibold text-[var(--a-ink-2)]">Client (optional)</span><input name="company" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={160} className={`${field} mt-1`} /></label>
        </div>
        <fieldset className="space-y-2">
          <label className="flex items-start gap-2 font-dm text-sm text-[var(--a-ink)]">
            <input type="radio" name="mode" checked={!deep} onChange={() => setDeep(false)} className="mt-1" />
            <span><strong>Passive assessment</strong> (any public site): what browsers, mail servers and public logs see. No intrusive requests.</span>
          </label>
          <label className="flex items-start gap-2 font-dm text-sm text-[var(--a-ink)]">
            <input type="radio" name="mode" checked={deep} onChange={() => setDeep(true)} className="mt-1" data-testid="cyber-deep" />
            <span><strong>Authorised assessment</strong> (passive + active tests): exposed files, admin areas, CORS, open redirects, input reflection, database errors. Needs an active engagement for this domain.</span>
          </label>
          {deep && (
            <p className={`ml-6 font-dm text-xs ${covering ? "text-green-700" : "text-red-600"}`} data-testid="cyber-engagement-status">
              {h ? (covering ? `Covered by the engagement with ${covering.client} (until ${new Date(covering.endsAt).toLocaleDateString()}).` : `No active engagement covers ${h}. `) : "Enter the website first. "}
              {!covering && <Link href="/admin_pro/scanner-leads/cyber/engagements" className="underline">Record the client&apos;s authorisation</Link>}
            </p>
          )}
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy || (deep && !covering)} className="inline-flex items-center gap-2 rounded-lg bg-[var(--a-orange)] px-4 py-2.5 font-dm text-sm font-semibold text-white disabled:opacity-50" data-testid="cyber-start">
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <ShieldCheck size={16} aria-hidden />} Start assessment
          </button>
          {err && <p role="alert" className="font-dm text-sm text-red-600">{err}</p>}
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)]">
        <h2 className="border-b border-[var(--a-border)] px-5 py-3 font-syne text-base font-bold text-[var(--a-ink)]">Assessments</h2>
        {!rows.length ? <p className="px-5 py-8 text-center font-dm text-sm text-[var(--a-ink-3)]">No assessments yet.</p> : (
          <ul className="divide-y divide-[var(--a-border)]" data-testid="cyber-list">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/admin_pro/scanner-leads/cyber/${r.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-[var(--a-surface-2)]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 font-syne text-lg font-bold" style={{ borderColor: r.grade === "A" || r.grade === "B" ? "#16a34a" : r.grade === "C" ? "#F47C20" : r.grade ? "#dc2626" : "var(--a-border)" }}>{r.grade ?? "…"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-all font-dm text-sm font-semibold text-[var(--a-ink)]">{r.domain}{r.company ? ` · ${r.company}` : ""}</span>
                    <span className="block font-dm text-[11.5px] text-[var(--a-ink-3)]">
                      {new Date(r.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · {r.deep ? "authorised" : "passive"} · {r.createdBy}
                      {r.status === "running" ? ` · ${r.progress ?? "running"}…` : r.status === "failed" ? " · failed" : r.counts ? ` · ${r.counts.critical ?? 0} critical, ${r.counts.high ?? 0} high, ${r.counts.medium ?? 0} medium` : ""}
                      {r.sharedAt ? " · shared" : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
