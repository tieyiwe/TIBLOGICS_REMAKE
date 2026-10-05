import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getLocale, getT } from "@/lib/i18n/server";
import { isLocale } from "@/lib/i18n/config";
import { requireTeamManager, teamRateLimit } from "@/lib/learn/team/guard";
import { inviteMembers, seatsUsed } from "@/lib/learn/team/service";
import { deliverInvite } from "@/lib/learn/team/emails";
import { parseEmailList, parseInviteRows } from "@/lib/learn/team/config";

// Invite by email: one address, a list, or a pasted CSV (names optional, any
// column order). Optional: role (owner only may invite managers), tracks to
// assign with a due date (applied when the invitation is accepted) and the
// email language for people without an account yet.
//   preview: true  -> what would happen to each address; nothing is saved.
// Seats are enforced in order under the team row lock; tokens are emailed,
// never returned.
const Id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
const Body = z.object({
  emails: z.array(z.string().trim().toLowerCase().email().max(254)).max(200).optional(),
  text: z.string().max(20_000).optional(),
  invites: z.array(z.object({ email: z.string().trim().toLowerCase().email().max(254), name: z.string().trim().max(80).nullable().optional() })).max(200).optional(),
  role: z.enum(["member", "manager"]).optional(),
  trackIds: z.array(Id).max(20).optional(),
  dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  locale: z.string().max(5).optional(),
  preview: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const parsed0 = await req.json().catch(() => ({}));
  const isPreview = parsed0?.preview === true;
  const limited = await teamRateLimit(req, isPreview ? "invite-preview" : "invite", isPreview ? 60 : 20);
  if (limited) return limited;
  const t = await getT();
  const g = await requireTeamManager();
  if (g.error) return g.error;
  if (!g.m.entitled) return NextResponse.json({ error: t("team.api.inactive") }, { status: 402 });

  const parsed = Body.safeParse(parsed0);
  if (!parsed.success) return NextResponse.json({ error: t("team.api.invalidEmails") }, { status: 400 });
  const d = parsed.data;

  // Names from structured invites or a pasted list ("Name, email" lines).
  const rows = new Map<string, string | null>();
  for (const i of d.invites ?? []) if (!rows.has(i.email)) rows.set(i.email, i.name || null);
  for (const e of d.emails ?? []) if (!rows.has(e)) rows.set(e, null);
  if (d.text) {
    const pasted = parseInviteRows(d.text);
    for (const r of pasted) if (!r.problem && !rows.has(r.email)) rows.set(r.email, r.name);
    // Anything else that looks like an address (old clients).
    for (const e of parseEmailList(d.text)) if (!rows.has(e)) rows.set(e, null);
  }
  const list = [...rows.entries()].slice(0, 200).map(([email, name]) => ({ email, name }));
  if (list.length === 0) return NextResponse.json({ error: t("team.api.invalidEmails") }, { status: 400 });

  const teamId = g.m.team.id;
  if (d.role === "manager" && g.m.role !== "owner") return NextResponse.json({ error: t("team.api.ownerOnly") }, { status: 403 });
  let trackIds: string[] = [];
  if (d.trackIds?.length) {
    const live = await prisma.learnTrack.findMany({ where: { id: { in: d.trackIds }, status: "live" }, select: { id: true } });
    if (live.length !== new Set(d.trackIds).size) return NextResponse.json({ error: t("team.api.unknownTrack") }, { status: 400 });
    trackIds = live.map((x) => x.id);
  }
  let dueAt: Date | null = null;
  if (d.dueAt) {
    dueAt = new Date(`${d.dueAt}T23:59:59.000Z`);
    if (Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: t("team.api.invalid") }, { status: 400 });
  }

  if (d.preview) {
    // No account lookups here: a manager must not learn who has an account.
    const [existing, used] = await Promise.all([
      prisma.teamMember.findMany({ where: { teamId, email: { in: list.map((x) => x.email) } }, select: { email: true, status: true, inviteExpiresAt: true } }),
      seatsUsed(teamId),
    ]);
    let free = Math.max(0, g.m.team.seats - used);
    const now = new Date();
    const results = list.map(({ email, name }) => {
      const row = existing.find((r) => r.email === email);
      if (row?.status === "active") return { email, name, status: "member" };
      if (row?.status === "invited" && row.inviteExpiresAt && row.inviteExpiresAt > now) return { email, name, status: "invited" };
      if (free <= 0) return { email, name, status: "full" };
      free--;
      return { email, name, status: "new" };
    });
    return NextResponse.json({ preview: true, results, seats: g.m.team.seats, used });
  }

  const locale = d.locale && isLocale(d.locale) ? d.locale : await getLocale();
  const outcomes = await inviteMembers(g.m.team, g.student.id, list, { role: d.role ?? "member", trackIds, dueAt, locale });
  let emailFailures = 0;
  for (const o of outcomes) {
    if (!o.ok) continue;
    await deliverInvite({
      teamId,
      teamName: g.m.team.name,
      memberId: o.memberId,
      email: o.email,
      token: o.token,
      inviterName: g.student.name,
      inviterEmail: g.student.email,
      fallbackLocale: locale,
    }).catch((err) => {
      emailFailures++;
      console.error("[team/invites] email", err instanceof Error ? err.message : err);
    });
  }
  return NextResponse.json({
    results: outcomes.map((o) => (o.ok ? { email: o.email, ok: true } : { email: o.email, ok: false, reason: o.reason })),
    seats: g.m.team.seats,
    used: await seatsUsed(teamId),
    emailFailures,
  });
}
