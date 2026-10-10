// Vibe Code Studio: reading the AI's answer (the note and the whole file).
// Pure, so it can be tested without the server.
import { parseAssist } from "@/lib/learn/labs/code-parse";
import { stripExternalUrls } from "./safety";

/** Plain text for display (React escapes it): no web addresses, bounded. */
function cleanLine(s: string, max: number): string {
  return stripExternalUrls(s).replace(/\*\*/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

/**
 * The file in the reply. parseAssist (Code Studio) takes a whole file only.
 * When the model (or the e2e mock) answers with a bare HTML snippet, it is
 * wrapped into a page rather than lost; the learner still reviews it before
 * applying and can undo.
 */
export function extractFile(raw: string, current: string): { prose: string; code: string | null } {
  const { reply, code } = parseAssist(raw, "", current);
  if (code) return { prose: reply, code: asPage(code) };
  const fence = /```([\w-]*)[^\n]*\n([\s\S]*?)```/g;
  let last: { body: string; start: number; end: number } | null = null;
  for (let m = fence.exec(raw); m; m = fence.exec(raw)) {
    const lang = m[1].toLowerCase();
    if ((lang === "" || lang === "html" || lang === "htm") && /<[a-z][\s\S]*>/i.test(m[2]) && m[2].trim().length >= 20) {
      last = { body: m[2], start: m.index, end: m.index + m[0].length };
    }
  }
  if (!last) return { prose: raw.trim(), code: null };
  return { prose: (raw.slice(0, last.start) + raw.slice(last.end)).trim(), code: asPage(last.body) };
}

/** A whole page: a bare snippet goes inside a minimal one. */
function asPage(code: string): string {
  if (/<(!doctype|html|body|head)\b/i.test(code)) return code;
  return `<!doctype html>\n<html>\n<head>\n<meta name="viewport" content="width=device-width, initial-scale=1">\n</head>\n<body>\n${code.trim()}\n</body>\n</html>\n`;
}

/** SUMMARY / CHANGES / TRY, or the whole note as the summary when the shape was not followed. */
export function parseNote(prose: string): { summary: string; changes: string[]; tryIt: string } {
  const text = prose.replace(/\r/g, "");
  const grab = (label: string) => new RegExp(`(?:^|\\n)\\s*\\**${label}\\**\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*\\**(?:SUMMARY|CHANGES|TRY)\\**\\s*:|$)`, "i").exec(text)?.[1]?.trim() ?? "";
  const summary = grab("SUMMARY");
  const changesRaw = grab("CHANGES");
  const tryIt = grab("TRY");
  if (!summary && !changesRaw && !tryIt) return { summary: cleanLine(text, 700), changes: [], tryIt: "" };
  const changes = changesRaw
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, ""))
    .map((l) => cleanLine(l, 200))
    .filter(Boolean)
    .slice(0, 6);
  return { summary: cleanLine(summary, 400), changes, tryIt: cleanLine(tryIt, 240) };
}
