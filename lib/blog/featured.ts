import prisma from "@/lib/prisma";

// The two featured AI Times articles: automatic, with the owner's picks first.
//
//   - Articles the owner features in the admin are pinned (AdminSettings
//     "featured:pins") and stay featured until the owner unfeatures them.
//   - Free slots go to the newest real news (an article written from a source)
//     of the last week, else the newest article of any kind, and are
//     refreshed whenever the news agent runs or a pin changes.
//   - An article the owner unfeatures is never picked automatically again
//     ("featured:skips"), so taking one down sticks.
// The `featured` column is the result; this decides it.

export const FEATURED_SLOTS = 2;
const PINS_KEY = "featured:pins";
const SKIPS_KEY = "featured:skips";
const NEWS_WINDOW_MS = 7 * 86_400_000;

async function readIds(key: string): Promise<string[]> {
  const row = await prisma.adminSettings.findUnique({ where: { key } }).catch(() => null);
  try {
    const v = row ? JSON.parse(row.value) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

async function writeIds(key: string, ids: string[]) {
  const value = JSON.stringify(ids);
  await prisma.adminSettings.upsert({ where: { key }, create: { key, value }, update: { value } });
}

export async function featuredPins(): Promise<string[]> {
  return readIds(PINS_KEY);
}

/**
 * The owner featured (on) or unfeatured (off) an article. Pins are kept
 * newest first and capped at the slot count: pinning a third drops the
 * oldest pin. Then the featured set is recomputed.
 */
export async function setFeaturedPin(id: string, on: boolean): Promise<void> {
  const [pins, skips] = await Promise.all([readIds(PINS_KEY), readIds(SKIPS_KEY)]);
  const nextPins = on ? [id, ...pins.filter((x) => x !== id)].slice(0, FEATURED_SLOTS) : pins.filter((x) => x !== id);
  const nextSkips = on ? skips.filter((x) => x !== id) : [id, ...skips.filter((x) => x !== id)].slice(0, 200);
  await Promise.all([writeIds(PINS_KEY, nextPins), writeIds(SKIPS_KEY, nextSkips)]);
  await applyFeatured();
}

/** Sets `featured` on exactly the chosen articles. Returns their ids. */
export async function applyFeatured(): Promise<string[]> {
  const [pins, skips] = await Promise.all([readIds(PINS_KEY), readIds(SKIPS_KEY)]);
  const published = await prisma.blogPost.findMany({
    where: { published: true },
    select: { id: true, featured: true, sourceUrl: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  const live = new Set(published.map((p) => p.id));
  const chosen = pins.filter((id) => live.has(id)).slice(0, FEATURED_SLOTS);
  const skip = new Set(skips);
  const recentNews = published.filter((p) => p.sourceUrl && Date.now() - p.createdAt.getTime() < NEWS_WINDOW_MS);
  for (const pool of [recentNews, published]) {
    for (const p of pool) {
      if (chosen.length >= FEATURED_SLOTS) break;
      if (!chosen.includes(p.id) && !skip.has(p.id)) chosen.push(p.id);
    }
  }
  const want = new Set(chosen);
  const on = published.filter((p) => want.has(p.id) && !p.featured).map((p) => p.id);
  await Promise.all([
    on.length ? prisma.blogPost.updateMany({ where: { id: { in: on } }, data: { featured: true } }) : null,
    // Anything else featured (including unpublished rows) is cleared.
    prisma.blogPost.updateMany({ where: { featured: true, id: { notIn: chosen } }, data: { featured: false } }),
  ]);
  if (pins.some((id) => !live.has(id))) await writeIds(PINS_KEY, pins.filter((id) => live.has(id)));
  return chosen;
}
