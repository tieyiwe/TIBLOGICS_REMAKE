import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireGrowth } from "@/lib/growth/outreach/auth";
import { leadDetail } from "@/lib/growth/outreach/detail";
import { addEvent, leadDataFromInput, setStage, stopLeadSequences } from "@/lib/growth/outreach/leads";
import { clean } from "@/lib/growth/outreach/normalize";
import { CONSENT_BASES, STAGE_KEYS, type Stage } from "@/lib/growth/outreach/shared";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const { id } = await ctx.params;
  const d = await leadDetail(id);
  return d ? NextResponse.json(d) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

const EDITABLE = ["companyName", "contactName", "role", "email", "phone", "website", "industry", "area", "linkedinUrl"] as const;

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const { id } = await ctx.params;
  const lead = await prisma.growthLead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const data: Prisma.GrowthLeadUpdateInput = {};
  if (EDITABLE.some((k) => k in body)) {
    const merged = leadDataFromInput({ ...lead, ...Object.fromEntries(EDITABLE.filter((k) => k in body).map((k) => [k, body[k]])) });
    if (!merged.companyName) return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    for (const k of EDITABLE) if (k in body) (data as Record<string, unknown>)[k] = merged[k];
    if ("email" in body) {
      data.emailStatus = merged.email ? "provided" : "unknown";
      if (merged.email !== lead.email) await stopLeadSequences(id, "email address changed");
    }
    if ("phone" in body) data.phoneNorm = merged.phoneNorm;
    if ("website" in body || "email" in body) data.domain = merged.domain;
  }
  if (typeof body.consentBasis === "string") {
    if (!CONSENT_BASES.some((c) => c.key === body.consentBasis)) return NextResponse.json({ error: "Unknown consent basis" }, { status: 400 });
    data.consentBasis = body.consentBasis;
    await addEvent(id, "consent", `Consent basis → ${body.consentBasis}`);
  }
  if ("consentNote" in body) data.consentNote = clean(body.consentNote, 500);
  if ("notes" in body) data.notes = clean(body.notes, 4000);
  if (Object.keys(data).length) await prisma.growthLead.update({ where: { id }, data });

  if (typeof body.stage === "string" && body.stage !== lead.stage) {
    if (!STAGE_KEYS.includes(body.stage)) return NextResponse.json({ error: "Unknown stage" }, { status: 400 });
    const fresh = await prisma.growthLead.findUniqueOrThrow({ where: { id } });
    await setStage(fresh, body.stage as Stage);
  }
  return NextResponse.json(await leadDetail(id));
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const { id } = await ctx.params;
  await prisma.$transaction([
    prisma.outreachMessage.deleteMany({ where: { leadId: id } }),
    prisma.outreachEnrollment.deleteMany({ where: { leadId: id } }),
    prisma.growthLeadEvent.deleteMany({ where: { leadId: id } }),
    prisma.growthLead.deleteMany({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
