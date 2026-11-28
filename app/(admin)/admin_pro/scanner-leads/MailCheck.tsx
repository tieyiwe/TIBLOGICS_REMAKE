"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MailCheck as MailIcon, XCircle } from "lucide-react";

type Row = { ok: boolean; record?: string | null; note?: string; detail?: string };
type Result = {
  smtp: Row;
  dns: { domain: string; spf: Row; dkim: Row; dmarc: Row; mx: Row };
  sample: Row | null;
  recent: { days: number; asked: number; sent: number };
};

/** Staff: check that the scanner's report emails can be delivered (runs on the live server). */
export default function MailCheck() {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(sample: boolean) {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/scanner-leads/mail-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sample }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Check failed");
      setRes(j as Result);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Check failed");
    } finally {
      setBusy(false);
    }
  }

  const line = (label: string, r: Row) => (
    <li key={label} className="flex items-start gap-2 font-dm text-sm">
      {r.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600" aria-hidden /> : <XCircle size={16} className="mt-0.5 shrink-0 text-red-600" aria-hidden />}
      <span>
        <strong className="text-[var(--a-ink)]">{label}:</strong> <span className="text-[var(--a-ink-2)]">{r.detail ?? r.note}</span>
        {r.record && <code className="mt-0.5 block break-all text-[11px] text-[var(--a-ink-3)]">{r.record}</code>}
      </span>
    </li>
  );

  return (
    <div className="rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-5" data-testid="mail-check">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-syne text-base font-bold text-[var(--a-ink)]">
            <MailIcon size={18} aria-hidden /> Check email delivery
          </h2>
          <p className="font-dm text-xs text-[var(--a-ink-3)]">Mail server login, the domain&apos;s SPF, DKIM and DMARC, and a sample of the visitor report email to you.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => run(false)} disabled={busy} className="rounded-lg border border-[var(--a-border)] px-3 py-2 font-dm text-sm font-semibold text-[var(--a-ink)] disabled:opacity-50" data-testid="mail-check-run">
            {busy ? <Loader2 size={14} className="inline animate-spin" aria-hidden /> : null} Check
          </button>
          <button type="button" onClick={() => run(true)} disabled={busy} className="rounded-lg bg-[var(--a-orange)] px-3 py-2 font-dm text-sm font-semibold text-white disabled:opacity-50" data-testid="mail-check-sample">
            Check and send me a sample
          </button>
        </div>
      </div>
      {err && <p className="mt-3 font-dm text-sm text-red-600">{err}</p>}
      {res && (
        <ul className="mt-4 space-y-2" data-testid="mail-check-result">
          {line("Mail server", res.smtp)}
          {line(`SPF (${res.dns.domain})`, res.dns.spf)}
          {line("DKIM", res.dns.dkim)}
          {line("DMARC", res.dns.dmarc)}
          {line("MX", res.dns.mx)}
          {res.sample && line("Sample email", res.sample)}
          <li className="font-dm text-xs text-[var(--a-ink-3)]">
            Last {res.recent.days} days: {res.recent.sent} of {res.recent.asked} visitors who asked have been emailed their report.
          </li>
        </ul>
      )}
    </div>
  );
}
