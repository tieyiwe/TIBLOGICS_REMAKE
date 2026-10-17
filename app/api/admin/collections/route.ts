import { NextRequest, NextResponse } from "next/server";
import { cleanCopy, cleanLine } from "@/lib/text/clean-copy";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { revalidateShop } from "@/lib/shop/revalidate";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

export async function GET() {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const collections = await prisma.collection
    .findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] })
    .catch((err) => {
      console.error("[admin/collections GET]", err);
      return null;
    });

  if (collections === null) {
    return NextResponse.json({ error: "Database error — run Sync Database", collections: [] }, { status: 500 });
  }
  return NextResponse.json({ collections });
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const name = cleanLine(String(body.name ?? ""));
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    let base = slugify(body.slug || name) || `collection-${Date.now()}`;
    // Every candidate (`base`, `base-1`, …) shares the `base` prefix, so one
    // query covers them all instead of a findUnique per attempt.
    const taken = new Set(
      (await prisma.collection.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } }))
        .map((c) => c.slug),
    );
    let slug = base;
    let n = 1;
    while (taken.has(slug)) slug = `${base}-${n++}`;

    const collection = await prisma.collection.create({
      data: {
        slug,
        name,
        description: cleanCopy(String(body.description ?? "")),
        image: body.image ? String(body.image) : null,
        featured: !!body.featured,
        published: body.published !== false,
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Math.round(Number(body.sortOrder)) : 0,
      },
    });
    revalidateShop();
    return NextResponse.json({ collection });
  } catch (err) {
    console.error("[admin/collections POST]", err);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}
