import type { GrowthLead, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { clean, dedupeDomain, normEmail, normPhone, normUrl } from "./normalize";
import { offerName } from "./offers";
import { CONSENT_BASES, STAGES, STOP_STAGES, type Stage } from "./shared";

export { STAGES, STAGE_KEYS, STOP_STAGES, CONSENT_BASES, SENDABLE_CONSENT } from "./shared";
export type { Stage } from "./shared";

export async function addEvent(leadId: string, type: string, detail?: string | null, meta: Record<string, unknown> = {}) {
  try {
    await prisma.growthLeadEvent.create({
      data: { leadId, type, detail: detail ?? null, meta: meta as Prisma.InputJsonValue },
    });
  } catch (err) {
    console.error("[growth/outreach] event", err);
  }
}

// ── Dedupe ──────────────────────────────────────────────────────────────────

export interface DedupeIndex {
  email: Map<string, string>;
  domain: Map<string, string>;
  phone: Map<string, string>;
}

export async function loadDedupeIndex(): Promise<DedupeIndex> {
  const rows = await prisma.growthLead.findMany({ select: { id: true, email: true, domain: true, phoneNorm: true } });
  const idx: DedupeIndex = { email: new Map(), domain: new Map(), phone: new Map() };
  for (const r of rows) remember(idx, r.id, r.email, r.domain, r.phoneNorm);
  return idx;
}

function remember(idx: DedupeIndex, id: string, email: string | null, domain: string | null, phone: string | null) {
  if (email && !idx.email.has(email)) idx.email.set(email, id);
  if (domain && !idx.domain.has(domain)) idx.domain.set(domain, id);
  if (phone && !idx.phone.has(phone)) idx.phone.set(phone, id);
}

export function findDuplicate(idx: DedupeIndex, k: { email: string | null; domain: string | null; phone: string | null }) {
  if (k.email && idx.email.has(k.email)) return { by: "email", id: idx.email.get(k.email)! };
  if (k.domain && idx.domain.has(k.domain)) return { by: "domain", id: idx.domain.get(k.domain)! };
  if (k.phone && idx.phone.has(k.phone)) return { by: "phone", id: idx.phone.get(k.phone)! };
  return null;
}

// ── Lead input ──────────────────────────────────────────────────────────────

export const IMPORT_FIELDS = [
  "companyName", "contactName", "role", "email", "phone", "website", "industry", "area", "linkedinUrl", "notes",
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

export function leadDataFromInput(raw: Partial<Record<ImportField, unknown>>) {
  const email = normEmail(raw.email);
  const website = normUrl(raw.website);
  const phone = clean(raw.phone, 40);
  const domain = dedupeDomain(website, email);
  const companyName = clean(raw.companyName, 200) ?? (domain ? domain.split(".")[0] : null);
  return {
    companyName,
    contactName: clean(raw.contactName, 120),
    role: clean(raw.role, 120),
    email,
    phone,
    phoneNorm: normPhone(phone),
    website,
    domain,
    industry: clean(raw.industry, 120),
    area: clean(raw.area, 160),
    linkedinUrl: normUrl(raw.linkedinUrl)?.includes("linkedin.com") ? normUrl(raw.linkedinUrl) : null,
    notes: clean(raw.notes, 4000),
    emailStatus: email ? "provided" : "unknown",
  };
}

export interface ImportResult {
  created: number;
  duplicates: Array<{ row: number; by: string; matchId: string; companyName: string | null }>;
  invalid: Array<{ row: number; reason: string }>;
  createdIds: string[];
}

/** CSV/manual import with dedupe by email, domain and phone (within the batch too). */
export async function importLeads(
  rows: Array<Partial<Record<ImportField, unknown>>>,
  opts: { consentBasis?: string; source?: string; tags?: string[] } = {},
): Promise<ImportResult> {
  const idx = await loadDedupeIndex();
  const out: ImportResult = { created: 0, duplicates: [], invalid: [], createdIds: [] };
  const consentBasis = CONSENT_BASES.some((c) => c.key === opts.consentBasis) ? opts.consentBasis! : "unset";
  const source = opts.source === "manual" ? "manual" : "csv";
  for (let i = 0; i < rows.length; i++) {
    const d = leadDataFromInput(rows[i]);
    if (!d.companyName) {
      out.invalid.push({ row: i + 1, reason: "No company name, website or business email" });
      continue;
    }
    const dup = findDuplicate(idx, { email: d.email, domain: d.domain, phone: d.phoneNorm });
    if (dup) {
      out.duplicates.push({ row: i + 1, by: dup.by, matchId: dup.id, companyName: d.companyName });
      continue;
    }
    const lead = await prisma.growthLead.create({
      data: { ...d, companyName: d.companyName, source, consentBasis, tags: (opts.tags ?? []) as Prisma.InputJsonValue },
    });
    remember(idx, lead.id, lead.email, lead.domain, lead.phoneNorm);
    await addEvent(lead.id, "imported", source === "csv" ? "Imported from CSV" : "Added manually");
    out.created++;
    out.createdIds.push(lead.id);
  }
  return out;
}

// ── Sync from Aria (AgentLead) and the advisor (Prospect) ──────────────────

const AGENT_STAGE: Record<string, Stage> = {
  NEW: "new", TRANSFERRED: "new", CONTACTED: "contacted", HOT: "hot", WARM: "interested",
  COLD: "new", UNINTERESTED: "lost", CONVERTED: "converted",
};
const PROSPECT_STAGE: Record<string, Stage> = {
  NEW: "new", CONTACTED: "contacted", QUALIFIED: "interested", PROPOSAL_SENT: "hot", NEGOTIATING: "hot",
  CLOSED_WON: "converted", CLOSED_LOST: "lost", ON_HOLD: "new",
};

/** Pulls in AgentLeads and Prospects not yet in the workspace. Idempotent. */
export async function syncSources(): Promise<{ created: number; duplicates: number }> {
  const known = await prisma.growthLead.findMany({
    where: { source: { in: ["aria", "prospect"] } },
    select: { source: true, sourceId: true },
  });
  const seen = new Set(known.map((k) => `${k.source}:${k.sourceId}`));
  const idx = await loadDedupeIndex();
  let created = 0;
  let duplicates = 0;

  const [agentLeads, prospects] = await Promise.all([
    prisma.agentLead.findMany({ orderBy: { createdAt: "desc" }, take: 5000 }).catch(() => []),
    prisma.prospect.findMany({ where: { archived: false }, orderBy: { createdAt: "desc" }, take: 5000 }).catch(() => []),
  ]);

  const candidates: Array<{ source: string; sourceId: string; stage: Stage; data: ReturnType<typeof leadDataFromInput>; consent: string; detail: string }> = [];
  for (const a of agentLeads) {
    if (seen.has(`aria:${a.id}`)) continue;
    candidates.push({
      source: "aria", sourceId: a.id, stage: AGENT_STAGE[a.status] ?? "new",
      data: leadDataFromInput({ companyName: a.companyName, contactName: a.contactName, email: a.email, phone: a.phone, website: a.website, industry: a.industry, area: a.area ?? a.location, notes: a.description }),
      consent: "unset", detail: `Synced from Aria (${a.status})`,
    });
  }
  for (const p of prospects) {
    if (seen.has(`prospect:${p.id}`)) continue;
    candidates.push({
      source: "prospect", sourceId: p.id, stage: PROSPECT_STAGE[p.status] ?? "new",
      data: leadDataFromInput({ companyName: p.business, contactName: p.name, email: p.email, phone: p.phone, industry: p.industry, notes: p.mainChallenge }),
      // They came to us through the advisor or a form: an enquiry is an
      // existing business relationship under CASL for six months.
      consent: "implied_relationship", detail: `Synced from Prospects (${p.status})`,
    });
  }

  for (const c of candidates) {
    if (!c.data.companyName) continue;
    const dup = findDuplicate(idx, { email: c.data.email, domain: c.data.domain, phone: c.data.phoneNorm });
    if (dup) {
      duplicates++;
      continue;
    }
    try {
      const lead = await prisma.growthLead.create({
        data: { ...c.data, companyName: c.data.companyName, source: c.source, sourceId: c.sourceId, stage: c.stage, consentBasis: c.consent },
      });
      remember(idx, lead.id, lead.email, lead.domain, lead.phoneNorm);
      await addEvent(lead.id, "imported", c.detail);
      created++;
    } catch {
      // unique (source, sourceId): a concurrent sync got there first
    }
  }
  return { created, duplicates };
}

// ── Stop / handover / convert ───────────────────────────────────────────────

/** Stops every live enrollment for a lead and cancels unsent emails. */
export async function stopLeadSequences(leadId: string, reason: string): Promise<number> {
  const live = await prisma.outreachEnrollment.findMany({
    where: { leadId, status: { in: ["pending_approval", "active"] } },
    select: { id: true },
  });
  if (live.length === 0) return 0;
  const ids = live.map((e) => e.id);
  await prisma.outreachEnrollment.updateMany({ where: { id: { in: ids } }, data: { status: "stopped", stopReason: reason } });
  await prisma.outreachMessage.updateMany({
    where: { enrollmentId: { in: ids }, status: { in: ["draft", "approved"] } },
    data: { status: "cancelled", error: `Stopped: ${reason}` },
  });
  return ids.length;
}

/** Stops sequences for every lead using this address (unsubscribe / bounce). */
export async function stopByEmail(email: string, reason: string): Promise<number> {
  const leads = await prisma.growthLead.findMany({ where: { email }, select: { id: true } });
  let n = 0;
  for (const l of leads) {
    n += await stopLeadSequences(l.id, reason);
    await addEvent(l.id, reason === "unsubscribed" ? "unsubscribed" : reason, `Address ${email} suppressed (${reason}); sequences stopped`);
  }
  // Pending messages addressed to it on other leads (shared mailbox) too.
  await prisma.outreachMessage.updateMany({
    where: { toEmail: email, status: { in: ["draft", "approved"] } },
    data: { status: "cancelled", error: `Stopped: ${reason}` },
  });
  return n;
}

export async function setStage(lead: GrowthLead, stage: Stage, by = "admin") {
  const data: Prisma.GrowthLeadUpdateInput = { stage };
  if (stage === "replied" || stage === "interested") data.repliedAt = lead.repliedAt ?? new Date();
  if (stage === "converted") data.convertedAt = new Date();
  await prisma.growthLead.update({ where: { id: lead.id }, data });
  if (STOP_STAGES.has(stage)) await stopLeadSequences(lead.id, `stage:${stage}`);
  await addEvent(lead.id, "stage", `Stage → ${STAGES.find((s) => s.key === stage)?.label ?? stage}`, { by });
}

/** HOT lead → Rex (the sales agent's queue, via AgentLead + AgentMessage). */
export async function handoverToRex(lead: GrowthLead): Promise<string> {
  const now = new Date();
  let agentLeadId: string;
  if (lead.source === "aria" && lead.sourceId && (await prisma.agentLead.findUnique({ where: { id: lead.sourceId } }))) {
    agentLeadId = lead.sourceId;
    await prisma.agentLead.update({
      where: { id: agentLeadId },
      data: { status: "HOT", assignedTo: "rex", transferredAt: now },
    });
  } else {
    const a = await prisma.agentLead.create({
      data: {
        source: "growth", fromAgent: "growth", companyName: lead.companyName, contactName: lead.contactName,
        email: lead.email, phone: lead.phone, website: lead.website, industry: lead.industry, area: lead.area,
        location: lead.area, description: lead.offerReason ?? null,
        notes: [lead.opener && `Opener: ${lead.opener}`, lead.notes].filter(Boolean).join("\n") || null,
        status: "HOT", assignedTo: "rex", transferredAt: now, hasWebsite: lead.website ? true : null,
        interestedIn: lead.bestOffer ? [offerName(lead.bestOffer)] : [],
      },
    });
    agentLeadId = a.id;
  }
  await prisma.agentMessage.create({
    data: {
      fromAgent: "growth", toAgent: "rex", type: "lead_transfer",
      subject: `HOT lead from Growth: ${lead.companyName}`,
      payload: {
        leadIds: [agentLeadId],
        leads: [{ id: agentLeadId, companyName: lead.companyName, location: lead.area }],
        growthLeadId: lead.id, score: lead.score, bestOffer: lead.bestOffer, transferredAt: now.toISOString(),
      },
    },
  });
  await prisma.growthLead.update({
    where: { id: lead.id },
    data: { stage: "hot", handedOverAt: now, handoverRef: `agentLead:${agentLeadId}` },
  });
  await stopLeadSequences(lead.id, "handed over to Rex");
  await addEvent(lead.id, "handed_over", "Sent to Rex (sales) as a HOT lead", { agentLeadId });
  return agentLeadId;
}

/** → Prospects pipeline (QUALIFIED). */
export async function handoverToProspect(lead: GrowthLead): Promise<string> {
  const now = new Date();
  let prospectId: string;
  if (lead.source === "prospect" && lead.sourceId && (await prisma.prospect.findUnique({ where: { id: lead.sourceId } }))) {
    prospectId = lead.sourceId;
    await prisma.prospect.update({ where: { id: prospectId }, data: { status: "QUALIFIED", priority: "high" } });
  } else {
    const p = await prisma.prospect.create({
      data: {
        name: lead.contactName ?? lead.companyName, business: lead.companyName, industry: lead.industry ?? "Unknown",
        mainChallenge: lead.offerReason ?? "From Growth outreach", budget: "Unknown",
        suggestedSolutions: lead.bestOffer ? [offerName(lead.bestOffer)] : [], email: lead.email, phone: lead.phone,
        source: "MANUAL", status: "QUALIFIED", priority: "high",
        notes: [`From Growth outreach (score ${lead.score ?? "n/a"})`, lead.opener, lead.notes].filter(Boolean).join("\n"),
      },
    });
    prospectId = p.id;
  }
  await prisma.growthLead.update({
    where: { id: lead.id },
    data: { stage: lead.stage === "converted" ? "converted" : "hot", handedOverAt: now, handoverRef: `prospect:${prospectId}` },
  });
  await stopLeadSequences(lead.id, "handed over to Prospects");
  await addEvent(lead.id, "handed_over", "Added to the Prospects pipeline (Qualified)", { prospectId });
  return prospectId;
}

export async function convertLead(lead: GrowthLead) {
  const now = new Date();
  await prisma.growthLead.update({ where: { id: lead.id }, data: { stage: "converted", convertedAt: now } });
  const refs = [lead.handoverRef, lead.source === "aria" ? `agentLead:${lead.sourceId}` : null, lead.source === "prospect" ? `prospect:${lead.sourceId}` : null];
  for (const ref of refs) {
    if (!ref) continue;
    const [kind, id] = ref.split(":");
    if (!id) continue;
    if (kind === "agentLead") await prisma.agentLead.updateMany({ where: { id }, data: { status: "CONVERTED" } });
    if (kind === "prospect") await prisma.prospect.updateMany({ where: { id }, data: { status: "CLOSED_WON", convertedAt: now } });
  }
  await stopLeadSequences(lead.id, "converted");
  await addEvent(lead.id, "converted", "Converted to customer");
}

/** Client-safe shape. */
export function serializeLead(l: GrowthLead) {
  return {
    ...l,
    enrichedAt: l.enrichedAt?.toISOString() ?? null,
    lastContactedAt: l.lastContactedAt?.toISOString() ?? null,
    repliedAt: l.repliedAt?.toISOString() ?? null,
    handedOverAt: l.handedOverAt?.toISOString() ?? null,
    convertedAt: l.convertedAt?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}
export type LeadDTO = ReturnType<typeof serializeLead>;
