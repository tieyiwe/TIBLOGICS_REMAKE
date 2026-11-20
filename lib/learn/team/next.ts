import prisma from "@/lib/prisma";
import { getResumeTarget } from "@/lib/learn/resume";
import { getTrackProgress } from "@/lib/learn/progress";
import { getMembership } from "./access";
import { myAssignments, type MyAssignment } from "./service";

// The learner's team plan: their assignments (soonest due first) and the one
// next step inside them, for the dashboard card, the team page, the welcome
// screen and the manager's nudge email.

export interface NextStep {
  href: string;
  /** Lesson title in English (pages translate it when they can). */
  title: string;
  lessonId: string | null;
  trackId: string | null;
  kind: string;
}

/**
 * "Continue" inside the assigned tracks: the resume target if it is in one of
 * them (lib/learn/resume.ts), else the next unfinished lesson of the first
 * unfinished assignment (overdue and soonest due first).
 */
export async function nextStepFor(studentId: string, items: Array<Pick<MyAssignment, "trackId" | "percent">>): Promise<NextStep | null> {
  const open = items.filter((i) => i.percent < 100);
  if (open.length === 0) return null;
  const resume = await getResumeTarget(studentId, { trackIds: open.map((i) => i.trackId) }).catch(() => null);
  if (resume && resume.kind !== "studio") {
    return { href: resume.href, title: resume.title, lessonId: resume.kind === "lesson" || resume.kind === "next" ? resume.refId : null, trackId: resume.trackId, kind: resume.kind };
  }
  for (const i of open) {
    const p = await getTrackProgress(studentId, i.trackId).catch(() => null);
    if (!p?.nextLessonId) continue;
    const l = await prisma.lesson.findUnique({ where: { id: p.nextLessonId }, select: { title: true } });
    return { href: `/learn/lesson/${p.nextLessonId}`, title: l?.title ?? "", lessonId: p.nextLessonId, trackId: i.trackId, kind: p.completedLessons === 0 ? "start" : "next" };
  }
  return null;
}

export interface TeamPlan {
  teamId: string;
  teamName: string;
  role: string;
  entitled: boolean;
  items: MyAssignment[];
  next: NextStep | null;
  managers: string[];
}

/** Everything a member's own plan needs, or null without a team. */
export async function myTeamPlan(studentId: string): Promise<TeamPlan | null> {
  const m = await getMembership(studentId);
  if (!m) return null;
  const [mine, managers] = await Promise.all([
    m.entitled ? myAssignments(studentId) : Promise.resolve(null),
    prisma.teamMember.findMany({ where: { teamId: m.team.id, status: "active", role: { in: ["owner", "manager"] } }, select: { studentId: true, role: true } }),
  ]);
  const ids = managers.map((x) => x.studentId).filter((x): x is string => !!x && x !== studentId);
  const names = ids.length ? await prisma.student.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : [];
  const items = (mine?.items ?? []).sort((a, b) => {
    // Unfinished first, then overdue, then by due date.
    const done = Number(a.percent >= 100) - Number(b.percent >= 100);
    if (done) return done;
    const od = Number(b.overdue) - Number(a.overdue);
    if (od) return od;
    return (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity);
  });
  return {
    teamId: m.team.id,
    teamName: m.team.name,
    role: m.role,
    entitled: m.entitled,
    items,
    next: m.entitled ? await nextStepFor(studentId, items) : null,
    managers: ids.map((id) => names.find((n) => n.id === id)?.name).filter((x): x is string => !!x),
  };
}
