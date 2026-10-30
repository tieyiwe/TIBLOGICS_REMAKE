// Code Studio: splitting an AI reply into the explanation and the proposed
// file. Pure (no imports), so the youth Vibe Code Studio and tests can use it.

/**
 * Split a pair-programmer reply into the explanation and the proposed file.
 *
 * Fences are matched as open/close PAIRS with their language tag. The old
 * pattern only recognised ```html or bare openers, so a reply that showed a
 * ```js snippet before the file matched that snippet's closing fence as an
 * opener and proposed the prose in between as the new file.
 *
 * Only a whole file counts as a proposal. A short ```html snippet used to
 * illustrate an answer was offered as the new file, and applying it replaced
 * the learner's entire app with a few lines.
 */
export function parseAssist(
  raw: string,
  fallbackReply = "Here is the updated file.",
  currentCode = "",
): { reply: string; code: string | null } {
  const fence = /```([\w-]*)[^\n]*\n([\s\S]*?)```/g;
  const blocks: Array<{ lang: string; body: string; start: number; end: number }> = [];
  for (let m = fence.exec(raw); m; m = fence.exec(raw)) {
    blocks.push({ lang: m[1].toLowerCase(), body: m[2], start: m.index, end: m.index + m[0].length });
  }
  const looksLikeFile = (b: string) =>
    /<(!doctype|html|body|head)\b/i.test(b) || (currentCode.trim().length > 0 && b.trim().length >= currentCode.trim().length * 0.5);
  const file =
    [...blocks].reverse().find((b) => b.lang === "html" && b.body.trim().length >= 20 && looksLikeFile(b.body)) ??
    [...blocks].reverse().find((b) => !b.lang && looksLikeFile(b.body));
  if (!file) return { reply: raw.trim(), code: null };
  const reply = (raw.slice(0, file.start) + raw.slice(file.end)).trim();
  return { reply: reply || fallbackReply, code: file.body.replace(/\s+$/, "\n") };
}
