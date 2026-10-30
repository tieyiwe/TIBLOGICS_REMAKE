// Bounds for the chat widgets (/api/claude/float, /api/claude/advisor, and
// the admin agents at /api/claude/agents).
//
// The routes pass the browser's `messages` array to the model, and every call
// is paid for the whole conversation so far. Real public conversations are
// short (replies are 2-4 sentences), so only the latest turns are sent: an
// older start of a long chat is dropped rather than refused. The public
// routes are anonymous and rate limited per IP; their spend also has its own
// daily budget (lib/ai-spend-guard.ts).

export type ChatMessage = { role: "user" | "assistant"; content: string };

export interface ChatLimits {
  /** Turns kept (the latest ones). */
  maxMessages: number;
  /** Characters kept across the kept turns. */
  maxTotalChars: number;
}

/** The public widgets: about ten exchanges. */
export const PUBLIC_CHAT_LIMITS: ChatLimits = { maxMessages: 20, maxTotalChars: 12_000 };

/** Staff tools: longer working sessions. */
export const STAFF_CHAT_LIMITS: ChatLimits = { maxMessages: 60, maxTotalChars: 40_000 };

/** A single message longer than this is refused, not cut. */
const MAX_MESSAGE_CHARS = 8_000;
/** Turns accepted in the request at all (the kept ones are fewer). */
const MAX_RECEIVED = 200;

/**
 * Plain text user/assistant turns, trimmed to the latest ones within `limits`,
 * starting and ending with the visitor's turn. Null when the payload is not
 * acceptable.
 */
export function boundChatMessages(raw: unknown, limits: ChatLimits = PUBLIC_CHAT_LIMITS): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_RECEIVED) return null;
  const all: ChatMessage[] = [];
  for (const m of raw) {
    const role = (m as { role?: unknown })?.role;
    const content = (m as { content?: unknown })?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    if (content.length > MAX_MESSAGE_CHARS) return null;
    if (content.trim()) all.push({ role, content }); // an empty reply (a failed stream) is skipped
  }
  if (all.length === 0) return null;
  // The model answers the visitor's last message: a request ending with the
  // assistant's turn is refused (the API rejects it too).
  if (all[all.length - 1].role !== "user") return null;

  const kept: ChatMessage[] = [];
  let total = 0;
  for (let i = all.length - 1; i >= 0 && kept.length < limits.maxMessages; i--) {
    total += all[i].content.length;
    if (total > limits.maxTotalChars && kept.length > 0) break;
    kept.unshift(all[i]);
  }
  // A conversation starts with the visitor (drops a greeting or a cut-off reply).
  while (kept.length > 0 && kept[0].role !== "user") kept.shift();
  return kept.length > 0 ? kept : null;
}
