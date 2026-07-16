import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

// GET — list all products (admin)
export async function GET() {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const products = await prisma.product
    .findMany({ orderBy: { createdAt: "desc" } })
    .catch((err) => {
      console.error("[admin/products GET]", err);
      return null;
    });

  if (products === null) {
    return NextResponse.json({ error: "Database error — run Sync Database", products: [] }, { status: 500 });
  }
  return NextResponse.json({ products });
}

// POST — create a product
export async function POST(req: NextRequest) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const price = Math.max(0, Math.round(Number(body.price) || 0));
    const compareAtPrice = body.compareAtPrice ? Math.max(0, Math.round(Number(body.compareAtPrice))) : null;

    // Ensure a unique slug
    let base = slugify(body.slug || name) || `product-${Date.now()}`;
    let slug = base;
    let n = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${base}-${n++}`;
    }

    const product = await prisma.product.create({
      data: {
        slug,
        name,
        tagline: body.tagline ? String(body.tagline).slice(0, 160) : null,
        description: String(body.description ?? ""),
        price,
        compareAtPrice,
        currency: body.currency || "USD",
        images: Array.isArray(body.images) ? body.images.filter(Boolean).slice(0, 8) : [],
        category: body.category || "General",
        tags: Array.isArray(body.tags) ? body.tags.filter(Boolean).slice(0, 12) : [],
        stock: body.stock === "" || body.stock == null ? null : Math.max(0, Math.round(Number(body.stock))),
        digital: body.digital !== false,
        featured: !!body.featured,
        published: !!body.published,
        onSale: !!body.onSale,
        sku: body.sku ? String(body.sku).slice(0, 60) : null,
      },
    });

    return NextResponse.json({ product });
  } catch (err) {
    console.error("[admin/products POST]", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
