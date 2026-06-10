import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TRAINING_EVENT_SEED, TRAINING_EVENT_SLUG } from "@/lib/event-seeds";

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure the current live training event always appears in admin, even if no
  // one has visited the public page yet. Create-only: existing edits preserved.
  try {
    await prisma.event.upsert({
      where: { slug: TRAINING_EVENT_SLUG },
      create: TRAINING_EVENT_SEED,
      update: {},
    });
  } catch (err) {
    console.error("[admin/events] ensure training event", err);
  }

  try {
    const [events, regCounts] = await Promise.all([
      prisma.event.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.eventRegistration.groupBy({
        by: ["eventSlug", "status"],
        _count: { id: true },
      }),
    ]);
    return NextResponse.json({ events, regCounts });
  } catch (err) {
    console.error("[admin/events GET]", err);
    return NextResponse.json({ error: "Database error — run: npx prisma db push", events: [], regCounts: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
