import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { finaliseExamSession } from "@/lib/learn/exam-scoring";

// Auto-submits exam sessions that ran past their deadline while the learner
// was away (Part E3). Runs every 15 minutes via vercel.json.
export async function GET(req: NextRequest) {
  // Fail CLOSED. Previously an unset CRON_SECRET left this endpoint open to
  // anyone, letting a stranger force-submit in-progress exams. A misconfigured
  // deployment should disable the sweep, never expose it.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron/exam-sweep] CRON_SECRET is not set — refusing to run");
    return NextResponse.json(
      { error: "Cron is not configured on this deployment" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const presented =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? searchParams.get("secret") ?? "";

  // Constant-time comparison so the secret can't be recovered by timing.
  const a = Buffer.from(presented);
  const b = Buffer.from(cronSecret);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let stale: Array<{ id: string }> = [];
  try {
    stale = await prisma.finalExamSession.findMany({
      where: { status: "in_progress", expiresAt: { lt: new Date() } },
      select: { id: true },
      take: 200,
    });
  } catch (err) {
    console.error("[cron/exam-sweep]", err);
    return NextResponse.json({ error: "Database error — run Sync Database" }, { status: 500 });
  }

  let swept = 0;
  for (const s of stale) {
    try {
      await finaliseExamSession(s.id, true);
      swept++;
    } catch (err) {
      console.error(`[cron/exam-sweep] session ${s.id}`, err);
    }
  }

  return NextResponse.json({ ok: true, found: stale.length, swept });
}
