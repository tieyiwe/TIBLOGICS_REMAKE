import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { markDeleteRequested, parentFromToken, setParentBoards, setParentConsent } from "@/lib/learn/youth-account";
import { sendDeletionRequestEmails, sendParentEmail } from "@/lib/learn/youth-emails";

// The parent dashboard's settings (/parent/[token]). No sign-in: the link
// emailed to the parent is the credential (32 random bytes, looked up by
// parentFromToken). Rate limited per address before the lookup and per child
// after it. JSON only, same origin.
const Action = z.discriminatedUnion("action", [
  // Confirm (under 13) or restore access, with the notice agreed.
  z.object({ action: z.literal("consent"), agree: z.literal(true) }),
  z.object({ action: z.literal("revoke") }),
  // Leaderboard and weekly challenge board (first name and initial only).
  z.object({ action: z.literal("boards"), allow: z.boolean() }),
  // The consent or information email again, to the parent.
  z.object({ action: z.literal("resend") }),
  // Ask ARFA to delete the child's account (access is locked at once).
  z.object({ action: z.literal("delete"), confirm: z.literal(true) }),
]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`parent-ip:${ip}`, 30, 600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const child = await parentFromToken((await params).token);
  if (!child) return NextResponse.json({ error: t("learn.parent.err.link") }, { status: 404 });
  if (!(await checkRateLimit(`parent-act:${child.studentId}`, 20, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Action.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.parent.err.invalid") }, { status: 400 });
  const a = parsed.data;
  if (child.parentDeleteRequestedAt && a.action !== "resend") {
    return NextResponse.json({ error: t("learn.parent.err.deleting") }, { status: 409 });
  }

  try {
    switch (a.action) {
      case "consent":
        await setParentConsent(child.studentId, "granted");
        return NextResponse.json({ ok: true, message: t("learn.parent.done.consent") });
      case "revoke":
        await setParentConsent(child.studentId, "revoked");
        return NextResponse.json({ ok: true, message: t("learn.parent.done.revoke") });
      case "boards":
        await setParentBoards(child.studentId, a.allow);
        return NextResponse.json({ ok: true, message: t(a.allow ? "learn.parent.done.boardsOn" : "learn.parent.done.boardsOff") });
      case "resend":
        if (!(await checkRateLimit(`youth-parent-mail:${child.parentEmail}`, 10, 86_400_000)) || !(await checkRateLimit(`parent-resend:${child.studentId}`, 3, 3_600_000))) {
          return NextResponse.json({ error: t("learn.youth.err.resendLimit") }, { status: 429 });
        }
        await sendParentEmail(child);
        return NextResponse.json({ ok: true, message: t("learn.parent.done.resend") });
      case "delete":
        await markDeleteRequested(child.studentId);
        await sendDeletionRequestEmails(child).catch((err) => console.error("[parent] deletion emails", err instanceof Error ? err.message : err));
        return NextResponse.json({ ok: true, message: t("learn.parent.done.delete") });
    }
  } catch (err) {
    console.error(`[POST /api/parent ${a.action}]`, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: t("learn.parent.err.failed") }, { status: 500 });
  }
}
