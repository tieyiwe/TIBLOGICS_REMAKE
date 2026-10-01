import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireGrowth } from "@/lib/growth/outreach/auth";
import { sequenceDTO } from "@/lib/growth/outreach/sequences";
import { parseSteps } from "@/lib/growth/outreach/templates";

/** Edit a sequence. Template edits affect future enrolments only; drafted emails keep their text. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const { id } = await ctx.params;
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const data: Prisma.OutreachSequenceUpdateInput = {};
  if (typeof b.name === "string" && b.name.trim()) data.name = b.name.trim().slice(0, 120);
  if (typeof b.description === "string") data.description = b.description.slice(0, 500);
  if (typeof b.status === "string" && ["active", "paused", "archived"].includes(b.status)) data.status = b.status;
  if ("steps" in b) {
    const steps = parseSteps(b.steps);
    if (steps.length === 0) return NextResponse.json({ error: "At least one step" }, { status: 400 });
    data.steps = steps as unknown as Prisma.InputJsonValue;
  }
  try {
    const s = await prisma.outreachSequence.update({ where: { id }, data });
    if (data.status === "archived") {
      // Archiving stops everything not yet sent.
      const live = await prisma.outreachEnrollment.findMany({ where: { sequenceId: id, status: { in: ["pending_approval", "active"] } }, select: { id: true } });
      await prisma.outreachEnrollment.updateMany({ where: { id: { in: live.map((e) => e.id) } }, data: { status: "stopped", stopReason: "sequence archived" } });
      await prisma.outreachMessage.updateMany({ where: { sequenceId: id, status: { in: ["draft", "approved"] } }, data: { status: "cancelled", error: "Sequence archived" } });
    }
    return NextResponse.json({ sequence: sequenceDTO(s) });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
