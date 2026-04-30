import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const events = await prisma.event.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ events });
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
