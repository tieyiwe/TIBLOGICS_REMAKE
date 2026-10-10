import { randomBytes, timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { ensureTeamTables } from "./db";
import { getMembership, teamEntitled, type TeamRow } from "./access";
import { emailOnDomain } from "./config";
import { inviteMembers, resendInvite } from "./service";
import { applyPlan, savePlan } from "./plan";
import { getPrefs, updatePrefs, type TeamLinkSettings } from "./prefs";

// The shareable team join link, restricted to one company email domain.
//
// Safety rules (named invitations keep their single-use tokens; this link is
// a separate, opt-in path the owner can rotate or turn off at any time):
//   - the link only works for a signed-in account whose email is on the
//     domain (or a subdomain); public mailbox domains cannot be chosen;
//   - an account whose address is not verified (password sign-up) is never
//     seated straight away: we email a normal single-use invitation to that
//     address, so only someone who reads that mailbox can join;
//   - a verified address (Google sign-in) joins at once;
//   - seats are counted under the team row lock, exactly like invitations;
//   - an address the team removed (or that left) is refused: only a named
//     invitation re-admits it.

export const newLinkToken = () => randomBytes(24).toString("base64url");

export async function createTeamLink(
  teamId: string,
  p: { domain: string; trackIds: string[]; dueAt: Date | null; createdById: string },
): Promise<TeamLinkSettings> {
  const link: TeamLinkSettings = {
    token: newLinkToken(),
    domain: p.domain,
    trackIds: p.trackIds,
    dueAt: p.dueAt ? p.dueAt.toISOString() : null,
    createdById: p.createdById,
    createdAt: new Date().toISOString(),
  };
  await updatePrefs(teamId, (prefs) => ({ ...prefs, joinLink: link }));
  return link;
}

export async function disableTeamLink(teamId: string): Promise<void> {
  await updatePrefs(teamId, (prefs) => ({ ...prefs, joinLink: null }));
}

export async function getTeamLink(teamId: string): Promise<TeamLinkSettings | null> {
  return (await getPrefs(teamId)).joinLink;
}

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** The team behind a join-link token, or null. */
async function findByToken(token: string): Promise<{ team: TeamRow; link: TeamLinkSettings } | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  await ensureTeamTables();
  const team = await prisma.team.findFirst({ where: { settings: { path: ["joinLink", "token"], equals: token } } });
  if (!team) return null;
  const link = (await getPrefs(team.id)).joinLink;
  if (!link || !same(link.token, token)) return null;
  return { team, link };
}

export interface TeamLinkPreview {
  teamId: string;
  teamName: string;
  domain: string;
  teamActive: boolean;
  trackTitles: string[];
}

export async function previewTeamLink(token: string): Promise<TeamLinkPreview | null> {
  const f = await findByToken(token);
  if (!f) return null;
  const tracks = f.link.trackIds.length
    ? await prisma.learnTrack.findMany({ where: { id: { in: f.link.trackIds }, status: "live" }, select: { title: true } })
    : [];
  return { teamId: f.team.id, teamName: f.team.name, domain: f.link.domain, teamActive: teamEntitled(f.team), trackTitles: tracks.map((t) => t.title) };
}

export type LinkJoinResult =
  | { kind: "joined"; teamId: string }
  | { kind: "emailSent"; email: string; memberId: string; token: string; teamId: string; inviterId: string }
  | { kind: "invalid" | "inactive" | "wrongDomain" | "otherTeam" | "full" | "already" | "removed" };

/**
 * Uses the team link for the signed-in learner. A verified address takes a
 * seat now; an unverified one gets a single-use invitation by email (the
 * caller sends it with the returned token).
 */
export async function joinViaTeamLink(token: string, student: { id: string; email: string }): Promise<LinkJoinResult> {
  const f = await findByToken(token);
  if (!f) return { kind: "invalid" };
  const { team, link } = f;
  if (!teamEntitled(team)) return { kind: "inactive" };
  const email = student.email.toLowerCase();
  if (!emailOnDomain(email, link.domain)) return { kind: "wrongDomain" };
  const current = await getMembership(student.id);
  if (current?.team.id === team.id) return { kind: "already" };
  if (current && current.entitled) return { kind: "otherTeam" };

  // Someone the team removed (or who left) cannot put themselves back with
  // the shared link, by either path below: only a named invitation from a
  // manager re-admits them.
  const prior = await prisma.teamMember.findUnique({ where: { teamId_email: { teamId: team.id, email } }, select: { status: true } });
  if (prior?.status === "removed") return { kind: "removed" };

  const plan = { trackIds: link.trackIds, dueAt: link.dueAt ? new Date(link.dueAt) : null };
  const inviterId = link.createdById || team.ownerStudentId;
  const acct = await prisma.student.findUnique({ where: { id: student.id }, select: { emailVerified: true, locale: true } });

  if (!acct?.emailVerified) {
    const [o] = await inviteMembers(team, inviterId, [email], { ...plan, locale: acct?.locale ?? null });
    if (o.ok) return { kind: "emailSent", email, memberId: o.memberId, token: o.token, teamId: team.id, inviterId };
    if (o.reason === "full") return { kind: "full" };
    if (o.reason === "member") return { kind: "already" };
    // A pending invitation: renew its link and send it again.
    const pending = await prisma.teamMember.findFirst({ where: { teamId: team.id, email, status: "invited" }, select: { id: true } });
    const r = pending ? await resendInvite(team.id, pending.id) : "notFound";
    if (r === "full") return { kind: "full" };
    if (r === "notFound") return { kind: "invalid" };
    return { kind: "emailSent", email, memberId: r.memberId, token: r.token, teamId: team.id, inviterId };
  }

  // Verified address: take a seat under the team row lock.
  const seated = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ seats: number }>>`SELECT "seats" FROM "Team" WHERE "id" = ${team.id} FOR UPDATE`;
    const seats = rows[0] ? Number(rows[0].seats) : null;
    if (seats == null) return "invalid" as const;
    const row = await tx.teamMember.findUnique({ where: { teamId_email: { teamId: team.id, email } } });
    if (row?.status === "active") return "already" as const;
    if (row?.status === "removed") return "removed" as const;
    const holdsSeat = row?.status === "invited" && !!row.inviteExpiresAt && row.inviteExpiresAt > new Date();
    if (!holdsSeat) {
      const used = await tx.teamMember.count({
        where: { teamId: team.id, OR: [{ status: "active" }, { status: "invited", inviteExpiresAt: { gt: new Date() } }] },
      });
      if (used >= seats) return "full" as const;
    }
    const data = {
      status: "active",
      role: "member",
      studentId: student.id,
      joinedAt: new Date(),
      removedAt: null,
      inviteTokenHash: null,
      inviteExpiresAt: null,
      invitedById: row?.invitedById ?? inviterId,
    };
    const m = row
      ? await tx.teamMember.update({ where: { id: row.id }, data })
      : await tx.teamMember.create({ data: { teamId: team.id, email, invitedAt: new Date(), ...data } });
    // A pending named invitation keeps its own plan (role, tracks); otherwise the link's tracks apply.
    if (!holdsSeat) {
      await savePlan(tx, { memberId: m.id, teamId: team.id, name: null, role: "member", trackIds: plan.trackIds, dueAt: plan.dueAt, locale: null });
    }
    return m.id;
  });
  if (seated === "invalid" || seated === "already" || seated === "full" || seated === "removed") return { kind: seated };
  await applyPlan(team.id, seated, student.id).catch((err) => console.error("[learn/team] link plan", err));
  return { kind: "joined", teamId: team.id };
}
