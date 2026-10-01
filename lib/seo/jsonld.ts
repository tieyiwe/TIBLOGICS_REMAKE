// Structured data (schema.org JSON-LD) builders and a safe serializer.
//
// Rules this file keeps:
//   - Only real data. No AggregateRating or Review without real reviews, no
//     invented addresses, founding dates, client names or statistics.
//   - One set of stable @id values (lib/seo/site.ts) so entities on different
//     pages join up into one graph for search and AI engines.
//   - Output goes through serializeJsonLd, which escapes "<", ">" and "&" so
//     text from the database can never close the <script> tag (XSS).

import { ARFA_ID, FOUNDER_ID, LOGO_URL, OG_IMAGE, ORG, ORG_ID, SITE_NAME, SITE_URL, WEBSITE_ID, absUrl } from "./site";

export type JsonLdValue = string | number | boolean | null | undefined | JsonLdNode | JsonLdValue[];
export interface JsonLdNode {
  "@type"?: string | string[];
  "@id"?: string;
  [key: string]: JsonLdValue;
}
export interface JsonLdDocument extends JsonLdNode {
  "@context": "https://schema.org";
}

/** JSON for a <script type="application/ld+json">, safe to inline in HTML. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data, (_k, v) => (v === undefined || (Array.isArray(v) && v.length === 0) ? undefined : v))
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Wrap one node, or several as an @graph, in a document with @context. */
export function jsonLdDocument(nodes: JsonLdNode | JsonLdNode[]): JsonLdDocument {
  const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);
  if (list.length === 1) return { "@context": "https://schema.org", ...list[0] };
  return { "@context": "https://schema.org", "@graph": list };
}

const ref = (id: string): JsonLdNode => ({ "@id": id });

/** ISO 8601 duration for a number of hours ("PT14H30M"). */
export function isoHours(hours: number): string | undefined {
  if (!Number.isFinite(hours) || hours <= 0) return undefined;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}` || undefined;
}

/** Price string for an Offer from cents ("297.00"). */
export const priceFromCents = (cents: number) => (cents / 100).toFixed(2);

// ── Site-wide entities ─────────────────────────────────────────────────────

export function organizationNode(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: { "@type": "ImageObject", "@id": `${SITE_URL}/#logo`, url: LOGO_URL, contentUrl: LOGO_URL, width: 512, height: 512, caption: SITE_NAME },
    image: OG_IMAGE,
    description: ORG.description,
    email: ORG.email,
    founder: ref(FOUNDER_ID),
    sameAs: [...ORG.sameAs],
    areaServed: ORG.areaServed.map((a) => ({ ...a })),
    knowsLanguage: [...ORG.serviceLanguages],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: ORG.email,
        url: `${SITE_URL}/contact`,
        availableLanguage: [...ORG.serviceLanguages],
        areaServed: [...ORG.contactAreas],
      },
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: ORG.founderEmail,
        url: `${SITE_URL}/book`,
        availableLanguage: [...ORG.serviceLanguages],
        areaServed: [...ORG.contactAreas],
      },
    ],
    knowsAbout: [
      "Artificial intelligence", "AI agents", "Large language model integration",
      "Retrieval-augmented generation", "Workflow automation", "AI strategy",
      "AI readiness", "AI training", "Web development", "Mobile app development",
      "Cybersecurity", "Data analytics",
    ],
    subOrganization: ref(ARFA_ID),
  };
}

export function founderNode(): JsonLdNode {
  return {
    "@type": "Person",
    "@id": FOUNDER_ID,
    name: ORG.founder.name,
    jobTitle: ORG.founder.jobTitle,
    worksFor: ref(ORG_ID),
    url: `${SITE_URL}/about`,
  };
}

export function websiteNode(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: ORG.description,
    publisher: ref(ORG_ID),
    inLanguage: [...ORG.siteLanguages],
    // AI Times reads ?search= on load (BlogPageClient), so this is a real search.
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/ai-times?search={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/** ARFA, the TIBLOGICS AI Academy, as an educational organisation. */
export function arfaNode(): JsonLdNode {
  return {
    "@type": "EducationalOrganization",
    "@id": ARFA_ID,
    name: "ARFA AI Academy",
    alternateName: ["ARFA", "AI Readiness For All", "TIBLOGICS AI Academy"],
    url: `${SITE_URL}/learning-box`,
    logo: LOGO_URL,
    description:
      "ARFA (AI Readiness For All) is the TIBLOGICS AI Academy: self-paced AI certificate tracks with hands-on labs, module quizzes, a timed final exam and a human-reviewed capstone, in English and French.",
    parentOrganization: ref(ORG_ID),
    email: ORG.academyEmail,
    knowsLanguage: ["English", "French"],
  };
}

// ── Page-level helpers ────────────────────────────────────────────────────

export interface Crumb { name: string; path: string }

export function breadcrumbNode(items: Crumb[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absUrl(c.path) })),
  };
}

export interface QA { q: string; a: string }

/** FAQPage. Only for questions and answers that are visible on the page. */
export function faqNode(items: QA[], path?: string): JsonLdNode {
  return {
    "@type": "FAQPage",
    ...(path ? { "@id": `${absUrl(path)}#faq`, url: absUrl(path) } : {}),
    mainEntity: items.map((x) => ({
      "@type": "Question",
      name: x.q,
      acceptedAnswer: { "@type": "Answer", text: x.a },
    })),
  };
}

export function webPageNode(o: { path: string; name: string; description?: string; type?: string; about?: string; inLanguage?: string }): JsonLdNode {
  const url = absUrl(o.path);
  return {
    "@type": o.type ?? "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: o.name,
    description: o.description,
    isPartOf: ref(WEBSITE_ID),
    about: o.about ? ref(o.about) : undefined,
    publisher: ref(ORG_ID),
    inLanguage: o.inLanguage,
  };
}

