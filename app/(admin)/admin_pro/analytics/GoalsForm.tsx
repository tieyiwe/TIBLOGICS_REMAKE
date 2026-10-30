"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Monthly targets (owner and admins): revenue in dollars, bookings, sign-ups.
// Saved through /api/admin/analytics/goals (revenue stored in cents).
export default function GoalsForm({ month, initial }: { month: string; initial: Record<string, number | null> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [v, setV] = useState({
    revenue: initial.revenue != null ? String(Math.round(initial.revenue / 100)) : "",
    bookings: initial.bookings != null ? String(initial.bookings) : "",
    signups: initial.signups != null ? String(initial.signups) : "",
  });
  const num = (s: string, mul = 1) => (s.trim() === "" ? null : Math.round(Number(s) * mul));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const goals = { revenue: num(v.revenue, 100), bookings: num(v.bookings), signups: num(v.signups) };
    if (Object.values(goals).some((x) => x != null && (!Number.isFinite(x) || x < 0))) {
      setErr("Enter positive numbers.");
      setBusy(false);
      return;
    }
    const r = await fetch("/api/admin/analytics/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month, goals }) }).catch(() => null);
    setBusy(false);
    if (!r?.ok) {
      const j = await r?.json().catch(() => ({}));
      setErr(j?.error ?? "Could not save.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  const field = "h-9 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-2.5 font-dm text-[13px] text-[var(--a-ink)] focus:border-[var(--a-blue)] focus:outline-none";
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-4 font-dm text-xs font-semibold text-[var(--a-blue)] hover:underline" data-testid="goals-edit">
        Set targets
      </button>
    );
  return (
    <form onSubmit={save} className="mt-4 space-y-2 border-t border-[var(--a-border)] pt-3" data-testid="goals-form">
      {([["revenue", "Revenue (USD)"], ["bookings", "Bookings"], ["signups", "ARFA sign-ups"]] as const).map(([k, label]) => (
        <label key={k} className="block font-dm text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--a-ink-3)]">
          {label}
          <input inputMode="numeric" name={k} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "") })} className={`${field} mt-1`} />
        </label>
      ))}
      {err && <p className="font-dm text-xs text-[var(--a-danger)]">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="h-9 rounded-[var(--a-radius-control)] bg-[var(--a-blue)] px-4 font-dm text-[13px] font-semibold text-white disabled:opacity-60">Save</button>
        <button type="button" onClick={() => setOpen(false)} className="h-9 px-2 font-dm text-[13px] font-semibold text-[var(--a-ink-3)]">Cancel</button>
      </div>
    </form>
  );
}
