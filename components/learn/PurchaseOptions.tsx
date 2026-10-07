"use client";

import Link from "next/link";
import { useState } from "react";
import { FOUNDING_PRICING } from "@/lib/payments/provider";
import { fmtPrice } from "@/lib/learn/format";
import { useLocale, useT } from "@/lib/i18n/client";
import SalePrice, { type SaleInfo } from "@/components/promo/SalePrice";
import PromoCodeField from "@/components/promo/PromoCodeField";
import { getStoredCode } from "@/lib/promotions/client-code";
import type { TargetT } from "@/lib/promotions/lines";
import { joinPath } from "@/lib/learn/join/choice";
import { separateMonthlyNames, trackMonthlyCents } from "@/lib/learn/track-monthly";

export interface PurchaseTrack {
  slug: string;
  title: string;
  /** One-time price in cents (lib/learn/pricing.ts, computed on the server). */
  priceCents: number;
  /** Already bought: the one-time option shows as owned. */
  owned?: boolean;
  /** Price under a live automatic sale (server-computed), display only. */
  salePriceCents?: number | null;
  /** Already on this track's own monthly plan (tracks sold that way only). */
  monthlyActive?: boolean;
}

/**
 * The two ways to buy, side by side:
 *   Own this track: $297 one time, lifetime access
 *   All tracks: $89/month
 * A track sold on its own monthly plan (lib/learn/track-monthly.ts) offers
 * that plan instead of the all-tracks one: "This track, monthly: $99".
 *
 * mode "checkout" (signed-in learner) starts Stripe Checkout; mode "link"
 * (public pages) opens the one-page join flow (/learning-box/join) with the
 * option preselected: choose, create the account and pay on one page. Prices shown
 * here are display only: checkout recomputes them on the server.
 */
