import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireGrowth } from "@/lib/growth/outreach/auth";
import { importLeads, serializeLead } from "@/lib/growth/outreach/leads";

export const dynamic = "force-dynamic";

/** All leads (the workspace filters client-side; capped for safety). */
export async function GET() {
  const deny = await requireGrowth();
  if (deny) return deny;
  const leads = await prisma.growthLead.findMany({ orderBy: [{ updatedAt: "desc" }], take: 5000 });
  return NextResponse.json({ leads: leads.map(serializeLead) });
}

/** Add one lead by hand (same dedupe as the CSV import). */
export async function POST(req: NextRequest) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const r = await importLeads([body], { source: "manual", consentBasis: typeof body.consentBasis === "string" ? body.consentBasis : undefined });
  if (r.invalid.length) return NextResponse.json({ error: r.invalid[0].reason }, { status: 400 });
  if (r.duplicates.length) return NextResponse.json({ error: `Duplicate of an existing lead (same ${r.duplicates[0].by})`, matchId: r.duplicates[0].matchId }, { status: 409 });
  const lead = await prisma.growthLead.findUnique({ where: { id: r.createdIds[0] } });
  return NextResponse.json({ lead: lead && serializeLead(lead) });
}
