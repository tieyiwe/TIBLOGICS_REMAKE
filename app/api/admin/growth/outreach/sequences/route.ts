import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireGrowth } from "@/lib/growth/outreach/auth";
import { ensureDefaultSequence, sequenceDTO } from "@/lib/growth/outreach/sequences";
import { parseSteps } from "@/lib/growth/outreach/templates";

export const dynamic = "force-dynamic";

export async function GET() {
  const deny = await requireGrowth();
  if (deny) return deny;
  await ensureDefaultSequence();
  const [seqs, stats] = await Promise.all([
    prisma.outreachSequence.findMany({ where: { status: { not: "archived" } }, orderBy: { createdAt: "asc" } }),
    prisma.outreachMessage.groupBy({ by: ["sequenceId", "status"], _count: { _all: true } }),
  ]);
  return NextResponse.json({
    sequences: seqs.map((s) => ({
      ...sequenceDTO(s),
      stats: Object.fromEntries(stats.filter((r) => r.sequenceId === s.id).map((r) => [r.status, r._count._all])),
    })),
  });
}

export async function POST(req: NextRequest) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const b = (await req.json().catch(() => null)) as { name?: unknown; description?: unknown; steps?: unknown; offerKey?: unknown } | null;
  const name = typeof b?.name === "string" ? b.name.trim().slice(0, 120) : "";
  const steps = parseSteps(b?.steps);
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (steps.length === 0) return NextResponse.json({ error: "At least one step with a subject and body" }, { status: 400 });
  const s = await prisma.outreachSequence.create({
    data: {
      name, description: typeof b?.description === "string" ? b.description.slice(0, 500) : null,
      offerKey: typeof b?.offerKey === "string" ? b.offerKey.slice(0, 60) : null,
      steps: steps as unknown as Prisma.InputJsonValue, status: "active",
    },
  });
  return NextResponse.json({ sequence: sequenceDTO(s) });
}
