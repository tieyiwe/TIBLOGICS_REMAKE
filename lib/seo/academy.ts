// ARFA AI Academy facts for the takeaways, FAQs, structured data and
// llms.txt. Everything is computed from the live catalog and the pricing code
// (lib/learn/pricing.ts, lib/payments/provider.ts), so the numbers search and
// AI engines read always match what the checkout charges.

import { getCatalog, type CatalogTrack } from "@/lib/learn/catalog";
import { totalHours } from "@/lib/learn/format";
import { PLANS } from "@/lib/payments/provider";
import type { T } from "@/lib/i18n/server";
import type { QA } from "./jsonld";

export type SummaryTrack = CatalogTrack & { hours: number; shownPriceCents: number };

export interface AcademySummary {
  /** Live tracks, catalog order. */
  live: SummaryTrack[];
  minPriceCents: number;
  maxPriceCents: number;
  minHours: number;
  maxHours: number;
  monthlyCents: number;
}

/** "beginner to intermediate" in the visitor's language, for running text. */
export function levelText(t: T, level: string, levelEnd?: string | null): string {
  const name = (lv: string) => {
    const k = `learn.level.${lv}`;
    const v = t(k);
    return (v === k ? lv : v).toLowerCase();
  };
  return levelEnd && levelEnd !== level ? t("seo.levelRange", { a: name(level), b: name(levelEnd) }) : name(level);
}

/** Hours a learner should plan for: lessons plus hands-on work. */
export function trackHours(t: Pick<CatalogTrack, "lessonMinutes" | "handsOnMinutes" | "estimatedHours">): number {
  return totalHours(t.lessonMinutes, t.handsOnMinutes, t.estimatedHours);
}

/**
 * Pass the catalog a page already loaded (localised, with sale prices) to
 * avoid a second query; otherwise the English catalog is read.
 */
export async function academySummary(
  catalog?: Array<CatalogTrack & { salePriceCents?: number | null }>,
  monthlyCents: number = PLANS.monthly.amount,
): Promise<AcademySummary> {
  const rows = catalog ?? (await getCatalog());
  const live = rows
    .filter((c) => c.status === "live")
    .map((c) => ({ ...c, hours: trackHours(c), shownPriceCents: c.salePriceCents ?? c.priceCents }));
  const prices = live.map((c) => c.shownPriceCents);
  const hours = live.map((c) => c.hours).filter((h) => h > 0);
  return {
    live,
    minPriceCents: prices.length ? Math.min(...prices) : 0,
    maxPriceCents: prices.length ? Math.max(...prices) : 0,
    minHours: hours.length ? Math.floor(Math.min(...hours)) : 0,
    maxHours: hours.length ? Math.ceil(Math.max(...hours)) : 0,
    monthlyCents,
  };
}

const sentence = (s: string | null | undefined) => {
  const x = (s ?? "").trim();
  if (!x) return "";
  return /[.!?…]$/.test(x) ? x : `${x}.`;
};

/** "Key takeaways" for the catalog page. */
export function academyTakeaways(t: T, s: AcademySummary, money: (cents: number) => string): string[] {
  const out = [t("seo.arfa.tldr.1")];
  if (s.live.length && s.maxHours > 0) out.push(t("seo.arfa.tldr.2", { n: s.live.length, min: s.minHours, max: s.maxHours }));
  if (s.live.length) out.push(t("seo.arfa.tldr.3", { from: money(s.minPriceCents), monthly: money(s.monthlyCents) }));
  out.push(t("seo.arfa.tldr.4"), t("seo.arfa.tldr.5"));
  return out;
}

/** FAQ for the catalog page: the questions people ask AI assistants about ARFA. */
export function academyFaq(t: T, s: AcademySummary, money: (cents: number) => string): QA[] {
  const qa = (k: string, vars?: Record<string, string | number>): QA => ({ q: t(`seo.arfa.faq.${k}.q`), a: t(`seo.arfa.faq.${k}.a`, vars) });
  const out: QA[] = [qa("what")];
  if (s.live.length) {
    out.push(qa("cost", { from: money(s.minPriceCents), to: money(s.maxPriceCents), monthly: money(s.monthlyCents) }));
  }
  out.push(qa("french"), qa("cert"), qa("start"));
  if (s.maxHours > 0) out.push(qa("time", { min: s.minHours, max: s.maxHours }));
  const smb = s.live.find((c) => c.slug === "ai-small-business");
  if (smb) out.push(qa("business", { track: smb.title, tagline: sentence(smb.tagline ?? smb.description.split(/(?<=\.)\s/)[0]) }));
  const parents = s.live.find((c) => c.slug === "ai-for-parents");
  if (parents) out.push(qa("parents", { track: parents.title, tagline: sentence(parents.tagline ?? parents.description.split(/(?<=\.)\s/)[0]) }));
  out.push(qa("offline"));
  return out;
}
