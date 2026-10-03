import { runClaude } from "@/lib/claude";
import { getCatalogItem } from "../catalog";
import { brandBrief, findAudience, getGrowthSettings, type Audience, type GrowthSettingsData } from "../settings";
import { extractJson, KitError } from "./kit";
import { normalizeKit, type KitAd, type KitContent, type KitEmail, type KitPost } from "./kit-types";
import { adWhere, checkText, claimContext, emailWhere, lengthWarning, postWhere } from "./claims";
import { isLanguage, PLATFORM_INFO, type Language } from "./platforms";

// Per-item rewrites in the kit editor: regenerate, shorter, punchier, more
// local (Francophone Africa or North America), two A/B variants, or a
// translation EN <-> FR. One Haiku call per click. The model sees the same
// product facts and brand rules as the kit, and every result goes back
// through the claim checks before the editor shows it.

export const REWRITE_OPS = ["regenerate", "shorter", "punchier", "local-africa", "local-na", "variants", "translate"] as const;
export type RewriteOp = (typeof REWRITE_OPS)[number];
export type RewriteKind = "post" | "email" | "ad" | "hero" | "video";

type Item = KitPost | KitEmail | KitAd | KitContent["hero"] | KitContent["video"];

const OP_TEXT: Record<RewriteOp, string> = {
  regenerate: "Write a fresh version with a different angle and hook. Same platform, same purpose.",
  shorter: "Make it about 40% shorter. Keep the key message and the call to action.",
  punchier: "Make it punchier: a stronger first line, shorter sentences, active verbs, no filler.",
  "local-africa": "Adapt it for business owners and professionals in Francophone West and Central Africa (Côte d'Ivoire, Senegal, Burkina Faso, Cameroon): mobile-first, WhatsApp-friendly, budget-conscious, practical local examples (markets, transport, shops, SMEs). Do not invent places, prices or statistics. Keep the same language as the input unless told otherwise.",
  "local-na": "Adapt it for small business owners and professionals in the United States and Canada: concrete local small-business examples, time saved, peer tone. Do not invent places, prices or statistics. Keep the same language as the input.",
  variants: "Write TWO clearly different A/B test variants (different hook and angle, same facts and call to action).",
  translate: "Translate it. Natural, idiomatic copy for the target audience, not a word-for-word translation. Keep every fact, number and call to action.",
};

const RULES = `You rewrite one piece of marketing copy for a small AI company. Return ONE JSON object: {"items":[ ...same shape as the input item... ]} and nothing else.

Hard rules:
- Use only the PRODUCT FACTS and approved proof points. Never invent statistics, percentages, prices, discounts, deadlines, client names, testimonials or results. If the input has a number that is not in the facts, drop it.
- Never use a banned claim, even reworded.
- No URLs in text (links are added automatically). Hashtags go in "hashtags" without "#".
- Keep the same JSON keys as the input item. No em dashes.`;

function describe(kind: RewriteKind, item: Item): string {
  if (kind === "post") {
    const p = item as KitPost;
    const i = PLATFORM_INFO[p.platform];
    return `A ${i.label} post. ${i.guide} Whole post including link and hashtags must fit ${i.maxChars} characters. Hashtags: ${i.hashtags[0]}-${i.hashtags[1]}.`;
  }
  if (kind === "email") return "A launch email: subject, preview text, plain-text body with short paragraphs, button text.";
  if (kind === "ad") {
    const a = item as KitAd;
    return a.network === "google"
      ? "A Google search ad: headline <= 30 chars, primaryText = second headline <= 30 chars, description <= 90 chars, cta."
      : a.network === "meta"
        ? "A Meta feed ad: primaryText <= 125 chars, headline <= 40 chars, description <= 30 chars, cta."
        : "A LinkedIn sponsored post: primaryText <= 150 chars, headline <= 70 chars, cta.";
  }
  if (kind === "hero") return "A landing page hero: headline <= 10 words, subheadline <= 30 words, 3 short bullets, button text.";
  return "A 30-60 second reel: title, hook (first 3 seconds), script with timing cues like [0-3s], short on-screen texts, cta, durationSeconds.";
}

function audienceFor(op: RewriteOp, settings: GrowthSettingsData, fallback: Audience | null): Audience | null {
  if (op === "local-africa") return settings.audiences.find((a) => a.id === "francophone-africa") ?? settings.audiences.find((a) => a.language === "fr") ?? fallback;
  if (op === "local-na") return settings.audiences.find((a) => a.id === "smb-na") ?? settings.audiences.find((a) => /north america|united states|canada/i.test(a.region)) ?? fallback;
  return fallback;
}

