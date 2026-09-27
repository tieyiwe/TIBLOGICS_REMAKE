import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TRAINING_EVENT_SEED, TRAINING_EVENT_SLUG, PARENTS_EVENT_SEED, PARENTS_EVENT_SLUG } from "@/lib/event-seeds";
import { requireAdmin } from "@/lib/require-admin";

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

export async function GET() {
  // Staff only. A bare session check passed here for TIBLOGICS Learn students
  // too, since learners share this NextAuth instance — requireAdmin rejects them.
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  // Ensure the current live training event always appears in admin, even if no
  // one has visited the public page yet. Create-only: existing edits preserved.
  try {
    await prisma.event.upsert({
      where: { slug: TRAINING_EVENT_SLUG },
      create: TRAINING_EVENT_SEED,
      update: { title: TRAINING_EVENT_SEED.title, price: TRAINING_EVENT_SEED.price, date: TRAINING_EVENT_SEED.date, endDate: TRAINING_EVENT_SEED.endDate, published: true },
    });
  } catch (err) {
    console.error("[admin/events] ensure training event", err);
  }

  // Ensure the parents training event exists (coming-soon, create-only)
  try {
    await prisma.event.upsert({
      where: { slug: PARENTS_EVENT_SLUG },
      create: PARENTS_EVENT_SEED,
      update: { spots: 50, capacity: 50, price: PARENTS_EVENT_SEED.price },
    });
  } catch (err) {
    console.error("[admin/events] ensure parents event", err);
  }

  // Load events and registration counts independently so a problem with one
  // table (e.g. EventRegistration not yet created) never blanks out the other.
  const events = await prisma.event
    .findMany({ orderBy: { createdAt: "desc" } })
    .catch((err) => {
      console.error("[admin/events GET] events", err);
      return null;
    });

  if (events === null) {
    return NextResponse.json({ error: "Database error — click Sync Database", events: [], regCounts: [] }, { status: 500 });
  }

  // Non-fatal — if EventRegistration table is missing/empty, events still render
  const regCounts = await prisma.eventRegistration
    .groupBy({ by: ["eventSlug", "status"], _count: { id: true } })
    .catch((err) => {
      console.error("[admin/events GET] regCounts", err);
      return [] as { eventSlug: string; status: string; _count: { id: number } }[];
    });

  return NextResponse.json({ events, regCounts });
}

export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const body = await req.json();
  const base = slugify(body.title ?? "event");
  let slug = base;
  let i = 1;
  while (await prisma.event.findUnique({ where: { slug } })) slug = `${base}-${i++}`;

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
  return NextResponse.json({ event }, { status: 201 });
}
