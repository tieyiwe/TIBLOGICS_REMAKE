import prisma from "@/lib/prisma";
import { outreachConfig } from "./config";
import { serializeLead } from "./leads";
import { sendBlocker } from "./sequences";
import { linkedinNote, mergeValues, utm, whatsappMessage } from "./templates";
import { waNumber } from "./normalize";

/** Everything the lead drawer shows: lead, timeline, emails, manual-channel drafts. */
export async function leadDetail(id: string) {
  const lead = await prisma.growthLead.findUnique({ where: { id } });
  if (!lead) return null;
  const [events, enrollments, messages] = await Promise.all([
    prisma.growthLeadEvent.findMany({ where: { leadId: id }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.outreachEnrollment.findMany({ where: { leadId: id }, orderBy: { createdAt: "desc" } }),
    prisma.outreachMessage.findMany({ where: { leadId: id }, orderBy: [{ createdAt: "desc" }, { stepIndex: "asc" }] }),
  ]);
  const seqIds = [...new Set(enrollments.map((e) => e.sequenceId))];
  const seqs = seqIds.length ? await prisma.outreachSequence.findMany({ where: { id: { in: seqIds } }, select: { id: true, name: true } }) : [];

  // Clicks on this lead's tracked booking links (lib/growth/links), if that
  // module's tables exist. Privacy-friendly: no pixels, no per-person IDs in
  // the click table — the per-lead link code is what ties a click to a lead.
  const codes = enrollments.map((e) => e.linkCode).filter((c): c is string => !!c);
  let clicks: Array<{ linkCode: string; day: string; n: number }> = [];
  if (codes.length) {
    try {
      clicks = await prisma.$queryRawUnsafe<Array<{ linkCode: string; day: string; n: number }>>(
        `SELECT "linkCode", "day", COUNT(*)::int AS "n" FROM "GrowthClick" WHERE "linkCode" = ANY($1::text[]) GROUP BY "linkCode", "day" ORDER BY "day" DESC`,
        codes,
      );
    } catch {
      clicks = [];
    }
  }

  const cfg = outreachConfig();
  const bookingUrl = utm("/book", "manual-outreach", lead.id, "whatsapp");
  const merge = { ...lead };
  const wa = waNumber(lead.phone);
  const waText = whatsappMessage(merge, cfg.fromName, bookingUrl);
  return {
    lead: serializeLead(lead),
    blocker: await sendBlocker(lead),
    events: events.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
    enrollments: enrollments.map((e) => ({
      ...e,
      sequenceName: seqs.find((s) => s.id === e.sequenceId)?.name ?? "(deleted sequence)",
      approvedAt: e.approvedAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
    messages: messages.map((m) => ({
      ...m,
      approvedAt: m.approvedAt?.toISOString() ?? null,
      scheduledFor: m.scheduledFor?.toISOString() ?? null,
      claimedAt: m.claimedAt?.toISOString() ?? null,
      sentAt: m.sentAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    })),
    clicks,
    manual: {
      whatsappText: waText,
      whatsappUrl: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(waText)}` : null,
      linkedinNote: linkedinNote(merge, cfg.fromName),
      linkedinUrl: lead.linkedinUrl,
      bookingUrl: utm("/book", "manual-outreach", lead.id, "manual"),
    },
    mergePreview: mergeValues(merge, { campaign: "preview", senderName: cfg.fromName }),
  };
}
export type LeadDetail = NonNullable<Awaited<ReturnType<typeof leadDetail>>>;
