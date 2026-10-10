import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { ensureBlueprintTables } from "@/lib/blueprint/db";
import { generateBlueprint } from "@/lib/blueprint/generate";

export const maxDuration = 300;

// Staff actions on a blueprint: record that its credit was applied to an
// engagement (or undo that), or write a failed one again with a fresh
// allowance of attempts.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const { action } = await req.json().catch(() => ({}));
  await ensureBlueprintTables();
  const bp = await prisma.blueprint.findUnique({ where: { id } });
  if (!bp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "credit-used" || action === "credit-unused") {
    if (bp.status === "draft") return NextResponse.json({ error: "This blueprint was never paid for." }, { status: 409 });
    await prisma.blueprint.update({ where: { id }, data: { creditUsedAt: action === "credit-used" ? new Date() : null } });
    return NextResponse.json({ ok: true });
  }
  if (action === "regenerate") {
    if (!["failed", "ready"].includes(bp.status)) return NextResponse.json({ error: "Only a finished or failed blueprint can be rewritten." }, { status: 409 });
    await prisma.blueprint.update({ where: { id }, data: { status: "failed", attempts: 0 } });
    return NextResponse.json({ outcome: await generateBlueprint(id) });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