/** Cleans model items into the kind's shape (posts keep their platform, ads their network). */
function clean(kind: RewriteKind, original: Item, raw: unknown[]): Item[] {
  const objs = raw.filter((x) => x && typeof x === "object") as Record<string, unknown>[];
  if (kind === "post") {
    const p = original as KitPost;
    return normalizeKit({ posts: objs.map((o) => ({ ...o, platform: p.platform, image: p.image ?? null })) }).posts;
  }
  if (kind === "email") return normalizeKit({ emails: objs }).emails;
  if (kind === "ad") return normalizeKit({ ads: objs.map((o) => ({ ...o, network: (original as KitAd).network })) }).ads;
  if (kind === "hero") return objs.map((o) => normalizeKit({ hero: o }).hero).filter((h) => h.headline);
  return objs.map((o) => normalizeKit({ video: o }).video).filter((v) => v.script || v.hook);
}

function textOfItem(kind: RewriteKind, it: Item): string {
  if (kind === "post") return (it as KitPost).text;
  if (kind === "email") { const e = it as KitEmail; return [e.subject, e.preview, e.body].join(" "); }
  if (kind === "ad") { const a = it as KitAd; return [a.headline, a.primaryText, a.description].join(" "); }
  if (kind === "hero") { const h = it as KitContent["hero"]; return [h.headline, h.subheadline, ...h.bullets].join(" "); }
  const v = it as KitContent["video"];
  return [v.hook, v.script, ...v.onScreenText].join(" ");
}

export interface RewriteResult {
  items: Item[];
  warnings: string[][];
  language: Language;
}

export async function rewriteItem(opts: {
  kit: { productKey: string; language: string; audienceId: string | null };
  kind: RewriteKind;
  index: number;
  item: unknown;
  op: RewriteOp;
  to?: string;
}): Promise<RewriteResult> {
  const { kind, op } = opts;
  // Normalise the client's item through the kit shape first.
  const wrapped = normalizeKit(
    kind === "post" ? { posts: [opts.item] } : kind === "email" ? { emails: [opts.item] } : kind === "ad" ? { ads: [opts.item] } : kind === "hero" ? { hero: opts.item } : { video: opts.item },
  );
  const item: Item | undefined =
    kind === "post" ? wrapped.posts[0] : kind === "email" ? wrapped.emails[0] : kind === "ad" ? wrapped.ads[0] : kind === "hero" ? wrapped.hero : wrapped.video;
  if (!item || !textOfItem(kind, item).trim()) throw new KitError("Write something in this item first.");

  const [product, settings] = await Promise.all([getCatalogItem(opts.kit.productKey), getGrowthSettings()]);
  const kitLang: Language = isLanguage(opts.kit.language) ? opts.kit.language : "en";
  const language: Language = op === "translate" ? (isLanguage(opts.to) && opts.to !== kitLang ? opts.to : kitLang === "fr" ? "en" : "fr") : kitLang;
  const audience = audienceFor(op, settings, findAudience(settings, opts.kit.audienceId));
  const facts = product?.facts ?? [];

  const system = `${RULES}\n\n${brandBrief(settings, audience, language)}`;
  const user = [
    `PRODUCT: ${product?.title ?? "TIBLOGICS offer"}`,
    `PRODUCT FACTS (the only product claims allowed):\n${facts.map((f) => `- ${f}`).join("\n") || "- (none: make no specific product claims)"}`,
    `ITEM TYPE: ${describe(kind, item)}`,
    `INSTRUCTION: ${OP_TEXT[op]}${op === "translate" ? ` Target language: ${language === "fr" ? "French" : language === "sw" ? "Swahili" : "English"}.` : ""}`,
    `Return ${op === "variants" ? "exactly 2 items" : "exactly 1 item"}.`,
    `INPUT ITEM (JSON):\n${JSON.stringify(item)}`,
  ].join("\n\n");

  const { text } = await runClaude("growth-rewrite", {
    system,
    messages: [{ role: "user", content: user }],
    meta: { ref: `growth-rewrite:${kind}:${op}` },
  });
  const j = extractJson(text) as { items?: unknown };
  const raw = Array.isArray(j.items) ? j.items : [j];
  const items = clean(kind, item, raw).slice(0, op === "variants" ? 2 : 1);
  if (!items.length) throw new KitError("The model returned nothing usable. Try again.");

  const ctx = claimContext(facts, settings);
  const where =
    kind === "post" ? postWhere(opts.index, (item as KitPost).platform) : kind === "email" ? emailWhere(opts.index) : kind === "ad" ? adWhere(opts.index, (item as KitAd).network) : kind === "hero" ? "Hero" : "Video script";
  const warnings = items.map((it) => {
    const w = checkText(where, textOfItem(kind, it), ctx);
    if (kind === "post") {
      const lw = lengthWarning(where, it as KitPost);
      if (lw) w.push(lw);
    }
    return w;
  });
  return { items, warnings, language };
}
