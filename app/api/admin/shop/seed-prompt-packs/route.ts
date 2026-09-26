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
    // Collection first, so products have something to belong to.
    await prisma.collection.upsert({
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
    });

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
        featured: true, // all four rotate through the spotlight
        // Only publish if the file is genuinely there.
        published: sizeBytes !== null,
      };

      const existing = await prisma.product.findUnique({
        where: { slug: pack.slug },
        select: { id: true },
      });

      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data });
        updated.push(pack.slug);
      } else {
        await prisma.product.create({ data: { slug: pack.slug, ...data } });
        created.push(pack.slug);
      }
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
