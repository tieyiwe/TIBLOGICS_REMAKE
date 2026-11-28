import type { Messages } from "../types";

// Authoring helper for the "pages" namespace: each key carries its English,
// French and Swahili text side by side, so a missing language is visible at a
// glance. French strings are written with an ordinary space before : ; ! ?
// and inside « »; the helper turns those into narrow no-break spaces so the
// punctuation never wraps onto a line of its own.

export type Tri = Record<string, [en: string, fr: string, sw: string]>;

function frenchSpacing(s: string): string {
  return s
    .replace(/ ([:;!?»])/g, " $1")
    .replace(/« /g, "« ");
}

export function tri(entries: Tri): Messages {
  const out: Messages = { en: {}, fr: {}, sw: {} };
  for (const [key, [en, fr, sw]] of Object.entries(entries)) {
    out.en[key] = en;
    out.fr[key] = frenchSpacing(fr);
    out.sw[key] = sw;
  }
  return out;
}
