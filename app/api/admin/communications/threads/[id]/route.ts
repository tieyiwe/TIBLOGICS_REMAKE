import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard, learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { addAdminReply, REPLY_MAX } from "@/lib/learn/inbox/threads";
import { ensureCommsTables } from "@/lib/learn/inbox/db";
import { sendAdminReplyEmail } from "@/lib/learn/inbox/email";
import { audit } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

// Admin side of an Inbox conversation: reply (in-app + email), close, reopen.
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reply"), body: z.string().trim().min(1, "Write a reply").max(REPLY_MAX * 2), email: z.boolean().optional().default(true) }),
  z.object({ action: z.literal("close") }),
  z.object({ action: z.literal("reopen") }),
]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { session, error } = await learnerStaff("manage");
  if (error) return error;
  const { id } = await params;
  if (!/^[\w-]{1,64}$/.test(id)) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  await ensureCommsTables();

  if (parsed.data.action !== "reply") {
    const status = parsed.data.action === "close" ? "closed" : "open";
    const r = await prisma.inboxThread.updateMany({ where: { id }, data: { status, ...(status === "closed" ? { adminUnread: 0 } : {}) } });
    if (!r.count) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    await audit(session, `comms.thread.${parsed.data.action}`, { type: "thread", id }, null);
    return NextResponse.json({ ok: true });
  }

  if (!(await checkRateLimit(`comms-reply:${session.user.email}`, 120, 3_600_000))) {
    return NextResponse.json({ error: "Too many replies in an hour." }, { status: 429 });
  }
  const thread = await addAdminReply(id, parsed.data.body, { name: session.user.name ?? null, email: session.user.email });
  if (!thread) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  const student = await prisma.student.findUnique({ where: { id: thread.studentId }, select: { id: true, email: true, name: true, locale: true } });
  let emailed = false;
  if (student && parsed.data.email && !student.email.endsWith("@deleted.arfa.invalid")) {
    try {
      await sendAdminReplyEmail({ to: student.email, name: student.name, locale: student.locale, subject: thread.subject, body: parsed.data.body, threadId: id });
      emailed = true;
    } catch (err) {
      console.error("[comms/reply] email", err instanceof Error ? err.message : err);
    }
  }
  await audit(session, "comms.thread.reply", { type: "learner", id: thread.studentId, label: student?.email ?? null }, { threadId: id, emailed });
  return NextResponse.json({ ok: true, emailed });
}
