import type { GrowthLead, OutreachSequence, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { runClaude } from "@/lib/claude";
import { createLink, shortUrl } from "@/lib/growth/links";
import { outreachConfig } from "./config";
import { addEvent } from "./leads";
import { OFFERS } from "./offers";
import { SENDABLE_CONSENT, STOP_STAGES } from "./shared";
import { isSuppressed } from "./suppression";
import { DEFAULT_STEPS, mergeValues, parseSteps, render, slugify, utm, type SequenceStep } from "./templates";

// Enrolling leads drafts every email of the sequence up front, so the owner
// previews exactly what each lead will get and approves it (each, or all).
// Nothing is ever sent from here: the sender only picks up "approved" rows.

export async function ensureDefaultSequence(): Promise<void> {
  const n = await prisma.outreachSequence.count();
  if (n > 0) return;
  await prisma.outreachSequence.create({
    data: {
      name: "Local business intro (3 touches)",
      description: "Day 0 personalised intro, day 3 follow-up, day 7 last touch.",
      status: "active",
      steps: DEFAULT_STEPS as unknown as Prisma.InputJsonValue,
    },
  });
}

const URL_RE = /https?:\/\/[^\s)>\]]+/g;

const PERSONALISE_SYSTEM = `You tailor one cold B2B email from TIBLOGICS to one specific business.
Return ONLY JSON: {"subject": "...", "body": "..."}
Rules:
- Keep the meaning, the offer and the call to action of the draft. Plain text, under 140 words.
- Use only facts given about the lead. Never invent details, results, names, prices or mutual connections.
- Copy every URL from the draft exactly, character for character.
- Honest subject line: no "Re:" or "Fwd:", no false urgency, no clickbait, no ALL CAPS.
- Friendly, direct, respectful; no emojis, no exclamation marks, no AI buzzwords.
- Keep the sign-off name from the draft. Do not add an unsubscribe line or address (a footer is appended later).`;

