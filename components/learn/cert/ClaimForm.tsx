"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// The learner types the name to print, twice, sees it on the certificate,
// ticks the box and confirms. Same rules as the server (lib/learn/cert/ref.ts
// cleanCertificateName): letters, spaces, hyphens, apostrophes, full stops;
// first and last name.
const tidy = (s: string) => s.normalize("NFC").replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
const valid = (s: string) => s.length >= 2 && s.length <= 70 && /\s/.test(s) && /^[\p{L}\p{M}][\p{L}\p{M} .'-]*[\p{L}\p{M}.]$/u.test(s);

export default function ClaimForm({ reference, initialName }: { reference: string; initialName: string }) {
  const t = useT();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [again, setAgain] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const last = useRef<string | null>(null);
  // Only the newest preview is shown: an older one finishing late is dropped.
  const seq = useRef(0);

  const a = tidy(name), b = tidy(again);
  const nameOk = valid(a);
  const match = a === b && b.length > 0;

  // Live preview of the certificate with the typed name (debounced).
  useEffect(() => {
    if (!nameOk) return;
    const id = setTimeout(async () => {
      const mine = ++seq.current;
      setLoadingPreview(true);
      try {
        const r = await fetch(`/api/learn/certificates/${encodeURIComponent(reference)}/preview?name=${encodeURIComponent(a)}`);
        if (mine !== seq.current) return;
        if (r.ok) {
          const url = URL.createObjectURL(await r.blob());
          if (last.current) URL.revokeObjectURL(last.current);
          last.current = url;
          setPreview(url);
        }
      } finally {
        if (mine === seq.current) setLoadingPreview(false);
      }
    }, 700);
    return () => clearTimeout(id);
  }, [a, nameOk, reference]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!nameOk) return setErr(t("learn.claim.badName"));
    if (!match) return setErr(t("learn.claim.mismatch"));
    if (!agree) return setErr(t("learn.claim.mustAgree"));
    setBusy(true);
    try {
      const r = await fetch(`/api/learn/certificates/${encodeURIComponent(reference)}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: a, nameAgain: b, agree }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? t("learn.claim.error"));
      router.push(`/learn/certificates/${encodeURIComponent(reference)}?celebrate=1`);
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t("learn.claim.error"));
      setBusy(false);
    }
  }

  const input = "mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-lg font-semibold text-[var(--ink)] focus:border-[var(--blue2)] focus:outline-none focus:ring-2 focus:ring-[var(--blue2)]/20";
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6" data-testid="claim-form">
        <label className="block text-sm font-semibold text-[var(--ink2)]">
          {t("learn.claim.nameLabel")}
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={input} data-testid="claim-name" />
        </label>
        <label className="block text-sm font-semibold text-[var(--ink2)]">
          {t("learn.claim.againLabel")}
          <input value={again} onChange={(e) => setAgain(e.target.value)} onPaste={(e) => e.preventDefault()} autoComplete="off" className={input} data-testid="claim-again" />
        </label>
        <p className={`text-sm ${again && !match ? "text-red-600" : "text-[var(--ink3)]"}`} aria-live="polite">
          {again ? (match ? `✓ ${t("learn.claim.matches")}` : t("learn.claim.mismatch")) : t("learn.claim.hint")}
        </p>
        <label className="flex items-start gap-3 rounded-xl bg-[var(--s2)] p-3 text-sm text-[var(--ink2)]">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4" data-testid="claim-agree" />
          <span>{t("learn.claim.agree")}</span>
        </label>
        {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{err}</p>}
        <button type="submit" disabled={busy || !nameOk || !match || !agree} className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#1B3A6B] px-6 text-base font-bold text-white disabled:opacity-50" data-testid="claim-submit">
          {busy && <Loader2 size={18} className="animate-spin" aria-hidden />} {t("learn.claim.submit")}
        </button>
      </form>
      <div>
        <p className="mb-2 text-sm font-semibold text-[var(--ink2)]">{t("learn.claim.previewTitle")}</p>
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={t("learn.claim.previewTitle")} className="block h-auto w-full" data-testid="claim-preview" />
          ) : (
            <div className="flex aspect-[2000/1414] items-center justify-center p-6 text-center text-sm text-[var(--ink3)]">{t("learn.claim.previewHint")}</div>
          )}
          {loadingPreview && <Loader2 size={20} className="absolute right-3 top-3 animate-spin text-[var(--ink3)]" aria-hidden />}
        </div>
      </div>
    </div>
  );
}
