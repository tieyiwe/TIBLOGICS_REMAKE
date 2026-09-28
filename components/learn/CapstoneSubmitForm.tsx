"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";

export default function CapstoneSubmitForm({
  capstoneId,
  accentColor,
  isResubmission,
}: {
  capstoneId: string;
  accentColor: string;
  isResubmission: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() && !notes.trim()) {
      setError(t("labs.capstone.needSomething"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/learn/capstone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capstoneId, submissionUrl: url.trim() || null, submissionMd: notes.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("labs.capstone.submitError"));
      setUrl("");
      setNotes("");
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("labs.error.generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
      <h2 className="text-base font-bold text-[var(--ink)]">
        {isResubmission ? t("labs.capstone.resubmitTitle") : t("labs.capstone.submitTitle")}
      </h2>
      <p className="mt-1 text-sm text-[var(--ink2)]">{t("labs.capstone.formIntro")}</p>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="cap-url" className="block text-sm font-semibold text-[var(--ink)]">
            {t("labs.capstone.link")}
          </label>
          <input
            id="cap-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
          />
          <p className="mt-1 text-xs text-[var(--ink3)]">{t("labs.capstone.linkHelp")}</p>
        </div>

        <div>
          <label htmlFor="cap-notes" className="block text-sm font-semibold text-[var(--ink)]">
            {t("labs.capstone.notes")}
          </label>
          <textarea
            id="cap-notes"
            rows={8}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("labs.capstone.notesPlaceholder")}
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
          />
          <p className="mt-1 text-xs text-[var(--ink3)]">{t("labs.capstone.markdown")}</p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 w-full rounded-full py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: accentColor }}
      >
        {busy ? t("labs.capstone.submitting") : isResubmission ? t("labs.capstone.resubmit") : t("labs.capstone.submit")}
      </button>
      <p className="mt-3 text-center text-xs text-[var(--ink3)]">
        {t("labs.capstone.reviewTime")}
      </p>
    </form>
  );
}