export function serviceNode(o: { name: string; description: string; path?: string; serviceType?: string }): JsonLdNode {
  return {
    "@type": "Service",
    name: o.name,
    description: o.description,
    serviceType: o.serviceType ?? o.name,
    url: o.path ? absUrl(o.path) : undefined,
    provider: ref(ORG_ID),
    areaServed: ORG.areaServed.map((a) => ({ ...a })),
    availableLanguage: [...ORG.serviceLanguages],
  };
}

export interface CourseInput {
  slug: string;
  name: string;
  description: string;
  level: string;
  levelEnd?: string | null;
  estimatedHours: number;
  priceCents: number;
  currency?: string;
  certificateName: string;
  outcomes?: string[];
  audience?: string | null;
  image?: string | null;
  available: boolean;
  modules?: number;
  lessons?: number;
}

const LEVEL_NAME: Record<string, string> = {
  starter: "Beginner",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/** Course + CourseInstance + Offer, per Google's Course info guidelines. */
export function courseNode(c: CourseInput): JsonLdNode {
  const url = absUrl(`/learning-box/${c.slug}`);
  const level = LEVEL_NAME[c.level] ?? c.level;
  const levelEnd = c.levelEnd ? LEVEL_NAME[c.levelEnd] ?? c.levelEnd : null;
  const offer: JsonLdNode = {
    "@type": "Offer",
    category: "Paid",
    price: priceFromCents(c.priceCents),
    priceCurrency: c.currency ?? "USD",
    availability: c.available ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
    url,
  };
  return {
    "@type": "Course",
    "@id": `${url}#course`,
    url,
    name: c.name,
    description: c.description,
    courseCode: c.slug,
    provider: { "@type": "EducationalOrganization", "@id": ARFA_ID, name: "ARFA AI Academy", url: `${SITE_URL}/learning-box` },
    publisher: ref(ORG_ID),
    inLanguage: ["en", "fr"],
    availableLanguage: ["English", "French"],
    educationalLevel: levelEnd && levelEnd !== level ? `${level} to ${levelEnd}` : level,
    teaches: c.outcomes?.length ? c.outcomes : undefined,
    audience: c.audience ? { "@type": "Audience", audienceType: c.audience } : undefined,
    timeRequired: isoHours(c.estimatedHours),
    image: c.image ? absUrl(c.image) : OG_IMAGE,
    isAccessibleForFree: false,
    educationalCredentialAwarded: {
      "@type": "EducationalOccupationalCredential",
      name: c.certificateName,
      credentialCategory: "Certificate",
      recognizedBy: ref(ARFA_ID),
    },
    offers: [offer],
    hasCourseInstance: [
      {
        "@type": "CourseInstance",
        courseMode: "Online",
        courseWorkload: isoHours(c.estimatedHours),
        inLanguage: ["en", "fr"],
        instructor: { "@type": "Organization", "@id": ARFA_ID, name: "ARFA AI Academy" },
        offers: offer,
      },
    ],
  };
}

export function itemListNode(o: { name: string; path?: string; items: Array<{ url: string; name?: string }> }): JsonLdNode {
  return {
    "@type": "ItemList",
    name: o.name,
    url: o.path ? absUrl(o.path) : undefined,
    numberOfItems: o.items.length,
    itemListElement: o.items.map((it, i) => ({ "@type": "ListItem", position: i + 1, url: absUrl(it.url), name: it.name })),
  };
}

export interface ProductInput {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  images: string[];
  category?: string;
  sku?: string | null;
  inStock: boolean;
  digital: boolean;
  /** Sale end, when a sale price applies (priceValidUntil). */
  priceValidUntil?: string;
}

/** Product + Offer. No ratings: there are no real reviews to mark up. */
export function productNode(p: ProductInput): JsonLdNode {
  const url = absUrl(`/store/${p.slug}`);
  return {
    "@type": "Product",
    "@id": `${url}#product`,
    url,
    name: p.name,
    description: p.description,
    image: p.images.length ? p.images.map((i) => absUrl(i)) : [OG_IMAGE],
    sku: p.sku ?? p.slug,
    category: p.category,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url,
      price: priceFromCents(p.priceCents),
      priceCurrency: p.currency || "USD",
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      priceValidUntil: p.priceValidUntil,
      seller: ref(ORG_ID),
    },
  };
}

export function softwareAppNode(o: {
  name: string;
  description: string;
  path: string;
  /** Distinct fragment when two apps share a page ("compliance-guard"). */
  fragment?: string;
  category?: string;
  priceCents?: number | null;
  recurring?: "month" | null;
  free?: boolean;
}): JsonLdNode {
  const url = absUrl(o.path);
  const offer: JsonLdNode | undefined = o.free
    ? { "@type": "Offer", price: "0", priceCurrency: "USD", url }
    : o.priceCents && o.priceCents > 0
      ? {
          "@type": "Offer",
          price: priceFromCents(o.priceCents),
          priceCurrency: "USD",
          url,
          ...(o.recurring
            ? { priceSpecification: { "@type": "UnitPriceSpecification", price: priceFromCents(o.priceCents), priceCurrency: "USD", unitCode: "MON", referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" } } }
            : {}),
        }
      : undefined;
  return {
    "@type": "SoftwareApplication",
    "@id": `${url}#${o.fragment ?? "app"}`,
    name: o.name,
    description: o.description,
    url,
    applicationCategory: o.category ?? "BusinessApplication",
    operatingSystem: "Web browser",
    provider: ref(ORG_ID),
    publisher: ref(ORG_ID),
    offers: offer,
    isAccessibleForFree: o.free ? true : undefined,
  };
}
