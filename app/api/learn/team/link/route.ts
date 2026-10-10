import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireTeamManager, requireTeamOwner, teamRateLimit } from "@/lib/learn/team/guard";
import { createTeamLink, disableTeamLink, getTeamLink } from "@/lib/learn/team/link";
import { cleanDomain } from "@/lib/learn/team/config";
import { inviteUrl } from "@/lib/learn/team/emails";

// The team's shareable join link, restricted to one company email domain
// (rules in lib/learn/team/link.ts). Managers can see it; only the owner
// creates, rotates or turns it off.

const Id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
const Body = z.object({
  domain: z.string().trim().max(253),
  trackIds: z.array(Id).max(20).optional(),
  dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

const view = (l: Awaited<ReturnType<typeof getTeamLink>>) =>
  l ? { url: inviteUrl(l.token), domain: l.domain, trackIds: l.trackIds, dueAt: l.dueAt, createdAt: l.createdAt } : null;

export async function GET(req: NextRequest) {
  const limited = await teamRateLimit(req, "read", 120);
  if (limited) return limited;
  const g = await requireTeamManager();
  if (g.error) return g.error;
  return NextResponse.json({ link: view(await getTeamLink(g.m.team.id)) });
}

/** Create or rotate (a new link replaces the old one, which stops working). */
export async function POST(req: NextRequest) {
  const limited = await teamRateLimit(req, "link", 10);
  if (limited) return limited;
  const t = await getT();
  const g = await requireTeamOwner();
  if (g.error) return g.error;
  if (!g.m.entitled) return NextResponse.json({ error: t("team.api.inactive") }, { status: 402 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("team.api.invalid") }, { status: 400 });
  const domain = cleanDomain(parsed.data.domain);
  if (!domain) return NextResponse.json({ error: t("team.api.badDomain") }, { status: 400 });
  const trackIds = [...new Set(parsed.data.trackIds ?? [])];
  if (trackIds.length) {
    const live = await prisma.learnTrack.count({ where: { id: { in: trackIds }, status: "live" } });
    if (live !== trackIds.length) return NextResponse.json({ error: t("team.api.unknownTrack") }, { status: 400 });
  }
  const dueAt = parsed.data.dueAt ? new Date(`${parsed.data.dueAt}T23:59:59.000Z`) : null;
  const link = await createTeamLink(g.m.team.id, { domain, trackIds, dueAt, createdById: g.student.id });
  return NextResponse.json({ ok: true, link: view(link) });
}

export async function DELETE(req: NextRequest) {
  const limited = await teamRateLimit(req, "link", 10);
  if (limited) return limited;
  const g = await requireTeamOwner();
  if (g.error) return g.error;
  await disableTeamLink(g.m.team.id);
  return NextResponse.json({ ok: true });
}
