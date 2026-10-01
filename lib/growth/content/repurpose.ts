import prisma from "@/lib/prisma";
import { runClaude } from "@/lib/claude";
import { ensureGrowthTables } from "../db";
import { brandBrief, getGrowthSettings, type Audience, type GrowthSettingsData } from "../settings";
import { createLink } from "../links";
import { extractJson } from "./kit";
import { normalizeKit } from "./kit-types";
import { PLATFORM_INFO, type Language, type Platform } from "./platforms";
import { suggestSlots } from "./times";

// Repurpose automation: new AI Times articles, Learn tracks and lessons,
// published store products, events and live sessions become DRAFT posts in
// the queue (the owner approves; nothing publishes on its own).
//
// Run by the growth cron. Idempotent: every draft has a sourceKey
// ("blog:<id>:linkedin:en") under a unique index, items already drafted are
// skipped before any model call, and the scan cursor only moves forward once
// every candidate up to it has been handled. Bounded per run
// (GROWTH_REPURPOSE_BATCH items, default 4, one Haiku call each).

const STATE_KEY = "repurpose";
const FIRST_RUN_LOOKBACK_DAYS = 3;
const DEFAULT_PLATFORMS: Platform[] = ["linkedin", "x", "facebook"];

export interface RepurposeItem {
  key: string; // "blog:<id>"
  kind: "article" | "track" | "lessons" | "product" | "event" | "live";
  title: string;
  facts: string[];
  url: string;
  at: Date;
}

