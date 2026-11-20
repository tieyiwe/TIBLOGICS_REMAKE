"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { MotionConfig } from "framer-motion";
import Link from "next/link";
import { I18nProvider, useLazyMessages, useLocale, useT } from "@/lib/i18n/client";
import { celebrate, bumpPractice } from "@/lib/learn/game-client";
import { STUDIO_BY_ID } from "@/lib/learn/studio/catalog";
import type { StudioResult } from "@/lib/learn/studio/types";
import { STUDIO_COMPONENTS } from "./registry";
import { StudioLayoutContext } from "./StudioFrame";
import { StudioDraftContext } from "./useStudioDraft";
import DraftStatus from "../DraftStatus";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import type { DraftSaveStatus } from "@/lib/learn/drafts/client";

type ToolProgress = Record<string, { done: boolean; perfect: boolean }>;

/**
 * Runs one Studio tool: saves completed challenges (points, badges and the
 * usual celebrations) and keeps progress in sync. Used by the Studio page and
 * by ```studio embeds inside lessons.
 */
export default function StudioHost({
  toolId,
  challengeId = null,
  embedded = false,
  initialProgress,
}: {
  toolId: string;
  challengeId?: string | null;
  embedded?: boolean;
  initialProgress?: ToolProgress;
}) {
  const t = useT();
  const locale = useLocale();
  // The tool texts are not embedded in every Learn page (lib/i18n/client-messages.ts):
  // fetched here unless the page sent them (the Studio tool page does).
  const toolMessages = useLazyMessages("studio");
  const meta = STUDIO_BY_ID.get(toolId);
  const Tool = STUDIO_COMPONENTS[toolId];
  const [progress, setProgress] = useState<ToolProgress>(initialProgress ?? {});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  // The design in progress, autosaved by the tool (useStudioDraft).
  const [draftStatus, setDraftStatus] = useState<DraftSaveStatus>("idle");
  // Full screen is the SAME component tree restyled as an overlay, so nothing
  // the learner has built is lost when it opens or closes.
  const [full, setFull] = useState(false);
  const fullBtn = useRef<HTMLButtonElement>(null);
  // Full screen is modal: Tab stays inside the overlay (the page behind is
  // covered). Focus goes back to the toggle on exit (effect below).
  const overlayRef = useRef<HTMLDivElement>(null);
  useFocusTrap(overlayRef, full, { initialFocus: fullBtn, returnFocus: false });
  // The "Reduce motion" reading preference also stills framer-motion.
  const [stillMotion, setStillMotion] = useState(false);
  useEffect(() => setStillMotion(document.documentElement.getAttribute("data-rp-motion") === "reduce"), []);

  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      // A tool can claim Escape (closing its own picker) with preventDefault.
      if (e.key === "Escape" && !e.defaultPrevented) setFull(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      fullBtn.current?.focus();
    };
  }, [full]);

  // Embeds don't get progress from the server page: fetch it.
  useEffect(() => {
    if (initialProgress) return;
    fetch("/api/learn/studio/progress")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.progress?.[toolId] && setProgress(d.progress[toolId]))
      .catch(() => {});
  }, [initialProgress, toolId]);

  const onComplete = useCallback(
    async (r: StudioResult) => {
      bumpPractice();
      setProgress((p) => ({
        ...p,
        [r.challengeId]: { done: true, perfect: (p[r.challengeId]?.perfect ?? false) || r.stars === 3 },
      }));
      setStatus("saving");
      try {
        const res = await fetch("/api/learn/studio/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolId, challengeId: r.challengeId, stars: r.stars }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error);
        setStatus("saved");
        celebrate({ points: d.pointsAwarded, reason: "studio", newBadges: d.newBadges, levelUp: d.levelUp });
      } catch {
        setStatus("failed");
      }
    },
    [toolId],
  );

  if (!meta || !meta.ready || !Tool) {
    return <p className="rounded-xl bg-[var(--s2)] p-4 text-sm text-[var(--ink3)]">{t("studio.unknown")}</p>;
  }

  const layout = full ? "overlay" : embedded ? "embedded" : "page";
  const toggle = (
    <button
      ref={fullBtn}
      type="button"
      onClick={() => setFull((f) => !f)}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#D2DCE8] bg-white px-3 py-1.5 text-xs font-bold text-[var(--ink2)] hover:border-[var(--ink3)] hover:text-[var(--ink)]"
    >
      {full ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      {full ? t("studio.frame.exitFull") : t("studio.frame.full")}
    </button>
  );

  return (
    <StudioLayoutContext.Provider value={{ layout }}>
      <div
        ref={overlayRef}
        role={full ? "dialog" : undefined}
        aria-modal={full ? true : undefined}
        aria-label={full ? t(`studio.${toolId}.name`) : undefined}
        className={
          full
            ? "fixed inset-0 z-[80] flex flex-col overflow-hidden bg-[#F4F7FB]"
            : embedded
              ? "my-5 rounded-2xl border-2 border-[#D2DCE8] bg-white"
              : ""
        }
      >
        {(embedded || full) && (
          <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 ${full ? "border-b border-[#D2DCE8] bg-white" : "border-b border-[#D2DCE8]"}`}>
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
              <span aria-hidden="true">{meta.icon}</span> {!full && `${t("studio.embedLabel")} · `}{t(`studio.${toolId}.name`)}
            </span>
            <span className="flex items-center gap-2">
              {embedded && !full && (
                <Link
                  href={`/learn/studio/${toolId}${challengeId ? `?c=${encodeURIComponent(challengeId)}` : ""}`}
                  className="text-xs font-semibold text-[var(--blue2)] underline"
                >
                  {t("studio.openPage")}
                </Link>
              )}
              {toggle}
            </span>
          </div>
        )}
        {!embedded && !full && <div className="mb-3 flex justify-end">{toggle}</div>}
        <div className={full ? "flex min-h-0 flex-1 flex-col overflow-auto p-3 sm:p-5 lg:overflow-hidden" : embedded ? "p-3 sm:p-4" : ""}>
          <StudioDraftContext.Provider value={setDraftStatus}>
            <MotionConfig reducedMotion={stillMotion ? "always" : "user"}>
              {toolMessages ? (
                <I18nProvider locale={locale} dict={toolMessages}>
                  <Tool challengeId={challengeId} embedded={embedded && !full} onComplete={onComplete} progress={progress} />
                </I18nProvider>
              ) : (
                <div className="h-48 animate-pulse rounded-xl bg-[var(--s2)]" />
              )}
            </MotionConfig>
          </StudioDraftContext.Provider>
        </div>
        {draftStatus !== "idle" && (
          <p className={`px-4 ${status !== "idle" ? "" : "pb-3"} pt-1 text-right`}>
            <DraftStatus status={draftStatus} />
          </p>
        )}
        {status !== "idle" && (
          <p role="status" className={`px-4 pb-3 text-xs ${status === "failed" ? "text-red-600" : "text-[var(--ink3)]"}`}>
            {status === "saving" ? t("studio.saving") : status === "saved" ? t("studio.saved") : t("studio.saveFailed")}
          </p>
        )}
      </div>
    </StudioLayoutContext.Provider>
  );
}
