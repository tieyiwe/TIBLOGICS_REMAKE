// Bounds for the public chat widgets (/api/claude/float, /api/claude/advisor).
//
// Both routes pass the browser's `messages` array straight to the model. They
// are anonymous and rate limited per IP, but without a size cap one request
// could carry a context window's worth of input tokens (every call is paid),
// or content blocks other than text. Real conversations are short: replies
// are 2-4 sentences.

const MAX_MESSAGES = 60;
const MAX_MESSAGE_CHARS = 8_000;
const MAX_TOTAL_CHARS = 40_000;

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** Plain text user/assistant turns within the limits, or null when the payload is not acceptable. */
export function boundChatMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null;
  const out: ChatMessage[] = [];
  let total = 0;
  for (const m of raw) {
    const role = (m as { role?: unknown })?.role;
    const content = (m as { content?: unknown })?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    if (content.length > MAX_MESSAGE_CHARS) return null;
    total += content.length;
    if (total > MAX_TOTAL_CHARS) return null;
    out.push({ role, content });
  }
  return out;
}
