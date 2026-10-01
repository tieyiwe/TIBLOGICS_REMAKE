"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { putDraft } from "@/lib/learn/drafts/client";

/**
 * Remembers how far down the lesson the learner is ("pos:<lessonId>" on the
 * server, so it works on any device) and, when they come back part-way
 * through, offers to jump back there. It never scrolls without being asked.
 *
 * Each visit also refreshes the record, which is what "Continue where you
 * left off" uses as the lesson's last activity.
 */
export default function LessonPosition({
  lessonId,
  savedPct,
  accentColor,
}: {
  lessonId: string;
  /** Where they were last time, 0-100, or null. */
  savedPct: number | null;
  accentColor: string;
}) {
  const t = useT();
  const worthOffering = savedPct != null && savedPct >= 8 && savedPct <= 95;
  const [offer, setOffer] = useState(worthOffering);
  // While the offer is open the old position is kept: scrolling near the top
  // must not overwrite it. Saving starts once they choose, or scroll there.
  const armed = useRef(!worthOffering);

  useEffect(() => {
    const key = `pos:${lessonId}`;
    let sent = savedPct ?? 0;
    let current = sent;
    let timer: ReturnType<typeof setTimeout> | null = null;
    putDraft(key, { pct: sent });

    const measure = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      return h > 0 ? Math.round(Math.min(100, Math.max(0, (window.scrollY / h) * 100))) : 0;
    };
    const send = (background = false) => {
      if (!armed.current || Math.abs(current - sent) < 2) return;
      sent = current;
      putDraft(key, { pct: current }, background);
    };
    const onScroll = () => {
      current = measure();
      if (!armed.current && savedPct != null && current >= savedPct - 2) {
        armed.current = true;
        setOffer(false);
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => send(), 2000);
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") send(true);
    };
    const onLeave = () => send(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onLeave);
    return () => {
      if (timer) clearTimeout(timer);
      send(true);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onLeave);
    };
  }, [lessonId, savedPct]);

  if (!offer || savedPct == null) return null;

  function jump() {
    armed.current = true;
    setOffer(false);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(0, (savedPct! / 100) * h), behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div
      role="region"
      aria-label={t("resume.jumpBack")}
      data-jump-back={savedPct}
      className="fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-lg sm:left-auto sm:right-6 sm:max-w-sm"
    >
      <p className="text-sm text-[var(--ink2)]">{t("resume.jumpBackBody", { pct: savedPct })}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={jump}
          className="rounded-full px-4 py-2 text-sm font-bold text-white"
          style={{ background: accentColor }}
        >
          {t("resume.jumpBack")} ↓
        </button>
        <button
          type="button"
          onClick={() => {
            armed.current = true;
            setOffer(false);
          }}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--ink2)]"
        >
          {t("resume.dismiss")}
        </button>
      </div>
    </div>
  );
}
