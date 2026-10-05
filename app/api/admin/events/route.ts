import { INDEXNOW_SECTIONS, indexNowSoon } from "@/lib/seo/indexnow";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TRAINING_EVENT_SEED, TRAINING_EVENT_SLUG, PARENTS_EVENT_SLUG } from "@/lib/event-seeds";
import { requireAdmin } from "@/lib/require-admin";

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

export async function GET() {
  // Staff only. A bare session check passed here for TIBLOGICS Learn students
  // too, since learners share this NextAuth instance — requireAdmin rejects them.
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  // Ensure the current live training event and the parents one always appear in
  // admin, even if no one has visited the public page yet. Create-only:
  // existing edits preserved. Different slugs, so neither waits on the other —
  // each keeps its own error handling so one failing still lets the other land.
  await Promise.all([
    prisma.event
      .upsert({
        where: { slug: TRAINING_EVENT_SLUG },
        create: TRAINING_EVENT_SEED,
        update: { title: TRAINING_EVENT_SEED.title, price: TRAINING_EVENT_SEED.price, date: TRAINING_EVENT_SEED.date, endDate: TRAINING_EVENT_SEED.endDate, published: true },
      })
      .catch((err) => {
        console.error("[admin/events] ensure training event", err);
      }),
    // The AI for Parents live training is replaced by the AI for Parents
    // track (/learning-box/ai-for-parents): no longer re-created, and taken
    // off the public list (the row and its waitlist are kept).
    prisma.event
      .updateMany({ where: { slug: PARENTS_EVENT_SLUG, published: true }, data: { published: false, registrationOpen: false } })
      .catch((err) => {
        console.error("[admin/events] retire parents event", err);
      }),
  ]);

  // Load events and registration counts independently so a problem with one
  // table (e.g. EventRegistration not yet created) never blanks out the other.
  // They read different tables, so both go out at once.
  const [events, regCounts] = await Promise.all([
    prisma.event
      .findMany({ orderBy: { createdAt: "desc" } })
      .catch((err) => {
        console.error("[admin/events GET] events", err);
        return null;
      }),
    // Non-fatal — if EventRegistration table is missing/empty, events still render
    prisma.eventRegistration
      .groupBy({ by: ["eventSlug", "status"], _count: { id: true } })
      .catch((err) => {
        console.error("[admin/events GET] regCounts", err);
        return [] as { eventSlug: string; status: string; _count: { id: number } }[];
      }),
  ]);

  if (events === null) {
    return NextResponse.json({ error: "Database error — click Sync Database", events: [], regCounts: [] }, { status: 500 });
  }

  return NextResponse.json({ events, regCounts });
}

export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const body = await req.json();
  const base = slugify(body.title ?? "event");
  // Every candidate the loop could try (`base`, `base-1`, `base-2`, …) starts
  // with `base`, so one prefix query replaces a findUnique per attempt.
  const taken = new Set(
    (await prisma.event.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } }))
      .map((e) => e.slug),
  );
  let slug = base;
  let i = 1;
  while (taken.has(slug)) slug = `${base}-${i++}`;

  const event = await prisma.event.create({
    data: {
      title: body.title,
      slug,
      description: body.description ?? "",
      content: body.content ?? null,
      type: body.type ?? "TRAINING",
      price: body.price ?? 0,
      capacity: body.capacity ?? null,
      spots: body.spots ?? null,
      location: body.location ?? "Online",
      date: body.date ? new Date(body.date) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      timeSlot: body.timeSlot ?? null,
      coverImage: body.coverImage ?? null,
      tags: body.tags ?? [],
      featured: body.featured ?? false,
      published: body.published ?? false,
      registrationOpen: body.registrationOpen ?? true,
      stripePaymentLink: body.stripePaymentLink ?? null,
    },
  });
  // Search engines and AI search (IndexNow) learn about the new event now.
  indexNowSoon(INDEXNOW_SECTIONS.event(event.slug));
  return NextResponse.json({ event }, { status: 201 });
}
