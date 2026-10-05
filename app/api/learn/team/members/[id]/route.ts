import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getLocale, getT } from "@/lib/i18n/server";
import { requireTeamManager, teamRateLimit } from "@/lib/learn/team/guard";
import { removeMember, resendInvite, setMemberRole } from "@/lib/learn/team/service";
import { memberDetail } from "@/lib/learn/team/report";
import { deliverInvite } from "@/lib/learn/team/emails";

type Ctx = { params: Promise<{ id: string }> };
const Id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

/** One member's progress (privacy-limited: see lib/learn/team/report.ts). Own team only. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const limited = await teamRateLimit(req, "read", 120);
  if (limited) return limited;
  const g = await requireTeamManager();
  if (g.error) return g.error;
  const id = Id.safeParse((await params).id);
  const detail = id.success ? await memberDetail(g.m.team.id, id.data) : null;
  if (!detail) return NextResponse.json({ error: (await getT())("team.api.notFound") }, { status: 404 });
  return NextResponse.json(detail);
}

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("resend") }),
  z.object({ action: z.literal("remove") }),
  z.object({ action: z.literal("role"), role: z.enum(["manager", "member"]) }),
]);

/** resend | remove (also revokes an invitation) | role (owner only). */
export async function POST(req: NextRequest, { params }: Ctx) {
  const limited = await teamRateLimit(req, "member", 30);
  if (limited) return limited;
  const t = await getT();
  const g = await requireTeamManager();
  if (g.error) return g.error;
  const id = Id.safeParse((await params).id);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!id.success || !parsed.success) return NextResponse.json({ error: t("team.api.invalid") }, { status: 400 });
  const teamId = g.m.team.id;

  if (parsed.data.action === "resend") {
    const r = await resendInvite(teamId, id.data);
    if (r === "notFound") return NextResponse.json({ error: t("team.api.notFound") }, { status: 404 });
    if (r === "full") return NextResponse.json({ error: t("team.api.full") }, { status: 409 });
    await deliverInvite({
      teamId,
      teamName: g.m.team.name,
      memberId: r.memberId,
      email: r.email,
      token: r.token,
      inviterName: g.student.name,
      inviterEmail: g.student.email,
      fallbackLocale: await getLocale(),
    }).catch((err) => console.error("[team/members] resend email", err instanceof Error ? err.message : err));
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "remove") {
    // Managers manage members; only the owner removes another manager.
    const target = await prisma.teamMember.findFirst({ where: { id: id.data, teamId }, select: { role: true, studentId: true } });
    if (!target) return NextResponse.json({ error: t("team.api.notFound") }, { status: 404 });
    if (target.role === "manager" && g.m.role !== "owner") return NextResponse.json({ error: t("team.api.ownerOnly") }, { status: 403 });
    if (target.studentId === g.student.id) return NextResponse.json({ error: t("team.api.useLeave") }, { status: 400 });
    const r = await removeMember(teamId, id.data);
    if (r === "owner") return NextResponse.json({ error: t("team.api.ownerStays") }, { status: 400 });
    if (r === "notFound") return NextResponse.json({ error: t("team.api.notFound") }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (g.m.role !== "owner") return NextResponse.json({ error: t("team.api.ownerOnly") }, { status: 403 });
  const r = await setMemberRole(teamId, id.data, parsed.data.role);
  if (r === "owner") return NextResponse.json({ error: t("team.api.ownerStays") }, { status: 400 });
  if (r === "notFound") return NextResponse.json({ error: t("team.api.notFound") }, { status: 404 });
  return NextResponse.json({ ok: true });
}
