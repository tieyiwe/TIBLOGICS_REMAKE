import prisma from "@/lib/prisma";
import { ensureTeamTables } from "./db";
import { claimEmail, releaseClaim } from "./claims";
import { trackPercents } from "./report";
import { nextStepFor } from "./next";
import { sendNudge } from "./emails";
import { TEAM_NUDGE_HOURS } from "./config";

// A manager's reminder ("nudge") to selected members about their unfinished
// assignments. Rate limit: one nudge per member per TEAM_NUDGE_HOURS, claimed
// before sending (TeamEmailClaim), so a double click or two managers at once
// never send twice. The weekly overdue reminder then waits a week
// (lastRemindedAt), so nobody gets both on the same day.

export interface NudgeResult {
  sent: string[];
  recent: string[];
  nothing: string[];
  failed: string[];
}

export async function nudgeMembers(
  team: { id: string; name: string },
  manager: { id: string; name: string },
  studentIds: string[],
  trackIds?: string[],
): Promise<NudgeResult> {
  await ensureTeamTables();
  const out: NudgeResult = { sent: [], recent: [], nothing: [], failed: [] };
  const seated = await prisma.teamMember.findMany({
    where: { teamId: team.id, status: "active", studentId: { in: studentIds } },
    select: { studentId: true },
  });
  const ids = seated.map((s) => s.studentId).filter((x): x is string => !!x);
  if (ids.length === 0) return out;
  const [assignments, pct, students] = await Promise.all([
    prisma.teamAssignment.findMany({ where: { teamId: team.id, studentId: { in: ids }, ...(trackIds?.length ? { trackId: { in: trackIds } } : {}) } }),
    trackPercents(ids),
    prisma.student.findMany({ where: { id: { in: ids } }, select: { id: true, email: true, name: true, locale: true } }),
  ]);
  const tracks = await prisma.learnTrack.findMany({
    where: { id: { in: [...new Set(assignments.map((a) => a.trackId))] } },
    select: { id: true, title: true, titleFr: true },
  });
  const bucket = Math.floor(Date.now() / (TEAM_NUDGE_HOURS * 3_600_000));

  for (const s of students) {
    const open = assignments
      .filter((a) => a.studentId === s.id)
      .map((a) => ({ a, percent: pct.get(s.id)?.get(a.trackId) ?? 0 }))
      .filter((x) => x.percent < 100);
    if (open.length === 0) {
      out.nothing.push(s.id);
      continue;
    }
    // Rolling window: also skip when the last reminder was recent.
    const cutoff = Date.now() - TEAM_NUDGE_HOURS * 3_600_000;
    if (open.some((x) => x.a.lastRemindedAt && x.a.lastRemindedAt.getTime() > cutoff)) {
      out.recent.push(s.id);
      continue;
    }
    const key = `nudge:${team.id}:${s.id}:${bucket}`;
    if (!(await claimEmail(key, team.id))) {
      out.recent.push(s.id);
      continue;
    }
    try {
      const next = await nextStepFor(s.id, open.map((x) => ({ trackId: x.a.trackId, percent: x.percent })));
      await sendNudge({
        email: s.email,
        name: s.name,
        teamName: team.name,
        managerName: manager.name,
        locale: s.locale,
        resumeHref: next?.href ?? null,
        items: open
          .sort((x, y) => (x.a.dueAt?.getTime() ?? Infinity) - (y.a.dueAt?.getTime() ?? Infinity))
          .map((x) => {
            const t = tracks.find((tr) => tr.id === x.a.trackId);
            return { title: (s.locale === "fr" && t?.titleFr) || t?.title || "", dueAt: x.a.dueAt, percent: x.percent };
          }),
      });
      await prisma.teamAssignment.updateMany({ where: { id: { in: open.map((x) => x.a.id) } }, data: { lastRemindedAt: new Date() } });
      out.sent.push(s.id);
    } catch (err) {
      console.error("[learn/team] nudge", err instanceof Error ? err.message : err);
      await releaseClaim(key);
      out.failed.push(s.id);
    }
  }
  return out;
}
