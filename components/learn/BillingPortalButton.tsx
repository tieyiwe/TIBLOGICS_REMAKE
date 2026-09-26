"use client";

import { useState } from "react";

export default function BillingPortalButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function open() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/learn/billing-portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not open billing");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={open}
        disabled={busy}
        className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--ink2)] transition-colors hover:border-[var(--ink3)] disabled:opacity-50"
      >
        {busy ? "Opening…" : "Manage billing →"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
