import prisma from "@/lib/prisma";
import { PLANS } from "@/lib/payments/provider";
import { trackPriceCents } from "@/lib/learn/pricing";
import { toolkitPlans } from "@/lib/toolkit/config";
import { blueprintPrice } from "@/lib/blueprint/config";
import { translatorFor } from "@/lib/i18n/server";

// The product catalog the Growth content tools market, built from what the
// site actually sells: Learn tracks and the all-tracks plan, store products
// (prompt packs included), Toolkit Live plans, the Automation Blueprint, free
// AI tools, services, events, live expert sessions and AI Times articles.
//
// Each item carries `facts`: the only product claims a generated kit may make.
// They come straight from the database or configuration, never from a model.

export type CatalogType = "track" | "learn-plan" | "product" | "toolkit" | "blueprint" | "tool" | "service" | "event" | "live" | "article";

export const TYPE_LABEL: Record<CatalogType, string> = {
  track: "AI Academy track",
  "learn-plan": "AI Academy plan",
  product: "Store product",
  toolkit: "Toolkit Live",
  blueprint: "Blueprint",
  tool: "Free AI tool",
  service: "Service",
  event: "Event",
  live: "Live session",
  article: "AI Times article",
};

export interface CatalogItem {
  key: string;
  type: CatalogType;
  title: string;
  summary: string;
  facts: string[];
  /** Site path (or absolute URL) the campaign links to. */
  url: string;
  price?: string;
  createdAt?: string;
}

const money = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);

