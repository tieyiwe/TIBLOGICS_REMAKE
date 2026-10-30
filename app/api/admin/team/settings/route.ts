import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { teamApi, teamError, readJson } from "@/lib/admin/team/guard";
import { RETENTION_KEY, RETENTION_MAX, RETENTION_MIN, retentionMonths } from "@/lib/admin/team/footprint";
import { audit } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

const Body = z.object({ retentionMonths: z.number().int().min(RETENTION_MIN).max(RETENTION_MAX) });

// Log retention: readable by Team & Roles viewers, changed by the owner only.
export async function GET(req: NextRequest) {
  const { error } = await teamApi(req, "view");
  if (error) return error;
  return NextResponse.json({ retentionMonths: await retentionMonths() });
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await teamApi(req, "view");
  if (error) return error;
  if (!session.user.isOwner) return NextResponse.json({ error: "Only the owner can change log retention." }, { status: 403 });
  try {
    const { retentionMonths: months } = Body.parse(await readJson(req));
    const before = await retentionMonths();
    await prisma.adminSettings.upsert({ where: { key: RETENTION_KEY }, update: { value: String(months) }, create: { key: RETENTION_KEY, value: String(months) } });
    await audit(session, "team.retention", { type: "team", label: "log retention" }, { before, after: months });
    return NextResponse.json({ retentionMonths: months });
  } catch (err) {
    return teamError(err, "settings");
  }
}
