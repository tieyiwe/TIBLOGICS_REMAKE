import { runClaude } from "@/lib/claude";
import { extractJson } from "../content/kit";
import { getCatalog, getCatalogItem, TYPE_LABEL, type CatalogItem } from "../catalog";
import { brandBrief, findAudience, getGrowthSettings, type GrowthSettingsData } from "../settings";
import type { Language } from "../content/platforms";
import {
  blankSection,
  normalizeMagnet,
  normalizePage,
  type MagnetContent,
  type MagnetType,
  type PageContent,
} from "./types";

// AI drafts for lead magnets and landing pages (Sonnet, thinking off; see
// lib/claude.ts "acquire-magnet" / "acquire-page"). Like the content kits,
// the model may only use the chosen product's facts and the brand's approved
// proof points; proof sections on landing pages are filled from brand
// settings in code, never by the model. Drafts are always edited and
// published by the owner.

export class DraftError extends Error {}

const RULES = `Return ONE JSON object and nothing else (no code fence, no commentary).

Hard rules:
- Claims about the product come only from PRODUCT FACTS; claims about the brand only from the approved proof points. Do not invent statistics, percentages, prices, discounts, deadlines, client names, testimonials, results or features. Without a number, write without one.
- Never use a banned claim, even reworded.
- No URLs in the text unless a field asks for an href.
- Plain punctuation: no em dashes or en dashes.
- Useful first: the asset must be genuinely helpful on its own, even if the reader never buys.`;

const SHAPES: Record<MagnetType, string> = {
  checklist: `"checklist": [{"heading": "section", "items": [{"text": "action to tick off, imperative", "note": "one sentence on why or how"}]}]  (3-5 sections, 4-7 items each)`,
  guide: `"guide": [{"heading": "step or chapter", "body": "2-4 short paragraphs separated by blank lines"}], "takeaways": ["3-5 one-line takeaways"]  (4-6 sections)`,
  quiz: `"questions": [{"text": "question about the reader's business or habits", "options": [{"label": "answer", "points": 0-3, "tip": "one practical tip for people who chose this answer (empty for the best answer)"}]}]  (6-8 questions, 3-4 options each, points 3 = best practice, 0 = weakest),
  "bands": [{"min": 0, "title": "result name", "body": "2-3 sentences: what this score means and the next step"}]  (3 bands with min 0, 40 and 75)`,
  templates: `"templates": [{"title": "resource name", "description": "how to use it in 2 sentences", "href": "one of the ALLOWED LINKS exactly", "label": "button text"}]  (3-6 items)`,
};

