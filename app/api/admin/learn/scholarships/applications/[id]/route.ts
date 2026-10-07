import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { audit } from "@/lib/admin/audit";
import { scholarshipWriter } from "@/lib/learn/scholarship/guard";
import { ensureScholarshipTables } from "@/lib/learn/scholarship/db";
import { awardApplication, reviewApplication } from "@/lib/learn/scholarship/applications";
import { COMPLETE_DAYS, MAX_TRACKS, OFFER_DAYS, PICK_DAYS, ScholarshipError } from "@/lib/learn/scholarship/service";

// One application: shortlist, decline (optionally emailing a kind no), or
// award (a draft award, then reviewed and approved as usual).
const Id = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("shortlist"), note: z.string().max(2000).nullish() }),
  z.object({ action: z.literal("decline"), notify: z.boolean().default(false), note: z.string().max(2000).nullish() }),
  z.object({
    action: z.literal("award"),
    trackCount: z.number().int().min(1).max(MAX_TRACKS),
    coveragePct: z.number().int().min(1).max(100),
    trackIds: z.array(Id).max(50).default([]),
    offerDays: z.number().int().min(OFFER_DAYS.min).max(OFFER_DAYS.max).optional(),
    sponsorName: z.string().max(200).nullish(),
    sponsorEmail: z.string().max(320).nullish(),
    pickDays: z.number().int().min(PICK_DAYS.min).max(PICK_DAYS.max).nullish(),
    completeDays: z.number().int().min(COMPLETE_DAYS.min).max(COMPLETE_DAYS.max).nullish(),
    partnerName: z.string().max(200).nullish(),
    partnerRole: z.enum(["partnership", "nominated", "through"]).nullish(),
    message: z.string().max(2000).nullish(),
  }),
]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await scholarshipWriter(req);
  if (error) return error;
  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!Id.safeParse(id).success || !parsed.success) return NextResponse.json({ error: parsed.error?.issues[0]?.message ?? "Invalid" }, { status: 400 });
  await ensureScholarshipTables();
  const a = await prisma.scholarshipApplication.findUnique({ where: { id }, select: { email: true } });
  if (!a) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  const target = { type: "scholarship-application", id, label: a.email };
  const b = parsed.data;
  try {
    if (b.action === "award") {
      const { action: _a, ...terms } = b;
      void _a;
      const r = await awardApplication(id, terms, session.user.email ?? "staff");
      await audit(session, "scholarship.application.award", target, { scholarshipId: r.scholarshipId, coveragePct: b.coveragePct, trackCount: b.trackCount });
      return NextResponse.json(r);
    }
    await reviewApplication(id, b.action, session.user.email ?? "staff", { notify: b.action === "decline" ? b.notify : false, note: b.note });
    await audit(session, `scholarship.application.${b.action}`, target, b.action === "decline" ? { notified: b.notify } : null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ScholarshipError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/scholarships/applications]", err);
    return NextResponse.json({ error: "Could not update the application." }, { status: 500 });
  }
}
