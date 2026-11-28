// Game Forge: the filter every piece of game text passes (the kid's own words,
// the AI's patches and characters, quick changes). Games are shared with
// family by link, so: plain text, no links, no contact details, no bad words.
// Client-safe.
import { hasBadWords } from "@/lib/learn/youth-text";

// Words that do not belong in a game a young person shares, on top of the
// youth list (lib/learn/youth-text.ts). Whole words, any case.
const EXTRA = ["nazi", "suicide", "cocaine", "heroin", "weed", "beer", "vodka", "casino", "gamble", "gambling", "nude", "naked", "boobs", "penis", "vagina"];
const EXTRA_RE = new RegExp(`(^|[^\\p{L}])(${EXTRA.join("|")})(?=[^\\p{L}]|$)`, "iu");

export type TextProblem = "markup" | "links" | "contact" | "words" | "control";

/** Why this text cannot be in a game, or null when it is fine. */
export function gameTextProblem(raw: string): TextProblem | null {
  if (!raw) return null;
  const s = raw.normalize("NFC");
  // Control characters (newlines are not used in game text either).
  if (/[\u0000-\u001f\u007f‪-‮⁦-⁩]/.test(s)) return "control";
  if (/[<>]/.test(s)) return "markup";
  if (/https?:|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|me|ly|app|gg|tv|fr|ke|tz|ug|uk|info|biz|link|xyz|ru|cn)\b/i.test(s)) return "links";
  if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(s) || /(^|\s)@[a-z0-9_]{2,}/i.test(s)) return "contact";
  // Phone numbers: nine or more digits in a row, give or take separators.
  const phone = s.match(/\+?\d[\d\s().-]{7,}\d/);
  if (phone && phone[0].replace(/\D/g, "").length >= 9) return "contact";
  if (hasBadWords(s) || EXTRA_RE.test(s)) return "words";
  return null;
}

/** Trims and squeezes spaces; drops characters the filter would refuse anyway. */
export function tidyGameText(raw: string, max: number): string {
  return raw
    .replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
