import prisma from "@/lib/prisma";
import BlogPageClient, { type BlogPost } from "./BlogPageClient";
import { SEED_POSTS } from "@/lib/blog/content/seed-posts";

// Cache the full page HTML for 60 seconds; regenerate in the background after.
export const revalidate = 60;

// What an empty site shows on first load, before the news agent has run: the
// first few general articles from the shared seed list. This used to be a
// hand-kept copy of the seeds that drifted from them, and still carried a
// case study and a "2026 Benchmarks" piece full of invented numbers after
// those were corrected elsewhere.
const QUICK_SEEDS = SEED_POSTS.filter((p) => p.category !== "case-studies" && p.category !== "breaking").slice(0, 5);

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

async function seedIfEmpty(): Promise<void> {
  const existingTitles = new Set(
    (await prisma.blogPost.findMany({ select: { title: true } })).map((p) =>
      p.title.toLowerCase()
    )
  );

  for (const seed of QUICK_SEEDS) {
    if (existingTitles.has(seed.title.toLowerCase())) continue;

    const base = slugify(seed.title);
    let slug = base;
    let i = 1;
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }

    await prisma.blogPost.create({
      data: {
        slug,
        title: seed.title,
        excerpt: seed.excerpt,
        content: seed.content,
        category: seed.category,
        tags: seed.tags,
        coverEmoji: seed.coverEmoji,
        coverGradient: seed.coverGradient,
        coverImage: seed.coverImage,
        author: "TIBLOGICS Editorial",
        readingTime: Math.ceil(
          seed.content.replace(/<[^>]*>/g, "").split(" ").length / 200
        ),
        featured: seed.featured,
        published: true,
        aiGenerated: false,
      },
    });
  }
}

export default async function BlogPage() {
  // No try/catch around the reads, deliberately. This page is cached for 60
  // seconds, and the old catch turned a database error into an empty page
  // that was then cached and served as if AI Times had no articles — the same
  // failure /store had. Letting it throw fails the build loudly when there is
  // no database, and on a revalidation Next keeps the last good page.
  let initialPosts: BlogPost[] = [];

  {
    const count = await prisma.blogPost.count({ where: { published: true } });

    if (count === 0) {
      await seedIfEmpty();
    }

    const rows = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        tags: true,
        coverImage: true,
        coverEmoji: true,
        coverGradient: true,
        author: true,
        readingTime: true,
        featured: true,
        aiGenerated: true,
        createdAt: true,
      },
    });

    initialPosts = rows.map((p) => ({
      ...p,
      coverImage: p.coverImage ?? undefined,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  return <BlogPageClient initialPosts={initialPosts} />;
}
