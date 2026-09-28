import prisma from "@/lib/prisma";

// Adds the `editedAt` columns the content editor relies on. The Learn tables
// predate them and this project has no migrations, so this runs (once per
// process) before any editor write and before seeding.
const TABLES = ["LearnTrack", "LearnModule", "Lesson", "MicroCheck", "Quiz", "FinalExam", "Lab", "Capstone"];

let ready: Promise<void> | null = null;

export function ensureLearnEditColumns(): Promise<void> {
  ready ??= (async () => {
    for (const t of TABLES) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${t}" ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3)`);
    }
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}
