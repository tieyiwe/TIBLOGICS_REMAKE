"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n/client";

const DISMISS_KEY = "tib_promo_banner_dismissed";

/**
 * The live promotion's banner (set in /admin_pro/promotions). Fetched per
 * page view from /api/promotions/banner, so publishing or pausing shows at
 * once without making static pages dynamic. "fixed" variant sits inside the
 * site's fixed header and sets --promo-bar so the page content moves down.
 */
export default function PromoBanner({ variant = "fixed" }: { variant?: "fixed" | "inline" }) {
  const t = useT();
  const [banner, setBanner] = useState<{ id: string; text: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/promotions/banner", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { banner?: { id: string; text: string } | null } | null) => {
        if (!live || !d?.banner) return;
        try {
          if (window.sessionStorage.getItem(DISMISS_KEY) === d.banner.id) return;
        } catch {}
        setBanner(d.banner);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (variant !== "fixed") return;
    const root = document.documentElement;
    const el = ref.current;
    if (!banner || !el) {
      root.style.removeProperty("--promo-bar");
      return;
    }
    const sync = () => root.style.setProperty("--promo-bar", `${el.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--promo-bar");
    };
  }, [banner, variant]);

  if (!banner) return null;
  return (
    <div
      ref={ref}
      role="region"
      aria-label={t("promo.banner.label")}
      className="flex min-h-[36px] items-center justify-center gap-2 bg-[#0D1B2A] px-10 py-1.5 text-center text-xs font-semibold leading-snug text-white sm:text-sm"
      style={{ position: "relative" }}
      data-promo-banner={banner.id}
    >
      <span className="line-clamp-2">
        <span aria-hidden="true" className="mr-1.5 text-[#F47C20]">●</span>
        {banner.text}
      </span>
      <button
        type="button"
        aria-label={t("promo.banner.dismiss")}
        onClick={() => {
          try {
            window.sessionStorage.setItem(DISMISS_KEY, banner.id);
          } catch {}
          setBanner(null);
        }}
        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white/70 hover:text-white"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
