import { NextResponse } from "next/server";
import { statSync } from "fs";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { DIGITAL_PRODUCTS } from "@/lib/shop/digital-products";
import { resolveDownloadPath } from "@/lib/shop/delivery";
import { revalidateShop } from "@/lib/shop/revalidate";

// Seeds the digital product catalogue. Idempotent — re-running updates copy
// and delivery settings in place and never duplicates a product.
//
// Products are created UNPUBLISHED with price 0. Publishing is a deliberate
// act in the admin after a price is set, so nothing is ever accidentally
// given away for free.
export async function POST() {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const created: string[] = [];
  const updated: string[] = [];
  const warnings: string[] = [];

  try {
    // One lookup for every seed slug, instead of a findUnique per product.
    const existingRows = await prisma.product.findMany({
      where: { slug: { in: DIGITAL_PRODUCTS.map((p) => p.slug) } },
      select: { id: true, slug: true },
    });
    const existingBySlug = new Map(existingRows.map((r) => [r.slug, r.id]));

    // The loop only builds work (and the on-disk warnings, in seed order).
    // Prisma promises are lazy, so nothing is sent until the Promise.all below.
    const writes: Promise<unknown>[] = [];
    const outcomes: Array<{ slug: string; isNew: boolean }> = [];

    for (const p of DIGITAL_PRODUCTS) {
      // Confirm the file is actually on disk. A product whose file is missing
      // would sell fine and fail at download, which is the worst order to
      // discover it in.
      const path = resolveDownloadPath(p.fileKey);
      let sizeBytes: number | null = null;
      if (!path) {
        warnings.push(`${p.slug}: fileKey "${p.fileKey}" is outside the download root — skipped`);
        continue;
      }
      try {
        sizeBytes = statSync(path).size;
      } catch {
        warnings.push(`${p.slug}: file "${p.fileKey}" not found on disk — product seeded but will not deliver`);
      }

      const data = {
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        category: p.category,
        tags: p.tags,
        digital: true,
        deliveryType: "download",
        fileKey: p.fileKey,
        fileName: p.fileName,
        fileFormat: p.fileFormat,
        fileSizeBytes: sizeBytes,
        downloadDays: 365,
        maxDownloads: 10,
        stock: null, // digital goods don't run out
      };

      const existingId = existingBySlug.get(p.slug);
      if (existingId) {
        // Never overwrite a price, a publish state or a feature flag an admin
        // has already set — `data` deliberately carries none of them.
        writes.push(prisma.product.update({ where: { id: existingId }, data }));
      } else {
        writes.push(
          prisma.product.create({
            data: {
              slug: p.slug,
              price: 0,
              published: false,
              featured: p.featured ?? false,
              ...data,
            },
          }),
        );
      }
      outcomes.push({ slug: p.slug, isNew: !existingId });
    }

    await Promise.all(writes);

    // Reported in DIGITAL_PRODUCTS order, as before.
    for (const o of outcomes) {
      if (o.isNew) created.push(o.slug);
      else updated.push(o.slug);
    }

    const needPricing = await prisma.product.count({
      where: { deliveryType: "download", price: 0 },
    });

    revalidateShop();

    return NextResponse.json({
      ok: true,
      created: created.length,
      updated: updated.length,
      createdSlugs: created,
      updatedSlugs: updated,
      warnings,
      needPricing,
      note:
        needPricing > 0
          ? `${needPricing} product(s) still have no price and stay unpublished until you set one.`
          : "All digital products are priced.",
      suggestedPricing: DIGITAL_PRODUCTS.map((p) => ({
        slug: p.slug,
        name: p.name,
        suggested: `$${(p.suggestedPrice / 100).toFixed(0)}`,
      })),
    });
  } catch (err) {
    console.error("[POST /api/admin/shop/seed-digital]", err);
    return NextResponse.json({ error: "Could not seed digital products" }, { status: 500 });
  }
}
