import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { teamRateLimit } from "@/lib/learn/team/guard";
import { joinViaTeamLink } from "@/lib/learn/team/link";
import { deliverInvite } from "@/lib/learn/team/emails";

const Body = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{20,64}$/) });
const STATUS: Record<string, number> = { invalid: 404, inactive: 402, wrongDomain: 403, otherTeam: 409, full: 409, already: 409 };

/**
 * Use the team's domain-restricted join link with the signed-in account.
 * joined: a verified address on the domain took a seat.
 * emailSent: we emailed a single-use invitation to the account's address.
 */
export async function POST(req: NextRequest) {
  const limited = await teamRateLimit(req, "link-join", 5);
  if (limited) return limited;
  const t = await getT();
  const { error, student } = await requireStudent();
  if (error) return error;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("team.join.invalid") }, { status: 400 });
  const r = await joinViaTeamLink(parsed.data.token, student);
  if (r.kind === "joined") return NextResponse.json({ ok: true, joined: true });
  if (r.kind === "emailSent") {
    const [team, inviter] = await Promise.all([
      prisma.team.findUnique({ where: { id: r.teamId }, select: { name: true } }),
      prisma.student.findUnique({ where: { id: r.inviterId }, select: { name: true } }),
    ]);
    try {
      await deliverInvite({
        teamId: r.teamId,
        teamName: team?.name ?? "",
        memberId: r.memberId,
        email: r.email,
        token: r.token,
        inviterName: inviter?.name ?? team?.name ?? "",
        fallbackLocale: await getLocale(),
      });
    } catch (err) {
      console.error("[team/link/join] email", err instanceof Error ? err.message : err);
      return NextResponse.json({ error: t("team.error.generic") }, { status: 500 });
    }
    return NextResponse.json({ ok: true, emailSent: true, email: r.email });
  }
  return NextResponse.json({ error: t(`team.link.err.${r.kind}`), reason: r.kind }, { status: STATUS[r.kind] ?? 400 });
}
