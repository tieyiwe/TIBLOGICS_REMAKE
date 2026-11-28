"use client";

import { createContext, useContext, useEffect } from "react";
import { useServerDraft, type DraftSaveStatus, type ServerDraftOptions } from "@/lib/learn/drafts/client";

/** StudioHost listens here and shows the "Saved" line under the tool. */
export const StudioDraftContext = createContext<((s: DraftSaveStatus) => void) | null>(null);

/**
 * Keeps a Learning Studio tool's current design for one challenge saved on
 * the server ("studio:<toolId>:<challengeId>"), so it follows the learner to
 * any device. The tool keeps its own state and storage; this only mirrors it.
 *
 * Pass `value` as undefined until the tool has loaded its design for this
 * challenge. `setValue` receives a newer saved design when there is one.
 */
export function useStudioDraft<T>(
  toolId: string,
  challengeId: string | null | undefined,
  value: T | undefined,
  setValue: (v: T) => void,
  opts?: ServerDraftOptions<T>,
): DraftSaveStatus {
  const key = challengeId && /^[A-Za-z0-9_-]{1,64}$/.test(challengeId) ? `studio:${toolId}:${challengeId}` : null;
  const { status } = useServerDraft(key, value, setValue, opts);
  const report = useContext(StudioDraftContext);
  useEffect(() => {
    report?.(status);
  }, [report, status]);
  return status;
}
