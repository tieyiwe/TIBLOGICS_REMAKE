"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import { setStoredCode, useStoredCode } from "@/lib/promotions/client-code";
import { fmtPrice } from "@/lib/learn/format";
import type { TargetT } from "@/lib/promotions/lines";

type Result = { ok: boolean; discountCents?: number; error?: string };

/**
 * "Have a promo code?" for our pre-checkout screens (ARFA plan picker, track
 * buy, store cart). Checks the code with /api/promotions/validate against the
 * items shown; the checkout route checks it again and decides.
 */
export default function PromoCodeField({ targets, email, tone = "light" }: { targets: TargetT[]; email?: string; tone?: "light" | "dark" }) {
  const t = useT();
  const locale = useLocale();
  const id = useId();
  const applied = useStoredCode();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savingCents, setSavingCents] = useState<number | null>(null);
  const checkedFor = useRef<string>("");
  const key = JSON.stringify(targets);

  async function check(code: string, quiet = false): Promise<boolean> {
    setBusy(true);
    if (!quiet) setError("");
    try {
      const res = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, targets, ...(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { email } : {}) }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string; error?: string; results?: Result[] };
      if (!res.ok || !data.ok) {
        if (!quiet) setError(data.error || t("promo.error.generic"));
        return false;
      }
      const best = (data.results ?? []).filter((r) => r.ok).reduce((m, r) => Math.max(m, r.discountCents ?? 0), 0);
      setSavingCents(best || null);
      setStoredCode(data.code || code.toUpperCase());
      return true;
    } catch {
      if (!quiet) setError(t("promo.error.generic"));
      return false;
    } finally {
      setBusy(false);
    }
  }

  // A code applied earlier in this tab: show what it saves on these items.
  useEffect(() => {
    if (!applied || checkedFor.current === `${applied}|${key}`) return;
    checkedFor.current = `${applied}|${key}`;
    setSavingCents(null);
    check(applied, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, key]);

  const dark = tone === "dark";
  const ink = dark ? "#fff" : "var(--ink)";
  const muted = dark ? "#8A9BA0" : "var(--ink3)";
  const field: React.CSSProperties = dark
    ? { background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.15)", color: "#fff" }
    : { background: "#fff", border: "1px solid var(--border)", color: "var(--ink)" };

  if (applied) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: dark ? "rgba(34,163,135,.12)" : "#ECFDF5", color: dark ? "#9FE7D2" : "#065F46" }} role="status">
        <span>
          {savingCents
            ? t("promo.field.applied", { code: applied, amount: fmtPrice(savingCents, locale) })
            : t("promo.field.appliedGeneric", { code: applied })}
        </span>
        <button type="button" className="min-h-[36px] font-bold underline" onClick={() => { setStoredCode(null); setSavingCents(null); setValue(""); }}>
          {t("promo.field.remove")}
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="min-h-[36px] text-xs font-semibold underline" style={{ color: muted }}>
        {t("promo.field.toggle")}
      </button>
    );
  }

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) check(value.trim());
      }}
    >
      <label htmlFor={id} className="mb-1 block text-xs font-semibold" style={{ color: ink }}>
        {t("promo.field.label")}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          placeholder={t("promo.field.placeholder")}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={32}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="min-h-[44px] min-w-0 flex-1 rounded-xl px-3 font-mono text-sm uppercase tracking-wide outline-none focus:ring-2 focus:ring-[var(--orange)]"
          style={field}
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="min-h-[44px] shrink-0 rounded-xl px-4 text-sm font-bold disabled:opacity-50"
          style={dark ? { background: "#fff", color: "#131A1B" } : { background: "var(--ink)", color: "#fff" }}
        >
          {busy ? t("promo.field.checking") : t("promo.field.apply")}
        </button>
      </div>
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs" style={{ color: dark ? "#F87171" : "#B91C1C" }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
