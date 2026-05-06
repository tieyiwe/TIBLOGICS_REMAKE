import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// GET is public (displayed on site), POST/DELETE require admin
export async function GET() {
  try {
    const now = new Date();
    const news = await prisma.breakingNews.findFirst({
      where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ news });
  } catch {
    return NextResponse.json({ news: null });
  }
}

export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const body = await req.json();
    if (!body.headline || typeof body.headline !== "string" || body.headline.length > 300) {
      return NextResponse.json({ error: "Invalid headline" }, { status: 400 });
    }
    await prisma.breakingNews.updateMany({ data: { active: false } });
    const news = await prisma.breakingNews.create({
      data: {
        headline: body.headline.trim(),
        summary: typeof body.summary === "string" ? body.summary.slice(0, 500) : "",
        sourceUrl: typeof body.sourceUrl === "string" ? body.sourceUrl.slice(0, 500) : null,
        source: typeof body.source === "string" ? body.source.slice(0, 100) : null,
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
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    await prisma.breakingNews.updateMany({ data: { active: false } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
