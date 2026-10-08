import { NextRequest, NextResponse } from "next/server";
import { requireStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { readYouthProfile } from "@/lib/learn/youth-account";
import { sendParentEmail } from "@/lib/learn/youth-emails";

// "Send the email to my parent again" (/learn/youth). Rate limited per
// learner (3 an hour, 6 a day) and per parent address (10 a day), so it can
// never be used to flood an inbox.
export async function POST(req: NextRequest) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const t = await getT();
  const { error, student } = await requireStudent();
  if (error) return error;
  const p = await readYouthProfile(student.id);
  if (!p?.parentEmail || !p.parentToken) {
    return NextResponse.json({ error: t("learn.youth.err.noParent") }, { status: 409 });
  }
  if (
    !(await checkRateLimit(`youth-resend:${student.id}`, 3, 3_600_000)) ||
    !(await checkRateLimit(`youth-resend-d:${student.id}`, 6, 86_400_000)) ||
    !(await checkRateLimit(`youth-parent-mail:${p.parentEmail}`, 10, 86_400_000))
  ) {
    return NextResponse.json({ error: t("learn.youth.err.resendLimit") }, { status: 429 });
  }
  try {
    await sendParentEmail(p);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/learn/youth/resend]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: t("learn.youth.err.sendFailed") }, { status: 502 });
  }
}
