// One helper for page metadata, so every public page gets the same complete
// set: title, description, canonical, Open Graph, Twitter card and robots.
//
// Why a helper: in the App Router a page that sets `openGraph` replaces the
// parent's object wholesale, and a page that sets none inherits the root
// layout's (the home page's URL and title). Both produced wrong previews and
// canonicals before; building them in one place keeps them consistent.

import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { OG_IMAGE, OG_IMAGE_SIZE, OG_LOCALE, ORG, SITE_NAME, absUrl } from "./site";
import { cardUrl, kickerFor, type CardBrand } from "@/lib/seo/og-card";
import { promoFor, type Promo } from "@/lib/seo/promo";

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;
/** What the root layout's title template adds (app/layout.tsx). */
export const TITLE_SUFFIX = " | TIBLOGICS";

/** Cut text at a word boundary to fit `max` characters, with an ellipsis. */
export function clip(text: string, max: number): string {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const at = cut.lastIndexOf(" ");
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:.\-–—]+$/, "")}…`;
}

/**
 * The first candidate title that fits in TITLE_MAX characters once the
 * " | TIBLOGICS" suffix is counted, as an absolute title. Candidates go from
 * most to least descriptive; when none fits, the last one is clipped.
 */
export function fitTitle(candidates: string[], suffix = TITLE_SUFFIX): string {
  for (const c of candidates) {
    if (`${c}${suffix}`.length <= TITLE_MAX) return `${c}${suffix}`;
  }
  for (const c of candidates) if (c.length <= TITLE_MAX) return c;
  return clip(candidates[candidates.length - 1], TITLE_MAX);
}

/** Plain text from a little HTML or Markdown (descriptions, excerpts). */
export function plain(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/[*_`#>]+/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export interface PageMetaInput {
  /** Path on the site ("/services") or an absolute URL. */
  path: string;
  title: string;
  description: string;
  locale?: Locale;
  /**
   * true: use the title as is. false (default): the root template adds
   * " | TIBLOGICS". Use absolute when the title already names the brand.
   */
  absoluteTitle?: boolean;
  /** Social title and description, when they should differ from the page's. */
  socialTitle?: string;
  socialDescription?: string;
  image?: string | { url: string; width?: number; height?: number; alt?: string };
  /**
   * The ad-style share preview (lib/seo/promo.ts). Default: the hand-written
   * one for this path, if any. null turns it off.
   */
  promo?: Promo | null;
  /** The card's section label and style when the page has no picture (default: from the path). */
  cardKicker?: string;
  cardBrand?: CardBrand;
  type?: "website" | "article";
  /** Keep out of search results (still followed unless `nofollow`). */
  noindex?: boolean;
  nofollow?: boolean;
  keywords?: string[];
  /**
   * hreflang: language code to path or URL, plus "x-default". Only for pages
   * that have a real URL per language (the site's language is otherwise a
   * cookie on one URL, which search engines cannot follow).
   */
  languages?: Record<string, string>;
  /** A Markdown version of the page for AI agents (<link rel="alternate" type="text/markdown">). */
  markdown?: string;
  /** Extra Open Graph fields for articles. */
  article?: { publishedTime?: string; modifiedTime?: string; authors?: string[]; section?: string; tags?: string[] };
}

export function pageMetadata(i: PageMetaInput): Metadata {
  const url = absUrl(i.path);
  const description = clip(plain(i.description), DESCRIPTION_MAX);
  // A promo (hook, benefit, button) also writes the text shown under the
  // picture in WhatsApp, LinkedIn and the rest.
  const promo = i.promo === undefined ? promoFor(i.path, i.locale) : i.promo;
  const socialTitle = promo?.title ?? i.socialTitle ?? i.title;
  const socialDescription = clip(plain(promo?.description ?? i.socialDescription ?? i.description), 200);
  const img = typeof i.image === "string" ? { url: i.image } : i.image;
  // No picture of its own: the home page keeps the owner's design; every
  // other page gets its own card (its title and description), so no two
  // pages share the same preview (lib/seo/og-card.ts).
  const sect = kickerFor(i.path);
  const image = img
    ? { url: absUrl(img.url), width: img.width, height: img.height, alt: img.alt ?? socialTitle }
    : i.path === "/" || i.path === ""
      ? { url: OG_IMAGE, ...OG_IMAGE_SIZE, alt: socialTitle }
      : promo
        ? {
            url: cardUrl({
              title: promo.title,
              description: promo.description,
              kicker: promo.kicker ?? i.cardKicker ?? sect.kicker,
              brand: promo.brand ?? i.cardBrand ?? sect.brand,
              cta: promo.cta,
              stat: promo.stat,
              statLabel: promo.statLabel,
              chips: promo.chips,
              image: promo.image,
            }),
            ...OG_IMAGE_SIZE,
            alt: socialTitle,
          }
        : {
          // The logo is on the card: no trailing "| TIBLOGICS" in its title.
          url: cardUrl({ title: clip(plain(socialTitle).replace(/\s*[|·–-]\s*TIBLOGICS[^|·]*$/i, ""), 140), description: socialDescription, kicker: i.cardKicker ?? sect.kicker, brand: i.cardBrand ?? sect.brand }),
          ...OG_IMAGE_SIZE,
          alt: socialTitle,
        };

  // Keep the title within what search results show: drop the " | TIBLOGICS"
  // suffix when it would overflow, and clip as a last resort.
  const bare = i.title.length <= TITLE_MAX ? i.title : clip(i.title, TITLE_MAX);
  const withSuffix = !i.absoluteTitle && `${i.title}${TITLE_SUFFIX}`.length <= TITLE_MAX;
  const meta: Metadata = {
    title: withSuffix ? i.title : { absolute: bare },
    description,
    alternates: {
      canonical: url,
      languages: i.languages ? Object.fromEntries(Object.entries(i.languages).map(([k, v]) => [k, absUrl(v)])) : undefined,
      types: i.markdown ? { "text/markdown": absUrl(i.markdown) } : undefined,
    },
    openGraph: {
      type: i.type ?? "website",
      url,
      siteName: SITE_NAME,
      title: socialTitle,
      description: socialDescription,
      locale: i.locale ? OG_LOCALE[i.locale] : undefined,
      images: [image],
      ...(i.type === "article" && i.article
        ? {
            publishedTime: i.article.publishedTime,
            modifiedTime: i.article.modifiedTime,
            authors: i.article.authors,
            section: i.article.section,
            tags: i.article.tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: ORG.twitter,
      creator: ORG.twitter,
      title: socialTitle,
      description: socialDescription,
      images: [image.url],
    },
  };
  if (i.keywords?.length) meta.keywords = i.keywords;
  if (i.noindex || i.nofollow) {
    meta.robots = {
      index: !i.noindex,
      follow: !i.nofollow,
      googleBot: { index: !i.noindex, follow: !i.nofollow },
    };
  }
  return meta;
}

/** Metadata for pages that must never appear in search results. */
export function privateMetadata(title?: string): Metadata {
  return {
    ...(title ? { title } : {}),
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  };
}
