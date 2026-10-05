import prisma from "@/lib/prisma";

// Adds the `editedAt` columns the content editor relies on, and the track's
// optional one-time price override (`LearnTrack.priceCents`). The Learn tables
// predate them and this project has no migrations, so this runs (once per
// process) before any editor write and before seeding.
const TABLES = ["LearnTrack", "LearnModule", "Lesson", "MicroCheck", "Quiz", "FinalExam", "Lab", "Capstone"];

let ready: Promise<void> | null = null;

export function ensureLearnEditColumns(): Promise<void> {
  ready ??= (async () => {
    for (const t of TABLES) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${t}" ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3)`);
    }
    // When a lesson was added, for "New in this track". Added WITHOUT a value
    // for existing rows (null = original content), then defaulted for new ones.
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lesson" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "LearnTrack" ADD COLUMN IF NOT EXISTS "priceCents" INTEGER`);
    await applyPriceRevisions();
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/**
 * Track prices the owner set in code, each applied once (recorded in
 * AdminSettings), so they reach production on the first request without a
 * trip to the admin. A price changed later in the track editor is kept.
 * To set another price this way, add an entry with a new key.
 */
const PRICE_REVISIONS: Array<{ key: string; slug: string; priceCents: number }> = [
  { key: "price-rev:2026-10-ai-apps-agents-897", slug: "ai-apps-agents", priceCents: 89700 },
  { key: "price-rev:2026-10-ai-small-business-497", slug: "ai-small-business", priceCents: 49700 },
];

async function applyPriceRevisions(): Promise<void> {
  for (const r of PRICE_REVISIONS) {
    const done = await prisma.adminSettings.findUnique({ where: { key: r.key } }).catch(() => null);
    if (done) continue;
    const n = await prisma.$executeRawUnsafe(`UPDATE "LearnTrack" SET "priceCents" = $1 WHERE "slug" = $2`, r.priceCents, r.slug);
    // Only recorded once the track exists, so a database seeded later still gets it.
    if (n > 0) {
      await prisma.adminSettings.upsert({ where: { key: r.key }, create: { key: r.key, value: String(r.priceCents) }, update: {} });
    }
  }
}
