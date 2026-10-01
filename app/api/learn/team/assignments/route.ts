import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireTeamManager, teamRateLimit } from "@/lib/learn/team/guard";
import { assignTrack, unassignTrack } from "@/lib/learn/team/service";

const Id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
const Body = z.object({
  studentIds: z.array(Id).min(1).max(500),
  trackId: Id,
  dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

/** Assign a live track to members of the manager's own team, with an optional due date. */
export async function POST(req: NextRequest) {
  const limited = await teamRateLimit(req, "assign", 30);
  if (limited) return limited;
  const t = await getT();
  const g = await requireTeamManager();
  if (g.error) return g.error;
  if (!g.m.entitled) return NextResponse.json({ error: t("team.api.inactive") }, { status: 402 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("team.api.invalid") }, { status: 400 });
  const track = await prisma.learnTrack.findUnique({ where: { id: parsed.data.trackId }, select: { status: true } });
  if (!track || track.status !== "live") return NextResponse.json({ error: t("team.api.unknownTrack") }, { status: 400 });
  let dueAt: Date | null = null;
  if (parsed.data.dueAt) {
    // End of the chosen day, UTC.
    dueAt = new Date(`${parsed.data.dueAt}T23:59:59.000Z`);
    if (Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: t("team.api.invalid") }, { status: 400 });
  }
  const n = await assignTrack(g.m.team.id, g.student.id, parsed.data.studentIds, parsed.data.trackId, dueAt);
  if (n === 0) return NextResponse.json({ error: t("team.api.notFound") }, { status: 404 });
  return NextResponse.json({ ok: true, assigned: n });
}

export async function DELETE(req: NextRequest) {
  const limited = await teamRateLimit(req, "assign", 30);
  if (limited) return limited;
  const g = await requireTeamManager();
  if (g.error) return g.error;
  const id = Id.safeParse(req.nextUrl.searchParams.get("id"));
  if (!id.success || !(await unassignTrack(g.m.team.id, id.data))) {
    return NextResponse.json({ error: (await getT())("team.api.notFound") }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
