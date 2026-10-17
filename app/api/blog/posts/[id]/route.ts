import { translateArticleSoon } from "@/lib/i18n/sources/blog";
import { applyFeatured, featuredPins, setFeaturedPin } from "@/lib/blog/featured";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { isBlogCategory } from "@/lib/blog/categories";
import { INDEXNOW_SECTIONS, indexNowSoon } from "@/lib/seo/indexnow";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const post = await prisma.blogPost.findFirst({
      where: { OR: [{ id }, { slug: id }], published: true },
    });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.blogPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } });
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { id } = await params;
    const body = await req.json();
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: typeof body.title === "string" ? body.title.slice(0, 300) : undefined,
        excerpt: typeof body.excerpt === "string" ? body.excerpt.slice(0, 500) : undefined,
        content: typeof body.content === "string" ? body.content : undefined,
        category: isBlogCategory(body.category) ? body.category : undefined,
        tags: Array.isArray(body.tags) ? body.tags.slice(0, 20) : undefined,
        coverEmoji: typeof body.coverEmoji === "string" ? body.coverEmoji.slice(0, 10) : undefined,
        coverGradient: typeof body.coverGradient === "string" ? body.coverGradient.slice(0, 100) : undefined,
        coverImage: typeof body.coverImage === "string" ? body.coverImage : undefined,
        published: typeof body.published === "boolean" ? body.published : undefined,
      },
    });
    // Featuring is a pin (kept until unfeatured); the two slots are then
    // recomputed (lib/blog/featured.ts). Publishing changes can free a slot.
    let featuredIds: string[] | undefined;
    if (typeof body.featured === "boolean") {
      await setFeaturedPin(id, body.featured);
      featuredIds = await applyFeatured();
    } else if (typeof body.published === "boolean") featuredIds = await applyFeatured().catch(() => undefined);
    // An edit changes the English, so the stored translations are redone now.
    translateArticleSoon(post);
    // Tell Bing/ChatGPT search and other IndexNow engines (no-op without INDEXNOW_KEY).
    indexNowSoon(INDEXNOW_SECTIONS.article(post.slug));
    return NextResponse.json({ post, ...(featuredIds ? { featuredIds, pins: await featuredPins() } : {}) });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { id } = await params;
    const post = await prisma.blogPost.findUnique({ where: { id }, select: { aiGenerated: true, title: true } });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Require explicit confirmation header to delete manually-written articles
    if (!post.aiGenerated) {
      const confirmed = req.headers.get("x-confirm-delete");
      if (confirmed !== "manual-article") {
        return NextResponse.json(
          { error: "This is a manually-written article. Add header x-confirm-delete: manual-article to confirm deletion." },
          { status: 409 }
        );
      }
    }

    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
