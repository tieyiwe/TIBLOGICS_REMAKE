"use client";

// Browser-side counters for magnets and landing pages (/api/acquire/event).
// Fire and forget: a blocked request never affects the page.

export type RefType = "magnet" | "page";

export function trackAcquire(refType: RefType, slug: string, kind: "view" | "cta" | "quiz") {
  try {
    void fetch("/api/acquire/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refType, slug, kind }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

const COOKIE = "tib_utm";
const MAX_AGE = 30 * 86_400;

/**
 * Credits later sign-ups and purchases to this magnet or page when the
 * visitor arrived without a campaign of their own (a campaign cookie from a
 * post, email or tracked link is never overwritten).
 */
export function ensureCampaignCookie(source: string, medium: string, campaign: string) {
  try {
    if (document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE}=`))) return;
    if (/[?&]utm_(source|campaign)=/.test(window.location.search)) return; // UtmCapture handles it
    const value = JSON.stringify({ s: source, m: medium, c: campaign, n: null, l: null, t: Date.now() });
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE}=${encodeURIComponent(value)}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  } catch {
    /* cookies blocked */
  }
}
