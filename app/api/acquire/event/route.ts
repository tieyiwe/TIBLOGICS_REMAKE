import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isBot } from "@/lib/growth/links";
import { ensureAcquireTables } from "@/lib/growth/acquire/db";
import { recordAcquireEvent } from "@/lib/growth/acquire/events";
import { clientIp, isSameSiteJson } from "@/lib/growth/acquire/security";
import { SLUG_RE } from "@/lib/growth/acquire/types";

// Counts a view, a CTA click or a finished quiz on a published magnet or
// landing page. Sent from the browser after the page has rendered (so link
// previews and prefetches never count); one per visitor and day.
export const dynamic = "force-dynamic";

const Body = z.object({
  refType: z.enum(["magnet", "page"]),
  slug: z.string().regex(SLUG_RE),
  kind: z.enum(["view", "cta", "quiz"]),
});

export async function POST(req: NextRequest) {
  if (!isSameSiteJson(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const ua = req.headers.get("user-agent") ?? "";
  if (isBot(ua)) return NextResponse.json({ ok: true, counted: false });
  const ip = clientIp(req);
  if (!(await checkRateLimit(`acquire-event:${ip}`, 120, 10 * 60_000))) return NextResponse.json({ ok: true, counted: false });
  try {
    await ensureAcquireTables();
    const { refType, slug, kind } = parsed.data;
    const row =
      refType === "magnet"
        ? await prisma.acquireMagnet.findUnique({ where: { slug }, select: { id: true, status: true } })
        : await prisma.acquirePage.findUnique({ where: { slug }, select: { id: true, status: true } });
    if (!row || row.status !== "published") return NextResponse.json({ ok: true, counted: false });
    const counted = await recordAcquireEvent(refType, row.id, kind, ip, ua);
    return NextResponse.json({ ok: true, counted });
  } catch (err) {
    console.error("[api/acquire/event]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
