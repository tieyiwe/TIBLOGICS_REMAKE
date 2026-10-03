import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireGrowth } from "@/lib/growth/outreach/auth";

export const dynamic = "force-dynamic";

const STATUSES = ["draft", "approved", "sending", "sent", "failed", "cancelled"];

/** The approval queue and send log, with the lead each email is for. */
export async function GET(req: NextRequest) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const status = req.nextUrl.searchParams.get("status") ?? "draft";
  if (!STATUSES.includes(status)) return NextResponse.json({ error: "Unknown status" }, { status: 400 });
  const msgs = await prisma.outreachMessage.findMany({
    where: { status },
    orderBy: status === "sent" ? [{ sentAt: "desc" }] : [{ createdAt: "desc" }, { stepIndex: "asc" }],
    take: 500,
  });
  const leadIds = [...new Set(msgs.map((m) => m.leadId))];
  const seqIds = [...new Set(msgs.map((m) => m.sequenceId))];
  const [leads, seqs] = await Promise.all([
    prisma.growthLead.findMany({ where: { id: { in: leadIds } }, select: { id: true, companyName: true, contactName: true, score: true, consentBasis: true, stage: true } }),
    prisma.outreachSequence.findMany({ where: { id: { in: seqIds } }, select: { id: true, name: true } }),
  ]);
  const L = new Map(leads.map((l) => [l.id, l]));
  const S = new Map(seqs.map((s) => [s.id, s.name]));
  return NextResponse.json({
    messages: msgs.map((m) => ({
      id: m.id, enrollmentId: m.enrollmentId, leadId: m.leadId, stepIndex: m.stepIndex, dayOffset: m.dayOffset,
      toEmail: m.toEmail, subject: m.subject, bodyText: m.bodyText, personalised: m.personalised, status: m.status,
      scheduledFor: m.scheduledFor?.toISOString() ?? null, sentAt: m.sentAt?.toISOString() ?? null, error: m.error,
      approvedBy: m.approvedBy, lead: L.get(m.leadId) ?? null, sequenceName: S.get(m.sequenceId) ?? "",
    })),
  });
}
