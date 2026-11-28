import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, requirePermission } from "@/lib/require-admin";
import { audit } from "@/lib/admin/audit";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import prisma from "@/lib/prisma";
import { adminAct } from "@/lib/blog/engage/db";
import { MODERATE_PERMISSION } from "@/lib/blog/engage/identity";
import { afterSaved } from "@/lib/blog/engage/notify";

export const dynamic = "force-dynamic";

const Body = z.object({ action: z.enum(["approve", "hide", "pin", "unpin", "delete", "block", "unblock"]) });

// Staff moderation of one article comment (AI Times manage access): approve
// a held comment, hide, pin to the top of the discussion, delete for good, or
// block the person (their comments come down and they cannot post again).
// Nobody edits a reader's words. proxy.ts checks the area first
// (lib/admin/access-map.ts); this checks again.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const denied = await requirePermission(MODERATE_PERMISSION);
  if (denied) return denied;
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await checkRateLimit(`admin-comment-act:${session.user?.email ?? "staff"}`, 200, 600_000))) {
    return NextResponse.json({ error: "Too many requests. Wait a moment." }, { status: 429 });
  }
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  const action = parsed.data.action;
  const by = session.user?.name || session.user?.email || "staff";
  try {
    const before = await adminAct(id, action, by);
    if (!before) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    if (before.refused) {
      return NextResponse.json(
        { error: action === "pin" ? "Only a published top-level comment can be pinned." : "This comment has no reader email to block." },
        { status: 400 },
      );
    }
    // A held comment going up now: the reply email it was waiting for.
    if (action === "approve" && before.status !== "published") {
      const now = await prisma.articleComment.findUnique({ where: { id } });
      const post = await prisma.blogPost.findUnique({ where: { slug: before.postSlug }, select: { title: true } });
      if (now && post) afterSaved(now, post.title, { alertOwner: false });
    }
    await audit(session, `comment.${action}`, { type: "article-comment", id, label: `${before.authorName} on ${before.postSlug}`.slice(0, 160) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/admin/blog/comments/[id]]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not update the comment." }, { status: 500 });
  }
}
