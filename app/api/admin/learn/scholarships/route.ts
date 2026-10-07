import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/admin/audit";
import { scholarshipWriter } from "@/lib/learn/scholarship/guard";
import { createDrafts, MAX_RECIPIENTS, MAX_TRACKS, OFFER_DAYS, ScholarshipError } from "@/lib/learn/scholarship/service";

// Award the Tilo Vision Scholarship to one or more people. Each becomes a
// draft for review; nothing is sent until it is approved ([id], action approve).
const Id = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);
const Body = z.object({
  recipients: z
    .array(z.object({ name: z.string().max(200), email: z.string().max(320), locale: z.enum(["en", "fr", "sw"]).optional() }))
    .min(1)
    .max(MAX_RECIPIENTS),
  trackCount: z.number().int().min(1).max(MAX_TRACKS),
  coveragePct: z.number().int().min(1).max(100),
  trackIds: z.array(Id).max(50).default([]),
  message: z.string().max(2000).nullish(),
  note: z.string().max(2000).nullish(),
  offerDays: z.number().int().min(OFFER_DAYS.min).max(OFFER_DAYS.max).optional(),
});

export async function POST(req: NextRequest) {
  const { session, error } = await scholarshipWriter(req);
  if (error) return error;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  try {
    const r = await createDrafts(parsed.data, session.user.email ?? "staff");
    for (const c of r.created) {
      await audit(session, "scholarship.create", { type: "scholarship", id: c.id, label: c.email }, {
        trackCount: parsed.data.trackCount,
        coveragePct: parsed.data.coveragePct,
        trackIds: parsed.data.trackIds,
      });
    }
    return NextResponse.json(r);
  } catch (err) {
    if (err instanceof ScholarshipError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/scholarships] create", err);
    return NextResponse.json({ error: "Could not create the scholarship." }, { status: 500 });
  }
}
