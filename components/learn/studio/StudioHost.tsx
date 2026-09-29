"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { celebrate, bumpPractice } from "@/lib/learn/game-client";
import { STUDIO_BY_ID } from "@/lib/learn/studio/catalog";
import type { StudioResult } from "@/lib/learn/studio/types";
import { STUDIO_COMPONENTS } from "./registry";

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
  const meta = STUDIO_BY_ID.get(toolId);
  const Tool = STUDIO_COMPONENTS[toolId];
  const [progress, setProgress] = useState<ToolProgress>(initialProgress ?? {});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");

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

  return (
    <div className={embedded ? "my-5 rounded-2xl border-2 border-[var(--border)] bg-white" : ""}>
      {embedded && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-2.5">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
            <span aria-hidden="true">{meta.icon}</span> {t("studio.embedLabel")} · {t(`studio.${toolId}.name`)}
          </span>
          <Link
            href={`/learn/studio/${toolId}${challengeId ? `?c=${encodeURIComponent(challengeId)}` : ""}`}
            className="text-xs font-semibold text-[var(--blue2)] underline"
          >
            {t("studio.openFull")}
          </Link>
        </div>
      )}
      <div className={embedded ? "p-3 sm:p-4" : ""}>
        <Tool challengeId={challengeId} embedded={embedded} onComplete={onComplete} progress={progress} />
      </div>
      {status !== "idle" && (
        <p role="status" className={`px-4 pb-3 text-xs ${status === "failed" ? "text-red-600" : "text-[var(--ink3)]"}`}>
          {status === "saving" ? t("studio.saving") : status === "saved" ? t("studio.saved") : t("studio.saveFailed")}
        </p>
      )}
    </div>
  );
}
