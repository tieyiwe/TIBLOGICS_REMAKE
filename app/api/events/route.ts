import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const featured = searchParams.get("featured");

  try {
    const where: Record<string, unknown> = { published: true };
    if (type && type !== "all") where.type = type.toUpperCase();
    if (featured === "true") where.featured = true;

    const events = await prisma.event.findMany({
      where,
      orderBy: [{ featured: "desc" }, { date: "asc" }],
    });
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
