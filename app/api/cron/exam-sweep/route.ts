import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { finaliseExamSession } from "@/lib/learn/exam-scoring";

// Auto-submits exam sessions that ran past their deadline while the learner
// was away (Part E3). Runs every 15 minutes via vercel.json.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const ok =
      req.headers.get("authorization") === `Bearer ${cronSecret}` ||
      searchParams.get("secret") === cronSecret;
    if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
