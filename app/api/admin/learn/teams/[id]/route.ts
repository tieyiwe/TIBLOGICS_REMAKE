import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, requirePermission } from "@/lib/require-admin";
import { adminTeamDetail, updateTeamAdmin } from "@/lib/learn/team/admin";
import { TEAM_MAX_SEATS } from "@/lib/learn/team/config";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const authErr = await requirePermission("*");
  if (authErr) return authErr;
  const d = await adminTeamDetail((await params).id);
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(d);
}

const Patch = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  comped: z.boolean().optional(),
  seats: z.number().int().min(1).max(TEAM_MAX_SEATS).optional(),
  /** null = back to the default price */
  seatPriceCents: z.number().int().min(0).max(1_000_000).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const authErr = await requirePermission("*");
  if (authErr) return authErr;
  if (!(await checkRateLimit("admin-teams:write", 60, 60_000))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const parsed = Patch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const r = await updateTeamAdmin((await params).id, parsed.data);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json(r);
}
