"use client";

import { useEffect } from "react";
import { ensureCampaignCookie, trackAcquire, type RefType } from "./track";

/** Counts the view once the page is on screen and sets the fallback campaign cookie. */
export default function PageBeacon({ refType, slug, campaign }: { refType: RefType; slug: string; campaign: string }) {
  useEffect(() => {
    ensureCampaignCookie("acquire", refType === "magnet" ? "lead-magnet" : "landing", campaign);
    trackAcquire(refType, slug, "view");
  }, [refType, slug, campaign]);
  return null;
}
