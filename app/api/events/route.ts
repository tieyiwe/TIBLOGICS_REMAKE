import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TYPE_COVER: Record<string, string> = {
  TRAINING: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
  WORKSHOP: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  WEBINAR:  "https://images.unsplash.com/photo-1587440871875-191322ee64b0?auto=format&fit=crop&w=1200&q=80",
  EVENT:    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const featured = searchParams.get("featured");

  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const where: Record<string, unknown> = {
      published: true,
      OR: [{ date: null }, { date: { gte: now } }],
    };
    if (type && type !== "all") where.type = type.toUpperCase();
    if (featured === "true") where.featured = true;

    const events = await prisma.event.findMany({
      where,
      orderBy: [{ featured: "desc" }, { date: "asc" }],
    });

    // Count paid registrations per event to compute live spotsLeft
    const paidCounts = await prisma.eventRegistration.groupBy({
      by: ["eventSlug"],
      where: { status: "paid", eventSlug: { in: events.map(e => e.slug) } },
      _count: { id: true },
    }).catch(() => [] as { eventSlug: string; _count: { id: number } }[]);

    const paidBySlug = Object.fromEntries(paidCounts.map(r => [r.eventSlug, r._count.id]));

    const withCovers = events.map((e) => ({
      ...e,
      coverImage: e.coverImage || TYPE_COVER[e.type] || TYPE_COVER.EVENT,
      spotsLeft: e.spots != null ? Math.max(0, e.spots - (paidBySlug[e.slug] ?? 0)) : null,
    }));

    return NextResponse.json({ events: withCovers });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
