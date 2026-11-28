import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { listStaff, logActivity, notify, taskHref } from "@/lib/admin/command-center/pm";
import { commentSchema } from "@/lib/admin/command-center/schemas";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Comment on a task. @mentions notify the people named (only staff with
 * Command Center access, and only when "@Name" really is in the text); the
 * assignee hears about every comment they did not write.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "comments", { max: 60 });
  if (blocked) return blocked;
  const parsed = commentSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const { id } = await params;
  await ensurePmTables();
  const task = await prisma.projectTask.findUnique({ where: { id }, select: { id: true, projectId: true, text: true, assigneeId: true } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const team = await listStaff();
  const body = parsed.data.body;
  const lower = body.toLowerCase();
  const mentions = [...new Set(parsed.data.mentions)].filter((m) => {
    const s = team.find((x) => x.id === m);
    return !!s && lower.includes(`@${s.name.toLowerCase()}`);
  });
  const comment = await prisma.pmComment.create({
    data: { projectId: task.projectId, taskId: task.id, authorId: staff.id, authorName: staff.name, body, mentions },
  });
  await logActivity(task.projectId, staff, "comment", `commented on "${task.text}"`, task.id);
  const href = taskHref(task.projectId, task.id);
  const preview = body.length > 140 ? `${body.slice(0, 137)}...` : body;
  await notify(mentions, { kind: "mention", title: `${staff.name} mentioned you on "${task.text}"`, body: preview, href }, staff.id);
  if (task.assigneeId && !mentions.includes(task.assigneeId)) {
    await notify([task.assigneeId], { kind: "comment", title: `${staff.name} commented on "${task.text}"`, body: preview, href }, staff.id);
  }
  return NextResponse.json(
    {
      comment: {
        id: comment.id,
        authorId: comment.authorId,
        authorName: comment.authorName,
        body: comment.body,
        mentions: comment.mentions,
        createdAt: comment.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
