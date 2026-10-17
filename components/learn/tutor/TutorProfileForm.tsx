"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { TUTOR_LEVELS, type TutorProfileView } from "@/lib/learn/tutor/shared";

// "Tell Tutor about you": optional role or field, goal and level.
export default function TutorProfileForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: TutorProfileView | null;
  onSaved: (p: TutorProfileView) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [role, setRole] = useState(initial?.role ?? "");
  const [goal, setGoal] = useState(initial?.goal ?? "");
  const [level, setLevel] = useState(initial?.level ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/learn/tutor/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, goal, level }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t("tutor.api.failed"));
      else onSaved(data.profile);
    } catch {
      setError(t("tutor.error.network"));
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--blue2)] focus:outline-none";
  return (
    <form onSubmit={save} className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--s2)] p-3">
      <p className="text-xs leading-relaxed text-[var(--ink2)]">{t("tutor.profile.intro")}</p>
      <label className="block text-xs font-semibold text-[var(--ink)]">
        {t("tutor.profile.role")}
        <input value={role} onChange={(e) => setRole(e.target.value)} maxLength={80} placeholder={t("tutor.profile.rolePh")} className={field} />
      </label>
      <label className="block text-xs font-semibold text-[var(--ink)]">
        {t("tutor.profile.goal")}
        <input value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={200} placeholder={t("tutor.profile.goalPh")} className={field} />
      </label>
      <label className="block text-xs font-semibold text-[var(--ink)]">
        {t("tutor.profile.level")}
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={field}>
          <option value="">{t("tutor.level.none")}</option>
          {TUTOR_LEVELS.map((l) => (
            <option key={l} value={l}>
              {t(`tutor.level.${l}`)}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-full bg-[var(--ink)] px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50">
          {t("tutor.profile.save")}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-[var(--border)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ink2)]">
          {t("tutor.profile.cancel")}
        </button>
      </div>
    </form>
  );
}
