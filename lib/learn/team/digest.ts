import prisma from "@/lib/prisma";
import { ensureTeamTables } from "./db";
import { teamEntitled } from "./access";
import { teamReport } from "./report";
import { readPrefs } from "./prefs";
import { claimEmail, pruneClaims, releaseClaim } from "./claims";
import { sendManagerDigest, type DigestData } from "./emails";
import { TEAM_INACTIVE_DAYS } from "./config";

// The weekly manager digest: one email per manager (owner and managers) per
// ISO week, summarising the team's last 7 days. Opt-out per manager from the
// dashboard (Team.settings.digestOff). Safe to call hourly: each email is
// claimed before it is sent (TeamEmailClaim "digest:<team>:<manager>:<week>"),
// so overlapping or repeated runs send it once; a failed send releases the
// claim and the next run retries.

const DAY = 86_400_000;

/** Monday (UTC) of the week, as YYYY-MM-DD. */
export function weekKey(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export async function buildDigest(teamId: string, teamName: string): Promise<DigestData> {
  const r = await teamReport(teamId);
  const active = r.members.filter((m) => m.status === "active");
  const learners = active.filter((m) => m.role !== "owner");
  const cutoff = Date.now() - TEAM_INACTIVE_DAYS * DAY;
  const overdueBy = new Map<string, number>();
  for (const a of r.assignments) if (a.overdue) overdueBy.set(a.studentId, (overdueBy.get(a.studentId) ?? 0) + 1);
  const who = (sid: string | null) => {
    const m = active.find((x) => x.studentId === sid);
    return m?.name ?? m?.email ?? "";
  };
  const attention: DigestData["attention"] = [
    ...[...overdueBy.keys()].map((sid) => ({ who: who(sid), why: "overdue" as const })),
    ...learners
      .filter((m) => !overdueBy.has(m.studentId ?? "") && (!m.lastActiveAt || new Date(m.lastActiveAt).getTime() < cutoff))
      .map((m) => ({ who: m.name ?? m.email, why: "inactive" as const })),
  ].slice(0, 8);
  const assigned = r.assignments.map((a) => a.percent);
  return {
    teamName,
    members: active.length,
    activeThisWeek: r.pulse.active7,
    lessonsThisWeek: r.pulse.lessons7,
    certificatesThisWeek: r.pulse.certificates7,
    avgPercent: assigned.length ? Math.round(assigned.reduce((x, y) => x + y, 0) / assigned.length) : null,
    overdue: r.assignments.filter((a) => a.overdue).length,
    pendingInvites: r.members.filter((m) => m.status === "invited").length,
    attention,
  };
}

export async function runTeamDigests(now = new Date()): Promise<{ digests: number; skipped: number; errors: string[] }> {
  await ensureTeamTables();
  const week = weekKey(now);
  const teams = (await prisma.team.findMany({ where: { status: { notIn: ["pending", "canceled"] } } })).filter((t) => teamEntitled(t));
  let digests = 0;
  let skipped = 0;
  const errors: string[] = [];
  for (const team of teams) {
    const members = await prisma.teamMember.findMany({ where: { teamId: team.id, status: { in: ["active", "invited"] } }, select: { studentId: true, role: true, status: true } });
    // Nothing to report on a team of one.
    if (members.length < 2) continue;
    const off = new Set(readPrefs(team.settings).digestOff);
    const managerIds = members.filter((m) => m.status === "active" && (m.role === "owner" || m.role === "manager") && m.studentId && !off.has(m.studentId)).map((m) => m.studentId!);
    if (managerIds.length === 0) continue;
    let data: DigestData | null = null;
    const managers = await prisma.student.findMany({ where: { id: { in: managerIds } }, select: { id: true, email: true, name: true, locale: true } });
    for (const mgr of managers) {
      const key = `digest:${team.id}:${mgr.id}:${week}`;
      if (!(await claimEmail(key, team.id))) {
        skipped++;
        continue;
      }
      try {
        data ??= await buildDigest(team.id, team.name);
        await sendManagerDigest({ email: mgr.email, name: mgr.name, locale: mgr.locale, d: data });
        digests++;
      } catch (err) {
        await releaseClaim(key);
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }
  }
  await pruneClaims();
  return { digests, skipped, errors };
}
