// AI-Empowered Youth: the filter for free text adults send to a child
// (encouragement messages, sponsor notes, the "other" relationship). Plain
// text only, no links, no contact details (email, phone, @handles), no bad
// words. Client-safe (no imports).

// A short list of words a child should never receive (EN, FR, SW), matched
// as whole words, lower case. Staff moderation and reports catch the rest.
const BAD_WORDS = [
  "fuck", "fucking", "shit", "bitch", "bastard", "asshole", "dick", "cunt", "slut", "whore", "nigger", "faggot", "retard", "porn", "sex", "sexy", "kill yourself",
  "merde", "putain", "connard", "connasse", "salope", "pute", "enculé", "bâtard",
  "malaya", "kuma", "mkundu", "msenge",
];

const escRe = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BAD_RE = new RegExp(`(^|[^\\p{L}])(${BAD_WORDS.map(escRe).join("|")})(?=[^\\p{L}]|$)`, "iu");

export function hasBadWords(s: string): boolean {
  return BAD_RE.test(s.normalize("NFC"));
}

/** The cleaned text, or null when it cannot be sent as written. */
export function cleanFreeText(raw: string, max: number, min = 1): string | null {
  const s = raw.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  if (s.length < min || s.length > max) return null;
  if (/https?:|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|me|ly|app|gg|tv|fr|ke|tz|ug|uk|info|biz|link|xyz)\b/i.test(s)) return null;
  if (/[^\s@]+@[^\s@]+/.test(s) || /(^|\s)@\w/.test(s)) return null;
  if (/(\+?\d[\d\s().-]{6,}\d)/.test(s)) return null;
  if (hasBadWords(s)) return null;
  return s;
}
