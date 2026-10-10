// Client-safe and tiny: no term list here (that is lib/learn/glossary/terms.ts).

/** One term as a lesson needs it: the forms to highlight and the definition in the learner's language. */
export interface GlossEntry {
  id: string;
  term: string;
  def: string;
  forms: string[];
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A whole-word pattern for these forms (longest first); use with the "iu" or "giu" flags. */
export function formsPattern(forms: string[]): string {
  return `(?<![\\p{L}\\p{N}])(?:${[...forms].sort((a, b) => b.length - a.length).map(esc).join("|")})(?![\\p{L}\\p{N}])`;
}
