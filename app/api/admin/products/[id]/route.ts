import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// PATCH — update a product
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const { id } = await params;

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.name != null) data.name = String(body.name).trim();
    if (body.tagline !== undefined) data.tagline = body.tagline ? String(body.tagline).slice(0, 160) : null;
    if (body.description != null) data.description = String(body.description);
    if (body.price != null) data.price = Math.max(0, Math.round(Number(body.price) || 0));
    if (body.compareAtPrice !== undefined)
      data.compareAtPrice = body.compareAtPrice ? Math.max(0, Math.round(Number(body.compareAtPrice))) : null;
    if (body.currency != null) data.currency = String(body.currency);
    if (body.images != null) data.images = Array.isArray(body.images) ? body.images.filter(Boolean).slice(0, 8) : [];
    if (body.category != null) data.category = String(body.category);
    if (body.collections != null) data.collections = Array.isArray(body.collections) ? body.collections.filter(Boolean).slice(0, 20) : [];
    if (body.tags != null) data.tags = Array.isArray(body.tags) ? body.tags.filter(Boolean).slice(0, 12) : [];
    if (body.stock !== undefined)
      data.stock = body.stock === "" || body.stock == null ? null : Math.max(0, Math.round(Number(body.stock)));
    if (body.digital != null) data.digital = !!body.digital;
    if (body.featured != null) data.featured = !!body.featured;
    if (body.published != null) data.published = !!body.published;
    if (body.onSale != null) data.onSale = !!body.onSale;
    if (body.sku !== undefined) data.sku = body.sku ? String(body.sku).slice(0, 60) : null;

    const product = await prisma.product.update({ where: { id }, data });
    return NextResponse.json({ product });
  } catch (err) {
    console.error("[admin/products PATCH]", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE — remove a product
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/products DELETE]", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
