import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const news = await prisma.breakingNews.findFirst({
      where: {
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ news });
  } catch {
    return NextResponse.json({ news: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Deactivate all previous breaking news
    await prisma.breakingNews.updateMany({ data: { active: false } });
    const news = await prisma.breakingNews.create({
      data: {
        headline: body.headline,
        summary: body.summary ?? "",
        sourceUrl: body.sourceUrl,
        source: body.source,
        active: true,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
    return NextResponse.json({ news }, { status: 201 });
  } catch (err) {
    console.error("Breaking news error:", err);
    return NextResponse.json({ error: "Failed to set breaking news" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.breakingNews.updateMany({ data: { active: false } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
