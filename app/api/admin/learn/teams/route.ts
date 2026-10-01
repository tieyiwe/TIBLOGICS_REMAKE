import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, requireAdmin } from "@/lib/require-admin";
import { createCompedTeam, listTeamsForAdmin } from "@/lib/learn/team/admin";
import { getTeamPricing, setTeamPricing } from "@/lib/learn/team/settings";
import { TEAM_MAX_SEATS } from "@/lib/learn/team/config";

export async function GET() {
  const authErr = await requireAdmin();
  if (authErr) return authErr;
  const [teams, pricing] = await Promise.all([listTeamsForAdmin(), getTeamPricing()]);
  return NextResponse.json({ teams, pricing });
}

const Create = z.object({
  name: z.string().trim().min(2).max(80),
  ownerEmail: z.string().trim().toLowerCase().email(),
  seats: z.number().int().min(1).max(TEAM_MAX_SEATS),
});

/** Comp a new team (free seats for a partner or pilot). */
export async function POST(req: NextRequest) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;
  if (!(await checkRateLimit("admin-teams:write", 60, 60_000))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const parsed = Create.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Name, owner email and seats are required." }, { status: 400 });
  const r = await createCompedTeam(parsed.data);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true, id: r.id });
}

const Defaults = z.object({
  seatPriceCents: z.number().int().min(100).max(1_000_000),
  minSeats: z.number().int().min(1).max(TEAM_MAX_SEATS),
});

/** Defaults for new teams: price per seat per month and the minimum seats. */
export async function PUT(req: NextRequest) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;
  const parsed = Defaults.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Seat price (cents, at least 100) and minimum seats are required." }, { status: 400 });
  await setTeamPricing(parsed.data);
  return NextResponse.json({ ok: true, pricing: await getTeamPricing() });
}
