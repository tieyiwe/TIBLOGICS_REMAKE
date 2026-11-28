import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireGrowth } from "@/lib/growth/outreach/auth";
import { enqueueEnrich } from "@/lib/growth/outreach/enrich";
import { addEvent, setStage, stopLeadSequences } from "@/lib/growth/outreach/leads";
import { CONSENT_BASES, STAGE_KEYS, type Stage } from "@/lib/growth/outreach/shared";
import { suppress } from "@/lib/growth/outreach/suppression";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const body = (await req.json().catch(() => null)) as { ids?: unknown; action?: unknown; value?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body!.ids.filter((x): x is string => typeof x === "string").slice(0, 2000) : [];
  const action = typeof body?.action === "string" ? body.action : "";
  const value = typeof body?.value === "string" ? body.value : "";
  if (ids.length === 0) return NextResponse.json({ error: "Select at least one lead" }, { status: 400 });

  switch (action) {
    case "enrich":
      return NextResponse.json({ ok: true, count: await enqueueEnrich(ids) });
    case "stage": {
      if (!STAGE_KEYS.includes(value)) return NextResponse.json({ error: "Unknown stage" }, { status: 400 });
      const leads = await prisma.growthLead.findMany({ where: { id: { in: ids } } });
      for (const l of leads) await setStage(l, value as Stage);
      return NextResponse.json({ ok: true, count: leads.length });
    }
    case "consent": {
      if (!CONSENT_BASES.some((c) => c.key === value)) return NextResponse.json({ error: "Unknown consent basis" }, { status: 400 });
      const r = await prisma.growthLead.updateMany({ where: { id: { in: ids } }, data: { consentBasis: value } });
      for (const id of ids) await addEvent(id, "consent", `Consent basis → ${value}`);
      if (value === "none") for (const id of ids) await stopLeadSequences(id, "no consent basis");
      return NextResponse.json({ ok: true, count: r.count });
    }
    case "dnc": {
      const leads = await prisma.growthLead.findMany({ where: { id: { in: ids } }, select: { id: true, email: true } });
      await prisma.growthLead.updateMany({ where: { id: { in: ids } }, data: { doNotContact: true } });
      for (const l of leads) {
        await stopLeadSequences(l.id, "do not contact");
        if (l.email) await suppress(l.email, "do_not_contact", "admin");
        await addEvent(l.id, "dnc", "Marked do not contact (address added to suppression list)");
      }
      return NextResponse.json({ ok: true, count: leads.length });
    }
    case "delete": {
      await prisma.$transaction([
        prisma.outreachMessage.deleteMany({ where: { leadId: { in: ids } } }),
        prisma.outreachEnrollment.deleteMany({ where: { leadId: { in: ids } } }),
        prisma.growthLeadEvent.deleteMany({ where: { leadId: { in: ids } } }),
        prisma.growthLead.deleteMany({ where: { id: { in: ids } } }),
      ]);
      return NextResponse.json({ ok: true, count: ids.length });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
