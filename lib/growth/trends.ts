import prisma from "@/lib/prisma";
import { runClaude } from "@/lib/claude";
import { ensureGrowthTables } from "./db";
import { getCatalog, type CatalogItem } from "./catalog";
import { brandBrief, getGrowthSettings } from "./settings";
import { createLink } from "./links";
import { extractJson } from "./content/kit";
import { normalizeKit, type KitPost } from "./content/kit-types";
import { checkText, claimContext, lengthWarning, postWhere } from "./content/claims";
import { PLATFORM_INFO, type Platform } from "./content/platforms";
import { suggestSlots } from "./content/times";
import { toView } from "./content/posts";

// "Trending now": the latest AI Times articles (the news agent's output)
// become post ideas that connect the news to the most relevant TIBLOGICS
// product. One Haiku call per article, cached in GrowthContentState
// ("trend:<articleId>"), so an idea is written once and reused. "Draft it"
// turns an idea into a DRAFT post with a tracked link: nothing publishes
// without approval.

export const TREND_PLATFORMS: Platform[] = ["linkedin", "x", "facebook"];
const KEY = (id: string) => `trend:${id}`;
const RECENT_DAYS = 10;
const SHOWN = 6;

export interface TrendIdea {
  blogId: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  productKey: string;
  productTitle: string;
  productUrl: string;
  angle: string;
  posts: KitPost[];
  warnings: string[];
  generatedAt: string;
  drafted: Platform[];
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const RULES = `You turn an AI news article into social posts for a small AI company, connecting the news to ONE of the company's products. Return ONE JSON object and nothing else:
{"productKey":"<a key from PRODUCTS>","angle":"one sentence: why this news matters to the audience and how the product helps","posts":[{"platform":"linkedin","text":"...","hashtags":["..."]},{"platform":"x","text":"...","hashtags":["..."]},{"platform":"facebook","text":"...","hashtags":["..."]}]}

Rules:
- Facts about the news come only from the ARTICLE; facts about the product only from its line in PRODUCTS. Do not invent statistics, results, prices, dates or quotes.
- Never use a banned claim. No URLs in the text (the link is added automatically). Hashtags without "#".
- Lead with the news (a timely hook), then the practical takeaway, then a soft call to action toward the product.
- Pick the product that fits best; prefer AI Academy tracks, tools and services over articles.`;

function productList(items: CatalogItem[]): string {
  return items.map((i) => `${i.key} | ${i.type} | ${i.title} | ${clip(i.summary.replace(/\s+/g, " "), 110)}`).join("\n");
}

async function generate(article: { id: string; slug: string; title: string; excerpt: string; category: string; createdAt: Date }): Promise<TrendIdea | null> {
  const [settings, catalog] = await Promise.all([getGrowthSettings(), getCatalog()]);
  const products = catalog.filter((i) => i.type !== "article" && i.type !== "event" && i.type !== "live").slice(0, 45);
  if (!products.length) return null;
  const audience = settings.audiences.find((a) => a.language === settings.defaultLanguage) ?? null;
  const guides = TREND_PLATFORMS.map((p) => `- ${p}: ${PLATFORM_INFO[p].guide} Hashtags: ${PLATFORM_INFO[p].hashtags[0]}-${PLATFORM_INFO[p].hashtags[1]}.`).join("\n");
  const { text } = await runClaude("growth-ideas", {
    system: `${RULES}\n\n${brandBrief(settings, audience, settings.defaultLanguage)}`,
    messages: [{
      role: "user",
      content: `ARTICLE (${article.category}): ${article.title}\n${clip(article.excerpt, 900)}\n\nPRODUCTS (key | type | title | summary):\n${productList(products)}\n\nPlatforms:\n${guides}`,
    }],
    maxTokens: 1400,
    meta: { ref: `growth-trend:${article.id}` },
  });
  const j = extractJson(text) as { productKey?: unknown; angle?: unknown; posts?: unknown };
  const product = products.find((p) => p.key === j.productKey) ?? products.find((p) => p.type === "learn-plan") ?? products[0];
  const posts = normalizeKit({ posts: j.posts }).posts.filter((p) => TREND_PLATFORMS.includes(p.platform));
  if (!posts.length) return null;
  const ctx = claimContext([article.title, article.excerpt, ...product.facts], settings);
  const warnings = posts.flatMap((p, i) => {
    const w = checkText(postWhere(i, p.platform), p.text, ctx);
    const lw = lengthWarning(postWhere(i, p.platform), p);
    return lw ? [...w, lw] : w;
  });
  return {
    blogId: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: clip(article.excerpt.replace(/\s+/g, " "), 280),
    category: article.category,
    publishedAt: article.createdAt.toISOString(),
    productKey: product.key,
    productTitle: product.title,
    productUrl: product.url,
    angle: typeof j.angle === "string" ? clip(j.angle.trim(), 300) : "",
    posts,
    warnings,
    generatedAt: new Date().toISOString(),
    drafted: [],
  };
}

async function recentArticles() {
  const since = new Date(Date.now() - RECENT_DAYS * 86_400_000);
  const select = { id: true, slug: true, title: true, excerpt: true, category: true, createdAt: true } as const;
  try {
    const recent = await prisma.blogPost.findMany({ where: { published: true, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: SHOWN, select });
    if (recent.length) return recent;
    return await prisma.blogPost.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 3, select });
  } catch {
    return [];
  }
}

