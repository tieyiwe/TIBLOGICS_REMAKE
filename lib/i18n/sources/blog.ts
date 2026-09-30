import { sanitizeTranslatedHtml } from "../sanitize-html";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { localized, translated, type Fields } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/config";

// AI Times articles (BlogPost rows). The article page, the listing and the
// translate cron all build the cached unit from postFields(), so they hash the
// same fields and share one translation per post and language.
//
// Content is HTML; the translator keeps tags and attributes and translates
// only the visible text.

export interface PostSource {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
}

export type PostFields = { title: string; excerpt: string; content: string };

export const postKey = (slug: string) => `post:${slug}`;

export function postFields(p: Pick<PostSource, "title" | "excerpt" | "content">): PostFields {
  return { title: p.title, excerpt: p.excerpt, content: p.content };
}

// ── Cache access that never calls the model ─────────────────────────────────

// Same definition as lib/i18n/content.ts, so reading before any translation
// has been written does not fail on a missing table.
const TABLE = `CREATE TABLE IF NOT EXISTS "ContentTranslation" (
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentTranslation_pkey" PRIMARY KEY ("key", "locale")
  )`;

let ready: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  ready ??= prisma.$executeRawUnsafe(TABLE).then(
    () => undefined,
    (err) => {
      ready = null;
      throw err;
    },
  );
  return ready;
}

/** The hash lib/i18n/content.ts stores with each translation (kept in step with it). */
function hashOf(fields: Fields): string {
  const h = createHash("sha256");
  for (const k of Object.keys(fields).sort()) h.update(k).update("\0").update(fields[k] ?? "").update("\0");
  return h.digest("hex").slice(0, 32);
}

// The same hash computed in SQL from the BlogPost row, for the fields
// content, excerpt, title (sorted), so a listing can check that a cached
// translation matches the current English without loading every article body.
const SQL_POST_HASH = `left(encode(sha256(
  convert_to('content', 'UTF8') || '\\x00'::bytea || convert_to(b."content", 'UTF8') || '\\x00'::bytea ||
  convert_to('excerpt', 'UTF8') || '\\x00'::bytea || convert_to(b."excerpt", 'UTF8') || '\\x00'::bytea ||
  convert_to('title', 'UTF8') || '\\x00'::bytea || convert_to(b."title", 'UTF8') || '\\x00'::bytea
), 'hex'), 32)`;

/**
 * Cached translated titles and excerpts for many posts in one query, keyed by
 * slug. Read-only: posts without an up-to-date translation are simply absent,
 * and nothing is queued. For listings and metadata.
 */
export async function cachedPostSummaries(
  locale: Locale,
  slugs: string[],
): Promise<Record<string, { title: string; excerpt: string }>> {
  if (locale === "en" || slugs.length === 0) return {};
  try {
    await ensureTable();
    const rows = await prisma.$queryRawUnsafe<Array<{ slug: string; title: string | null; excerpt: string | null }>>(
      `SELECT b."slug", ct."value"->>'title' AS "title", ct."value"->>'excerpt' AS "excerpt"
         FROM "BlogPost" b
         JOIN "ContentTranslation" ct ON ct."key" = 'post:' || b."slug" AND ct."locale" = $1
        WHERE b."slug" = ANY($2::text[])
          AND ct."hash" = ${SQL_POST_HASH}`,
      locale,
      slugs,
    );
    const out: Record<string, { title: string; excerpt: string }> = {};
    for (const r of rows) if (r.title && r.excerpt) out[r.slug] = { title: r.title, excerpt: r.excerpt };
    return out;
  } catch (err) {
    console.error("[i18n] blog summaries read failed", err instanceof Error ? err.message : err);
    return {};
  }
}


/** An up-to-date cached translation of one post, or null. Never calls the model. */
async function cachedPost(post: PostSource, locale: Locale): Promise<PostFields | null> {
  try {
    await ensureTable();
    const fields = postFields(post);
    const rows = await prisma.$queryRawUnsafe<Array<{ hash: string; value: Fields }>>(
      `SELECT "hash", "value" FROM "ContentTranslation" WHERE "key" = $1 AND "locale" = $2`,
      postKey(post.slug),
      locale,
    );
    if (rows[0]?.hash === hashOf(fields)) return { ...fields, ...(rows[0].value as Partial<PostFields>) };
  } catch (err) {
    console.error("[i18n] blog cache read failed", err instanceof Error ? err.message : err);
  }
  return null;
}

/** Title and excerpt for page metadata: the cached translation, else English. No model call. */
export async function postMetaFor(post: PostSource, locale: Locale): Promise<{ title: string; excerpt: string }> {
  if (locale === "en") return { title: post.title, excerpt: post.excerpt };
  const hit = await cachedPost(post, locale);
  return hit ? { title: hit.title, excerpt: hit.excerpt } : { title: post.title, excerpt: post.excerpt };
}

