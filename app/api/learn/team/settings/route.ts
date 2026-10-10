import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { requireTeamManager, teamRateLimit } from "@/lib/learn/team/guard";
import { setDigest, setMonthly } from "@/lib/learn/team/prefs";

const Body = z
  .object({ digest: z.boolean().optional(), monthly: z.boolean().optional() })
  .refine((b) => b.digest !== undefined || b.monthly !== undefined);

/**
 * The signed-in manager's own email preferences for this team: the weekly
 * digest (owner and managers) and the monthly report (owner only).
 */
export async function POST(req: NextRequest) {
  const limited = await teamRateLimit(req, "settings", 20);
  if (limited) return limited;
  const g = await requireTeamManager();
  if (g.error) return g.error;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: (await getT())("team.api.invalid") }, { status: 400 });
  const { digest, monthly } = parsed.data;
  if (monthly !== undefined && g.m.role !== "owner") return NextResponse.json({ error: (await getT())("team.api.ownerOnly") }, { status: 403 });
  if (digest !== undefined) await setDigest(g.m.team.id, g.student.id, digest);
  if (monthly !== undefined) await setMonthly(g.m.team.id, g.student.id, monthly);
  return NextResponse.json({ ok: true, digest, monthly });
}
