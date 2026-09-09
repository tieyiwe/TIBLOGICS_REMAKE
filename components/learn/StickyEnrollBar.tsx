"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import WaitlistForm from "./WaitlistForm";
import { PLANS, formatPlanPrice, FOUNDING_PRICING } from "@/lib/payments/provider";

// Sticky enrol CTA (Part C2). Appears after the hero scrolls away so it
// doesn't compete with the page's own call to action.
export default function StickyEnrollBar({
  trackTitle,
  accentColor,
  comingSoon,
  trackSlug,
}: {
  trackTitle: string;
  accentColor: string;
  comingSoon: boolean;
  trackSlug: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-white/95 backdrop-blur transition-transform duration-300 sm:bottom-0 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--ink)]">{trackTitle}</p>
          <p className="text-xs text-[var(--ink3)]">
            {comingSoon ? (
              "Opening soon — join the waitlist"
            ) : (
              <>
                {FOUNDING_PRICING && (
                  <span className="mr-1.5 font-bold text-[var(--orange2)]">Founding rate</span>
                )}
                <strong className="text-[var(--ink2)]">
                  {formatPlanPrice(PLANS.monthly)}/mo
                </strong>{" "}
                · every track included
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
            href={`/learn/signup?track=${trackSlug}`}
            className="shrink-0 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: accentColor }}
          >
            Create account & start →
          </Link>
        )}
      </div>
    </div>
  );
}
