import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { requireTeamManager, teamRateLimit } from "@/lib/learn/team/guard";
import { setDigest } from "@/lib/learn/team/prefs";

const Body = z.object({ digest: z.boolean() });

/** The signed-in manager's own preferences for this team (the weekly digest email). */
export async function POST(req: NextRequest) {
  const limited = await teamRateLimit(req, "settings", 20);
  if (limited) return limited;
  const g = await requireTeamManager();
  if (g.error) return g.error;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: (await getT())("team.api.invalid") }, { status: 400 });
  await setDigest(g.m.team.id, g.student.id, parsed.data.digest);
  return NextResponse.json({ ok: true, digest: parsed.data.digest });
}
