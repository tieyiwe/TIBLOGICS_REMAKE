import prisma from "@/lib/prisma";
import { CORRECTED_ARTICLES, CORRECTION_BY_OLD_TITLE, type CorrectedArticle } from "./corrected";

/**
 * Bring existing posts in line with corrected.ts. Run by the news agent.
 *
 * A post is matched by any title it has been published under, and rewritten
 * in place: the slug is kept so links and shares still work, and published
 * or unpublished stays as it was. Cached translations are deleted so the
 * French and Swahili versions are regenerated from the corrected text rather
 * than keep the old claims. Returns the slugs it changed.
 */
export async function applyCorrections(): Promise<string[]> {
  const byNewTitle = new Map(CORRECTED_ARTICLES.map((a) => [a.title.toLowerCase().trim(), a]));
  const titles = CORRECTED_ARTICLES.flatMap((a) => [...a.replaces, a.title]);

  const posts = await prisma.blogPost.findMany({
    where: { title: { in: titles } },
    select: { id: true, slug: true, title: true, excerpt: true, content: true },
  });

  const changed: string[] = [];
  for (const post of posts) {
    const key = post.title.toLowerCase().trim();
    const target: CorrectedArticle | undefined = CORRECTION_BY_OLD_TITLE.get(key) ?? byNewTitle.get(key);
    if (!target) continue;
    if (post.title === target.title && post.excerpt === target.excerpt && post.content === target.content) continue;

    await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        title: target.title,
        excerpt: target.excerpt,
        content: target.content,
        category: target.category,
        tags: target.tags,
        ...(target.author ? { author: target.author } : {}),
        readingTime: Math.max(1, Math.ceil(target.content.replace(/<[^>]*>/g, " ").split(/\s+/).length / 200)),
      },
    });
    await prisma.adminSettings.deleteMany({ where: { key: { in: [`tx:${post.slug}:fr`, `tx:${post.slug}:sw`] } } });
    changed.push(post.slug);
  }
  return changed;
}
