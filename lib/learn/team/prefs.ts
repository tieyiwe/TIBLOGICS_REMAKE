import prisma from "@/lib/prisma";
import { ensureTeamTables } from "./db";

// Team-level preferences kept in Team.settings (JSON):
//   joinLink   the domain-restricted shareable join link (./link.ts)
//   digestOff  student ids of managers who turned off the weekly digest
// Writes lock the team row so two managers saving at once never lose a change.

export interface TeamLinkSettings {
  token: string;
  domain: string;
  trackIds: string[];
  dueAt: string | null;
  createdById: string;
  createdAt: string;
}

export interface TeamPrefs {
  joinLink: TeamLinkSettings | null;
  digestOff: string[];
}

export function readPrefs(settings: unknown): TeamPrefs {
  const s = (settings && typeof settings === "object" ? settings : {}) as Record<string, unknown>;
  const l = s.joinLink as Partial<TeamLinkSettings> | null | undefined;
  const joinLink =
    l && typeof l.token === "string" && typeof l.domain === "string"
      ? {
          token: l.token,
          domain: l.domain,
          trackIds: Array.isArray(l.trackIds) ? l.trackIds.filter((x): x is string => typeof x === "string") : [],
          dueAt: typeof l.dueAt === "string" ? l.dueAt : null,
          createdById: String(l.createdById ?? ""),
          createdAt: String(l.createdAt ?? ""),
        }
      : null;
  const digestOff = Array.isArray(s.digestOff) ? s.digestOff.filter((x): x is string => typeof x === "string") : [];
  return { joinLink, digestOff };
}

export async function getPrefs(teamId: string): Promise<TeamPrefs> {
  await ensureTeamTables();
  const t = await prisma.team.findUnique({ where: { id: teamId }, select: { settings: true } });
  return readPrefs(t?.settings);
}

/** Read-modify-write of Team.settings under the team row lock. */
export async function updatePrefs(teamId: string, fn: (p: TeamPrefs) => TeamPrefs): Promise<TeamPrefs> {
  await ensureTeamTables();
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ settings: unknown }>>`SELECT "settings" FROM "Team" WHERE "id" = ${teamId} FOR UPDATE`;
    const raw = (rows[0]?.settings && typeof rows[0].settings === "object" ? rows[0].settings : {}) as Record<string, unknown>;
    const next = fn(readPrefs(raw));
    const merged = { ...raw, joinLink: next.joinLink, digestOff: next.digestOff };
    await tx.$executeRaw`UPDATE "Team" SET "settings" = ${JSON.stringify(merged)}::jsonb, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${teamId}`;
    return next;
  });
}

export async function setDigest(teamId: string, studentId: string, on: boolean): Promise<void> {
  await updatePrefs(teamId, (p) => ({
    ...p,
    digestOff: on ? p.digestOff.filter((x) => x !== studentId) : [...new Set([...p.digestOff, studentId])],
  }));
}
