import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secretEquals } from "@/lib/require-admin";
import { ensureScannerColumns } from "@/lib/scanner/db";
import { pendingReports, writeReport } from "@/lib/scanner/report";
import { sendFollowup } from "@/lib/scanner/email";

// Website scanner, daily (hourly is fine too):
//   npm run cron scanner
//   1. Follow-ups to visitors who left their email and have not unlocked the
//      report or booked a call: day 3 (the biggest problem) and day 7 (build
//      ideas and the offer). Each is claimed before it is sent, so a run that
//      overlaps another sends once. Unsubscribed addresses are skipped.
//   2. Paid or call-unlocked reports whose writing did not finish (up to 3 tries).

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  if (!secretEquals(bearer, cronSecret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureScannerColumns();
  const deadline = Date.now() + 240_000;

  let sent = 0;
  let skipped = 0;
  const due = await prisma.scannerLead.findMany({
    where: { followupAt: { lte: new Date() }, email: { not: null }, unlockedAt: null, followupStage: { lt: 2 } },
    orderBy: { followupAt: "asc" },
    take: 100,
  });
  for (const lead of due) {
    if (Date.now() > deadline) break;
    const stage = (lead.followupStage + 1) as 1 | 2;
    // Claim: move to the next stage first (and schedule the one after).
    const claimed = await prisma.scannerLead.updateMany({
      where: { id: lead.id, followupStage: lead.followupStage, followupAt: lead.followupAt },
      data: { followupStage: stage, followupAt: stage === 1 ? new Date(Date.now() + 4 * 86_400_000) : null },
    });
    if (claimed.count !== 1) continue;
    const ok = await sendFollowup(lead, stage).catch((err) => {
      console.error("[cron/scanner] follow-up", lead.id, err instanceof Error ? err.message : err);
      return false;
    });
    if (ok) sent++;
    else skipped++;
  }

  const reports: Record<string, number> = {};
  for (const id of await pendingReports(5)) {
    if (Date.now() > deadline) break;
    const o = await writeReport(id).catch(() => "failed" as const);
    reports[o] = (reports[o] ?? 0) + 1;
  }
  return NextResponse.json({ followups: { due: due.length, sent, skipped }, reports });
}
