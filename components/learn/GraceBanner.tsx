"use client";

import { useState } from "react";

// Shown while a past_due subscription is inside its 7-day grace window.
// Access stays intact — the point is to warn, not to punish mid-lesson.
export default function GraceBanner({ graceUntil }: { graceUntil: Date | string | null }) {
  const [busy, setBusy] = useState(false);
  const until = graceUntil ? new Date(graceUntil) : null;
  const daysLeft = until
    ? Math.max(0, Math.ceil((until.getTime() - Date.now()) / 86_400_000))
    : null;

  async function openPortal() {
    setBusy(true);
    try {
      const res = await fetch("/api/learn/billing-portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.url) window.location.href = data.url;
      else setBusy(false);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div role="alert" className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <p className="min-w-0 flex-1 text-sm text-amber-900">
          <strong>We couldn't process your last payment.</strong> You still have full access
          {daysLeft != null && daysLeft > 0
            ? ` for ${daysLeft} more day${daysLeft === 1 ? "" : "s"}`
            : " for now"}
          . Update your card to keep it.
        </p>
        <button
          onClick={openPortal}
          disabled={busy}
          className="shrink-0 rounded-full bg-amber-900 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Opening…" : "Update payment method"}
        </button>
      </div>
    </div>
  );
}