/**
 * Ideas for the latest articles. Cached ideas come back at once; up to
 * `generate` missing ones are written now (one Haiku call each), the rest
 * on the next request.
 */
export async function getTrendIdeas(opts: { generate?: number } = {}): Promise<{ ideas: TrendIdea[]; pending: number; errors: string[] }> {
  await ensureGrowthTables();
  const articles = await recentArticles();
  if (!articles.length) return { ideas: [], pending: 0, errors: [] };
  const rows = await prisma.growthContentState.findMany({ where: { key: { in: articles.map((a) => KEY(a.id)) } } });
  const cached = new Map(rows.map((r) => [r.key, r.value as unknown as TrendIdea]));
  const drafted = await prisma.growthPost.findMany({ where: { sourceKey: { in: articles.flatMap((a) => TREND_PLATFORMS.map((p) => `trend:${a.id}:${p}`)) } }, select: { sourceKey: true } });
  const draftedSet = new Set(drafted.map((d) => d.sourceKey));

  let budget = Math.max(0, opts.generate ?? 2);
  const ideas: TrendIdea[] = [];
  const errors: string[] = [];
  let pending = 0;
  for (const a of articles) {
    let idea = cached.get(KEY(a.id)) ?? null;
    if (!idea && budget > 0) {
      budget--;
      try {
        idea = await generate(a);
        if (idea) {
          const value = JSON.parse(JSON.stringify(idea));
          await prisma.growthContentState.upsert({ where: { key: KEY(a.id) }, create: { key: KEY(a.id), value }, update: { value } });
        }
      } catch (err) {
        errors.push(`${a.title}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    if (!idea) {
      pending++;
      continue;
    }
    ideas.push({ ...idea, drafted: TREND_PLATFORMS.filter((p) => draftedSet.has(`trend:${a.id}:${p}`)) });
  }
  return { ideas, pending, errors };
}

export class TrendError extends Error {}

/** "Draft it": a DRAFT post with a tracked link, at the platform's next best time. */
export async function draftTrendPost(blogId: string, platform: Platform) {
  await ensureGrowthTables();
  const row = await prisma.growthContentState.findUnique({ where: { key: KEY(blogId) } });
  const idea = row?.value as unknown as TrendIdea | undefined;
  if (!idea) throw new TrendError("That idea is not ready yet. Reload the ideas.");
  const post = idea.posts.find((p) => p.platform === platform) ?? idea.posts[0];
  if (!post) throw new TrendError("This idea has no post for that platform.");
  const sourceKey = `trend:${blogId}:${post.platform}`;
  const existing = await prisma.growthPost.findUnique({ where: { sourceKey } });
  if (existing) return { post: toView(existing), created: false };
  const settings = await getGrowthSettings();
  const tz = settings.audiences.find((a) => a.language === settings.defaultLanguage)?.timezone ?? "America/New_York";
  const link = await createLink({
    targetUrl: idea.productUrl || "/",
    utmSource: post.platform,
    utmMedium: "social",
    utmCampaign: `trend-${idea.slug}`.slice(0, 60),
    utmContent: "trend",
    label: `Trend: ${idea.title}`.slice(0, 200),
  });
  try {
    const p = await prisma.growthPost.create({
      data: {
        source: "trend",
        sourceKey,
        platform: post.platform,
        language: settings.defaultLanguage,
        body: post.text,
        hashtags: post.hashtags,
        linkCode: link.code,
        status: "draft",
        scheduledAt: suggestSlots(post.platform, tz, new Date(), 1)[0] ?? null,
      },
    });
    return { post: toView(p), created: true };
  } catch (err) {
    if ((err as { code?: string })?.code === "P2002") {
      const again = await prisma.growthPost.findUnique({ where: { sourceKey } });
      if (again) return { post: toView(again), created: false };
    }
    throw err;
  }
}
