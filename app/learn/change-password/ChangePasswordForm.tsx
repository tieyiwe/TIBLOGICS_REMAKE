"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n/client";

const input =
  "mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20";

export default function ChangePasswordForm({ email }: { email: string }) {
  const t = useT();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (next.length < 10) return setError(t("changePassword.tooShort"));
    if (next !== confirm) return setError(t("changePassword.mismatch"));
    if (next === current) return setError(t("changePassword.same"));
    setBusy(true);
    try {
      const res = await fetch("/api/learn/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, password: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("changePassword.error"));
      router.replace("/learn");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("changePassword.error"));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      {/* Lets password managers save the new password against the right account. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <div>
        <label htmlFor="cp-current" className="block text-sm font-semibold text-[var(--ink)]">{t("changePassword.current")}</label>
        <input id="cp-current" type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={input} />
      </div>
      <div>
        <label htmlFor="cp-new" className="block text-sm font-semibold text-[var(--ink)]">{t("changePassword.new")}</label>
        <input id="cp-new" type="password" required minLength={10} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={input} aria-describedby="cp-hint" />
        <p id="cp-hint" className="mt-1 text-xs text-[var(--ink3)]">{t("changePassword.hint")}</p>
      </div>
      <div>
        <label htmlFor="cp-confirm" className="block text-sm font-semibold text-[var(--ink)]">{t("changePassword.confirm")}</label>
        <input id="cp-confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-[var(--ink)] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? t("changePassword.saving") : t("changePassword.submit")}
      </button>
    </form>
  );
}
