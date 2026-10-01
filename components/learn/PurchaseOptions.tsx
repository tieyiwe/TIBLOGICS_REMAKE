"use client";

import Link from "next/link";
import { useState } from "react";
import { FOUNDING_PRICING } from "@/lib/payments/provider";
import { fmtPrice } from "@/lib/learn/format";
import { useLocale, useT } from "@/lib/i18n/client";

export interface PurchaseTrack {
  slug: string;
  title: string;
  /** One-time price in cents (lib/learn/pricing.ts, computed on the server). */
  priceCents: number;
  /** Already bought: the one-time option shows as owned. */
  owned?: boolean;
}

/**
 * The two ways to buy, side by side:
 *   Own this track: $297 one time, lifetime access
 *   All tracks: $89/month
 *
 * mode "checkout" (signed-in learner) starts Stripe Checkout; mode "link"
 * (public pages) sends the visitor to create an account first. Prices shown
 * here are display only: checkout recomputes them on the server.
 */
export default function PurchaseOptions({
  track,
  monthlyCents,
  monthlyCompareAtCents,
  mode,
  showSubscribe = true,
  accentColor,
}: {
  track?: PurchaseTrack | null;
  monthlyCents: number;
  monthlyCompareAtCents?: number;
  mode: "checkout" | "link";
  showSubscribe?: boolean;
  accentColor?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [busy, setBusy] = useState<"track" | "monthly" | null>(null);
  const [error, setError] = useState("");
  const signupHref = track ? `/learn/signup?track=${track.slug}` : "/learn/signup";

  async function start(kind: "track" | "monthly") {
    setBusy(kind);
    setError("");
    try {
      const res = await fetch("/api/learn/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kind === "track" ? { trackSlug: track!.slug } : { plan: "monthly", track: track?.slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? t("learn.plan.checkoutFailed"));
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("learn.error.generic"));
      setBusy(null);
    }
  }

  const btnBase =
    "mt-5 block w-full rounded-full px-4 py-3 text-center text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50";
  const accent = accentColor ?? "var(--ink)";

  return (
    <div>
      <div className={`grid gap-4 ${track && showSubscribe ? "sm:grid-cols-2" : ""}`}>
        {track && (
          <div className="flex min-w-0 flex-col rounded-2xl border-2 bg-white p-6" style={{ borderColor: accent }}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.offer.track.title")}</h3>
            <p className="mt-1 truncate text-sm font-semibold text-[var(--ink)]" title={track.title}>
              {track.title}
            </p>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
              <span className="text-3xl font-black text-[var(--ink)]">{fmtPrice(track.priceCents, locale)}</span>
              <span className="text-sm text-[var(--ink3)]">{t("learn.offer.oneTime")}</span>
            </p>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ink2)]">{t("learn.offer.track.blurb")}</p>
            {track.owned ? (
              <p className="mt-5 rounded-full bg-green-50 px-4 py-3 text-center text-sm font-bold text-green-800">
                ✓ {t("learn.offer.owned")}
              </p>
            ) : mode === "link" ? (
              <Link href={signupHref} className={`${btnBase} text-white`} style={{ background: accent }}>
                {t("learn.offer.track.buy", { price: fmtPrice(track.priceCents, locale) })}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => start("track")}
                disabled={busy !== null}
                className={`${btnBase} text-white`}
                style={{ background: accent }}
              >
                {busy === "track" ? t("learn.plan.opening") : t("learn.offer.track.buy", { price: fmtPrice(track.priceCents, locale) })}
              </button>
            )}
          </div>
        )}

        {showSubscribe && (
          <div className="flex min-w-0 flex-col rounded-2xl border border-[var(--border)] bg-white p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.offer.all.title")}</h3>
            <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{t("learn.billing.everyTrack")}</p>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
              <span className="text-3xl font-black text-[var(--ink)]">{fmtPrice(monthlyCents, locale)}</span>
              <span className="text-sm text-[var(--ink3)]">{t("learn.plan.per.month")}</span>
            </p>
            {monthlyCompareAtCents != null && FOUNDING_PRICING && (
              <p className="mt-1 text-xs text-[var(--ink3)]">
                <span className="line-through">{fmtPrice(monthlyCompareAtCents, locale)}</span>{" "}
                <span className="font-bold text-[var(--orange2)]">{t("learn.billing.foundingRate")}</span>
              </p>
            )}
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ink2)]">{t("learn.offer.all.blurb")}</p>
            {mode === "link" ? (
              <Link
                href={signupHref}
                className={`${btnBase} bg-gradient-to-r from-[var(--orange)] to-[#F9A738] text-[var(--ink)]`}
              >
                {t("learn.offer.all.cta", { price: fmtPrice(monthlyCents, locale) })}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => start("monthly")}
                disabled={busy !== null}
                className={`${btnBase} bg-gradient-to-r from-[var(--orange)] to-[#F9A738] text-[var(--ink)]`}
              >
                {busy === "monthly" ? t("learn.plan.opening") : t("learn.offer.all.cta", { price: fmtPrice(monthlyCents, locale) })}
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {error}
        </p>
      )}
      <p className="mt-4 text-center text-xs text-[var(--ink3)]">{t("learn.offer.secure")}</p>
    </div>
  );
}
