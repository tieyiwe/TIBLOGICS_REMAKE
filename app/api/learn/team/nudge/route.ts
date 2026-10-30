import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { requireTeamManager, teamRateLimit } from "@/lib/learn/team/guard";
import { nudgeMembers } from "@/lib/learn/team/nudge";

const Id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
const Body = z.object({ studentIds: z.array(Id).min(1).max(200), trackIds: z.array(Id).max(20).optional() });

/**
 * Reminder email to selected members of the manager's own team about their
 * unfinished assignments. At most one per member per day (claimed before
 * sending), plus this route's own rate limit.
 */
export async function POST(req: NextRequest) {
  const limited = await teamRateLimit(req, "nudge", 10);
  if (limited) return limited;
  const t = await getT();
  const g = await requireTeamManager();
  if (g.error) return g.error;
  if (!g.m.entitled) return NextResponse.json({ error: t("team.api.inactive") }, { status: 402 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("team.api.invalid") }, { status: 400 });
  const r = await nudgeMembers({ id: g.m.team.id, name: g.m.team.name }, { id: g.student.id, name: g.student.name }, parsed.data.studentIds, parsed.data.trackIds);
  return NextResponse.json({ ok: true, sent: r.sent.length, recent: r.recent.length, nothing: r.nothing.length, failed: r.failed.length });
}
