"use client";

import { useT } from "@/lib/i18n/client";
import type { DraftSaveStatus } from "@/lib/learn/drafts/client";

/** The quiet "Saving… / Saved / Offline: saved on this device" line next to work in progress. */
export default function DraftStatus({ status, className = "" }: { status: DraftSaveStatus; className?: string }) {
  const t = useT();
  const text =
    status === "saving"
      ? t("drafts.saving")
      : status === "saved"
        ? t("drafts.saved")
        : status === "local"
          ? t("drafts.local")
          : status === "restored"
            ? t("drafts.restored")
            : "";
  return (
    <span
      role="status"
      aria-live="polite"
      data-draft-status={status}
      className={`text-xs ${status === "local" ? "text-[#B45309]" : "text-[var(--ink3)]"} ${className}`}
    >
      {text && (
        <>
          <span aria-hidden="true">{status === "local" ? "⚠ " : status === "saving" ? "" : "✓ "}</span>
          {text}
        </>
      )}
    </span>
  );
}
