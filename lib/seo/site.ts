// Site-wide SEO constants and the company facts that structured data,
// llms.txt and the fact sheet all repeat. Keep these to facts that are true
// and already stated elsewhere on the site: AI engines quote them verbatim.
//
// The canonical origin is always the apex domain, whatever host served the
// request (proxy.ts sends www.tiblogics.com here with a 301).

import type { Locale } from "@/lib/i18n/config";

export const SITE_URL = "https://tiblogics.com";
export const SITE_HOST = "tiblogics.com";
export const SITE_NAME = "TIBLOGICS";

/** The default social card: the owner's own design (public/main-domain-preview.png),
 *  padded to 1200x630 in public/main-domain-preview-og.png. Bump ?v= when it changes
 *  so social sites fetch it again. Articles use their own cards. */
export const OG_IMAGE = `${SITE_URL}/main-domain-preview-og.png?v=1`;

/** ARFA (the academy) pages: the ARFA banner (public/arfa-banner.png) fitted to 1200x630 in public/arfa-preview-og.jpg. Bump ?v= when it changes. */
export const ARFA_OG_IMAGE = { url: `${SITE_URL}/arfa-preview-og.jpg?v=2`, width: 1200, height: 630, alt: "ARFA, AI Readiness For All: the TIBLOGICS AI Academy" };
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** Raster logo for structured data (Google wants a crawlable image, ≥112px). */
export const LOGO_URL = `${SITE_URL}/pwa/icon-512.png`;

export const OG_LOCALE: Record<Locale, string> = { en: "en_US", fr: "fr_FR", sw: "sw_KE" };
export const HTML_LANG: Record<Locale, string> = { en: "en", fr: "fr", sw: "sw" };

// Stable @id values, so every page's JSON-LD points at the same entities.
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const FOUNDER_ID = `${SITE_URL}/#founder`;
/**
 * The founder's name and photo stay off the public site (About page,
 * structured data, llms.txt) until the brand is a known name. Set to true to
 * bring them back everywhere.
 */
export const SHOW_FOUNDER = false;
export const ARFA_ID = `${SITE_URL}/learning-box#arfa`;

/** Absolute URL on the canonical origin for a path ("/x") or an absolute URL. */
export function absUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const p = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return p === "/" ? SITE_URL : `${SITE_URL}${p}`;
}

/**
 * Company facts. Every value here appears elsewhere in the codebase (footer,
 * about page, contact page, root layout); nothing is invented. Add a fact
 * here only once it is true and published on the site.
 */
export const ORG = {
  name: SITE_NAME,
  description:
    "TIBLOGICS is an AI implementation agency. It builds AI agents, workflow automation and full-stack digital products for businesses in North America and Africa, in English and French.",
  /** General enquiries (footer, contact page). */
  email: "info@tiblogics.com",
  /** The founder's address (about page). */
  founderEmail: "ai@tiblogics.com",
  /** ARFA AI Academy and training enquiries (training terms, event emails). */
  academyEmail: "arfa@tiblogics.com",
  founder: { name: "Tieyiwe Bassole", jobTitle: "Founder & CEO" },
  /** Official social profiles linked from the site's structured data. */
  sameAs: ["https://linkedin.com/company/tiblogics", "https://twitter.com/tiblogics"],
  twitter: "@tiblogics",
  /** Where the agency works (about page: "United States and African markets"). */
  areaServed: [
    { "@type": "Country", name: "United States" },
    { "@type": "Country", name: "Canada" },
    { "@type": "Continent", name: "Africa" },
  ],
  /** ISO codes used on the contact points (francophone Africa included). */
  contactAreas: ["US", "CA", "FR", "SN", "CI", "CM"],
  /** Delivery languages for services; the website is also in Swahili. */
  serviceLanguages: ["English", "French"],
  siteLanguages: ["en", "fr", "sw"],
  /** Discovery calls: free, 30 minutes (services page, step 1). */
  discoveryCall: "Free 30-minute discovery call, no obligation",
} as const;
