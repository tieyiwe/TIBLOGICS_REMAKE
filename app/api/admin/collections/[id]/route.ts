import { NextRequest, NextResponse } from "next/server";
import { cleanCopy, cleanLine } from "@/lib/text/clean-copy";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const { id } = await params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.name != null) data.name = cleanLine(String(body.name));
    if (body.description != null) data.description = cleanCopy(String(body.description));
    if (body.image !== undefined) data.image = body.image ? String(body.image) : null;
    if (body.featured != null) data.featured = !!body.featured;
    if (body.published != null) data.published = !!body.published;
    if (body.sortOrder != null) data.sortOrder = Math.round(Number(body.sortOrder) || 0);

    const collection = await prisma.collection.update({ where: { id }, data });
    return NextResponse.json({ collection });
  } catch (err) {
    console.error("[admin/collections PATCH]", err);
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const { id } = await params;
  try {
    // Remove this collection's slug from any products referencing it
    const col = await prisma.collection.findUnique({ where: { id }, select: { slug: true } });
    if (col) {
      const affected = await prisma.product.findMany({ where: { collections: { has: col.slug } }, select: { id: true, collections: true } });
      // Each product gets a different resulting array, so this cannot collapse
      // into one updateMany — but the writes don't depend on each other.
      await Promise.all(
        affected.map((p) =>
          prisma.product.update({ where: { id: p.id }, data: { collections: p.collections.filter((s) => s !== col.slug) } }),
        ),
      );
    }
    await prisma.collection.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/collections DELETE]", err);
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
  }
}
