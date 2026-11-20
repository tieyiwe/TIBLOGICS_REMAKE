"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ScanSearch } from "lucide-react";

const field = "w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-surface)] px-3 py-2 font-dm text-sm text-[var(--a-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/30";

/** Staff: scan a website, then open its page to review and send the report. */
export default function NewScanForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [locale, setLocale] = useState("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function scan(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/scanner-leads/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, name, company, locale }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.id) throw new Error(j.error ?? "Could not scan the site");
      const q = new URLSearchParams({ send: "1", ...(name ? { name } : {}), ...(company ? { company } : {}), locale });
      router.push(`/admin_pro/scanner-leads/${j.id}?${q}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not scan the site");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={scan} data-testid="admin-scan-form" className="rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-5 space-y-4">
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <label className="block">
          <span className="font-dm text-xs font-semibold text-[var(--a-ink-2)]">Website</span>
          <input required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="example.com" maxLength={500} className={`${field} mt-1`} name="url" />
        </label>
        <label className="block">
          <span className="font-dm text-xs font-semibold text-[var(--a-ink-2)]">Report language</span>
          <select value={locale} onChange={(e) => setLocale(e.target.value)} className={`${field} mt-1`} name="locale">
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="sw">Swahili</option>
          </select>
        </label>
        <label className="block">
          <span className="font-dm text-xs font-semibold text-[var(--a-ink-2)]">Contact name (optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={`${field} mt-1`} name="name" />
        </label>
        <label className="block">
          <span className="font-dm text-xs font-semibold text-[var(--a-ink-2)]">Company (optional)</span>
          <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={160} className={`${field} mt-1`} name="company" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} data-testid="admin-scan-submit" className="inline-flex items-center gap-2 rounded-lg bg-[var(--a-orange)] px-4 py-2.5 font-dm text-sm font-semibold text-white disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <ScanSearch size={16} aria-hidden />}
          {busy ? "Scanning (up to a minute)…" : "Scan website"}
        </button>
        {error && <p role="alert" className="font-dm text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}
