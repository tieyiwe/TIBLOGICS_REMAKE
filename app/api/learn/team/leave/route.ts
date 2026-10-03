import { NextRequest, NextResponse } from "next/server";
import { getT } from "@/lib/i18n/server";
import { requireTeamMember, teamRateLimit } from "@/lib/learn/team/guard";
import { leaveTeam } from "@/lib/learn/team/service";

/** Leave the team: the seat is freed; one-time purchases and any own subscription are unaffected. */
export async function POST(req: NextRequest) {
  const limited = await teamRateLimit(req, "leave", 10);
  if (limited) return limited;
  const g = await requireTeamMember();
  if (g.error) return g.error;
  const r = await leaveTeam(g.m);
  if (r === "owner") return NextResponse.json({ error: (await getT())("team.api.ownerCannotLeave") }, { status: 400 });
  return NextResponse.json({ ok: true });
}
