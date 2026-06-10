// Diagnostic: connect to the DB, count events, and force-insert the training
// event. Run with:  node scripts/check-events.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TRAINING_EVENT_SLUG = "ai-practical-training-cohort-1";

async function main() {
  console.log("\n=== EVENT DIAGNOSTIC ===\n");

  // 1. Can we read the Event table at all?
  try {
    const count = await prisma.event.count();
    console.log(`✅ Event table readable. Current count: ${count}`);
  } catch (err) {
    console.error("❌ Cannot read Event table. The schema is likely out of sync.");
    console.error("   → Run:  npx prisma db push");
    console.error("\n   Raw error:\n", err.message);
    process.exit(1);
  }

  // 2. List existing events
  try {
    const events = await prisma.event.findMany({ select: { slug: true, title: true, published: true } });
    if (events.length === 0) {
      console.log("ℹ️  No events in DB yet.");
    } else {
      console.log("\nExisting events:");
      events.forEach((e) => console.log(`   • ${e.title} (${e.slug}) published=${e.published}`));
    }
  } catch (err) {
    console.error("❌ findMany failed — a column in the schema does not exist in the DB.");
    console.error("   → Run:  npx prisma db push");
    console.error("\n   Raw error:\n", err.message);
    process.exit(1);
  }

  // 3. Force-create the training event
  try {
    await prisma.event.upsert({
      where: { slug: TRAINING_EVENT_SLUG },
      update: {},
      create: {
        slug: TRAINING_EVENT_SLUG,
        title: "AI Practical Training — Cohort 1",
        description:
          "A hands-on 4-session live training where you go from curious to capable — writing with AI, building income, creating automations, and getting your first taste of vibe coding. Live on Zoom. Every Saturday 9:30AM–1PM.",
        type: "TRAINING",
        price: 64900,
        currency: "USD",
        capacity: 30,
        spots: 30,
        location: "Live on Zoom",
        date: new Date("2026-06-20T09:30:00"),
        endDate: new Date("2026-07-11T13:00:00"),
        timeSlot: "9:30AM – 1:00PM ET (Saturdays)",
        timezone: "America/New_York",
        coverImage:
          "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
        tags: ["ai", "training", "practical", "cohort", "live", "zoom"],
        featured: true,
        published: true,
        registrationOpen: true,
      },
    });
    console.log(`\n✅ Training event is present in the DB (${TRAINING_EVENT_SLUG}).`);
    console.log("   Reload the admin Events page — it should now appear.\n");
  } catch (err) {
    console.error("\n❌ Could not create the training event.");
    console.error("   → Run:  npx prisma db push   (then re-run this script)");
    console.error("\n   Raw error:\n", err.message);
    process.exit(1);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
