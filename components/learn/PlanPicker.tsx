"use client";

import PurchaseOptions, { type PurchaseTrack } from "./PurchaseOptions";
import { PLANS } from "@/lib/payments/provider";
import type { SaleInfo } from "@/components/promo/SalePrice";
import type { TargetT } from "@/lib/promotions/lines";

/**
 * The plan step for a signed-in learner: own one track (one payment,
 * lifetime access) or all tracks on the monthly subscription. The annual plan
 * is no longer sold.
 */
export default function PlanPicker({
  track,
  showSubscribe = true,
  monthlySale,
  extraPromoTargets,
}: {
  track?: PurchaseTrack | null;
  showSubscribe?: boolean;
  /** Live automatic sale on the monthly plan (server-computed), display only. */
  monthlySale?: SaleInfo | null;
  extraPromoTargets?: TargetT[];
}) {
  return (
    <PurchaseOptions
      mode="checkout"
      track={track}
      showSubscribe={showSubscribe}
      monthlyCents={PLANS.monthly.amount}
      monthlyCompareAtCents={PLANS.monthly.compareAtAmount}
      monthlySale={monthlySale}
      extraPromoTargets={extraPromoTargets}
    />
  );
}
