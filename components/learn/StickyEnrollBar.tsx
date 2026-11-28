"use client";

import Link from "next/link";
import { trackMonthlyCents } from "@/lib/learn/track-monthly";
import { useEffect, useState } from "react";
import WaitlistForm from "./WaitlistForm";
import { PLANS, FOUNDING_PRICING } from "@/lib/payments/provider";
import { fmtPrice } from "@/lib/learn/format";
import { useLocale, useT } from "@/lib/i18n/client";
import { joinPath } from "@/lib/learn/join/choice";

// Sticky enrol CTA (Part C2). Appears after the hero scrolls away so it
// doesn't compete with the page's own call to action.
export default function StickyEnrollBar({
  trackTitle,
  accentColor,
  comingSoon,
  trackSlug,
  priceCents,
  salePriceCents,
}: {
  trackTitle: string;
  accentColor: string;
  comingSoon: boolean;
  trackSlug: string;
  /** One-time price for lifetime access to this track. */
  priceCents: number;
  /** Price under a live automatic sale, display only. */
  salePriceCents?: number | null;
}) {
  const t = useT();
  const locale = useLocale();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      // On phones the site's bottom tab bar (components/public/MobileBottomNav,
      // 60px plus the safe area) sits at the very bottom: this bar rides just
      // above it, and slides fully out of view when hidden.
      className={`fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-40 border-t border-[var(--border)] bg-white/95 backdrop-blur transition-transform duration-300 sm:bottom-0 sm:pb-[env(safe-area-inset-bottom)] ${
        show ? "translate-y-0" : "translate-y-[calc(100%+80px)] sm:translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--ink)]">{trackTitle}</p>
          <p className="text-xs text-[var(--ink3)]">
            {comingSoon ? (
              t("learn.enroll.openingSoon")
            ) : (
              <>
                {FOUNDING_PRICING && (
                  <span className="mr-1.5 font-bold text-[var(--orange2)]">{t("learn.billing.foundingRate")}</span>
                )}
                {salePriceCents != null && salePriceCents < priceCents ? (
                  <span className="mr-1.5 text-[var(--ink3)] line-through">{fmtPrice(priceCents, locale)}</span>
                ) : null}
                <strong className="text-[var(--ink2)]">
                  {t("learn.offer.trackLine", { price: fmtPrice(salePriceCents ?? priceCents, locale) })}
                </strong>{" "}
                ·{" "}
                {trackMonthlyCents(trackSlug) != null
                  ? t("learn.offer.orMonthlyLine", { price: fmtPrice(trackMonthlyCents(trackSlug) as number, locale) })
                  : t("learn.offer.orAllLine", { price: fmtPrice(PLANS.monthly.amount, locale) })}
              </>
            )}
          </p>
        </div>

        {comingSoon ? (
          <div className="w-full sm:w-auto sm:min-w-[300px]">
            <WaitlistForm trackSlug={trackSlug} />
          </div>
        ) : (
          <Link
            href={joinPath({ kind: "track", slug: trackSlug })}
            className="shrink-0 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: accentColor }}
          >
            {t("learn.enroll.createAndStart")} →
          </Link>
        )}
      </div>
    </div>
  );
}
