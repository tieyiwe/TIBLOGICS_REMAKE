"use client";

import { useEffect, useRef, useState } from "react";
import { HandHeart, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// The Tilo Vision Scholarship donate box: one time or monthly, a preset or
// custom amount, then Stripe Checkout. `from` is where the donor comes back
// if they cancel (an enum, never a URL).
type From = "arfa" | "scholarship" | "about" | "partners" | "products";
const PRESETS = [25, 50, 100, 250, 500];
const TRACK_CENTS = 29700; // the base track price (lib/learn/pricing.ts)
const MIN = 5;
const MAX = 10_000;

export function DonateBox({ from, compact = false }: { from: From; compact?: boolean }) {
  const t = useT();
  const [frequency, setFrequency] = useState<"once" | "monthly">("once");
  const [preset, setPreset] = useState<number | null>(50);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dollars = preset ?? (Number(custom.replace(/[^0-9.]/g, "")) || 0);
  const cents = Math.round(dollars * 100);
  const valid = dollars >= MIN && dollars <= MAX;
  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
  const impact =
    !valid ? null
      : cents >= TRACK_CENTS
        ? t(frequency === "monthly" ? "donate.impact.trackMonthly" : "donate.impact.track", { n: String(Math.floor(cents / TRACK_CENTS)) })
        : t(frequency === "monthly" ? "donate.impact.partMonthly" : "donate.impact.part", { pct: String(Math.max(1, Math.round((cents / TRACK_CENTS) * 100))) });

  return (
    <form
      data-testid="donate-box"
      className={compact ? "space-y-4" : "space-y-5"}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return setError(t("donate.error.amount"));
        setBusy(true);
        setError("");
        try {
          const res = await fetch("/api/scholarship/donate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amountCents: cents, frequency, from }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.url) throw new Error(data.error ?? t("donate.error.generic"));
          window.location.href = data.url;
        } catch (err) {
          setError(err instanceof Error ? err.message : t("donate.error.generic"));
          setBusy(false);
        }
      }}
    >
      <div role="radiogroup" aria-label={t("donate.frequency")} className="grid grid-cols-2 gap-1 rounded-full bg-[#EEF2F8] p-1">
        {(["once", "monthly"] as const).map((f) => (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={frequency === f}
            onClick={() => setFrequency(f)}
            className={`min-h-11 rounded-full text-sm font-bold transition ${frequency === f ? "bg-white text-[#0D1B2A] shadow-sm" : "text-[#5b6b72]"}`}
          >
            {t(f === "once" ? "donate.once" : "donate.monthly")}
          </button>
        ))}
      </div>
      <div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={preset === n}
              onClick={() => { setPreset(n); setCustom(""); setError(""); }}
              className={`min-h-11 rounded-xl border text-sm font-bold transition ${preset === n ? "border-[#F47C20] bg-[#FFF1E3] text-[#B4530F]" : "border-[#D2DCE8] bg-white text-[#0D1B2A] hover:border-[#9DB9D6]"}`}
            >
              {fmt(n)}
            </button>
          ))}
          <label className={`col-span-3 flex min-h-11 items-center rounded-xl border bg-white px-3 sm:col-span-1 ${preset === null ? "border-[#F47C20]" : "border-[#D2DCE8]"}`}>
            <span className="text-sm font-bold text-[#5b6b72]">$</span>
            <input
              inputMode="decimal"
              aria-label={t("donate.custom")}
              placeholder={t("donate.customPh")}
              value={custom}
              onFocus={() => setPreset(null)}
              onChange={(e) => { setPreset(null); setCustom(e.target.value.replace(/[^0-9.]/g, "").slice(0, 8)); setError(""); }}
              className="w-full min-w-0 bg-transparent px-1 text-sm font-bold text-[#0D1B2A] outline-none"
            />
          </label>
        </div>
        <p className="mt-2 min-h-5 text-xs font-semibold text-emerald-800" aria-live="polite">{impact}</p>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={busy || !valid}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F47C4C] to-[#F9A738] px-6 text-base font-black text-[#131A1B] shadow-sm transition hover:brightness-105 disabled:opacity-60"
      >
        <HandHeart size={18} aria-hidden />
        {busy ? t("donate.busy") : valid ? t(frequency === "monthly" ? "donate.ctaMonthly" : "donate.ctaOnce", { amount: fmt(dollars) }) : t("donate.cta")}
      </button>
      <p className="text-center text-xs text-[#7A8FA6]">{t("donate.secure")}</p>
    </form>
  );
}

/** A short explanation and the "Donate to the scholarship" button; the box opens in a dialog. */
export function DonateCallout({ from, tone = "light" }: { from: From; tone?: "light" | "dark" }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const dark = tone === "dark";
  return (
    <div
      data-testid="donate-callout"
      className={`rounded-2xl border p-5 sm:p-6 ${dark ? "border-white/15 bg-white/5 text-white" : "border-[#F4C9A0] bg-gradient-to-br from-[#FFFBF6] to-white text-[#0D1B2A]"}`}
    >
      <div className="flex flex-wrap items-start gap-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${dark ? "bg-white/10" : "bg-[#1B2A5E]"}`}>
          <HandHeart size={20} className="text-[#F9A738]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#F47C20]">{t("donate.kicker")}</p>
          <h3 className="mt-1 text-lg font-black leading-snug">{t("donate.title")}</h3>
          <p className={`mt-1.5 text-sm leading-relaxed ${dark ? "text-white/80" : "text-[#3A4A5C]"}`}>{t("donate.explain")}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-testid="donate-open"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F47C4C] to-[#F9A738] px-5 text-sm font-black text-[#131A1B] hover:brightness-105 sm:w-auto sm:self-center"
        >
          <HandHeart size={16} aria-hidden />
          {t("donate.button")}
        </button>
      </div>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === dialog.current) setOpen(false); }}
        className="w-[min(560px,calc(100vw-24px))] max-w-none rounded-2xl p-0 text-[#0D1B2A] backdrop:bg-black/50"
        aria-label={t("donate.title")}
      >
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#F47C20]">The Tilo Vision Scholarship</p>
              <h2 className="mt-1 text-xl font-black">{t("donate.title")}</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("donate.close")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-[#EEF2F8]">
              <X size={18} aria-hidden />
            </button>
          </div>
          <p className="mb-5 mt-2 text-sm leading-relaxed text-[#3A4A5C]">{t("donate.explain")}</p>
          {open && <DonateBox from={from} compact />}
        </div>
      </dialog>
    </div>
  );
}
