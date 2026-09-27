import { NextResponse } from "next/server";
import { statSync } from "fs";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import {
  PROMPT_PACKS,
  PROMPT_PACK_CATEGORY,
  PROMPT_PACK_COLLECTION,
  PROMPT_PACK_COLLECTION_META,
  PROMPT_PACK_PRICE,
} from "@/lib/shop/prompt-packs";
import { resolveDownloadPath } from "@/lib/shop/delivery";
import { revalidateShop } from "@/lib/shop/revalidate";

// Creates the AI Prompt Pack products and their collection.
//
// Idempotent — re-running refreshes copy and delivery settings without
// duplicating. Unlike the generic digital seed these ARE published with a
// price, because the price is known ($79) and they are finished products.
export async function POST() {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const created: string[] = [];
  const updated: string[] = [];
  const warnings: string[] = [];

  try {
    // The collection and the "which packs already exist?" lookup touch
    // different tables and neither reads the other, so they go out together.
    // One findMany over every pack slug replaces a findUnique per pack.
    const [, existingRows] = await Promise.all([
      prisma.collection.upsert({
        where: { slug: PROMPT_PACK_COLLECTION },
        create: {
          slug: PROMPT_PACK_COLLECTION,
          name: PROMPT_PACK_COLLECTION_META.name,
          description: PROMPT_PACK_COLLECTION_META.description,
          featured: PROMPT_PACK_COLLECTION_META.featured,
          sortOrder: PROMPT_PACK_COLLECTION_META.sortOrder,
          published: true,
        },
        update: {
          name: PROMPT_PACK_COLLECTION_META.name,
          description: PROMPT_PACK_COLLECTION_META.description,
          featured: PROMPT_PACK_COLLECTION_META.featured,
        },
      }),
      prisma.product.findMany({
        where: { slug: { in: PROMPT_PACKS.map((p) => p.slug) } },
        select: { id: true, slug: true },
      }),
    ]);
    const existingBySlug = new Map(existingRows.map((r) => [r.slug, r.id]));

    // The loop now only builds work (and the on-disk warnings, in pack order).
    // Prisma promises are lazy, so nothing is sent until the Promise.all below.
    const writes: Promise<unknown>[] = [];
    const outcomes: Array<{ slug: string; isNew: boolean }> = [];

    for (const pack of PROMPT_PACKS) {
      // Verify the PDF is on disk. A product that sells and then fails at
      // download is the worst possible order to discover a missing file.
      const path = resolveDownloadPath(pack.fileKey);
      let sizeBytes: number | null = null;
      if (!path) {
        warnings.push(`${pack.slug}: fileKey escapes the download root — skipped`);
        continue;
      }
      try {
        sizeBytes = statSync(path).size;
      } catch {
        warnings.push(`${pack.slug}: PDF missing on disk — NOT published`);
      }

      const data = {
        name: pack.name,
        tagline: pack.tagline,
        description: pack.description,
        price: PROMPT_PACK_PRICE,
        currency: "USD",
        images: [pack.coverImage],
        category: PROMPT_PACK_CATEGORY,
        collections: [PROMPT_PACK_COLLECTION],
        tags: pack.tags,
        stock: null, // digital — never runs out
        digital: true,
        // Wires into the delivery system: paid order -> grant -> token URL.
        deliveryType: "download",
        fileKey: pack.fileKey,
        fileName: pack.fileName,
        fileFormat: `PDF · ${pack.pages} pages · ${pack.prompts} prompts`,
        fileSizeBytes: sizeBytes,
        downloadDays: 365,
        maxDownloads: 10,
        // Exactly one pack is featured, set per-pack in prompt-packs.ts.
        // This was hardcoded true, so every pack was featured and the
        // spotlight rotated through all of them whether or not that was wanted.
        featured: pack.featured ?? false,
        // Only publish if the file is genuinely there.
        published: sizeBytes !== null,
      };

      const existingId = existingBySlug.get(pack.slug);
      if (existingId) {
        writes.push(prisma.product.update({ where: { id: existingId }, data }));
      } else {
        writes.push(prisma.product.create({ data: { slug: pack.slug, ...data } }));
      }
      outcomes.push({ slug: pack.slug, isNew: !existingId });
    }

    await Promise.all(writes);

    // Reported in PROMPT_PACKS order, as before.
    for (const o of outcomes) {
      if (o.isNew) created.push(o.slug);
      else updated.push(o.slug);
    }

    const live = await prisma.product.count({
      where: { category: PROMPT_PACK_CATEGORY, published: true },
    });

    revalidateShop();

    return NextResponse.json({
      ok: true,
      created: created.length,
      updated: updated.length,
      createdSlugs: created,
      updatedSlugs: updated,
      published: live,
      price: `$${(PROMPT_PACK_PRICE / 100).toFixed(0)}`,
      collection: PROMPT_PACK_COLLECTION,
      warnings,
    });
  } catch (err) {
    console.error("[POST /api/admin/shop/seed-prompt-packs]", err);
    return NextResponse.json({ error: "Could not seed prompt packs" }, { status: 500 });
  }
}
