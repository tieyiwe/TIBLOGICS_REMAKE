import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isGrowthAdmin } from "@/lib/growth/content-auth";
import { growthTablesReady } from "@/lib/growth/db";
import { normalizeCard, slideCount } from "@/lib/growth/cards/spec";
import { renderCard } from "@/lib/growth/cards/render";
import { verifyCardSig } from "@/lib/growth/cards/sign";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// The image card attached to a queued post. Readable by a growth admin, or
// by anyone holding the signed URL (how Facebook fetches it when the post is
// published). ?download=1 saves it as a file.
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const q = req.nextUrl.searchParams;
  const slideReq = Math.max(0, Math.floor(Number(q.get("slide")) || 0));
  if (!verifyCardSig(id, slideReq, q.get("sig"))) {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!isGrowthAdmin(session?.user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await growthTablesReady())) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const post = await prisma.growthPost.findUnique({ where: { id }, select: { image: true } });
  const spec = normalizeCard(post?.image);
  if (!spec) return NextResponse.json({ error: "No image" }, { status: 404 });
  const slide = Math.min(slideCount(spec) - 1, slideReq);
  try {
    return await renderCard(spec, slide, {
      "Cache-Control": "private, max-age=120",
      ...(q.get("download") ? { "Content-Disposition": `attachment; filename="tiblogics-post-${id.slice(-6)}-${slide + 1}.png"` } : {}),
    });
  } catch (err) {
    console.error("[growth/cards] post render", err);
    return NextResponse.json({ error: "Could not render the card" }, { status: 500 });
  }
}
