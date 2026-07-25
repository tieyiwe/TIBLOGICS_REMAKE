"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() && !notes.trim()) {
      setError("Add a link to your work, a written submission, or both.");
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
      if (!res.ok) throw new Error(data.error ?? "Could not submit");
      setUrl("");
      setNotes("");
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
      <h2 className="text-base font-bold text-[var(--ink)]">
        {isResubmission ? "Resubmit your capstone" : "Submit your capstone"}
      </h2>
      <p className="mt-1 text-sm text-[var(--ink2)]">
        Link to your work (a doc, repo, slide deck, or video), and add anything the reviewer should
        know before they start.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="cap-url" className="block text-sm font-semibold text-[var(--ink)]">
            Link to your work
          </label>
          <input
            id="cap-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
          />
          <p className="mt-1 text-xs text-[var(--ink3)]">
            Make sure the link is publicly viewable, or the reviewer won't be able to open it.
          </p>
        </div>

        <div>
          <label htmlFor="cap-notes" className="block text-sm font-semibold text-[var(--ink)]">
            Notes for the reviewer
          </label>
          <textarea
            id="cap-notes"
            rows={8}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what you built, the decisions you made and why, and anything you'd like feedback on."
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
          />
          <p className="mt-1 text-xs text-[var(--ink3)]">Markdown is supported.</p>
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
        {busy ? "Submitting…" : isResubmission ? "Resubmit for review" : "Submit for review"}
      </button>
      <p className="mt-3 text-center text-xs text-[var(--ink3)]">
        Reviews typically take up to 5 business days. You'll get an email when the status changes.
      </p>
    </form>
  );
}
