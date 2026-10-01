import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { createCohort } from "@/lib/learn/community/cohorts";
import { parseCohortInput } from "@/lib/learn/community/admin-input";

/** Create a cohort. */
export async function POST(req: NextRequest) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;
  const parsed = parseCohortInput(await req.json().catch(() => ({})));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const track = await prisma.learnTrack.findUnique({ where: { id: parsed.value.trackId }, select: { id: true } });
  if (!track) return NextResponse.json({ error: "Unknown track" }, { status: 400 });
  try {
    const id = await createCohort(parsed.value);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[admin/cohorts] create", err);
    return NextResponse.json({ error: "Could not create the cohort" }, { status: 500 });
  }
}
