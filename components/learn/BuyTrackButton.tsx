"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { getStoredCode } from "@/lib/promotions/client-code";

/** Starts the one-time checkout for one track. The price is set on the server. */
export default function BuyTrackButton({ slug, label }: { slug: string; label: string }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/learn/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // A code applied in the promo field on this page; checked again on the server.
        body: JSON.stringify({ trackSlug: slug, ...(getStoredCode() ? { promoCode: getStoredCode() } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? t("learn.plan.checkoutFailed"));
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("learn.error.generic"));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start sm:items-end">
      <button
        type="button"
        onClick={buy}
        disabled={busy}
        className="rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? t("learn.plan.opening") : label}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
