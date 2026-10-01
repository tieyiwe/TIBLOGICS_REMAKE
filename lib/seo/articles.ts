// AI Times articles for search: which languages an article is readable in
// (English plus any cached translation), the language URLs (?lang=), and the
// author entity. Shared by the article page, the sitemap and the RSS feed.

import { LOCALES, type Locale } from "@/lib/i18n/config";
import { cachedPostSummaries } from "@/lib/i18n/sources/blog";
import { ORG_ID, SITE_NAME, absUrl } from "./site";
import type { JsonLdNode } from "./jsonld";

/** The article's URL in a language: English is the plain URL. */
export function articleUrl(slug: string, locale: Locale = "en"): string {
  const base = absUrl(`/ai-times/${slug}`);
  return locale === "en" ? base : `${base}?lang=${locale}`;
}

/**
 * Languages each article can be read in, from the translation cache. Never
 * asks the model; a language whose translation is not ready is left out, so
 * hreflang only points at real translations.
 */
export async function articleLanguages(slugs: string[]): Promise<Map<string, Locale[]>> {
  const out = new Map<string, Locale[]>(slugs.map((s) => [s, ["en"] as Locale[]]));
  if (!slugs.length) return out;
  for (const locale of LOCALES) {
    if (locale === "en") continue;
    const hits = await cachedPostSummaries(locale, slugs).catch(() => ({}) as Record<string, unknown>);
    for (const slug of Object.keys(hits)) out.get(slug)?.push(locale);
  }
  return out;
}

/** hreflang map for one article (plus x-default = English). */
export function articleAlternates(slug: string, langs: Locale[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of langs) map[l] = articleUrl(slug, l);
  map["x-default"] = articleUrl(slug, "en");
  return map;
}

/**
 * The byline as an entity. House bylines ("TIBLOGICS Editorial", "Echelon
 * AI") are the organisation, not a person; marking them up as a Person
 * would be untrue.
 */
export function authorNode(author: string): JsonLdNode {
  if (/tiblogics|editorial|echelon|\bai\b/i.test(author)) {
    return { "@type": "Organization", "@id": ORG_ID, name: SITE_NAME, url: absUrl("/") };
  }
  return { "@type": "Person", name: author };
}
