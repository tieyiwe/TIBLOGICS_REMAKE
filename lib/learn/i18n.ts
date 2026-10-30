// Learning Box text helpers on top of the site-wide i18n (lib/i18n).
//
// This file used to hold a Learn-only English/French dictionary. Its keys now
// live in lib/i18n/messages/learn.ts ("learn." namespace, English, French and
// Swahili), read with getT() on the server and useT() on the client. What
// remains is a translator for stored locales (emails) and a coverage figure.
// Formatting helpers live in lib/learn/format.ts (client components import
// that directly so the full dictionary stays out of their bundle).
import { DEFAULT_LOCALE, format, isLocale as isSiteLocale, LOCALES as SITE_LOCALES, type Locale as SiteLocale } from "@/lib/i18n/config";
import { coverage, dictionary } from "@/lib/i18n/messages";

export * from "./format";
import type { T } from "./format";

// Kept for older imports; the Learning Box speaks every site language.
export const LOCALES = SITE_LOCALES;
export type Locale = SiteLocale;
export { DEFAULT_LOCALE };
export const isLocale = isSiteLocale;

/**
 * Translator for a stored locale (e.g. Student.locale) outside a request,
 * such as emails. Accepts old un-namespaced keys ("nav.dashboard") too.
 */
export function translator(locale: string | null | undefined): T {
  const dict = dictionary(isSiteLocale(locale) ? locale : DEFAULT_LOCALE);
  return (key, vars) => format(dict[key] ?? dict[`learn.${key}`] ?? key, vars);
}

/** Share of the Learning Box interface translated into a locale. */
export function localeCoverage(locale: Locale): { total: number; translated: number; percent: number } {
  const { missing } = coverage(locale);
  const learnKeys = Object.keys(dictionary("en")).filter((k) => k.startsWith("learn."));
  const miss = missing.filter((k) => k.startsWith("learn.")).length;
  const total = learnKeys.length;
  const translated = total - miss;
  return { total, translated, percent: total === 0 ? 100 : Math.round((translated / total) * 100) };
}