function productBlock(item: CatalogItem | null): string {
  if (!item) return "PRODUCT: none chosen. Recommend ARFA, the TIBLOGICS AI Academy (ARFA = AI Readiness For All; write it "ARFA · AI Academy"), in general terms only.";
  return [
    `RECOMMENDED PRODUCT: ${item.title} (${TYPE_LABEL[item.type]})`,
    item.price ? `PRICE: ${item.price}` : "",
    `PRODUCT FACTS (the only product claims allowed):\n${item.facts.map((f) => `- ${f}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function allowedLinks(): Promise<CatalogItem[]> {
  const cat = await getCatalog();
  return [
    ...cat.filter((c) => c.type === "tool" || c.type === "blueprint" || c.type === "learn-plan"),
    ...cat.filter((c) => c.type === "article").slice(0, 8),
  ];
}

export async function draftMagnet(opts: {
  type: MagnetType;
  topic: string;
  productKey?: string | null;
  language: Language;
  audienceId?: string | null;
}): Promise<{ title: string; content: MagnetContent; warnings: string[] }> {
  const settings = await getGrowthSettings();
  const audience = findAudience(settings, opts.audienceId);
  const item = opts.productKey ? await getCatalogItem(opts.productKey) : null;
  const links = opts.type === "templates" ? await allowedLinks() : [];
  const system = `You write lead magnets for a small AI company: free, practical assets people trade their email for.\n\n${RULES}\n\n${brandBrief(settings, audience, opts.language)}`;
  const user = [
    `LEAD MAGNET TYPE: ${opts.type}`,
    `TOPIC / ANGLE: ${opts.topic || "(choose the most useful angle for the audience and product)"}`,
    productBlock(item),
    links.length ? `ALLOWED LINKS (href must be one of these paths):\n${links.map((l) => `- ${l.url} : ${l.title}. ${l.summary}`).join("\n")}` : "",
    `JSON shape:
{
  "title": "internal name, <= 60 chars",
  "headline": "sign-up page headline, <= 12 words, names the outcome",
  "subheadline": "<= 30 words",
  "bullets": ["3-4 'what you get' bullets"],
  "ctaLabel": "form button text, e.g. Send me the checklist",
  "intro": "2-3 sentences opening the asset",
  ${SHAPES[opts.type]},
  "outro": "1-2 sentences closing the asset",
  "productPitch": "1-2 sentences: how the recommended product helps with the next step, from the facts only",
  "productCta": "button text for the product",
  "emailSubject": "subject of the email that delivers the asset",
  "emailBody": "short plain-text email body, 2-3 short paragraphs separated by blank lines, greeting without a name; the link to the asset is added automatically"
}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const { text, stopReason } = await runClaude("acquire-magnet", { system, messages: [{ role: "user", content: user }], meta: { ref: `acquire-magnet:${opts.type}` } });
  if (stopReason === "max_tokens") throw new DraftError("The draft was cut off. Try again.");
  let raw: Record<string, unknown>;
  try {
    raw = extractJson(text) as Record<string, unknown>;
  } catch (err) {
    throw new DraftError(err instanceof Error ? err.message : "The model did not return JSON.");
  }
  const content = normalizeMagnet(raw);
  if (opts.type === "templates") {
    const ok = new Set(links.map((l) => l.url));
    content.templates = content.templates.filter((t) => ok.has(t.href));
  }
  const title = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim().slice(0, 120) : content.headline || "Lead magnet";
  return { title, content, warnings: claimWarnings(JSON.stringify(content), item?.facts ?? [], settings) };
}

// ── Landing pages ───────────────────────────────────────────────────────────

function proofSection(settings: GrowthSettingsData, i: number) {
  const s = blankSection("proof", i);
  s.title = "";
  s.items = settings.proofPoints.slice(0, 6);
  s.enabled = s.items.length > 0;
  return s;
}

function factsSection(item: CatalogItem | null, i: number) {
  const s = blankSection("product", i);
  s.title = item?.title ?? "";
  s.body = item?.price ?? "";
  s.items = (item?.facts ?? []).filter((f) => !/^Description:/i.test(f)).slice(0, 6);
  s.enabled = s.items.length > 0;
  return s;
}

/** Destination for the CTA, from the product. */
export function ctaFor(item: CatalogItem | null): PageContent["cta"] {
  if (!item) return { kind: "newsletter", href: "" };
  if (item.type === "track" || item.type === "learn-plan") return { kind: "track", href: item.url };
  if (item.type === "service") return { kind: "booking", href: "/book" };
  return { kind: "buy", href: item.url };
}

/** A landing page built from a content kit's hero, pains and benefits (no model call). */
export async function pageFromKit(kit: { content: unknown; productKey: string; productTitle: string }): Promise<PageContent> {
  const { normalizeKit } = await import("../content/kit-types");
  const k = normalizeKit(kit.content);
  const settings = await getGrowthSettings();
  const item = await getCatalogItem(kit.productKey);
  const hero = blankSection("hero", 0);
  hero.title = k.hero.headline || kit.productTitle;
  hero.body = k.hero.subheadline || k.positioning;
  hero.items = k.hero.bullets;
  hero.ctaLabel = k.hero.cta;
  const pains = blankSection("pains", 1);
  pains.items = k.pains;
  pains.enabled = k.pains.length > 0;
  const benefits = blankSection("benefits", 2);
  benefits.items = k.benefits;
  benefits.enabled = k.benefits.length > 0;
  const faq = blankSection("faq", 5);
  faq.enabled = false;
  const cta = blankSection("cta", 6);
  cta.title = k.hero.headline;
  cta.ctaLabel = k.hero.cta;
  const form = blankSection("form", 7);
  return normalizePage({
    sections: [hero, pains, benefits, proofSection(settings, 3), factsSection(item, 4), faq, cta, form],
    cta: ctaFor(item),
    description: k.positioning || k.hero.subheadline,
    askBusiness: true,
    askWhatsapp: false,
  });
}

export async function draftPage(opts: { productKey?: string | null; goal: string; language: Language; audienceId?: string | null }): Promise<{ title: string; content: PageContent; warnings: string[] }> {
  const settings = await getGrowthSettings();
  const audience = findAudience(settings, opts.audienceId);
  const item = opts.productKey ? await getCatalogItem(opts.productKey) : null;
  const system = `You write high-converting, honest campaign landing pages for a small AI company.\n\n${RULES}\n\n${brandBrief(settings, audience, opts.language)}`;
  const user = [
    `CAMPAIGN GOAL: ${opts.goal || "get qualified sign-ups for the product"}`,
    productBlock(item),
    `JSON shape:
{
  "title": "internal page name, <= 60 chars",
  "description": "share-card description, <= 25 words",
  "hero": {"headline": "<= 10 words", "subheadline": "<= 30 words", "bullets": ["3 short bullets"], "cta": "button text"},
  "pains": ["3-4 audience pains in their words"],
  "benefits": ["3-5 concrete benefits tied to the facts"],
  "faq": [{"q": "real objection as a question", "a": "2-3 sentence answer from the facts only"}],  (4-5 items)
  "closing": {"headline": "<= 10 words", "body": "1-2 sentences", "cta": "button text"},
  "form": {"headline": "lead form heading", "body": "one sentence on what they get by leaving their email"}
}`,
  ].join("\n\n");
  const { text, stopReason } = await runClaude("acquire-page", { system, messages: [{ role: "user", content: user }], meta: { ref: `acquire-page:${item?.key ?? "none"}` } });
  if (stopReason === "max_tokens") throw new DraftError("The draft was cut off. Try again.");
  let raw: Record<string, unknown>;
  try {
    raw = extractJson(text) as Record<string, unknown>;
  } catch (err) {
    throw new DraftError(err instanceof Error ? err.message : "The model did not return JSON.");
  }
  const o = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  const h = o(raw.hero);
  const closing = o(raw.closing);
  const formRaw = o(raw.form);
  const hero = { ...blankSection("hero", 0), title: str(h.headline), body: str(h.subheadline), items: list(h.bullets), ctaLabel: str(h.cta) };
  const pains = { ...blankSection("pains", 1), items: list(raw.pains) };
  const benefits = { ...blankSection("benefits", 2), items: list(raw.benefits) };
  const faq = { ...blankSection("faq", 5), faq: Array.isArray(raw.faq) ? (raw.faq as { q: string; a: string }[]) : [] };
  const cta = { ...blankSection("cta", 6), title: str(closing.headline), body: str(closing.body), ctaLabel: str(closing.cta) };
  const form = { ...blankSection("form", 7), title: str(formRaw.headline), body: str(formRaw.body) };
  const content = normalizePage({
    sections: [hero, pains, benefits, proofSection(settings, 3), factsSection(item, 4), faq, cta, form],
    cta: ctaFor(item),
    description: str(raw.description),
    askBusiness: true,
    askWhatsapp: opts.language !== "en",
  });
  const title = str(raw.title).trim().slice(0, 120) || hero.title || "Landing page";
  return { title, content, warnings: claimWarnings(JSON.stringify(content), item?.facts ?? [], settings) };
}

// ── Checks ──────────────────────────────────────────────────────────────────

const NUMBER_RE = /(?:[$€£]\s?\d[\d,.]*\s?[kKmM]?|\d[\d,.]*\s?(?:%|percent|pour ?cent|x\b|×|FCFA|CFA|USD|dollars?))|\b\d{3,}[\d,.]*\b/g;

/** Numbers that are not in the facts or proof points, and banned claims. */
export function claimWarnings(text: string, facts: string[], settings: GrowthSettingsData): string[] {
  const allowed = [...facts, ...settings.proofPoints].join(" ").toLowerCase().replace(/\s|,/g, "");
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of text.match(NUMBER_RE) ?? []) {
    const n = m.toLowerCase().replace(/\s|,/g, "");
    if (seen.has(n) || allowed.includes(n)) continue;
    seen.add(n);
    out.push(`"${m.trim()}" is not in the product data or proof points. Check it or remove it.`);
  }
  const lower = text.toLowerCase();
  for (const b of settings.bannedClaims) if (b && lower.includes(b.toLowerCase())) out.push(`Uses the banned claim "${b}".`);
  return out.slice(0, 20);
}
