import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getLocale, getT } from "@/lib/i18n/server";
import { requireTeamManager, teamRateLimit } from "@/lib/learn/team/guard";
import { inviteMembers, seatsUsed } from "@/lib/learn/team/service";
import { sendTeamInvite } from "@/lib/learn/team/emails";
import { parseEmailList } from "@/lib/learn/team/config";

// Invite by email: one address, a list, or a pasted CSV (any column holding
// addresses). Seats are enforced in order; the response says what happened
// to each address. Tokens are emailed, never returned.
const Body = z.object({
  emails: z.array(z.string().trim().toLowerCase().email().max(254)).max(200).optional(),
  text: z.string().max(20_000).optional(),
});

export async function POST(req: NextRequest) {
  const limited = await teamRateLimit(req, "invite", 20);
  if (limited) return limited;
  const t = await getT();
  const g = await requireTeamManager();
  if (g.error) return g.error;
  if (!g.m.entitled) return NextResponse.json({ error: t("team.api.inactive") }, { status: 402 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("team.api.invalidEmails") }, { status: 400 });
  const emails = [...new Set([...(parsed.data.emails ?? []), ...parseEmailList(parsed.data.text ?? "")])].slice(0, 200);
  if (emails.length === 0) return NextResponse.json({ error: t("team.api.invalidEmails") }, { status: 400 });

  const outcomes = await inviteMembers(g.m.team, g.student.id, emails);
  const locale = await getLocale();
  const known = await prisma.student.findMany({
    where: { email: { in: outcomes.filter((o) => o.ok).map((o) => o.email) } },
    select: { email: true, locale: true },
  });
  const expiresAt = new Date(Date.now() + 14 * 86_400_000);
  let emailFailures = 0;
  for (const o of outcomes) {
    if (!o.ok) continue;
    await sendTeamInvite({
      email: o.email,
      teamName: g.m.team.name,
      inviterName: g.student.name,
      token: o.token,
      expiresAt,
      locale: known.find((k) => k.email.toLowerCase() === o.email)?.locale ?? locale,
    }).catch((err) => {
      emailFailures++;
      console.error("[team/invites] email", err instanceof Error ? err.message : err);
    });
  }
  return NextResponse.json({
    results: outcomes.map((o) => (o.ok ? { email: o.email, ok: true } : { email: o.email, ok: false, reason: o.reason })),
    seats: g.m.team.seats,
    used: await seatsUsed(g.m.team.id),
    emailFailures,
  });
}
