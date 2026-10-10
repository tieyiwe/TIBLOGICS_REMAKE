import type { Locale } from "@/lib/i18n/config";
import { GLOSSARY, type GlossaryTerm } from "./terms";
import { formsPattern, type GlossEntry } from "./pattern";

export type { GlossEntry };

// Which glossary terms a lesson uses, so the lesson page sends only those to
// the browser (lib/learn/glossary/terms.ts holds the full list).


const LANG_INDEX: Record<string, 0 | 1 | 2> = { en: 0, fr: 1, sw: 2 };

export function termName(t: GlossaryTerm, locale: Locale | string): string {
  return (locale === "fr" && t.termFr) || (locale === "sw" && t.termSw) || t.term;
}

export function termDef(t: GlossaryTerm, locale: Locale | string): string {
  return t.def[LANG_INDEX[locale] ?? 0] || t.def[0];
}

/** Forms highlighted for this language: French lessons also use the English forms (acronyms, borrowed terms). */
export function termForms(t: GlossaryTerm, locale: Locale | string): string[] {
  return [...new Set([...(locale === "fr" ? t.matchFr ?? [] : []), ...t.match])].filter((f) => f.length >= 3);
}


/** The glossary terms that appear in this text. */
export function termsInText(text: string, locale: Locale | string, max = 40): GlossEntry[] {
  if (!text) return [];
  const out: GlossEntry[] = [];
  for (const t of GLOSSARY) {
    const forms = termForms(t, locale);
    if (!forms.length) continue;
    if (new RegExp(formsPattern(forms), "iu").test(text)) {
      out.push({ id: t.id, term: termName(t, locale), def: termDef(t, locale), forms });
      if (out.length >= max) break;
    }
  }
  return out;
}
