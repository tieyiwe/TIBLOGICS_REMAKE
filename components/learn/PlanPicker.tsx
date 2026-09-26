"use client";

import { useState } from "react";
import { formatPlanPrice, FOUNDING_PRICING, type PlanDefinition } from "@/lib/payments/provider";

export default function PlanPicker({
  plans,
  track,
}: {
  plans: PlanDefinition[];
  track?: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function start(plan: string) {
    setBusy(plan);
    setError("");
    try {
      const res = await fetch("/api/learn/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, track }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not start checkout");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2">
        {plans.map((p) => {
          const best = p.id === "annual";
          const saving =
            p.compareAtAmount != null
              ? Math.round(((p.compareAtAmount - p.amount) / p.compareAtAmount) * 100)
              : null;
          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 ${
                best ? "border-[var(--orange)] shadow-md" : "border-[var(--border)]"
              }`}
            >
              {best && (
                <span className="absolute -top-3 left-6 rounded-full bg-[var(--orange)] px-3 py-1 text-xs font-bold text-white">
                  Best value
                </span>
              )}
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--ink3)]">
                {p.label}
              </h3>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[var(--ink)]">{formatPlanPrice(p)}</span>
                <span className="text-sm text-[var(--ink3)]">/{p.interval}</span>
              </p>
              {p.compareAtAmount != null && (
                <p className="mt-1 text-xs text-[var(--ink3)]">
                  <span className="line-through">${(p.compareAtAmount / 100).toFixed(0)}</span>{" "}
                  <span className="font-bold text-[var(--orange2)]">
                    {FOUNDING_PRICING ? "Founding rate" : `Save ${saving}%`}
                  </span>
                </p>
              )}
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ink2)]">{p.blurb}</p>
              <button
                onClick={() => start(p.id)}
                disabled={busy !== null}
                className={`mt-5 w-full rounded-full py-3 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50 ${
                  best
                    ? "bg-gradient-to-r from-[var(--orange)] to-[#F9A738] text-[var(--ink)]"
                    : "bg-[var(--ink)] text-white"
                }`}
              >
                {busy === p.id ? "Opening checkout…" : `Choose ${p.label}`}
              </button>
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {error}
        </p>
      )}
      <p className="mt-4 text-center text-xs text-[var(--ink3)]">
        Secure checkout. Cancel anytime from your account.
      </p>
    </div>
  );
}
