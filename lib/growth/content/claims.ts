// Claim checks for generated marketing copy. Client-safe (no server
// imports): the kit editor runs the same checks live, item by item, that the
// server runs on save. A number is allowed only when it appears in the
// product facts or the brand's approved proof points; banned claims are
// never allowed; posts must fit their platform with link and hashtags.

import type { KitContent } from "./kit-types";
import { composePost, PLATFORM_INFO, type Platform } from "./platforms";

export interface ClaimRules {
  proofPoints: string[];
  bannedClaims: string[];
}

export const NUMBER_RE = /(?:[$€£]\s?\d[\d,.]*\s?[kKmM]?|\d[\d,.]*\s?(?:%|percent|pour ?cent|x\b|×|FCFA|CFA|USD|dollars?|k\b))|\b\d{3,}[\d,.]*\b/g;

export function normNum(s: string): string {
  return s.toLowerCase().replace(/\s|,/g, "").replace(/percent|pourcent/, "%").replace(/\.0+(?=\D|$)/, "");
}

/** Prepared allow-list, so checking many items does not re-scan the facts. */
export function claimContext(facts: string[], rules: ClaimRules) {
  const allowed = new Set<string>();
  for (const src of [...facts, ...rules.proofPoints]) for (const m of src.match(NUMBER_RE) ?? []) allowed.add(normNum(m));
  return { allowed, allowedText: [...facts, ...rules.proofPoints].join(" ").toLowerCase(), banned: rules.bannedClaims.filter(Boolean) };
}
export type ClaimContext = ReturnType<typeof claimContext>;

/** Warnings for one piece of text, prefixed with where it is. */
export function checkText(where: string, text: string, ctx: ClaimContext): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of text.match(NUMBER_RE) ?? []) {
    const n = normNum(m);
    if (ctx.allowed.has(n) || seen.has(n) || ctx.allowedText.includes(m.toLowerCase().trim())) continue;
    seen.add(n);
    out.push(`${where}: "${m.trim()}" is not in the product data or proof points. Check it or remove it.`);
  }
  const lower = text.toLowerCase();
  for (const b of ctx.banned) if (lower.includes(b.toLowerCase())) out.push(`${where}: uses the banned claim "${b}".`);
  return out;
}

export const SAMPLE_SHORT_URL = "https://tiblogics.com/go/xxxxxxx";

/** Over-length warning for a post (text + link + hashtags), or null. */
export function lengthWarning(where: string, p: { platform: Platform; text: string; hashtags: string[] }): string | null {
  const len = composePost({ platform: p.platform, body: p.text, hashtags: p.hashtags, shortUrl: SAMPLE_SHORT_URL }).length;
  const max = PLATFORM_INFO[p.platform].maxChars;
  return len > max ? `${where} is ${len} characters with link and hashtags; the limit is ${max}.` : null;
}

export const postWhere = (i: number, platform: Platform) => `Post ${i + 1} (${PLATFORM_INFO[platform].label})`;
export const emailWhere = (i: number) => `Email ${i + 1}`;
export const adWhere = (i: number, network: string) => `Ad ${i + 1} (${network})`;

export function kitTexts(k: KitContent): [string, string][] {
  return [
    ["Positioning", k.positioning],
    ...k.pains.map((p, i): [string, string] => [`Pain ${i + 1}`, p]),
    ...k.benefits.map((p, i): [string, string] => [`Benefit ${i + 1}`, p]),
    ["Hero", [k.hero.headline, k.hero.subheadline, ...k.hero.bullets].join(" ")],
    ...k.posts.map((p, i): [string, string] => [postWhere(i, p.platform), p.text]),
    ...k.emails.map((e, i): [string, string] => [emailWhere(i), [e.subject, e.preview, e.body].join(" ")]),
    ...k.ads.map((a, i): [string, string] => [adWhere(i, a.network), [a.headline, a.primaryText, a.description].join(" ")]),
    ["Video script", [k.video.hook, k.video.script, ...k.video.onScreenText].join(" ")],
  ];
}

/**
 * Warnings for the editor: numbers that are not in the product facts or
 * proof points, banned claims, and posts over the platform limit.
 */
export function checkKit(k: KitContent, facts: string[], rules: ClaimRules): string[] {
  const ctx = claimContext(facts, rules);
  const warnings: string[] = [];
  for (const [where, text] of kitTexts(k)) warnings.push(...checkText(where, text, ctx));
  k.posts.forEach((p, i) => {
    const w = lengthWarning(postWhere(i, p.platform), p);
    if (w) warnings.push(w);
  });
  return warnings.slice(0, 60);
}
