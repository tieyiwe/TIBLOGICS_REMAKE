import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { clientIp } from "@/lib/growth/acquire/security";
import prisma from "@/lib/prisma";
import { deleteOwnComment, reportComment, toggleHelpful } from "@/lib/blog/engage/db";
import { keyedHash, readerHash, readerId, setReaderCookie, viewerOf } from "@/lib/blog/engage/identity";
import { afterSaved } from "@/lib/blog/engage/notify";

export const dynamic = "force-dynamic";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("helpful") }),
  z.object({ action: z.literal("report"), reason: z.enum(["spam", "abuse", "offtopic", "other"]) }),
  z.object({ action: z.literal("delete") }),
]);

// A reader's action on one comment: vote it helpful (toggle), report it, or
// delete their own. JSON from this site only, rate limited per network.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const b = parsed.data;
  const ip = clientIp(req);

  try {
    if (b.action === "delete") {
      if (!(await checkRateLimit(`comment-delete:${ip}`, 30, 3_600_000))) return NextResponse.json({ error: "Too many" }, { status: 429 });
      const ok = await deleteOwnComment(id, await viewerOf(req));
      return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rid = readerId(req);
    let res: NextResponse;
    if (b.action === "helpful") {
      if (!(await checkRateLimit(`comment-helpful:${ip}`, 120, 3_600_000))) return NextResponse.json({ error: "Too many" }, { status: 429 });
      const r = await toggleHelpful(id, readerHash(rid.id));
      if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
      res = NextResponse.json(r);
    } else {
      if (!(await checkRateLimit(`comment-report:${ip}`, 20, 3_600_000))) return NextResponse.json({ error: "Too many" }, { status: 429 });
      // One report per network, not per browser: clearing cookies must not
      // let one person take a comment down alone.
      const r = await reportComment(id, keyedHash("reporter", ip), b.reason);
      if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (r.held) {
        // Off the page until staff look: tell the owner.
        const c = await prisma.articleComment.findUnique({ where: { id } });
        const post = c ? await prisma.blogPost.findUnique({ where: { slug: c.postSlug }, select: { title: true } }) : null;
        if (c && post) afterSaved(c, post.title, { alertOwner: true });
      }
      res = NextResponse.json({ ok: true, held: r.held });
    }
    if (rid.fresh) setReaderCookie(res, rid.id);
    return res;
  } catch (err) {
    console.error("[POST comment action]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
