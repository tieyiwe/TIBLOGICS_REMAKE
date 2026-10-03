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
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}
