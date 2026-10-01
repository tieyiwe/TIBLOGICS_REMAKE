import prisma from "@/lib/prisma";
import { outreachConfig } from "./config";
import { ensureOutreachTables } from "./db";
import { STAGES } from "./shared";

// Small, cheap numbers for the /admin_pro/growth hub cards. Never throws:
// on any database problem it returns zeros with `ok: false`.

export interface OutreachSummary {
  ok: boolean;
  totalLeads: number;
  leadsByStage: Array<{ stage: string; label: string; count: number }>;
  emailsSentThisWeek: number;
  emailsSent24h: number;
  dailyCap: number;
  awaitingApproval: number;
  /** Replied (or better) leads ÷ leads emailed, over the last 30 days; 0-1. */
  replyRate: number;
  repliedLast30d: number;
  emailedLast30d: number;
  hotLeads: number;
  hotList: Array<{ id: string; companyName: string; score: number | null; area: string | null }>;
}

export async function getOutreachSummary(): Promise<OutreachSummary> {
  const dailyCap = outreachConfig().dailyCap;
  const empty: OutreachSummary = {
    ok: false, totalLeads: 0, leadsByStage: STAGES.map((s) => ({ stage: s.key, label: s.label, count: 0 })),
    emailsSentThisWeek: 0, emailsSent24h: 0, dailyCap, awaitingApproval: 0, replyRate: 0, repliedLast30d: 0,
    emailedLast30d: 0, hotLeads: 0, hotList: [],
  };
  try {
    await ensureOutreachTables();
    const now = Date.now();
    const week = new Date(now - 7 * 86_400_000);
    const day = new Date(now - 86_400_000);
    const month = new Date(now - 30 * 86_400_000);
    const [byStage, sentWeek, sent24h, awaiting, emailedRows, hot] = await Promise.all([
      prisma.growthLead.groupBy({ by: ["stage"], _count: { _all: true } }),
      prisma.outreachMessage.count({ where: { status: "sent", sentAt: { gte: week } } }),
      prisma.outreachMessage.count({ where: { status: "sent", sentAt: { gte: day } } }),
      prisma.outreachMessage.count({ where: { status: "draft" } }),
      prisma.outreachMessage.findMany({ where: { status: "sent", sentAt: { gte: month } }, select: { leadId: true }, distinct: ["leadId"] }),
      prisma.growthLead.findMany({
        where: { stage: "hot" },
        orderBy: [{ score: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
        take: 5,
        select: { id: true, companyName: true, score: true, area: true },
      }),
    ]);
    const emailedIds = emailedRows.map((r) => r.leadId);
    const replied = emailedIds.length
      ? await prisma.growthLead.count({ where: { id: { in: emailedIds }, repliedAt: { not: null } } })
      : 0;
    const counts = new Map(byStage.map((r) => [r.stage, r._count._all]));
    return {
      ok: true,
      totalLeads: [...counts.values()].reduce((a, b) => a + b, 0),
      leadsByStage: STAGES.map((s) => ({ stage: s.key, label: s.label, count: counts.get(s.key) ?? 0 })),
      emailsSentThisWeek: sentWeek,
      emailsSent24h: sent24h,
      dailyCap,
      awaitingApproval: awaiting,
      replyRate: emailedIds.length ? replied / emailedIds.length : 0,
      repliedLast30d: replied,
      emailedLast30d: emailedIds.length,
      hotLeads: counts.get("hot") ?? 0,
      hotList: hot,
    };
  } catch (err) {
    console.error("[growth/outreach] summary", err);
    return empty;
  }
}
