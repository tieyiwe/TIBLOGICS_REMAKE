import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import { REFRESH_INTERVAL_MS } from "@/lib/blog/schedule";
import BlogClient from "./BlogClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

// Rendered on the server. This page used to load its list from the public
// /api/blog/posts endpoint, which only returns published posts: unpublishing
// an article (or a retraction) made it vanish from the admin with no way to
// find it again, and the "Published" count always equalled the total.
export default async function BlogAdminPage() {
  await requireAdminPage();

  const [posts, breaking, last] = await Promise.all([
    prisma.blogPost
      .findMany({
        orderBy: { createdAt: "desc" },
        take: 2000,
        select: {
          id: true, slug: true, title: true, category: true, coverEmoji: true, coverImage: true,
          featured: true, published: true, aiGenerated: true, viewCount: true, createdAt: true,
        },
      })
      .catch((err) => {
        console.error("[admin/blog page]", err);
        return [];
      }),
    prisma.breakingNews
      .findFirst({
        where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        orderBy: { createdAt: "desc" },
        select: { headline: true, source: true, createdAt: true },
      })
      .catch(() => null),
    prisma.adminSettings.findUnique({ where: { key: "blog_last_refresh" } }).catch(() => null),
  ]);

  const lastRefresh = last ? new Date(last.value) : null;

  return (
    <BlogClient
      posts={posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))}
      breaking={
        breaking
          ? { headline: breaking.headline, source: breaking.source ?? undefined, createdAt: breaking.createdAt.toISOString() }
          : null
      }
      refreshStatus={{
        needsRefresh: !lastRefresh || Date.now() - lastRefresh.getTime() > REFRESH_INTERVAL_MS,
        lastRefresh: lastRefresh?.toISOString() ?? null,
        nextRefresh: lastRefresh ? new Date(lastRefresh.getTime() + REFRESH_INTERVAL_MS).toISOString() : null,
      }}
    />
  );
}
