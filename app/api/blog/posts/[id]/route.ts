import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

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
        category: typeof body.category === "string" ? body.category : undefined,
        tags: Array.isArray(body.tags) ? body.tags.slice(0, 20) : undefined,
        coverEmoji: typeof body.coverEmoji === "string" ? body.coverEmoji.slice(0, 10) : undefined,
        coverGradient: typeof body.coverGradient === "string" ? body.coverGradient.slice(0, 100) : undefined,
        featured: typeof body.featured === "boolean" ? body.featured : undefined,
        published: typeof body.published === "boolean" ? body.published : undefined,
      },
    });
    return NextResponse.json({ post });
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
