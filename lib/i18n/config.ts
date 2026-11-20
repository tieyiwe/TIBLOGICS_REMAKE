// Site languages. English is primary; French and Swahili are full
// translations. The visitor's browser language picks the first one, and the
// language switcher (a cookie) overrides it.

export const LOCALES = ["en", "fr", "sw"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "tib_lang";

/**
 * Learning Box tracks are offered in English and French only. Inside the
 * Learning Box a Swahili visitor sees English; everywhere else keeps all
 * three languages.
 */
export const LEARN_LOCALES = ["en", "fr"] as const satisfies readonly Locale[];
export function learnLocale(locale: Locale): Locale {
  return (LEARN_LOCALES as readonly string[]).includes(locale) ? locale : "en";
}
export const LEARN_PATH = /^\/(learn|learning-box|p|certificates|badges)(\/|$)/;

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  sw: "Kiswahili",
};

/** Name used when telling a model which language to write in. */
export const LANGUAGE_FOR_AI: Record<Locale, string> = {
  en: "English",
  fr: "French",
  sw: "Swahili (standard Kiswahili)",
};

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** Best supported language from an Accept-Language header. */
export function negotiate(accept: string | null | undefined): Locale {
  if (!accept) return DEFAULT_LOCALE;
  const ranked = accept
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { base: tag.toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const r of ranked) if (isLocale(r.base)) return r.base;
  return DEFAULT_LOCALE;
}

/** A sentence for system prompts so AI replies match the visitor's language. */
export function replyInLanguage(locale: Locale): string {
  return locale === "en" ? "" : `Write your reply in ${LANGUAGE_FOR_AI[locale]}, whatever language the instructions above are in.`;
}

export type Vars = Record<string, string | number>;

export function format(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}
