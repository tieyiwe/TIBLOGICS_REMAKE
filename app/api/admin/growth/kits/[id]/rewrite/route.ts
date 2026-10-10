import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { ClaudeRefusal } from "@/lib/claude";
import { jsonBody, requireGrowthAdmin } from "@/lib/growth/content-auth";
import { KitError } from "@/lib/growth/content/kit";
import { REWRITE_OPS, rewriteItem, type RewriteKind, type RewriteOp } from "@/lib/growth/content/rewrite";

export const maxDuration = 60;

const KINDS: RewriteKind[] = ["post", "email", "ad", "hero", "video"];
type Ctx = { params: Promise<{ id: string }> };

/** One item rewrite (Haiku). The result is returned for review; nothing is saved. */
export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const session = await getServerSession(authOptions).catch(() => null);
  if (!(await checkRateLimit(`growth-rewrite:${session?.user?.id ?? "admin"}`, 200, 3_600_000))) {
    return NextResponse.json({ error: "Too many rewrites this hour. Try again later." }, { status: 429 });
  }
  const { id } = await params;
  const kit = await prisma.growthKit.findUnique({ where: { id }, select: { productKey: true, language: true, audienceId: true } });
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = await jsonBody(req);
  const kind = b?.kind as RewriteKind;
  const op = b?.op as RewriteOp;
  if (!KINDS.includes(kind) || !(REWRITE_OPS as readonly string[]).includes(op) || !b?.item || JSON.stringify(b.item).length > 20_000) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const r = await rewriteItem({ kit, kind, op, item: b.item, index: Math.max(0, Math.floor(Number(b.index) || 0)), to: typeof b.to === "string" ? b.to : undefined });
    return NextResponse.json(r);
  } catch (err) {
    if (err instanceof KitError) return NextResponse.json({ error: err.message }, { status: 422 });
    if (err instanceof ClaudeRefusal) return NextResponse.json({ error: "The model declined this rewrite." }, { status: 422 });
    console.error("[growth/rewrite]", err);
    return NextResponse.json({ error: "Rewrite failed. Try again." }, { status: 502 });
  }
}
