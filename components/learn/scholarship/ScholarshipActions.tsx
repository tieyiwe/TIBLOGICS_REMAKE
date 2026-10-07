"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useT } from "@/lib/i18n/client";

async function post(url: string, body: unknown, fallback: string): Promise<{ url?: string }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? fallback);
  return data;
}

/** Accepts the award with its emailed link, then opens the scholarship page. */
export function AcceptScholarshipButton({ token }: { token: string }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await post("/api/learn/scholarship/accept", { token }, t("learn.scholar.error.generic"));
            router.push("/scholarship?welcome=1");
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : t("learn.scholar.error.generic"));
            setBusy(false);
          }
        }}
        className="w-full rounded-full bg-gradient-to-r from-[#F47C4C] to-[#F9A738] px-5 py-3.5 text-sm font-black text-[#131A1B] shadow-sm transition hover:brightness-105 disabled:opacity-60"
      >
        {busy ? t("learn.scholar.busy") : t("learn.scholar.claim.accept")}
      </button>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

/**
 * Uses one scholarship track. First a summary: the track price, what the
 * scholarship covers (the saving) and what the learner pays today. Then it
 * opens the track (free) or goes to checkout at the scholarship price.
 */
export function PickTrackButton({
  scholarshipId, trackId, trackTitle, label, price, covered, pay, pct,
}: { scholarshipId: string; trackId: string; trackTitle: string; label: string; price: string; covered: string; pay: string; pct: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="min-h-11 w-full rounded-full bg-[var(--ink)] px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:w-auto sm:self-end">
        {label}
      </button>
    );
  }
  return (
    <div className="rounded-xl border border-[#F4C9A0] bg-[#FFFBF6] p-4" data-testid="pick-summary">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.scholar.sum.title")}</p>
      <dl className="mt-2 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="min-w-0 break-words text-[var(--ink2)]">{trackTitle}</dt>
          <dd className="shrink-0 tabular-nums text-[var(--ink)]">{price}</dd>
        </div>
        <div className="flex justify-between gap-3 text-emerald-800">
          <dt>{t("learn.scholar.sum.covered", { pct: String(pct) })}</dt>
          <dd className="shrink-0 tabular-nums font-semibold">−{covered}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-[#F4C9A0] pt-1.5 font-black text-[var(--ink)]">
          <dt>{t("learn.scholar.sum.pay")}</dt>
          <dd className="shrink-0 tabular-nums">{pay}</dd>
        </div>
      </dl>
      <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900">{t("learn.scholar.sum.save", { amount: covered })}</p>
      <p className="mt-2 text-xs text-[var(--ink3)]">{t("learn.scholar.page.final")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const data = await post("/api/learn/scholarship/pick", { scholarshipId, trackId }, t("learn.scholar.error.generic"));
              if (!data.url) throw new Error(t("learn.scholar.error.generic"));
              window.location.href = data.url;
            } catch (err) {
              setError(err instanceof Error ? err.message : t("learn.scholar.error.generic"));
              setBusy(false);
            }
          }}
          className="min-h-11 flex-1 rounded-full bg-[var(--ink)] px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? t("learn.scholar.busy") : label}
        </button>
        <button type="button" disabled={busy} onClick={() => setOpen(false)} className="min-h-11 rounded-full border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)]">
          {t("learn.scholar.sum.cancel")}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}

export function SignOutBack({ to }: { to: string }) {
  const t = useT();
  return (
    <button type="button" onClick={() => signOut({ callbackUrl: to })} className="mt-3 w-full rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--ink)]">
      {t("learn.scholar.claim.signOut")}
    </button>
  );
}
