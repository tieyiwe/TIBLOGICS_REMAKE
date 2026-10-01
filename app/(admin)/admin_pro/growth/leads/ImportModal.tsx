"use client";

import { useMemo, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { CONSENT_BASES } from "@/lib/growth/outreach/shared";
import { api, Modal } from "./ui";

const FIELDS: Array<{ key: string; label: string; guess: RegExp }> = [
  { key: "companyName", label: "Company", guess: /^(company|business|organi[sz]ation|business name|company name|name)$/i },
  { key: "contactName", label: "Contact name", guess: /contact|owner|full ?name|person|^first ?name/i },
  { key: "role", label: "Role / title", guess: /title|role|position|job/i },
  { key: "email", label: "Email", guess: /e-?mail/i },
  { key: "phone", label: "Phone", guess: /phone|tel|mobile|cell/i },
  { key: "website", label: "Website", guess: /web|site|url|domain/i },
  { key: "industry", label: "Industry", guess: /industry|category|niche|sector|type/i },
  { key: "area", label: "City / area", guess: /city|area|location|region|town|address/i },
  { key: "linkedinUrl", label: "LinkedIn URL", guess: /linkedin/i },
  { key: "notes", label: "Notes", guess: /note|comment|description/i },
];

/** RFC 4180-ish CSV parser: quotes, escaped quotes, CRLF, BOM, ; or tab delimiters. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  const counts = [",", ";", "\t"].map((d) => [d, first.split(d).length] as const).sort((a, b) => b[1] - a[1]);
  const delim = counts[0][1] > 1 ? counts[0][0] : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQ = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQ) {
      if (c === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else inQ = false;
      } else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}

interface Result {
  created: number;
  duplicates: Array<{ row: number; by: string; companyName: string | null }>;
  invalid: Array<{ row: number; reason: string }>;
}

export default function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => Promise<void> }) {
  const [rows, setRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [consent, setConsent] = useState("unset");
  const [tag, setTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const header = rows[0] ?? [];
  const body = rows.slice(1);

  function load(text: string, name: string) {
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      setErr("That file has no data rows.");
      return;
    }
    setErr("");
    setRows(parsed);
    setFileName(name);
    const m: Record<string, number> = {};
    const used = new Set<number>();
    for (const f of FIELDS) {
      const idx = parsed[0].findIndex((h, i) => !used.has(i) && f.guess.test(h.trim()));
      if (idx >= 0) { m[f.key] = idx; used.add(idx); }
    }
    setMapping(m);
  }

  const mapped = useMemo(
    () => body.map((r) => Object.fromEntries(Object.entries(mapping).filter(([, i]) => i >= 0).map(([k, i]) => [k, (r[i] ?? "").trim()]))),
    [body, mapping],
  );

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      let total: Result = { created: 0, duplicates: [], invalid: [] };
      for (let i = 0; i < mapped.length; i += 2000) {
        const r = await api<Result>("/api/admin/growth/leads/import", {
          method: "POST",
          body: JSON.stringify({ rows: mapped.slice(i, i + 2000), consentBasis: consent, tags: tag.trim() ? [tag.trim()] : [] }),
        });
        total = {
          created: total.created + r.created,
          duplicates: [...total.duplicates, ...r.duplicates.map((d) => ({ ...d, row: d.row + i }))],
          invalid: [...total.invalid, ...r.invalid.map((d) => ({ ...d, row: d.row + i }))],
        };
      }
      setResult(total);
      await onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Import leads from CSV" onClose={onClose} wide>
      {result ? (
        <div className="space-y-3 font-dm text-sm" data-testid="import-result">
          <p className="text-lg font-semibold text-[var(--a-success)]">{result.created} lead(s) imported</p>
          <p className="text-[var(--a-ink-2)]">{result.duplicates.length} duplicate(s) skipped (matched by email, website domain or phone) · {result.invalid.length} invalid row(s)</p>
          {result.duplicates.length > 0 && (
            <ul className="max-h-40 overflow-y-auto rounded-[var(--a-radius-control)] bg-[var(--a-surface-2)] p-3 text-xs space-y-0.5">
              {result.duplicates.map((d) => <li key={`d${d.row}`}>Row {d.row}: <b>{d.companyName}</b> duplicate by {d.by}</li>)}
            </ul>
          )}
          {result.invalid.length > 0 && (
            <ul className="max-h-32 overflow-y-auto rounded-[var(--a-radius-control)] bg-[var(--a-danger-bg)] p-3 text-xs space-y-0.5">
              {result.invalid.map((d) => <li key={`i${d.row}`}>Row {d.row}: {d.reason}</li>)}
            </ul>
          )}
          <div className="flex justify-end"><button onClick={onClose} className="px-4 py-2 rounded-[var(--a-radius-control)] bg-[var(--a-navy)] text-white font-semibold">Done</button></div>
        </div>
      ) : rows.length === 0 ? (
        <div className="space-y-3 font-dm text-sm">
          <label className="flex flex-col items-center justify-center gap-2 rounded-[var(--a-radius-card)] border-2 border-dashed border-[var(--a-border-strong)] p-10 cursor-pointer hover:bg-[var(--a-surface-2)]">
            <FileUp className="text-[var(--a-blue)]" />
            <span className="font-semibold text-[var(--a-ink)]">Choose a .csv file</span>
            <span className="text-xs text-[var(--a-ink-3)]">First row must be column headers. Up to 2,000 rows per batch.</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              data-testid="csv-input"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 5_000_000) { setErr("File is larger than 5 MB."); return; }
                load(await f.text(), f.name);
              }}
            />
          </label>
          {err && <p className="text-[var(--a-danger)]">{err}</p>}
          <p className="text-xs text-[var(--a-ink-3)]">Only import contacts you are allowed to email: business addresses that are published, or people who have dealt with you. Purchased lists rarely meet CASL.</p>
        </div>
      ) : (
        <div className="space-y-4 font-dm text-sm">
          <p className="text-[var(--a-ink-2)]"><b>{fileName}</b>: {body.length} row(s). Map the columns:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {FIELDS.map((f) => (
              <label key={f.key} className="flex flex-col gap-1">
                <span className="text-xs text-[var(--a-ink-3)]">{f.label}</span>
                <select
                  value={mapping[f.key] ?? -1}
                  onChange={(e) => setMapping({ ...mapping, [f.key]: Number(e.target.value) })}
                  className="rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-2 py-1.5"
                  data-testid={`map-${f.key}`}
                >
                  <option value={-1}>(skip)</option>
                  {header.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                </select>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs text-[var(--a-ink-3)]">Consent basis for this list (recorded per lead; leads left &ldquo;not set&rdquo; cannot be emailed)</span>
              <select value={consent} onChange={(e) => setConsent(e.target.value)} className="rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-2 py-1.5" data-testid="import-consent">
                {CONSENT_BASES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--a-ink-3)]">Tag (optional)</span>
              <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. trade-show-2026" className="rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-2 py-1.5" />
            </label>
          </div>
          <div className="overflow-x-auto rounded-[12px] border border-[var(--a-border)]">
            <table className="w-full text-xs">
              <thead className="bg-[var(--a-surface-2)] text-[var(--a-ink-3)]">
                <tr>{FIELDS.filter((f) => (mapping[f.key] ?? -1) >= 0).map((f) => <th key={f.key} className="p-2 text-left">{f.label}</th>)}</tr>
              </thead>
              <tbody>
                {mapped.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-t border-[var(--a-border)]">
                    {FIELDS.filter((f) => (mapping[f.key] ?? -1) >= 0).map((f) => <td key={f.key} className="p-2 truncate max-w-[180px]">{r[f.key]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {err && <p className="text-[var(--a-danger)]">{err}</p>}
          <div className="flex justify-between gap-2">
            <button onClick={() => setRows([])} className="px-4 py-2 rounded-[var(--a-radius-control)] text-[var(--a-ink-2)]">Choose another file</button>
            <button
              onClick={submit}
              disabled={busy || ((mapping.companyName ?? -1) < 0 && (mapping.website ?? -1) < 0 && (mapping.email ?? -1) < 0)}
              className="px-4 py-2 rounded-[var(--a-radius-control)] bg-[var(--a-orange-text)] text-white font-semibold disabled:opacity-50 inline-flex items-center gap-2"
              data-testid="import-submit"
            >
              {busy && <Loader2 size={14} className="animate-spin" />} Import {body.length} row(s)
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
