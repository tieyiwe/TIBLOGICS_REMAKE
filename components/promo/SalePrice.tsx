"use client";

import { useLocale, useT } from "@/lib/i18n/client";
import { fmtPrice } from "@/lib/learn/format";
import type { PromoDuration } from "@/lib/promotions/shared";

export interface SaleInfo {
  saleCents: number;
  originalCents: number;
  duration?: PromoDuration;
  durationMonths?: number | null;
}

/**
 * "~~$297~~ Sale" next to a sale price, plus how long a subscription keeps it.
 * The sale price itself is rendered by the caller. Display only: checkout
 * recomputes on the server.
 */
export default function SalePrice({ sale, recurring, className, tone = "light" }: { sale: SaleInfo; recurring?: boolean; className?: string; tone?: "light" | "dark" }) {
  const t = useT();
  const locale = useLocale();
  const when =
    recurring && sale.duration && sale.duration !== "forever"
      ? sale.duration === "repeating" && (sale.durationMonths ?? 1) > 1
        ? t("promo.sale.firstMonths", { n: sale.durationMonths ?? 1 })
        : sale.duration === "repeating"
          ? t("promo.sale.firstMonth")
          : t("promo.sale.firstPayment")
      : null;
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs ${className ?? ""}`}>
      <span className={tone === "dark" ? "text-white/60 line-through" : "text-[var(--ink3)] line-through"}>
        <span className="sr-only">{t("promo.sale.was", { price: "" })}</span>
        {fmtPrice(sale.originalCents, locale)}
      </span>
      <span className="rounded-full bg-[#FEF0E6] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#B8500A]">{t("promo.sale.badge")}</span>
      {when ? <span className={tone === "dark" ? "text-white/70" : "text-[var(--ink3)]"}>{when}</span> : null}
    </span>
  );
}
