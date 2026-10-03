import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireGrowth } from "@/lib/growth/outreach/auth";
import { configProblems, inSendWindow, outreachConfig } from "@/lib/growth/outreach/config";
import { sentInLast24h } from "@/lib/growth/outreach/sender";

export const dynamic = "force-dynamic";

export async function GET() {
  const deny = await requireGrowth();
  if (deny) return deny;
  const cfg = outreachConfig();
  const [sent24h, state, counts] = await Promise.all([
    sentInLast24h(),
    prisma.outreachState.findUnique({ where: { id: "sender" } }),
    prisma.outreachMessage.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  return NextResponse.json({
    dailyCap: cfg.dailyCap, sent24h, perRun: cfg.perRun, window: `${cfg.windowStart}:00-${cfg.windowEnd}:00 ${cfg.timeZone}`,
    inWindow: inSendWindow(cfg), fromName: cfg.fromName, fromEmail: cfg.fromEmail, replyTo: cfg.replyTo,
    physicalAddress: cfg.physicalAddress || null, problems: configProblems(cfg),
    lastRunAt: state?.lastRunAt?.toISOString() ?? null, lastResult: state?.lastResult ?? null,
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
  });
}
