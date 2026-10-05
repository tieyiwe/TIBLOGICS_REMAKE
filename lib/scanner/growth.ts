import type { Prisma, ScannerLead } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureOutreachTables } from "@/lib/growth/outreach/db";
import { addEvent, leadDataFromInput } from "@/lib/growth/outreach/leads";
import { dedupeDomain } from "@/lib/growth/outreach/normalize";
import { allFindings, readExtra } from "./view";

// A scanner visitor who leaves an email (or pays, or books a call) becomes a
// lead in the Growth pipeline: source "scanner", their scanned site as the
// website, the scores and the services their site needs in the note, and
// express consent when they ticked the box. An existing lead with the same
// email or site gets an event and the "scanner" tag instead of a duplicate.

/** The TIBLOGICS services this scan points to, most needed first. */
export function servicesNeeded(lead: Pick<ScannerLead, "findings" | "extra">): string[] {
  const out: string[] = [];
  for (const f of allFindings(lead)) {
    if (f.type === "good" || !("service" in f) || !f.service) continue;
    if (!out.includes(f.service)) out.push(f.service);
  }
  return out;
}

/** The Growth offer (lib/growth/outreach/offers.ts) for a service this site needs. */
const OFFER_FOR: Record<string, string> = {
  "lead-capture": "ai-implementation", booking: "ai-implementation", "ai-assistant": "ai-implementation",
  automation: "workflow-automation", email: "workflow-automation",
};
const offerFor = (service: string | undefined) => (service ? OFFER_FOR[service] ?? "web-development" : null);

export async function upsertScannerGrowthLead(lead: ScannerLead, event: "scanner_email" | "scanner_paid" | "scanner_call"): Promise<string | null> {
  if (!lead.email) return null;
  await ensureOutreachTables();
  const extra = readExtra(lead.extra);
  const services = servicesNeeded(lead);
  const summary = [
    `Website scan of ${lead.url}: overall ${lead.overallScore}/100 (AI ${lead.aiScore}, SEO ${lead.seoScore}, speed ${lead.perfScore}, UX ${lead.uxScore}` +
      (extra ? `, lead capture ${extra.growthScore}, security ${extra.securityScore})` : ")"),
    services.length ? `Needs: ${services.join(", ")}` : null,
    extra?.tech?.cms ? `Platform: ${extra.tech.cms}` : null,
  ]
    .filter(Boolean)
    .join(". ");
  const detail = event === "scanner_paid" ? "Bought the full scanner report" : event === "scanner_call" ? "Booked a call from the scanner report" : "Left their email on the website scanner";
  const consent = lead.consentAt
    ? `Express consent (scanner form) ${lead.consentAt.toISOString()} for ${lead.url}: report and follow-up emails`
    : null;

  const d = leadDataFromInput({ website: lead.url, email: lead.email, contactName: lead.name ?? undefined, notes: summary });
  const siteDomain = dedupeDomain(lead.url, null);
  const or: Prisma.GrowthLeadWhereInput[] = [{ email: lead.email }];
  if (siteDomain) or.push({ domain: siteDomain });
  const existing = lead.growthLeadId
    ? await prisma.growthLead.findUnique({ where: { id: lead.growthLeadId } })
    : await prisma.growthLead.findFirst({ where: { OR: or }, orderBy: { createdAt: "asc" } });

  const hot = event !== "scanner_email";
  if (existing) {
    const tags = Array.isArray(existing.tags) ? (existing.tags as unknown[]).filter((x): x is string => typeof x === "string") : [];
    const sameContact = !existing.email || existing.email.toLowerCase() === lead.email;
    await prisma.growthLead.update({
      where: { id: existing.id },
      data: {
        tags: [...new Set([...tags, "scanner"])].slice(0, 30),
        ...(!existing.email ? { email: lead.email } : {}),
        ...(!existing.website ? { website: d.website } : {}),
        ...(sameContact && consent && !existing.doNotContact && existing.consentBasis !== "express" ? { consentBasis: "express", consentNote: consent } : {}),
        ...(hot && ["new", "enriched", "contacted"].includes(existing.stage) ? { stage: "hot" } : {}),
      },
    });
    await addEvent(existing.id, event, `${detail}. ${summary}`, { scannerLeadId: lead.id, services });
    if (!lead.growthLeadId) await prisma.scannerLead.updateMany({ where: { domain: lead.domain, email: lead.email, growthLeadId: null }, data: { growthLeadId: existing.id } });
    return existing.id;
  }
  const created = await prisma.growthLead.create({
    data: {
      ...d,
      companyName: (extra?.page?.title?.split(/[|\-–—:]/)[0]?.trim() || d.companyName || lead.domain || lead.email).slice(0, 200),
      source: "scanner",
      sourceId: lead.id,
      stage: hot ? "hot" : "new",
      score: Math.max(0, 100 - lead.overallScore),
      bestOffer: offerFor(services[0]),
      offerReason: services.length ? `Scanner: ${services.slice(0, 3).join(", ")}` : null,
      consentBasis: consent ? "express" : "unset",
      consentNote: consent,
      tags: ["scanner"],
      signals: { scanner: { overall: lead.overallScore, services, tech: extra?.tech ?? null } } as unknown as Prisma.InputJsonValue,
    },
  });
  await addEvent(created.id, event, `${detail}. ${summary}`, { scannerLeadId: lead.id, services });
  await prisma.scannerLead.updateMany({ where: { domain: lead.domain, email: lead.email, growthLeadId: null }, data: { growthLeadId: created.id } });
  return created.id;
}
