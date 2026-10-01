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

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

/** Cut text at a word boundary to fit `max` characters, with an ellipsis. */
export function clip(text: string, max: number): string {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const at = cut.lastIndexOf(" ");
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:.\-–—]+$/, "")}…`;
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
  type?: "website" | "article";
  /** Keep out of search results (still followed unless `nofollow`). */
  noindex?: boolean;
  nofollow?: boolean;
  keywords?: string[];
  /** Extra Open Graph fields for articles. */
  article?: { publishedTime?: string; modifiedTime?: string; authors?: string[]; section?: string; tags?: string[] };
}

export function pageMetadata(i: PageMetaInput): Metadata {
  const url = absUrl(i.path);
  const description = clip(plain(i.description), DESCRIPTION_MAX);
  const socialTitle = i.socialTitle ?? i.title;
  const socialDescription = clip(plain(i.socialDescription ?? i.description), 200);
  const img = typeof i.image === "string" ? { url: i.image } : i.image;
  const image = img
    ? { url: absUrl(img.url), width: img.width, height: img.height, alt: img.alt ?? socialTitle }
    : { url: OG_IMAGE, ...OG_IMAGE_SIZE, alt: socialTitle };

  const meta: Metadata = {
    title: i.absoluteTitle ? { absolute: i.title } : i.title,
    description,
    alternates: { canonical: url },
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