export default function PurchaseOptions({
  track,
  monthlyCents,
  monthlyCompareAtCents,
  mode,
  showSubscribe = true,
  accentColor,
  monthlySale,
  extraPromoTargets,
}: {
  track?: PurchaseTrack | null;
  monthlyCents: number;
  monthlyCompareAtCents?: number;
  /** Live automatic sale on the monthly plan (server-computed), display only. */
  monthlySale?: SaleInfo | null;
  /** More things on the same page a code may be for (e.g. the track grid). */
  extraPromoTargets?: TargetT[];
  mode: "checkout" | "link";
  showSubscribe?: boolean;
  accentColor?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [busy, setBusy] = useState<"track" | "monthly" | null>(null);
  const [error, setError] = useState("");
  // Public pages: the one-page join flow, with this option preselected.
  const trackHref = track ? joinPath({ kind: "track", slug: track.slug }) : joinPath(null);
  const monthlyHref = joinPath({ kind: "monthly", track: track?.slug ?? null });

  async function start(kind: "track" | "monthly") {
    setBusy(kind);
    setError("");
    try {
      const res = await fetch("/api/learn/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // A code applied in the field below goes along; the server checks it again.
        body: JSON.stringify({
          ...(kind === "track" ? { trackSlug: track!.slug } : { plan: "monthly", track: track?.slug }),
          ...(getStoredCode() ? { promoCode: getStoredCode() } : {}),
        }),
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
  const trackSale =
    track && track.salePriceCents != null && track.salePriceCents < track.priceCents
      ? { saleCents: track.salePriceCents, originalCents: track.priceCents }
      : null;
  const trackPrice = trackSale?.saleCents ?? track?.priceCents ?? 0;
  // This track has its own monthly plan: the second card sells that plan.
  const ownMonthly = trackMonthlyCents(track?.slug);
  const monthlyPrice = ownMonthly ?? monthlySale?.saleCents ?? monthlyCents;
  const promoTargets: TargetT[] = [
    ...(track && !track.owned ? [{ kind: "track" as const, slug: track.slug }] : []),
    ...(showSubscribe && ownMonthly == null ? [{ kind: "arfa_monthly" as const }] : []),
    ...(extraPromoTargets ?? []),
  ].slice(0, 12);

  return (
    <div>
      <div className={`grid gap-4 ${track && showSubscribe ? "sm:grid-cols-2" : ""}`}>
        {track && (
          <div className="flex min-w-0 flex-col rounded-2xl border-2 bg-white p-6" style={{ borderColor: accent }}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.offer.track.title")}</h3>
            <p className="mt-1 truncate text-sm font-semibold text-[var(--ink)]" title={track.title}>
              {track.title}
            </p>
            {trackSale ? <SalePrice sale={trackSale} className="mt-3" /> : null}
            <p className={`${trackSale ? "mt-1" : "mt-3"} flex flex-wrap items-baseline gap-x-2`}>
              <span className="text-3xl font-black text-[var(--ink)]">{fmtPrice(trackPrice, locale)}</span>
              <span className="text-sm text-[var(--ink3)]">{t("learn.offer.oneTime")}</span>
            </p>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ink2)]">{t("learn.offer.track.blurb")}</p>
            {track.owned ? (
              <p className="mt-5 rounded-full bg-green-50 px-4 py-3 text-center text-sm font-bold text-green-800">
                ✓ {t("learn.offer.owned")}
              </p>
            ) : mode === "link" ? (
              <Link href={trackHref} className={`${btnBase} text-white`} style={{ background: accent }}>
                {t("learn.offer.track.buy", { price: fmtPrice(trackPrice, locale) })}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => start("track")}
                disabled={busy !== null}
                className={`${btnBase} text-white`}
                style={{ background: accent }}
              >
                {busy === "track" ? t("learn.plan.opening") : t("learn.offer.track.buy", { price: fmtPrice(trackPrice, locale) })}
              </button>
            )}
          </div>
        )}

        {showSubscribe && ownMonthly != null && track && (
          <div className="flex min-w-0 flex-col rounded-2xl border border-[var(--border)] bg-white p-6" data-testid="track-monthly">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.offer.trackMonthly.title")}</h3>
            <p className="mt-1 truncate text-sm font-semibold text-[var(--ink)]" title={track.title}>
              {track.title}
            </p>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
              <span className="text-3xl font-black text-[var(--ink)]">{fmtPrice(ownMonthly, locale)}</span>
              <span className="text-sm text-[var(--ink3)]">{t("learn.plan.per.month")}</span>
            </p>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ink2)]">{t("learn.offer.trackMonthly.blurb")}</p>
            {track.monthlyActive || track.owned ? (
              <p className="mt-5 rounded-full bg-green-50 px-4 py-3 text-center text-sm font-bold text-green-800">
                ✓ {t(track.owned ? "learn.offer.owned" : "learn.offer.trackMonthly.active")}
              </p>
            ) : mode === "link" ? (
              <Link href={monthlyHref} className={`${btnBase} bg-gradient-to-r from-[var(--orange)] to-[#F9A738] text-[var(--ink)]`}>
                {t("learn.offer.trackMonthly.cta", { price: fmtPrice(ownMonthly, locale) })}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => start("monthly")}
                disabled={busy !== null}
                className={`${btnBase} bg-gradient-to-r from-[var(--orange)] to-[#F9A738] text-[var(--ink)]`}
              >
                {busy === "monthly" ? t("learn.plan.opening") : t("learn.offer.trackMonthly.cta", { price: fmtPrice(ownMonthly, locale) })}
              </button>
            )}
          </div>
        )}

        {showSubscribe && ownMonthly == null && (
          <div className="flex min-w-0 flex-col rounded-2xl border border-[var(--border)] bg-white p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.offer.all.title")}</h3>
            <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{t("learn.billing.everyTrack")}</p>
            {monthlySale ? <SalePrice sale={monthlySale} recurring className="mt-3" /> : null}
            <p className={`${monthlySale ? "mt-1" : "mt-3"} flex flex-wrap items-baseline gap-x-2`}>
              <span className="text-3xl font-black text-[var(--ink)]">{fmtPrice(monthlyPrice, locale)}</span>
              <span className="text-sm text-[var(--ink3)]">{t("learn.plan.per.month")}</span>
            </p>
            {monthlyCompareAtCents != null && FOUNDING_PRICING && !monthlySale && (
              <p className="mt-1 text-xs text-[var(--ink3)]">
                <span className="line-through">{fmtPrice(monthlyCompareAtCents, locale)}</span>{" "}
                <span className="font-bold text-[var(--orange2)]">{t("learn.billing.foundingRate")}</span>
              </p>
            )}
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ink2)]">
              {t("learn.offer.all.blurb")} {t("learn.offer.all.except", { tracks: separateMonthlyNames() })}
            </p>
            {mode === "link" ? (
              <Link
                href={monthlyHref}
                className={`${btnBase} bg-gradient-to-r from-[var(--orange)] to-[#F9A738] text-[var(--ink)]`}
              >
                {t("learn.offer.all.cta", { price: fmtPrice(monthlyPrice, locale) })}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => start("monthly")}
                disabled={busy !== null}
                className={`${btnBase} bg-gradient-to-r from-[var(--orange)] to-[#F9A738] text-[var(--ink)]`}
              >
                {busy === "monthly" ? t("learn.plan.opening") : t("learn.offer.all.cta", { price: fmtPrice(monthlyPrice, locale) })}
              </button>
            )}
          </div>
        )}
      </div>

      {mode === "checkout" && promoTargets.length > 0 && (
        <div className="mt-4 flex justify-center">
          <div className="w-full max-w-md text-center">
            <PromoCodeField targets={promoTargets} />
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {error}
        </p>
      )}
      <p className="mt-4 text-center text-xs text-[var(--ink3)]">{t("learn.offer.secure")}</p>
    </div>
  );
}
