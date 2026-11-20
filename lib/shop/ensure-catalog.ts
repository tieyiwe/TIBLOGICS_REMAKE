// Keeps the AI Toolkit line (lib/shop/prompt-packs.ts) present and
// displayable in whatever database the app is running against.
//
// Why this exists: the packs are defined in code but only reached the
// database when an admin pressed "Seed toolkits". A deploy that added a pack
// (the Realtor toolkit) showed nothing until someone pressed it again, and a
// seed run while a PDF had not landed yet created that pack unpublished, after
// which no later seed would publish it. The store then showed four of five
// packs, with the spotlight rotating through every old "featured" row.
//
// What it does, on the first store request of each server process:
//   1. Creates any pack that is missing, published when its PDF is on disk.
//   2. Repairs what makes a pack render broken: a cover URL that is empty or
//      points at a /shop/covers file that does not exist, and a pack missing
//      from its collection.
//   3. Once per CATALOG_REV (recorded in AdminSettings): publishes every pack
//      whose PDF is on disk and applies the featured flags from code. After
//      that, publish/feature choices made in admin are left alone.
//
// Idempotent and cheap: after the first run it is one findMany per process.
// It reads nothing from the request and writes only rows defined in code.
import { existsSync, statSync } from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import {
  PROMPT_PACKS,
  PROMPT_PACK_CATEGORY,
  PROMPT_PACK_COLLECTION,
  PROMPT_PACK_COLLECTION_META,
  PROMPT_PACK_PRICE,
  type PromptPackSeed,
} from "./prompt-packs";
import { resolveDownloadPath } from "./delivery";

/**
 * Bump when the pack line changes in a way production must pick up once
 * (a new pack, a new featured choice). Each value is applied a single time.
 */
export const CATALOG_REV = "2026-10-five-toolkits";
const REV_KEY = "shop_catalog_rev";

/** Size of the pack's PDF, or null when it is not on disk (or escapes the root). */
export function packFileSize(pack: PromptPackSeed): number | null {
  const p = resolveDownloadPath(pack.fileKey);
  if (!p) return null;
  try {
    return statSync(p).size;
  } catch {
    return null;
  }
}

/** The product fields the code owns for a pack (not published / featured). */
export function promptPackData(pack: PromptPackSeed, sizeBytes: number | null) {
  return {
    name: pack.name,
    tagline: pack.tagline,
    description: pack.description,
    price: PROMPT_PACK_PRICE,
    currency: "USD",
    images: [pack.coverImage],
    category: PROMPT_PACK_CATEGORY,
    collections: [PROMPT_PACK_COLLECTION],
    tags: pack.tags,
    stock: null, // digital, never runs out
    digital: true,
    // Wires into the delivery system: paid order -> grant -> token URL.
    deliveryType: "download",
    fileKey: pack.fileKey,
    fileName: pack.fileName,
    fileFormat: `PDF · ${pack.pages} pages · ${pack.prompts} prompts`,
    fileSizeBytes: sizeBytes,
    downloadDays: 365,
    maxDownloads: 10,
  };
}

/** True when a site-relative image URL names a file that is not in /public. */
function missingPublicFile(url: string | undefined): boolean {
  if (!url) return true;
  if (!url.startsWith("/") || url.startsWith("//")) return false; // remote: not ours to check
  const clean = url.split(/[?#]/)[0];
  const root = path.join(process.cwd(), "public");
  const file = path.resolve(root, "." + clean);
  if (!file.startsWith(root + path.sep)) return false;
  return !existsSync(file);
}

/** Display order of the packs in code, for a stable storefront order. */
export const PACK_ORDER: Record<string, number> = Object.fromEntries(
  PROMPT_PACKS.map((p) => [p.slug, p.sortOrder]),
);

async function run(): Promise<void> {
  const slugs = PROMPT_PACKS.map((p) => p.slug);
  const [rows, rev] = await Promise.all([
    prisma.product.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, slug: true, images: true, collections: true, published: true, featured: true },
    }),
    prisma.adminSettings.findUnique({ where: { key: REV_KEY } }).catch(() => null),
  ]);
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const firstRunOfRev = rev?.value !== CATALOG_REV;

  const writes: Promise<unknown>[] = [];

  // The collection the packs belong to. Created if missing; never edited here.
  writes.push(
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
      update: firstRunOfRev ? { published: true } : {},
    }),
  );

  for (const pack of PROMPT_PACKS) {
    const row = bySlug.get(pack.slug);
    const size = packFileSize(pack);
    if (!row) {
      writes.push(
        prisma.product.create({
          data: {
            slug: pack.slug,
            ...promptPackData(pack, size),
            featured: pack.featured ?? false,
            published: size !== null,
          },
        }),
      );
      continue;
    }

    const fix: Record<string, unknown> = {};
    if (row.images.length === 0 || missingPublicFile(row.images[0])) {
      fix.images = [pack.coverImage, ...row.images.filter((u) => u && !missingPublicFile(u))];
    }
    if (!row.collections.includes(PROMPT_PACK_COLLECTION)) {
      fix.collections = [...row.collections, PROMPT_PACK_COLLECTION];
    }
    if (firstRunOfRev) {
      if (!row.published && size !== null) fix.published = true;
      if (row.featured !== (pack.featured ?? false)) fix.featured = pack.featured ?? false;
    }
    if (Object.keys(fix).length) {
      writes.push(prisma.product.update({ where: { id: row.id }, data: fix }));
    }
  }

  await Promise.all(writes);

  if (firstRunOfRev) {
    await prisma.adminSettings.upsert({
      where: { key: REV_KEY },
      update: { value: CATALOG_REV },
      create: { key: REV_KEY, value: CATALOG_REV },
    });
  }
}

const g = globalThis as unknown as { __tibShopEnsure?: { p: Promise<void> | null; failedAt: number } };
const S = (g.__tibShopEnsure ??= { p: null, failedAt: 0 });

/**
 * Make sure the toolkits are in the database and displayable. Runs once per
 * process; a failure is logged, never thrown (the store still renders what it
 * has), and retried at most once a minute.
 */
export async function ensureStoreCatalog(): Promise<void> {
  if (!S.p) {
    if (S.failedAt && Date.now() - S.failedAt < 60_000) return;
    S.p = run().catch((err) => {
      console.error("[shop] ensureStoreCatalog failed", err);
      S.p = null;
      S.failedAt = Date.now();
    });
  }
  await S.p;
}

/**
 * Storefront order: featured first, then the packs in their code order, then
 * newest. Deterministic, so the grid does not reshuffle between requests.
 */
export function sortStoreProducts<T extends { slug: string; featured: boolean; createdAt: Date }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    const pa = PACK_ORDER[a.slug] ?? Number.MAX_SAFE_INTEGER;
    const pb = PACK_ORDER[b.slug] ?? Number.MAX_SAFE_INTEGER;
    if (pa !== pb) return pa - pb;
    const t = b.createdAt.getTime() - a.createdAt.getTime();
    return t !== 0 ? t : a.slug.localeCompare(b.slug);
  });
}
