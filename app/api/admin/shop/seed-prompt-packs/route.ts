import { NextResponse } from "next/server";
import { statSync } from "fs";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import {
  PROMPT_PACKS,
  PROMPT_PACK_COLLECTION,
  PROMPT_PACK_COLLECTION_META,
  PROMPT_PACK_PRICE,
} from "@/lib/shop/prompt-packs";
import { promptPackData } from "@/lib/shop/ensure-catalog";
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
    const outcomes: Array<{ slug: string; isNew: boolean; hasFile: boolean }> = [];

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
        warnings.push(
          existingBySlug.has(pack.slug)
            ? `${pack.slug}: PDF missing on disk — left as it is, but buyers cannot download it until the file is deployed`
            : `${pack.slug}: PDF missing on disk — created unpublished`,
        );
      }

      const data = promptPackData(pack, sizeBytes);

      const existingId = existingBySlug.get(pack.slug);
      if (existingId) {
        // `published` and `featured` are deliberately NOT in the update.
        //
        // They belong to whoever is running the store. This seed used to write
        // both on every run, which had two bad consequences: a pack unpublished
        // or featured by hand in admin silently reverted on the next seed, and
        // — worse — running the seed on a deploy where the PDF had not landed
        // yet took a live, selling product off the storefront while leaving it
        // visible in admin. That is exactly how the Realtor toolkit
        // disappeared from the store but stayed in the admin list.
        //
        // A file that goes missing is already handled at the point it matters:
        // the download route returns "temporarily unavailable" rather than a
        // broken file, and the warning below says which pack to look at.
        writes.push(prisma.product.update({ where: { id: existingId }, data }));
      } else {
        writes.push(
          prisma.product.create({
            data: {
              slug: pack.slug,
              ...data,
              // Exactly one pack is featured, set per-pack in prompt-packs.ts.
              featured: pack.featured ?? false,
              // A brand new pack only goes live if its file is genuinely there.
              published: sizeBytes !== null,
            },
          }),
        );
      }
      outcomes.push({ slug: pack.slug, isNew: !existingId, hasFile: sizeBytes !== null });
    }

    await Promise.all(writes);

    // Reported in PROMPT_PACKS order, as before.
    for (const o of outcomes) {
      if (o.isNew) created.push(o.slug);
      else updated.push(o.slug);
    }

    // Reported per pack so "it's in admin but not in the store" is answerable
    // from this response alone, rather than by guessing.
    const packStates = await prisma.product.findMany({
      where: { slug: { in: PROMPT_PACKS.map((p) => p.slug) } },
      select: { slug: true, published: true, featured: true },
      orderBy: { slug: "asc" },
    });
    const live = packStates.filter((p) => p.published).length;

    revalidateShop();

    return NextResponse.json({
      ok: true,
      created: created.length,
      updated: updated.length,
      createdSlugs: created,
      updatedSlugs: updated,
      packs: packStates.map((p) => ({
        slug: p.slug,
        published: p.published,
        featured: p.featured,
        fileOnDisk: outcomes.find((o) => o.slug === p.slug)?.hasFile ?? false,
      })),
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
