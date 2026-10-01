"use client";

import PurchaseOptions, { type PurchaseTrack } from "./PurchaseOptions";
import { PLANS } from "@/lib/payments/provider";

/**
 * The plan step for a signed-in learner: own one track (one payment,
 * lifetime access) or all tracks on the monthly subscription. The annual plan
 * is no longer sold.
 */
export default function PlanPicker({ track, showSubscribe = true }: { track?: PurchaseTrack | null; showSubscribe?: boolean }) {
  return (
    <PurchaseOptions
      mode="checkout"
      track={track}
      showSubscribe={showSubscribe}
      monthlyCents={PLANS.monthly.amount}
      monthlyCompareAtCents={PLANS.monthly.compareAtAmount}
    />
  );
}
