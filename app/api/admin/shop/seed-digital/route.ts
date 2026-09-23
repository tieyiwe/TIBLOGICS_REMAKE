import { NextResponse } from "next/server";
import { statSync } from "fs";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { DIGITAL_PRODUCTS } from "@/lib/shop/digital-products";
import { resolveDownloadPath } from "@/lib/shop/delivery";

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

      const existing = await prisma.product.findUnique({
        where: { slug: p.slug },
        select: { id: true, price: true, published: true },
      });

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
        featured: p.featured ?? false,
        stock: null, // digital goods don't run out
      };

      if (existing) {
        // Never overwrite a price or publish state an admin has already set.
        await prisma.product.update({ where: { id: existing.id }, data });
        updated.push(p.slug);
      } else {
        await prisma.product.create({
          data: { slug: p.slug, price: 0, published: false, ...data },
        });
        created.push(p.slug);
      }
    }

    const needPricing = await prisma.product.count({
      where: { deliveryType: "download", price: 0 },
    });

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