async function personalise(draft: { subject: string; body: string }, lead: GrowthLead): Promise<{ subject: string; body: string } | null> {
  const facts = {
    company: lead.companyName, contact: lead.contactName, role: lead.role, industry: lead.industry, area: lead.area,
    website: lead.website, observations: lead.scoreReasons, opener: lead.opener,
  };
  try {
    const { text } = await runClaude("outreach-personalise", {
      system: PERSONALISE_SYSTEM,
      messages: [{ role: "user", content: `Lead facts: ${JSON.stringify(facts)}\n\nDraft subject: ${draft.subject}\n\nDraft body:\n${draft.body}` }],
      meta: { ref: `growth-lead:${lead.id}` },
    });
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const j = JSON.parse(m[0]) as { subject?: unknown; body?: unknown };
    const subject = typeof j.subject === "string" ? j.subject.trim() : "";
    const body = typeof j.body === "string" ? j.body.trim() : "";
    if (!subject || !body) return null;
    // Every link of the draft must survive verbatim (UTM, tracked booking link).
    const need = draft.body.match(URL_RE) ?? [];
    if (need.some((u) => !body.includes(u))) return null;
    if (/^\s*(re|fwd?)\s*:/i.test(subject)) return null;
    return { subject: subject.slice(0, 200), body: body.slice(0, 5000) };
  } catch (err) {
    console.warn("[growth/outreach] personalise failed", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Why a lead cannot be emailed at all, or null. */
export async function sendBlocker(lead: GrowthLead): Promise<string | null> {
  if (!lead.email) return lead.emailStatus === "none_found" ? "No public email found" : "No email address";
  if (lead.doNotContact) return "Marked do not contact";
  if (STOP_STAGES.has(lead.stage)) return `Stage is ${lead.stage}`;
  if (!SENDABLE_CONSENT.has(lead.consentBasis)) return "No consent basis recorded";
  const sup = await isSuppressed(lead.email);
  if (sup) return `On suppression list (${sup})`;
  return null;
}

async function bookingLinkFor(lead: GrowthLead, campaign: string): Promise<{ url: string; code: string | null }> {
  try {
    const link = await createLink({
      targetUrl: "/book", utmSource: "outreach", utmMedium: "email", utmCampaign: campaign,
      utmContent: lead.id.slice(-8), label: `Outreach booking: ${lead.companyName}`.slice(0, 200),
    });
    return { url: shortUrl(link.code), code: link.code };
  } catch (err) {
    // Short links unavailable: a plain UTM link still attributes the booking.
    console.warn("[growth/outreach] short link unavailable", err instanceof Error ? err.message : err);
    return { url: utm("/book", campaign, lead.id), code: null };
  }
}

export interface EnrollResult {
  enrolled: Array<{ leadId: string; enrollmentId: string; messages: number }>;
  skipped: Array<{ leadId: string; company: string; reason: string }>;
}

export async function enrollLeads(sequenceId: string, leadIds: string[]): Promise<EnrollResult> {
  const seq = await prisma.outreachSequence.findUnique({ where: { id: sequenceId } });
  if (!seq) throw new Error("Sequence not found");
  const steps = parseSteps(seq.steps);
  if (steps.length === 0) throw new Error("Sequence has no steps");
  const cfg = outreachConfig();
  const campaign = slugify(seq.name);
  const out: EnrollResult = { enrolled: [], skipped: [] };

  const leads = await prisma.growthLead.findMany({ where: { id: { in: leadIds.slice(0, 25) } } });
  for (const lead of leads) {
    const blocker = await sendBlocker(lead);
    if (blocker) {
      out.skipped.push({ leadId: lead.id, company: lead.companyName, reason: blocker });
      continue;
    }
    const live = await prisma.outreachEnrollment.findFirst({ where: { leadId: lead.id, status: { in: ["pending_approval", "active"] } } });
    if (live) {
      out.skipped.push({ leadId: lead.id, company: lead.companyName, reason: "Already in a live sequence" });
      continue;
    }
    if (await prisma.outreachEnrollment.findUnique({ where: { sequenceId_leadId: { sequenceId, leadId: lead.id } } })) {
      out.skipped.push({ leadId: lead.id, company: lead.companyName, reason: "Already went through this sequence" });
      continue;
    }

    const booking = await bookingLinkFor(lead, campaign);
    const values = mergeValues(lead, { campaign, bookingUrl: booking.url, senderName: cfg.fromName });
    const drafts: Array<{ step: SequenceStep; subject: string; body: string; personalised: boolean }> = [];
    for (const step of steps) {
      let subject = render(step.subject, values);
      let body = render(step.body, values);
      let personalised = false;
      if (step.personalise) {
        const p = await personalise({ subject, body }, lead);
        if (p) {
          subject = p.subject;
          body = p.body;
          personalised = true;
        }
      }
      drafts.push({ step, subject, body, personalised });
    }

    try {
      const enrollment = await prisma.$transaction(async (tx) => {
        const e = await tx.outreachEnrollment.create({
          data: { sequenceId, leadId: lead.id, status: "pending_approval", linkCode: booking.code },
        });
        await tx.outreachMessage.createMany({
          data: drafts.map((d, i) => ({
            enrollmentId: e.id, sequenceId, leadId: lead.id, stepIndex: i, dayOffset: d.step.dayOffset,
            toEmail: lead.email, subject: d.subject, bodyText: d.body, personalised: d.personalised, status: "draft",
          })),
        });
        return e;
      });
      await addEvent(lead.id, "enrolled", `Added to "${seq.name}" (${drafts.length} emails drafted, awaiting approval)`, { sequenceId, enrollmentId: enrollment.id });
      out.enrolled.push({ leadId: lead.id, enrollmentId: enrollment.id, messages: drafts.length });
    } catch {
      out.skipped.push({ leadId: lead.id, company: lead.companyName, reason: "Already enrolled" });
    }
  }
  for (const id of leadIds.slice(0, 25)) {
    if (!leads.some((l) => l.id === id)) out.skipped.push({ leadId: id, company: "?", reason: "Lead not found" });
  }
  return out;
}

// Random delay added to each approved send time so a batch does not go out at
// once. OUTREACH_JITTER_MIN overrides both defaults (20 min for the first
// email, 120 for follow-ups); 0 disables it.
const jitterMs = (defMin: number) => {
  const env = Number(process.env.OUTREACH_JITTER_MIN);
  const maxMin = process.env.OUTREACH_JITTER_MIN !== undefined && Number.isFinite(env) && env >= 0 ? env : defMin;
  return Math.floor(Math.random() * maxMin * 60_000);
};

/**
 * Owner approval. Only drafts become approved; each gets a send time (day
 * offset from now plus a random jitter so a batch does not go out at once).
 */
export async function approveMessages(where: { messageIds?: string[]; enrollmentIds?: string[]; all?: boolean }, by: string): Promise<number> {
  const filter: Prisma.OutreachMessageWhereInput = { status: "draft", toEmail: { not: null } };
  if (where.messageIds?.length) filter.id = { in: where.messageIds };
  else if (where.enrollmentIds?.length) filter.enrollmentId = { in: where.enrollmentIds };
  else if (!where.all) return 0;

  const msgs = await prisma.outreachMessage.findMany({ where: filter, select: { id: true, enrollmentId: true, dayOffset: true } });
  const live = await prisma.outreachEnrollment.findMany({
    where: { id: { in: [...new Set(msgs.map((m) => m.enrollmentId))] }, status: { in: ["pending_approval", "active"] } },
    select: { id: true },
  });
  const liveIds = new Set(live.map((e) => e.id));
  const now = Date.now();
  let n = 0;
  for (const m of msgs) {
    if (!liveIds.has(m.enrollmentId)) continue;
    const r = await prisma.outreachMessage.updateMany({
      where: { id: m.id, status: "draft" },
      data: { status: "approved", approvedAt: new Date(), approvedBy: by, scheduledFor: new Date(now + m.dayOffset * 86_400_000 + jitterMs(m.dayOffset === 0 ? 20 : 120)) },
    });
    n += r.count;
  }
  if (liveIds.size) {
    await prisma.outreachEnrollment.updateMany({
      where: { id: { in: [...liveIds] }, status: "pending_approval" },
      data: { status: "active", approvedAt: new Date() },
    });
  }
  return n;
}

/** Edit a draft or an approved-but-unsent email; an edit always needs re-approval. */
export async function editMessage(id: string, subject: string, body: string) {
  const r = await prisma.outreachMessage.updateMany({
    where: { id, status: { in: ["draft", "approved"] } },
    data: { subject: subject.slice(0, 200), bodyText: body.slice(0, 5000), status: "draft", approvedAt: null, approvedBy: null, scheduledFor: null },
  });
  return r.count === 1;
}

// ── AI sequence drafting (Sonnet: strategy) ─────────────────────────────────

export async function draftSequenceWithAI(input: { audience: string; offerKey?: string | null; goal?: string | null; steps?: number }): Promise<SequenceStep[]> {
  const offer = OFFERS.find((o) => o.key === input.offerKey);
  const n = Math.max(2, Math.min(4, input.steps ?? 3));
  const { text } = await runClaude("outreach-strategy", {
    system: `You write short, compliant B2B cold email sequences for TIBLOGICS (an AI implementation studio for small businesses).
Return ONLY JSON: {"steps": [{"dayOffset": 0, "subject": "...", "body": "...", "personalise": true}]}
Rules: ${n} steps; dayOffsets ascending starting at 0 (e.g. 0, 3, 7). Plain text, each body under 120 words.
Use these merge fields where useful: {{firstName}} {{company}} {{industry}} {{area}} {{opener}} {{offer}} {{offerUrl}} {{bookingUrl}} {{senderName}}.
Step 1 must use {{opener}} and set personalise true. Every step ends with {{senderName}} and offers {{bookingUrl}}.
Honest subjects (no "Re:"/"Fwd:", no false urgency). No invented facts, prices, results or testimonials. No unsubscribe text (a footer is added).`,
    messages: [{ role: "user", content: `Audience: ${input.audience.slice(0, 500)}\nOffer: ${offer ? `${offer.name}: ${offer.fitsWhen}` : "best-fit offer per lead ({{offer}})"}\nGoal: ${(input.goal ?? "book a 15-minute call").slice(0, 300)}` }],
  });
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("The model did not return a sequence");
  const steps = parseSteps((JSON.parse(m[0]) as { steps?: unknown }).steps);
  if (steps.length === 0) throw new Error("The model returned no usable steps");
  return steps.map((s) => ({ ...s, subject: s.subject.replace(/^\s*(re|fwd?)\s*:\s*/i, "") }));
}

export function sequenceDTO(s: OutreachSequence) {
  return { ...s, steps: parseSteps(s.steps), createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() };
}
