// Existence checks for proxy.ts, so a missing track, product, article,
// collection, lead magnet or landing page answers with a real HTTP 404.
//
// Why here and not in the pages: the public layout has a loading.tsx, so
// those pages start streaming (status 200) before the page can call
// notFound(). Next then marks the page noindex, but crawlers still log a
// "soft 404". Checking before the response starts is the documented fix
// (node_modules/next/dist/docs: loading.md, "Status Codes").
//
// Fast and fail-open: one indexed lookup per slug, cached for a minute, and
// any database error lets the request through to the page as before.

import prisma from "@/lib/prisma";

type Check = (slug: string) => Promise<boolean>;

const SLUG = /^[A-Za-z0-9][A-Za-z0-9._~%-]{0,200}$/;

const ROUTES: Array<{ re: RegExp; check: Check }> = [
  {
    re: /^\/learning-box\/([^/]+)$/,
    check: async (slug) => !!(await prisma.learnTrack.findFirst({ where: { slug, status: { in: ["live", "coming_soon"] } }, select: { id: true } })),
  },
  {
    re: /^\/store\/collections\/([^/]+)$/,
    check: async (slug) => !!(await prisma.collection.findFirst({ where: { slug, published: true }, select: { id: true } })),
  },
  {
    // Not /store/success or /store/collections (handled above).
    re: /^\/store\/(?!success$|collections$)([^/]+)$/,
    check: async (slug) => !!(await prisma.product.findFirst({ where: { slug, published: true }, select: { id: true } })),
  },
  {
    re: /^\/ai-times\/(?!feed\.xml$|opengraph-image)([^/]+)$/,
    check: async (slug) => !!(await prisma.blogPost.findFirst({ where: { slug, published: true }, select: { id: true } })),
  },
  {
    re: /^\/free\/([^/]+)$/,
    check: async (slug) => !!(await prisma.acquireMagnet.findFirst({ where: { slug, status: "published" }, select: { id: true } })),
  },
  {
    re: /^\/lp\/([^/]+)$/,
    check: async (slug) => !!(await prisma.acquirePage.findFirst({ where: { slug, status: "published" }, select: { id: true } })),
  },
];

// A found item is re-checked after a minute; a missing one sooner, so a
// product or article published a moment ago is not 404ed for long.
const TTL_FOUND_MS = 60_000;
const TTL_MISSING_MS = 10_000;
const MAX_ENTRIES = 2_000;
const cache = new Map<string, { exists: boolean; at: number }>();

/**
 * true when the path is a content page whose item does not exist (or is not
 * published). false for anything else, including when the check fails.
 */
export async function isMissingContent(pathname: string): Promise<boolean> {
  for (const r of ROUTES) {
    const m = pathname.match(r.re);
    if (!m) continue;
    let slug: string;
    try {
      slug = decodeURIComponent(m[1]);
    } catch {
      return true;
    }
    if (!SLUG.test(slug)) return true;
    const hit = cache.get(pathname);
    if (hit && Date.now() - hit.at < (hit.exists ? TTL_FOUND_MS : TTL_MISSING_MS)) return !hit.exists;
    try {
      const exists = await r.check(slug);
      if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
      cache.set(pathname, { exists, at: Date.now() });
      return !exists;
    } catch {
      return false;
    }
  }
  return false;
}
