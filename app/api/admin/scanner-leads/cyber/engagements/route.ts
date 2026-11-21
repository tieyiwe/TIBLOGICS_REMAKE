import { NextResponse } from "next/server";
import { z } from "zod";
import { auditFromRequest } from "@/lib/admin/audit";
import { cyberGuard } from "@/lib/cyber/access";
import { createEngagement, listEngagements, normDomain } from "@/lib/cyber/engagement";

// Engagements: the client's written authorisation for active testing.

const Body = z.object({
  client: z.string().trim().min(2).max(160),
  contactName: z.string().trim().max(120).optional(),
  contactEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
  authorizedBy: z.string().trim().min(3).max(200),
  scope: z.string().max(2000),
  startsAt: z.string(),
  endsAt: z.string(),
  note: z.string().trim().max(2000).optional(),
  confirm: z.literal(true),
});

export async function GET(req: Request) {
  const g = await cyberGuard(req);
  if (g.denied) return g.denied;
  return NextResponse.json({ engagements: await listEngagements() });
}

export async function POST(req: Request) {
  const g = await cyberGuard(req);
  if (g.denied) return g.denied;
  const b = Body.safeParse(await req.json().catch(() => null));
  if (!b.success) return NextResponse.json({ error: "Fill in the client, who authorised it, the scope, the dates and the confirmation." }, { status: 400 });
  const scope = [...new Set(b.data.scope.split(/[\s,]+/).map(normDomain).filter((d): d is string => !!d))].slice(0, 20);
  if (!scope.length) return NextResponse.json({ error: "Add at least one domain to the scope (e.g. client.com)." }, { status: 400 });
  const startsAt = new Date(b.data.startsAt), endsAt = new Date(b.data.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) return NextResponse.json({ error: "The end date must be after the start date." }, { status: 400 });
  if (endsAt.getTime() - startsAt.getTime() > 366 * 86_400_000) return NextResponse.json({ error: "An engagement can last at most a year." }, { status: 400 });
  const id = await createEngagement({ createdBy: g.email, client: b.data.client, contactName: b.data.contactName || null, contactEmail: b.data.contactEmail || null, authorizedBy: b.data.authorizedBy, scope, startsAt, endsAt, note: b.data.note || null });
  await auditFromRequest("cyber.engagement.create", { type: "cyber_engagement", id, label: b.data.client }, { scope, startsAt, endsAt, authorizedBy: b.data.authorizedBy });
  return NextResponse.json({ id, scope });
}
