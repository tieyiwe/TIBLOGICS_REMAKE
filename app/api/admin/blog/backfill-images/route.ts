import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { COVER_POOL_SIZE, photoIdFromUrl, pickCoverImage } from "@/lib/blog-images";

// Repairs cover images across every article:
//   1. Articles with no cover get one (the agent used to save null).
//   2. Articles sharing a cover with an older article get a different one.
//
// Oldest article keeps its image so existing posts stay visually stable; only
// the later duplicate moves. Safe to re-run — a corrected library is a no-op.
export const maxDuration = 120;

export async function POST() {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  try {
    // Oldest first so seniority decides who keeps a contested image.
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, slug: true, title: true, coverImage: true },
    });

    const taken = new Set<string>();
    const fixedMissing: string[] = [];
    const fixedDuplicate: string[] = [];
    let exhausted = false;

    for (const post of posts) {
      const currentId = photoIdFromUrl(post.coverImage);

      // Keeps its image: has one, and nobody earlier claimed it.
      if (currentId && !taken.has(currentId)) {
        taken.add(currentId);
        continue;
      }

      const reason = currentId ? "duplicate" : "missing";
      const pick = pickCoverImage(post.slug, taken);
      if (pick.reused) exhausted = true;

      await prisma.blogPost.update({
        where: { id: post.id },
        data: { coverImage: pick.url },
      });
      taken.add(pick.photoId);

      (reason === "missing" ? fixedMissing : fixedDuplicate).push(post.title.slice(0, 70));
    }

    return NextResponse.json({
      ok: true,
      totalPosts: posts.length,
      poolSize: COVER_POOL_SIZE,
      missingFixed: fixedMissing.length,
      duplicatesFixed: fixedDuplicate.length,
      distinctImagesInUse: taken.size,
      // True only if there are more articles than images — the signal to add
      // more IDs to the pool rather than a silent duplication.
      poolExhausted: exhausted,
      details: { missing: fixedMissing.slice(0, 40), duplicates: fixedDuplicate.slice(0, 40) },
    });
  } catch (err) {
    console.error("[POST /api/admin/blog/backfill-images]", err);
    return NextResponse.json({ error: "Could not repair cover images" }, { status: 500 });
  }
}

// Read-only audit: what would change, without changing anything.
export async function GET() {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, coverImage: true },
    });

    const seen = new Set<string>();
    const missing: string[] = [];
    const duplicates: string[] = [];

    for (const p of posts) {
      const id = photoIdFromUrl(p.coverImage);
      if (!id) missing.push(p.title.slice(0, 70));
      else if (seen.has(id)) duplicates.push(p.title.slice(0, 70));
      else seen.add(id);
    }

    return NextResponse.json({
      totalPosts: posts.length,
      poolSize: COVER_POOL_SIZE,
      missingCount: missing.length,
      duplicateCount: duplicates.length,
      distinctImagesInUse: seen.size,
      missing: missing.slice(0, 40),
      duplicates: duplicates.slice(0, 40),
    });
  } catch (err) {
    console.error("[GET /api/admin/blog/backfill-images]", err);
    return NextResponse.json({ error: "Could not audit cover images" }, { status: 500 });
  }
}