/**
 * The article in the visitor's language for the article page. Returns English
 * with `pending: true` (and queues a translation) when none is ready yet.
 */
export async function localizedPost(post: PostSource, locale: Locale): Promise<{ value: PostFields; pending: boolean }> {
  if (locale === "en") return { value: postFields(post), pending: false };
  // Older "tx:<slug>:<lang>" translations are not used: they carry no link to
  // the English they came from, so they could still show text from before an
  // article was corrected. The translate job replaces them.
  const cached = await cachedPost(post, locale);
  const out = cached ? { value: cached, pending: false } : await localized(postKey(post.slug), locale, postFields(post));
  if (out.pending) return out;
  // Model-written HTML is cleaned before it is rendered (see sanitize-html.ts).
  return { value: { ...out.value, content: sanitizeTranslatedHtml(out.value.content) }, pending: false };
}

// ── Warm-up for the translate cron ───────────────────────────────────────────

/**
 * Translate published posts that have no up-to-date translation in `locale`,
 * most recent first, one model call per post, until `budget.left` runs out.
 * Returns how many posts were translated.
 */
export async function warm(locale: Locale, budget: { left: number }): Promise<number> {
  if (locale === "en" || budget.left <= 0) return 0;

  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { slug: true, title: true, excerpt: true, content: true },
  });
  if (posts.length === 0) return 0;

  await ensureTable();
  const existing = await prisma.$queryRawUnsafe<Array<{ key: string; hash: string }>>(
    `SELECT "key", "hash" FROM "ContentTranslation" WHERE "locale" = $1 AND "key" = ANY($2::text[])`,
    locale,
    posts.map((p) => postKey(p.slug)),
  );
  const have = new Map(existing.map((r) => [r.key, r.hash]));

  let done = 0;
  for (const post of posts) {
    if (budget.left <= 0) break;
    const fields = postFields(post);
    if (have.get(postKey(post.slug)) === hashOf(fields)) continue;
    budget.left -= 1;
    const result = await translated(postKey(post.slug), locale, fields, "wait");
    if (result) done += 1;
  }
  return done;
}

// ── Translate on publish ─────────────────────────────────────────────────────
//
// Articles are translated when they are published or edited, not when a
// reader first asks for them, so a French or Swahili reader gets the stored
// translation instantly. These run in the background (the long-running server
// keeps working after the response) and never overlap.

let articleJob: Promise<void> | null = null;

/**
 * Translate every published article that has no up-to-date French or
 * Swahili translation, newest first. Safe to call often: a second call while
 * one is running just waits for it, and up-to-date articles cost nothing.
 */
export function translateArticlesSoon(maxCalls = 80): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) return Promise.resolve();
  articleJob ??= (async () => {
    try {
      const budget = { left: maxCalls };
      for (const locale of ["fr", "sw"] as const) {
        if (budget.left <= 0) break;
        await warm(locale, budget);
      }
    } catch (err) {
      console.error("[i18n] article translation job failed", err instanceof Error ? err.message : err);
    } finally {
      articleJob = null;
    }
  })();
  return articleJob;
}

/** Translate one article into French and Swahili now (background). */
export function translateArticleSoon(post: PostSource & { published?: boolean }): void {
  if (!process.env.ANTHROPIC_API_KEY || post.published === false) return;
  for (const locale of ["fr", "sw"] as const) {
    void translated(postKey(post.slug), locale, postFields(post), "wait").catch(() => {});
  }
}

/** How many published articles have an up-to-date translation, per language. */
export async function articleTranslationStatus(): Promise<{ total: number; fr: number; sw: number; running: boolean }> {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true, title: true, excerpt: true, content: true },
  });
  await ensureTable();
  const rows = await prisma.$queryRawUnsafe<Array<{ key: string; locale: string; hash: string }>>(
    `SELECT "key", "locale", "hash" FROM "ContentTranslation" WHERE "locale" IN ('fr','sw') AND "key" = ANY($1::text[])`,
    posts.map((p) => postKey(p.slug)),
  );
  const have = new Map(rows.map((r) => [`${r.locale}:${r.key}`, r.hash]));
  let fr = 0, sw = 0;
  for (const p of posts) {
    const h = hashOf(postFields(p));
    if (have.get(`fr:${postKey(p.slug)}`) === h) fr++;
    if (have.get(`sw:${postKey(p.slug)}`) === h) sw++;
  }
  return { total: posts.length, fr, sw, running: !!articleJob };
}
