// On-brand social image cards. Client-safe: the editor builds and previews a
// spec, the server renders it to PNG (lib/growth/cards/render.tsx via
// next/og). Copy on a card comes from the post itself, the product data or
// the brand's approved proof points, never from a model, so a card can never
// carry a number the claim checks have not seen.

export const CARD_TEMPLATES = ["quote", "stat", "spotlight", "carousel"] as const;
export type CardTemplate = (typeof CARD_TEMPLATES)[number];

export const TEMPLATE_LABEL: Record<CardTemplate, string> = {
  quote: "Quote",
  stat: "Proof point",
  spotlight: "Product spotlight",
  carousel: "Carousel",
};

export const CARD_FORMATS = {
  square: { width: 1080, height: 1080, label: "Square 1080x1080" },
  portrait: { width: 1080, height: 1350, label: "Portrait 1080x1350" },
  landscape: { width: 1200, height: 627, label: "Landscape 1200x627" },
} as const;
export type CardFormat = keyof typeof CARD_FORMATS;

export const CARD_THEMES = ["navy", "light", "orange"] as const;
export type CardTheme = (typeof CARD_THEMES)[number];

export interface CardSlide {
  title: string;
  body: string;
}

export interface CardSpec {
  template: CardTemplate;
  format: CardFormat;
  theme: CardTheme;
  /** Small label above the headline (product type, "New", ...). */
  kicker: string;
  headline: string;
  /** Supporting line (attribution, product name, stat label). */
  sub: string;
  /** Proof point template: the big figure, e.g. "200+". */
  stat: string;
  bullets: string[];
  cta: string;
  /** Carousel only: 2-8 slides. */
  slides: CardSlide[];
}

const s = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

export function isTemplate(v: unknown): v is CardTemplate {
  return typeof v === "string" && (CARD_TEMPLATES as readonly string[]).includes(v);
}
export function isFormat(v: unknown): v is CardFormat {
  return typeof v === "string" && v in CARD_FORMATS;
}

/** A clean spec from anything (request body, stored JSON), or null. */
export function normalizeCard(raw: unknown): CardSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!isTemplate(r.template)) return null;
  const slides = (Array.isArray(r.slides) ? r.slides : [])
    .map((x) => {
      const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
      return { title: s(o.title, 90), body: s(o.body, 260) };
    })
    .filter((x) => x.title || x.body)
    .slice(0, 8);
  const spec: CardSpec = {
    template: r.template,
    format: isFormat(r.format) ? r.format : "square",
    theme: (CARD_THEMES as readonly string[]).includes(r.theme as string) ? (r.theme as CardTheme) : "navy",
    kicker: s(r.kicker, 40),
    headline: s(r.headline, 220),
    sub: s(r.sub, 140),
    stat: s(r.stat, 16),
    bullets: (Array.isArray(r.bullets) ? r.bullets : []).map((b) => s(b, 90)).filter(Boolean).slice(0, 4),
    cta: s(r.cta, 40),
    slides,
  };
  if (spec.template === "carousel" ? spec.slides.length < 1 : !spec.headline && !spec.stat) return null;
  return spec;
}

export function slideCount(spec: CardSpec): number {
  return spec.template === "carousel" ? Math.max(1, spec.slides.length) : 1;
}

/** Splits text into sentences (keeps the punctuation). */
export function sentences(text: string): string[] {
  return (text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).map((x) => x.trim()).filter((x) => x.length > 2);
}

const firstLine = (text: string) => text.split(/\n/).map((l) => l.trim()).find((l) => l.length > 3) ?? text.trim();
const clipWords = (t: string, max: number) => (t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`);
const HAS_NUMBER = /\d/;

export interface CardContext {
  productTitle?: string;
  productType?: string;
  benefits?: string[];
  proofPoints?: string[];
  cta?: string;
}

/**
 * A ready spec for a post, without any model call: the hook line for a
 * quote, an approved proof point (or a number already in the post) for a
 * stat, the product and its benefits for a spotlight, and the post's own
 * paragraphs for a carousel.
 */
export function suggestCard(text: string, template: CardTemplate, ctx: CardContext = {}, format?: CardFormat): CardSpec {
  const clean = text.replace(/https?:\/\/\S+/g, "").replace(/#[\p{L}\p{N}_]+/gu, "").trim();
  const sents = sentences(clean);
  const hook = clipWords(firstLine(clean).replace(/^[^\p{L}\p{N}"“]+/u, ""), 180);
  const base: CardSpec = {
    template,
    format: format ?? (template === "carousel" ? "portrait" : "square"),
    theme: "navy",
    kicker: ctx.productType ?? "",
    headline: hook,
    sub: ctx.productTitle ?? "",
    stat: "",
    bullets: [],
    cta: ctx.cta || "Learn more at tiblogics.com",
    slides: [],
  };
  if (template === "stat") {
    const proof = (ctx.proofPoints ?? []).find((p) => HAS_NUMBER.test(p));
    const fromPost = sents.find((x) => HAS_NUMBER.test(x));
    const source = proof ?? fromPost ?? "";
    const m = source.match(/[$€£]?\s?\d[\d,.]*\s?(?:%|\+|x\b|×|k\b)?/);
    return {
      ...base,
      theme: "orange",
      stat: m ? m[0].trim() : "",
      headline: m ? clipWords(source, 160) : hook,
      kicker: proof ? "Proof point" : base.kicker,
    };
  }
  if (template === "spotlight") {
    const bullets = (ctx.benefits?.length ? ctx.benefits : sents.slice(1, 4)).map((b) => clipWords(b, 80)).slice(0, 3);
    return { ...base, theme: "light", headline: ctx.productTitle || hook, sub: clipWords(sents[0] ?? hook, 140), bullets };
  }
  if (template === "carousel") {
    const paras = clean.split(/\n{2,}/).map((p) => p.replace(/\s+/g, " ").trim()).filter((p) => p.length > 3);
    const chunks = paras.length >= 3 ? paras : sents;
    const body = chunks.slice(1, 6).map((c, i) => {
      const parts = sentences(c);
      return { title: clipWords(parts[0] ?? c, 80) || `Point ${i + 1}`, body: clipWords(parts.slice(1).join(" "), 220) };
    });
    return {
      ...base,
      slides: [
        { title: clipWords(chunks[0] ?? hook, 90), body: "Swipe to see how" },
        ...body,
        { title: ctx.productTitle || "Ready to start?", body: base.cta },
      ].slice(0, 8),
    };
  }
  return base;
}

/** The query string that renders this spec (preview route). */
export function specQuery(spec: CardSpec, slide = 0): string {
  return `spec=${encodeURIComponent(JSON.stringify(spec))}&slide=${slide}`;
}
