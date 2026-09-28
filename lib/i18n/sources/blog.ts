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

/**
 * Translations made by the earlier per-article translate button, stored in
 * AdminSettings as "tx:<slug>:<lang>". Used when the shared cache has nothing
 * yet, so articles already translated that way do not fall back to English.
 */
async function legacyTranslation(slug: string, locale: Locale): Promise<PostFields | null> {
  try {
    const row = await prisma.adminSettings.findUnique({ where: { key: `tx:${slug}:${locale}` } });
    if (!row?.value) return null;
    const v = JSON.parse(row.value) as Partial<PostFields>;
    if (typeof v.title === "string" && typeof v.excerpt === "string" && typeof v.content === "string" && v.content.trim()) {
      return { title: v.title, excerpt: v.excerpt, content: v.content };
    }
  } catch {
    /* unreadable: treat as absent */
  }
  return null;
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

/** Title and excerpt for page metadata: cached or legacy translation, else English. No model call. */
export async function postMetaFor(post: PostSource, locale: Locale): Promise<{ title: string; excerpt: string }> {
  if (locale === "en") return { title: post.title, excerpt: post.excerpt };
  const hit = (await cachedPost(post, locale)) ?? (await legacyTranslation(post.slug, locale));
  return hit ? { title: hit.title, excerpt: hit.excerpt } : { title: post.title, excerpt: post.excerpt };
}

/**
 * The article in the visitor's language for the article page. Returns English
 * with `pending: true` (and queues a translation) when none is ready yet.
 */
export async function localizedPost(post: PostSource, locale: Locale): Promise<{ value: PostFields; pending: boolean }> {
  if (locale === "en") return { value: postFields(post), pending: false };
  const cached = await cachedPost(post, locale);
  if (cached) return { value: cached, pending: false };
  const legacy = await legacyTranslation(post.slug, locale);
  if (legacy) return { value: legacy, pending: false };
  return localized(postKey(post.slug), locale, postFields(post));
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
