// Comment text rules. Plain text only (shown as text, never as HTML), line
// breaks kept. Email addresses are refused (readers' contact details are not
// published). Links, phone numbers and words on the platform's list are
// allowed but the comment waits for staff: spam usually carries one, while a
// genuine reader sometimes cites a source or discusses a sensitive topic.
import { hasBadWords } from "@/lib/learn/youth-text";
import { BODY_MAX, BODY_MIN, NAME_MAX, NAME_MIN } from "./types";

export type TextProblem = "short" | "long" | "email";
export type HoldReason = "links" | "phone" | "words";

const LINK = /https?:|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|me|ly|app|gg|tv|fr|ke|tz|ug|uk|info|biz|link|xyz|ru|cn|top|site|online|shop)\b/i;
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const PHONE = /(\+?\d[\d\s().-]{8,}\d)/;

/** Strips markup and control characters, tidies spaces, keeps up to one blank line. */
function tidy(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function cleanCommentBody(raw: string): { ok: true; body: string; hold: HoldReason | null } | { ok: false; problem: TextProblem } {
  const body = tidy(raw);
  if (body.length < BODY_MIN) return { ok: false, problem: "short" };
  if (body.length > BODY_MAX) return { ok: false, problem: "long" };
  if (EMAIL.test(body)) return { ok: false, problem: "email" };
  const hold = hasBadWords(body) ? "words" : LINK.test(body) ? "links" : PHONE.test(body) ? "phone" : null;
  return { ok: true, body, hold };
}

/** A display name: one line, no links, contact details or bad words. */
export function cleanName(raw: string): string | null {
  const s = tidy(raw).replace(/\n/g, " ").slice(0, NAME_MAX + 10).trim();
  if (s.length < NAME_MIN || s.length > NAME_MAX) return null;
  if (LINK.test(s) || EMAIL.test(s) || /\d{5,}/.test(s) || hasBadWords(s)) return null;
  return s;
}
