import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { ensureCommunityTables } from "@/lib/learn/community/db";
import { deletePost, deleteThread, getPost, setAnswer, setHidden } from "@/lib/learn/community/discussion";
import { setPeerHidden } from "@/lib/learn/community/peer";

// Moderation. POST with one of:
//   { action: "hide" | "unhide" | "delete", targetType: "thread" | "post", targetId }
//     (hide and delete also resolve the target's open reports)
//   { action: "dismiss", targetId }               dismiss the target's open reports
//   { action: "suspend", studentId, days, reason } days 0 = lift the suspension
//   { action: "answer", threadId, postId | null }  mark the accepted answer
//   { action: "hidePeer" | "unhidePeer", reviewId }
export async function POST(req: NextRequest) {
  const authErr = await requirePermission("events");
  if (authErr) return authErr;
  await ensureCommunityTables();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const s = (v: unknown, max = 64) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const targetType = b.targetType === "thread" ? "thread" : b.targetType === "post" ? "post" : null;
  const targetId = s(b.targetId);

  const resolve = (status: "resolved" | "dismissed") =>
    prisma.$executeRaw`UPDATE "CommunityReport" SET "status" = ${status}, "resolvedAt" = now() WHERE "targetId" = ${targetId} AND "status" = 'open'`;

  switch (b.action) {
    case "hide":
    case "unhide":
      if (!targetType || !targetId) break;
      await setHidden(targetType, targetId, b.action === "hide");
      if (b.action === "hide") await resolve("resolved");
      return NextResponse.json({ ok: true });
    case "delete":
      if (!targetType || !targetId) break;
      if (targetType === "thread") await deleteThread(targetId, null);
      else await deletePost(targetId, null);
      await resolve("resolved");
      return NextResponse.json({ ok: true });
    case "dismiss":
      if (!targetId) break;
      // Dismissing also brings back a post that reports auto-hid.
      await resolve("dismissed");
      await prisma.$executeRaw`UPDATE "CommunityThread" SET "hidden" = false WHERE "id" = ${targetId}`;
      await prisma.$executeRaw`UPDATE "CommunityPost" SET "hidden" = false WHERE "id" = ${targetId}`;
      return NextResponse.json({ ok: true });
    case "suspend": {
      const studentId = s(b.studentId);
      const days = Number(b.days);
      if (!studentId || !Number.isFinite(days) || days < 0 || days > 36500) break;
      const until = days === 0 ? null : new Date(Date.now() + days * 86_400_000);
      const reason = s(b.reason, 300) || null;
      await prisma.$executeRaw`
        INSERT INTO "CommunityProfile" ("studentId", "suspendedUntil", "suspendReason") VALUES (${studentId}, ${until}, ${reason})
        ON CONFLICT ("studentId") DO UPDATE SET "suspendedUntil" = ${until}, "suspendReason" = ${reason}, "updatedAt" = now()`;
      return NextResponse.json({ ok: true });
    }
    case "answer": {
      const threadId = s(b.threadId);
      const postId = b.postId === null ? null : s(b.postId) || null;
      if (postId) {
        const post = await getPost(postId);
        if (!post || post.threadId !== threadId) break;
      }
      const ok = await setAnswer(threadId, postId);
      return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    case "hidePeer":
    case "unhidePeer":
      await setPeerHidden(s(b.reviewId), b.action === "hidePeer");
      return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
