import type { AcquireMagnet, AcquirePage } from "@prisma/client";
import { signupToJoin } from "@/lib/learn/join/choice";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import { getCatalogItem, TYPE_LABEL } from "../catalog";
import { trackedProductUrl } from "./email";
import { localizeContent } from "./i18n";
import { acquireLabels } from "./labels";
import { campaignFor } from "./store";
import { normalizeMagnet, normalizePage, type MagnetContent, type PageContent } from "./types";
import type { Labels } from "./fmt";

// What the public pages need, in the visitor's language where possible.

export interface ProductCard {
  title: string;
  summary: string;
  price: string | null;
  typeLabel: string;
  href: string;
}

async function productCard(key: string | null, campaign: string, medium: string): Promise<ProductCard | null> {
  if (!key) return null;
  const item = await getCatalogItem(key).catch(() => null);
  if (!item) return null;
  const href = trackedProductUrl(item.url, campaign, medium);
  if (!href) return null;
  // Same-site link: keep it relative so it works on any host.
  const u = new URL(href);
  return { title: item.title, summary: item.summary, price: item.price ?? null, typeLabel: TYPE_LABEL[item.type], href: `${u.pathname}${u.search}` };
}

export interface MagnetView {
  magnet: AcquireMagnet;
  content: MagnetContent;
  locale: Locale;
  /** Shown while the visitor's translation is on its way (in their language). */
  pendingNote: string | null;
  labels: Labels;
  product: ProductCard | null;
  campaign: string;
}

export async function magnetView(magnet: AcquireMagnet, visitor?: Locale): Promise<MagnetView> {
  const v = visitor ?? (await getLocale());
  const loc = await localizeContent(`acquire:magnet:${magnet.id}`, magnet.language, normalizeMagnet(magnet.content), v);
  const campaign = campaignFor("magnet", magnet.slug);
  return {
    magnet,
    content: loc.content,
    locale: loc.locale,
    pendingNote: loc.pending ? translatorFor(v)("acquire.pending") : null,
    labels: acquireLabels(loc.locale),
    product: await productCard(magnet.productKey, campaign, "lead-magnet"),
    campaign,
  };
}

export interface PageView {
  page: AcquirePage;
  content: PageContent;
  locale: Locale;
  pendingNote: string | null;
  labels: Labels;
  product: ProductCard | null;
  campaign: string;
  ctaHref: string | null;
}

export async function pageView(page: AcquirePage, visitor?: Locale, contentOverride?: PageContent): Promise<PageView> {
  const v = visitor ?? (await getLocale());
  const base = contentOverride ?? normalizePage(page.content);
  const loc = contentOverride ? { content: base, locale: (page.language as Locale) ?? "en", pending: false } : await localizeContent(`acquire:page:${page.id}`, page.language, base, v);
  const campaign = campaignFor("page", page.slug);
  let ctaHref: string | null = null;
  if (base.cta.kind === "newsletter") ctaHref = "#lead-form";
  else if (base.cta.href.startsWith("/")) ctaHref = (() => {
    // "Sign up" CTAs open the one-page join flow (choose, account, pay).
    const u = trackedProductUrl(signupToJoin(base.cta.href), campaign, "landing");
    if (!u) return null;
    const x = new URL(u);
    return `${x.pathname}${x.search}${x.hash}`;
  })();
  else if (base.cta.href) ctaHref = base.cta.href;
  return {
    page,
    content: loc.content,
    locale: loc.locale,
    pendingNote: loc.pending ? translatorFor(v)("acquire.pending") : null,
    labels: acquireLabels(loc.locale),
    product: await productCard(page.productKey, campaign, "landing"),
    campaign,
    ctaHref,
  };
}
