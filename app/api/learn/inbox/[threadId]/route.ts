import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { addLearnerReply, markLearnerRead, REPLY_MAX } from "@/lib/learn/inbox/threads";
import { sendLearnerReplyAlert } from "@/lib/learn/inbox/email";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { onLearnerFollowUp } from "@/lib/learn/support/tickets";

export const dynamic = "force-dynamic";

// Learner Inbox actions on one thread: mark read, or reply. Replies are rate
// limited (10 an hour, 30 a day per learner), stored as typed (rendered
// escaped, see lib/learn/inbox/markdown.ts) and announced to the ARFA
// mailbox.

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("read") }),
  z.object({ action: z.literal("reply"), body: z.string() }),
]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { error, student } = await requireStudent();
  if (error) return error;
  const t = await getT();
  const { threadId } = await params;
  if (!/^[\w-]{1,64}$/.test(threadId)) return NextResponse.json({ error: t("inbox.error") }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("inbox.error") }, { status: 400 });

  if (parsed.data.action === "read") {
    const ok = await markLearnerRead(student.id, threadId);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: t("inbox.error") }, { status: 404 });
  }

  const body = parsed.data.body.replace(/\r\n?/g, "\n").trim();
  if (!body) return NextResponse.json({ error: t("inbox.empty_reply") }, { status: 400 });
  if (body.length > REPLY_MAX) return NextResponse.json({ error: t("inbox.tooLong") }, { status: 400 });
  const hourOk = await checkRateLimit(`inbox-reply:h:${student.id}`, 10, 3_600_000);
  const dayOk = hourOk && (await checkRateLimit(`inbox-reply:d:${student.id}`, 30, 86_400_000));
  if (!hourOk || !dayOk) return NextResponse.json({ error: t("inbox.tooMany") }, { status: 429 });

  const r = await addLearnerReply(student.id, threadId, body, { name: student.name, email: student.email });
  if (r.error === "not_found") return NextResponse.json({ error: t("inbox.error") }, { status: 404 });
  if (r.error === "closed") return NextResponse.json({ error: t("inbox.closed") }, { status: 409 });

  // Support threads ("Need help?") alert the owner, batched (lib/learn/support);
  // other threads keep the usual alert to the ARFA mailbox.
  const isSupport = await onLearnerFollowUp(threadId).catch((err) => {
    console.error("[inbox] support follow-up", err instanceof Error ? err.message : err);
    return false;
  });
  if (!isSupport) {
    sendLearnerReplyAlert({ name: student.name, email: student.email, subject: r.thread.subject, body, threadId }).catch((err) =>
      console.error("[inbox] reply alert", err instanceof Error ? err.message : err),
    );
  }
  return NextResponse.json({ ok: true });
}
