// French URLs for the ARFA pages (/learning-box?lang=fr,
// /learning-box/<slug>?lang=fr), so search engines can index the French
// courses and show them to French searchers.
//
// Why: the site's language is otherwise a cookie (or the browser's
// Accept-Language) on one URL. Crawlers send neither, so they only ever saw
// English, and ARFA could not appear in French results ("formation IA en
// ligne") at all. AI Times articles already do the same (?lang=,
// lib/seo/articles.ts). Only the page's own content follows ?lang=; the
// header and footer keep the visitor's language.
//
// English stays the plain URL. Swahili is not offered: tracks are English
// and French only (lib/i18n/config.ts LEARN_LOCALES).

import type { Locale } from "@/lib/i18n/config";
import { readCached, trackFields, trackKey, type TrackSource } from "@/lib/i18n/sources/learn";

/** The ?lang= value as a page language, or null (plain URL: visitor's language). */
export function learnLangParam(v: string | string[] | undefined): "fr" | null {
  return v === "fr" ? "fr" : null;
}

/** The URL of an ARFA page in a language. */
export function learnLangPath(path: string, locale: Locale | null): string {
  return locale === "fr" ? `${path}?lang=fr` : path;
}

/** hreflang map: English (also the default) and French. */
export function learnAlternates(path: string): Record<string, string> {
  return { en: path, fr: learnLangPath(path, "fr"), "x-default": path };
}

/**
 * Slugs whose French translation is ready, from the translation cache. Never
 * calls the model, so a crawler cannot cause translation spend; a track
 * still waiting for its translation gets no French URL (it would only be the
 * English page again).
 */
export async function tracksReadyInFrench(sources: TrackSource[]): Promise<Set<string>> {
  if (!sources.length) return new Set();
  const hits = await readCached(
    "fr",
    sources.map((s) => ({ key: trackKey(s.slug), fields: trackFields(s) })),
  ).catch(() => new Map());
  return new Set(sources.filter((s) => hits.has(trackKey(s.slug))).map((s) => s.slug));
}