const clip = (s: string | null | undefined, n: number) => {
  const t = (s ?? "").replace(/<[^>]+>/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

async function safe<T>(label: string, fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[growth/repurpose] ${label}`, err instanceof Error ? err.message : err);
    return [];
  }
}

/** Everything new or newly published since `since`. */
export async function findNewItems(since: Date): Promise<RepurposeItem[]> {
  const [posts, tracks, lessons, products, events, lives] = await Promise.all([
    safe("blog", () =>
      prisma.blogPost.findMany({
        where: { published: true, createdAt: { gt: since } },
        select: { id: true, slug: true, title: true, excerpt: true, category: true, createdAt: true },
        take: 50,
      }),
    ),
    safe("tracks", () =>
      prisma.learnTrack.findMany({
        where: { status: { in: ["live", "coming_soon"] }, createdAt: { gt: since } },
        select: { id: true, slug: true, title: true, tagline: true, description: true, level: true, status: true, createdAt: true },
        take: 20,
      }),
    ),
    safe("lessons", () =>
      prisma.lesson.findMany({
        where: { createdAt: { gt: since }, module: { track: { status: "live", createdAt: { lte: since } } } },
        select: { id: true, title: true, createdAt: true, module: { select: { track: { select: { id: true, slug: true, title: true } } } } },
        take: 200,
      }),
    ),
    safe("products", () =>
      prisma.product.findMany({
        where: { published: true, updatedAt: { gt: since } },
        select: { id: true, slug: true, name: true, tagline: true, description: true, price: true, currency: true, category: true, updatedAt: true },
        take: 50,
      }),
    ),
    safe("events", () =>
      prisma.event.findMany({
        where: { published: true, updatedAt: { gt: since } },
        select: { id: true, slug: true, title: true, description: true, type: true, date: true, timezone: true, price: true, location: true, updatedAt: true },
        take: 30,
      }),
    ),
    safe("live", () =>
      prisma.expertSession.findMany({
        where: { status: "scheduled", createdAt: { gt: since }, startsAt: { gt: new Date() } },
        select: { id: true, title: true, expertName: true, topic: true, startsAt: true, timezone: true, createdAt: true },
        take: 20,
      }),
    ),
  ]);

  const money = (c: number, cur = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur.toUpperCase() }).format(c / 100);
  const items: RepurposeItem[] = [];
  for (const p of posts)
    items.push({ key: `blog:${p.id}`, kind: "article", title: p.title, url: `/ai-times/${p.slug}`, at: p.createdAt, facts: [`New AI Times article (${p.category}).`, `Summary: ${clip(p.excerpt, 600)}`] });
  for (const t of tracks)
    items.push({
      key: `track:${t.id}`, kind: "track", title: t.title, url: `/learning-box/${t.slug}`, at: t.createdAt,
      facts: [`New TIBLOGICS Learning Box track (${t.level})${t.status === "coming_soon" ? ", coming soon: waitlist open" : ""}.`, t.tagline ? `Tagline: ${t.tagline}` : "", `Description: ${clip(t.description, 600)}`].filter(Boolean),
    });
  // New lessons in an existing track: one item per track per day.
  const byTrack = new Map<string, { track: { id: string; slug: string; title: string }; titles: string[]; at: Date }>();
  for (const l of lessons) {
    const tr = l.module.track;
    const at = l.createdAt ?? new Date();
    const day = at.toISOString().slice(0, 10);
    const k = `${tr.id}:${day}`;
    const e = byTrack.get(k) ?? { track: tr, titles: [], at };
    e.titles.push(l.title);
    if (at > e.at) e.at = at;
    byTrack.set(k, e);
  }
  for (const [k, e] of byTrack)
    items.push({
      key: `lessons:${k}`, kind: "lessons", title: `New lessons in ${e.track.title}`, url: `/learning-box/${e.track.slug}`, at: e.at,
      facts: [`${e.titles.length} new lesson${e.titles.length > 1 ? "s" : ""} added to the Learning Box track "${e.track.title}": ${e.titles.slice(0, 8).join("; ")}.`],
    });
  for (const p of products)
    items.push({
      key: `product:${p.id}`, kind: "product", title: p.name, url: `/store/${p.slug}`, at: p.updatedAt,
      facts: [`Now in the TIBLOGICS Store (${p.category}).`, p.tagline ? `Tagline: ${p.tagline}` : "", `Description: ${clip(p.description, 600)}`, `Price: ${money(p.price, p.currency)}.`].filter(Boolean),
    });
  for (const e of events)
    items.push({
      key: `event:${e.id}`, kind: "event", title: e.title, url: "/events", at: e.updatedAt,
      facts: [
        `TIBLOGICS ${e.type.toLowerCase()}, ${e.location}.`,
        e.date ? `Date: ${e.date.toLocaleDateString("en-US", { dateStyle: "long", timeZone: e.timezone || "UTC" })}.` : "",
        `Description: ${clip(e.description, 600)}`,
        `Price: ${e.price ? money(e.price) : "free"}.`,
      ].filter(Boolean),
    });
  for (const s of lives)
    items.push({
      key: `live:${s.id}`, kind: "live", title: s.title, url: `/learn/live/${s.id}`, at: s.createdAt,
      facts: [
        `Live expert session for Learning Box members with ${s.expertName}.`,
        s.topic ? `Topic: ${clip(s.topic, 300)}` : "",
        `Starts ${s.startsAt.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: s.timezone || "UTC" })} (${s.timezone}).`,
      ].filter(Boolean),
    });
  return items.sort((a, b) => a.at.getTime() - b.at.getTime());
}

const REPURPOSE_RULES = `You repurpose new content from a small AI company into social media posts. Return ONE JSON object: {"posts":[{"platform":"...","text":"...","hashtags":["..."]}]} with exactly one post per requested platform, nothing else.

Rules: use only the FACTS given (no invented numbers, results, dates or features); never use a banned claim; no URLs in the text (the link is added automatically); hashtags without "#" in the array, never in the text.`;

/** Language(s) and platforms to draft for: the default language, plus French when a French audience exists. */
function targets(settings: GrowthSettingsData): { language: Language; platforms: Platform[]; audience: Audience | null }[] {
  const out: { language: Language; platforms: Platform[]; audience: Audience | null }[] = [];
  const main = settings.audiences.find((a) => a.language === settings.defaultLanguage) ?? null;
  out.push({ language: settings.defaultLanguage, platforms: DEFAULT_PLATFORMS, audience: main });
  const fr = settings.audiences.find((a) => a.language === "fr");
  if (fr && settings.defaultLanguage !== "fr") {
    const ch = fr.channels.length ? fr.channels.slice(0, 2) : (["facebook", "whatsapp"] as Platform[]);
    out.push({ language: "fr", platforms: ch, audience: fr });
  }
  return out;
}

async function draftFor(item: RepurposeItem, settings: GrowthSettingsData): Promise<number> {
  let created = 0;
  for (const tg of targets(settings)) {
    const wanted = tg.platforms;
    const keys = wanted.map((p) => `${item.key}:${p}:${tg.language}`);
    const have = new Set((await prisma.growthPost.findMany({ where: { sourceKey: { in: keys } }, select: { sourceKey: true } })).map((p) => p.sourceKey));
    const todo = wanted.filter((p, i) => !have.has(keys[i]));
    if (todo.length === 0) continue;

    const guides = todo.map((p) => `- ${p}: ${PLATFORM_INFO[p].guide} Hashtags: ${PLATFORM_INFO[p].hashtags[0]}-${PLATFORM_INFO[p].hashtags[1]}.`).join("\n");
    const { text } = await runClaude("growth-post", {
      system: `${REPURPOSE_RULES}\n\n${brandBrief(settings, tg.audience, tg.language)}`,
      messages: [{
        role: "user",
        content: `NEW ${item.kind.toUpperCase()}: ${item.title}\n\nFACTS:\n${item.facts.map((f) => `- ${f}`).join("\n")}\n\nPlatforms (one post each):\n${guides}`,
      }],
      meta: { ref: `growth-repurpose:${item.key}` },
    });
    const posts = normalizeKit(extractJson(text)).posts;
    const tz = tg.audience?.timezone ?? "America/New_York";
    const campaign = `auto-${item.kind}-${item.title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40)}`;
    for (const p of todo) {
      const post = posts.find((x) => x.platform === p);
      if (!post) continue;
      const link = await createLink({ targetUrl: item.url, utmSource: p, utmMedium: "social", utmCampaign: campaign, utmContent: `auto-${tg.language}`, label: `Auto: ${item.title}` });
      try {
        await prisma.growthPost.create({
          data: {
            source: "repurpose",
            sourceKey: `${item.key}:${p}:${tg.language}`,
            platform: p,
            language: tg.language,
            body: post.text,
            hashtags: post.hashtags,
            linkCode: link.code,
            status: "draft",
            scheduledAt: suggestSlots(p, tz, new Date(), 1)[0] ?? null,
          },
        });
        created++;
      } catch (err) {
        if ((err as { code?: string })?.code !== "P2002") throw err;
      }
    }
  }
  return created;
}

export interface RepurposeReport {
  scanned: number;
  processed: number;
  drafts: number;
  remaining: number;
  since: string;
  errors: string[];
}

export async function runRepurpose(opts?: { batch?: number }): Promise<RepurposeReport> {
  await ensureGrowthTables();
  const startedAt = new Date();
  const state = await prisma.growthContentState.findUnique({ where: { key: STATE_KEY } });
  const v = (state?.value ?? {}) as { since?: string };
  const since = v.since && !Number.isNaN(Date.parse(v.since)) ? new Date(v.since) : new Date(Date.now() - FIRST_RUN_LOOKBACK_DAYS * 86_400_000);
  const batch = opts?.batch ?? (Number(process.env.GROWTH_REPURPOSE_BATCH) > 0 ? Number(process.env.GROWTH_REPURPOSE_BATCH) : 4);

  const settings = await getGrowthSettings();
  const items = await findNewItems(since);
  // Skip items fully drafted already (cheap; no model call).
  const pending: RepurposeItem[] = [];
  for (const it of items) {
    const n = await prisma.growthPost.count({ where: { sourceKey: { startsWith: `${it.key}:` } } });
    const expected = targets(settings).reduce((s, t) => s + t.platforms.length, 0);
    if (n < expected) pending.push(it);
  }

  const errors: string[] = [];
  let drafts = 0;
  let processed = 0;
  for (const it of pending.slice(0, batch)) {
    try {
      drafts += await draftFor(it, settings);
      processed++;
    } catch (err) {
      errors.push(`${it.key}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  const remaining = pending.length - processed;
  // Move the cursor only when nothing is left behind (an hour of overlap is
  // harmless: sourceKeys dedupe).
  if (remaining === 0 && errors.length === 0) {
    const next = new Date(startedAt.getTime() - 3_600_000).toISOString();
    await prisma.growthContentState.upsert({
      where: { key: STATE_KEY },
      create: { key: STATE_KEY, value: { since: next } },
      update: { value: { since: next } },
    });
  } else if (!state) {
    await prisma.growthContentState.create({ data: { key: STATE_KEY, value: { since: since.toISOString() } } }).catch(() => {});
  }
  return { scanned: items.length, processed, drafts, remaining, since: since.toISOString(), errors };
}
