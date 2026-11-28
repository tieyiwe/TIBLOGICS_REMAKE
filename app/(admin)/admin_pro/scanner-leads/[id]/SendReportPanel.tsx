"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

const field = "w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-surface)] px-3 py-2 font-dm text-sm text-[var(--a-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/30";

export interface SentRow {
  to: string;
  name: string | null;
  company: string | null;
  locale: string;
  by: string;
  at: string;
  pdf: boolean;
}

/** Staff: email this scan's report to the site's owner, with a note and the PDF. */
export default function SendReportPanel({
  id,
  domain,
  notes,
  initial,
  sent,
  openByDefault,
}: {
  id: string;
  domain: string;
  /** The starting note in each language. */
  notes: Record<string, string>;
  initial: { name: string; company: string; locale: string };
  sent: SentRow[];
  openByDefault: boolean;
}) {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [name, setName] = useState(initial.name);
  const [company, setCompany] = useState(initial.company);
  const [locale, setLocale] = useState(initial.locale in notes ? initial.locale : "en");
  const [note, setNote] = useState(notes[initial.locale] ?? notes.en);
  const [edited, setEdited] = useState(false);
  const [pdf, setPdf] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function pickLocale(l: string) {
    setLocale(l);
    // A note nobody has edited follows the language.
    if (!edited) setNote(notes[l] ?? notes.en);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(`Send the ${domain} report to ${to}?`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/scanner-leads/${encodeURIComponent(id)}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, name, company, note, locale, pdf }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Could not send");
      setMsg({ ok: true, text: `Sent to ${to}.` });
      setTo("");
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Could not send" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <details open={openByDefault} className="rounded-2xl border border-[var(--a-blue)] bg-[var(--a-surface)] p-5" data-testid="send-report">
      <summary className="cursor-pointer font-syne text-base font-bold text-[var(--a-ink)]">
        Send the report to the owner{sent.length ? ` · sent ${sent.length}×` : ""}
      </summary>
      <form onSubmit={send} className="mt-4 space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="font-dm text-xs font-semibold text-[var(--a-ink-2)]">Owner&apos;s email</span>
            <input required type="email" value={to} onChange={(e) => setTo(e.target.value)} maxLength={254} className={`${field} mt-1`} name="to" placeholder="owner@company.com" />
          </label>
          <label className="block">
            <span className="font-dm text-xs font-semibold text-[var(--a-ink-2)]">Language</span>
            <select value={locale} onChange={(e) => pickLocale(e.target.value)} className={`${field} mt-1`} name="locale">
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="sw">Swahili</option>
            </select>
          </label>
          <label className="block">
            <span className="font-dm text-xs font-semibold text-[var(--a-ink-2)]">Name (for the greeting)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={`${field} mt-1`} name="name" />
          </label>
          <label className="block">
            <span className="font-dm text-xs font-semibold text-[var(--a-ink-2)]">Company</span>
            <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={160} className={`${field} mt-1`} name="company" />
          </label>
        </div>
        <label className="block">
          <span className="font-dm text-xs font-semibold text-[var(--a-ink-2)]">Your note (shown above the results)</span>
          <textarea
            required
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setEdited(true);
            }}
            rows={6}
            maxLength={4000}
            className={`${field} mt-1`}
            name="note"
          />
        </label>
        <label className="flex items-center gap-2 font-dm text-sm text-[var(--a-ink-2)]">
          <input type="checkbox" checked={pdf} onChange={(e) => setPdf(e.target.checked)} />
          Attach the PDF report
        </label>
        <p className="font-dm text-xs text-[var(--a-ink-3)]">
          The email shows the scores, the security grade and every problem (critical and high included) with &quot;Fix this for me&quot; links, a free call and the full report link. Replies come to your address. It says why they got it and has an unsubscribe link.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} data-testid="send-report-submit" className="inline-flex items-center gap-2 rounded-lg bg-[var(--a-orange)] px-4 py-2.5 font-dm text-sm font-semibold text-white disabled:opacity-60">
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />}
            {busy ? "Sending…" : "Send report"}
          </button>
          {msg && (
            <p role="status" className={`font-dm text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>
              {msg.text}
            </p>
          )}
        </div>
      </form>
      {sent.length > 0 && (
        <div className="mt-5 border-t border-[var(--a-border)] pt-4">
          <p className="font-dm text-xs font-semibold uppercase tracking-wide text-[var(--a-ink-3)]">Sent</p>
          <ul className="mt-2 space-y-1 font-dm text-sm text-[var(--a-ink-2)]" data-testid="sent-list">
            {[...sent].reverse().map((s, i) => (
              <li key={`${s.at}-${i}`}>
                {new Date(s.at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · {s.to}
                {s.name ? ` (${s.name}${s.company ? `, ${s.company}` : ""})` : s.company ? ` (${s.company})` : ""} · {s.locale.toUpperCase()}
                {s.pdf ? " · PDF" : ""} · by {s.by}
              </li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}