const clip = (s: string | null | undefined, n: number) => {
  const t = (s ?? "").replace(/<[^>]+>/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

async function safe<T>(label: string, fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[growth/catalog] ${label}`, err instanceof Error ? err.message : err);
    return [];
  }
}

const TOOLS = [
  { id: "scanner", url: "/tools/scanner", paid: false },
  { id: "calculator", url: "/tools/calculator", paid: false },
  { id: "monitor", url: "/tools/readiness-monitor", paid: true },
] as const;

const SERVICES = ["agents", "automation", "strategy", "web", "security", "data", "mobile", "training", "iot"] as const;

let cache: { at: number; items: CatalogItem[] } | null = null;

/** The whole catalog (cached for a minute). */
export async function getCatalog(): Promise<CatalogItem[]> {
  if (cache && Date.now() - cache.at < 60_000) return cache.items;
  const t = translatorFor("en");

  const [tracks, products, events, lives, articles] = await Promise.all([
    safe("tracks", () =>
      prisma.learnTrack.findMany({
        where: { status: { in: ["live", "coming_soon"] } },
        orderBy: { sortOrder: "asc" },
        select: {
          slug: true, title: true, titleFr: true, tagline: true, description: true, level: true, status: true, outcomes: true,
          audience: true, estimatedHours: true, certificateName: true, priceCents: true, createdAt: true,
          modules: { orderBy: { sortOrder: "asc" }, select: { title: true, _count: { select: { lessons: true } } } },
        },
      }),
    ),
    safe("products", () =>
      prisma.product.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: { slug: true, name: true, tagline: true, description: true, price: true, compareAtPrice: true, currency: true, category: true, tags: true, digital: true, createdAt: true },
      }),
    ),
    safe("events", () =>
      prisma.event.findMany({
        where: { published: true },
        orderBy: { date: "desc" },
        take: 50,
        select: { slug: true, title: true, description: true, type: true, price: true, currency: true, location: true, date: true, timeSlot: true, timezone: true, createdAt: true },
      }),
    ),
    safe("live sessions", () =>
      prisma.expertSession.findMany({
        where: { status: "scheduled", startsAt: { gte: new Date(Date.now() - 86_400_000) } },
        orderBy: { startsAt: "asc" },
        take: 30,
        select: { id: true, title: true, expertName: true, expertBio: true, topic: true, startsAt: true, durationMinutes: true, timezone: true, createdAt: true },
      }),
    ),
    safe("articles", () =>
      prisma.blogPost.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: { slug: true, title: true, excerpt: true, category: true, tags: true, readingTime: true, createdAt: true },
      }),
    ),
  ]);

  const items: CatalogItem[] = [];

  for (const tr of tracks) {
    const lessons = tr.modules.reduce((n, m) => n + m._count.lessons, 0);
    const outcomes = Array.isArray(tr.outcomes) ? (tr.outcomes as unknown[]).filter((o): o is string => typeof o === "string") : [];
    const price = trackPriceCents(tr.level, tr.priceCents);
    items.push({
      key: `track:${tr.slug}`,
      type: "track",
      title: tr.title,
      summary: clip(tr.tagline || tr.description, 200),
      url: `/learning-box/${tr.slug}`,
      price: `${money(price)} one-time, or included in the ${money(PLANS.monthly.amount)}/month all-tracks plan`,
      createdAt: tr.createdAt.toISOString(),
      facts: [
        `Self-paced online track in TIBLOGICS AI Academy (inside the product it is "ARFA · AI Academy"; ARFA = AI Readiness For All), level: ${tr.level}${tr.status === "coming_soon" ? " (coming soon, waitlist open)" : ""}.`,
        tr.tagline ? `Tagline: ${tr.tagline}` : "",
        `Description: ${clip(tr.description, 700)}`,
        tr.audience ? `Who it is for: ${clip(tr.audience, 300)}` : "",
        tr.modules.length ? `${tr.modules.length} modules${lessons ? `, ${lessons} lessons` : ""}: ${tr.modules.slice(0, 12).map((m) => m.title).join("; ")}.` : "",
        tr.estimatedHours ? `About ${Math.round(tr.estimatedHours)} hours of learning.` : "",
        `Completing it earns the certificate "${tr.certificateName}".`,
        outcomes.length ? `Outcomes: ${outcomes.slice(0, 8).map((o) => clip(o, 160)).join("; ")}.` : "",
        `Price: ${money(price)} one-time for lifetime access to this track, or every track with the monthly plan (${money(PLANS.monthly.amount)}/month, cancel anytime).`,
        tr.titleFr ? "Available in English and French." : "",
      ].filter(Boolean),
    });
  }

  items.push({
    key: "learn-plan:monthly",
    type: "learn-plan",
    title: "AI Academy: all tracks (monthly)",
    summary: PLANS.monthly.blurb,
    url: "/learning-box",
    price: `${money(PLANS.monthly.amount)}/month`,
    facts: [
      `Every AI Academy track, ${money(PLANS.monthly.amount)} per month. ${PLANS.monthly.blurb}`,
      tracks.length ? `Tracks include: ${tracks.filter((x) => x.status === "live").map((x) => x.title).join("; ")}.` : "",
      "Lessons, labs, quizzes, final exams and certificates; available in English and French.",
    ].filter(Boolean),
  });

  for (const p of products) {
    items.push({
      key: `product:${p.slug}`,
      type: "product",
      title: p.name,
      summary: clip(p.tagline || p.description, 200),
      url: `/store/${p.slug}`,
      price: money(p.price, p.currency),
      createdAt: p.createdAt.toISOString(),
      facts: [
        `${p.digital ? "Digital product" : "Product"} in the TIBLOGICS Store, category ${p.category}.`,
        p.tagline ? `Tagline: ${p.tagline}` : "",
        `Description: ${clip(p.description, 900)}`,
        `Price: ${money(p.price, p.currency)}${p.compareAtPrice && p.compareAtPrice > p.price ? ` (regular price ${money(p.compareAtPrice, p.currency)})` : ""}.`,
        p.tags.length ? `Tags: ${p.tags.slice(0, 10).join(", ")}.` : "",
      ].filter(Boolean),
    });
  }

  const plans = toolkitPlans();
  for (const plan of Object.values(plans)) {
    items.push({
      key: `toolkit:${plan.id}`,
      type: "toolkit",
      title: plan.name,
      summary: plan.blurb,
      url: "/tools/toolkit-live",
      price: plan.amount ? `${money(plan.amount)}/month` : undefined,
      facts: [
        plan.blurb,
        `Includes up to ${plan.monthlyRuns} runs per month.`,
        plan.generate ? "Includes the industry prompt libraries filled in with the customer's business details." : "Checks drafts only (no generation).",
        plan.amount ? `Price: ${money(plan.amount)} per month.` : "",
      ].filter(Boolean),
    });
  }

  const bp = blueprintPrice();
  items.push({
    key: "blueprint:automation",
    type: "blueprint",
    title: t("tools.index.blueprint.name"),
    summary: t("tools.index.blueprint.desc"),
    url: "/tools/automation-blueprint",
    price: bp ? money(bp) : undefined,
    facts: [t("tools.index.blueprint.desc"), bp ? `Price: ${money(bp)}, credited against a build with TIBLOGICS.` : ""].filter(Boolean),
  });

  for (const tool of TOOLS) {
    items.push({
      key: `tool:${tool.id}`,
      type: "tool",
      title: t(`tools.index.${tool.id}.name`),
      summary: t(`tools.index.${tool.id}.desc`),
      url: tool.url,
      price: tool.paid ? undefined : "Free",
      facts: [t(`tools.index.${tool.id}.desc`), tool.paid ? "" : "Free to use on tiblogics.com."].filter(Boolean),
    });
  }

  for (const id of SERVICES) {
    const name = t(`pages.services.svc.${id}.name`);
    items.push({
      key: `service:${id}`,
      type: "service",
      title: name,
      summary: t(`pages.services.svc.${id}.desc`),
      url: `/services/get-started?service=${encodeURIComponent(name)}`,
      facts: [
        `TIBLOGICS service: ${name}. ${t(`pages.services.svc.${id}.desc`)}`,
        "Start with a free consultation request on tiblogics.com/services.",
      ],
    });
  }

  for (const e of events) {
    const when = e.date ? e.date.toLocaleDateString("en-US", { dateStyle: "long", timeZone: e.timezone || "UTC" }) : null;
    items.push({
      key: `event:${e.slug}`,
      type: "event",
      title: e.title,
      summary: clip(e.description, 200),
      url: "/events",
      price: e.price ? money(e.price, e.currency) : "Free",
      createdAt: e.createdAt.toISOString(),
      facts: [
        `${e.type.toLowerCase()} by TIBLOGICS, location: ${e.location}.`,
        when ? `Date: ${when}${e.timeSlot ? `, ${e.timeSlot}` : ""} (${e.timezone}).` : "",
        `Description: ${clip(e.description, 800)}`,
        `Price: ${e.price ? money(e.price, e.currency) : "free"}.`,
      ].filter(Boolean),
    });
  }

  for (const s of lives) {
    items.push({
      key: `live:${s.id}`,
      type: "live",
      title: s.title,
      summary: clip(s.topic || s.expertBio, 200),
      url: `/learn/live/${s.id}`,
      createdAt: s.createdAt.toISOString(),
      facts: [
        `Live expert session for TIBLOGICS AI Academy members with ${s.expertName}.`,
        s.topic ? `Topic: ${clip(s.topic, 300)}` : "",
        s.expertBio ? `About the expert: ${clip(s.expertBio, 400)}` : "",
        `Starts ${s.startsAt.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: s.timezone || "UTC" })} (${s.timezone}), ${s.durationMinutes} minutes.`,
      ].filter(Boolean),
    });
  }

  for (const a of articles) {
    items.push({
      key: `article:${a.slug}`,
      type: "article",
      title: a.title,
      summary: clip(a.excerpt, 200),
      url: `/ai-times/${a.slug}`,
      price: "Free to read",
      createdAt: a.createdAt.toISOString(),
      facts: [
        `AI Times article (${a.category}, ${a.readingTime}-minute read).`,
        `Summary: ${clip(a.excerpt, 700)}`,
        a.tags.length ? `Tags: ${a.tags.slice(0, 8).join(", ")}.` : "",
      ].filter(Boolean),
    });
  }

  cache = { at: Date.now(), items };
  return items;
}

export async function getCatalogItem(key: string): Promise<CatalogItem | null> {
  return (await getCatalog()).find((i) => i.key === key) ?? null;
}

export function clearCatalogCache() {
  cache = null;
}
