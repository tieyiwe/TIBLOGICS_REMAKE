"use client";

import { useServerDraft, type DraftSaveStatus, type ServerDraftOptions } from "@/lib/learn/drafts/client";

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
  return useServerDraft(key, value, setValue, opts).status;
}
