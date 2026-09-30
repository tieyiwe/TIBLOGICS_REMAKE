import { translateArticlesSoon } from "@/lib/i18n/sources/blog";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { SEED_POSTS } from "@/lib/blog/content/seed-posts";

// Starter articles for an empty blog, taken from the shared seed list so they
// are the corrected versions. This route used to keep its own copy, which
// still carried an invented case study and made-up benchmark figures.
const QUICK_SEEDS = SEED_POSTS.filter((p) => p.category !== "case-studies" && p.category !== "breaking").slice(0, 5);

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export async function POST() {
  // Staff only. It was public, so anyone could re-insert the pre-written
  // starter articles, including ones since retracted as fabricated.
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    // Titles and slugs in one pass — the slug set replaces the per-seed
    // findUnique loop that used to probe for a free slug.
    const allExisting = await prisma.blogPost.findMany({ select: { title: true, slug: true } });
    const existingTitles = new Set(allExisting.map((p) => p.title.toLowerCase()));
    const existingSlugs = new Set(allExisting.map((p) => p.slug));

    let inserted = 0;
    let skipped = 0;

    for (const seed of QUICK_SEEDS) {
      if (existingTitles.has(seed.title.toLowerCase())) {
        skipped++;
        continue;
      }

      const base = slugify(seed.title);
      let slug = base;
      let i = 1;
      while (existingSlugs.has(slug)) {
        slug = `${base}-${i++}`;
      }
      existingSlugs.add(slug); // so two seeds in this run cannot collide

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
          readingTime: Math.ceil(seed.content.replace(/<[^>]*>/g, "").split(" ").length / 200),
          featured: seed.featured,
          published: true,
          aiGenerated: false,
        },
      });
      inserted++;
    }

    return NextResponse.json({ ok: true, inserted, skipped });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/blog/seed]", msg);
    // Surface the real error so we can diagnose
    void translateArticlesSoon();
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
