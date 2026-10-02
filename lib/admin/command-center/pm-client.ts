// Pure helpers shared by the server (lib/admin/command-center/pm.ts) and the
// client pages. No database or Node imports here.
import { diffDays, keyOf } from "./dates";
import { STALE_UPDATE_DAYS } from "./constants";

export interface HealthSignal {
  kind: "overdue" | "stale" | "milestone";
  text: string;
}

export function healthSignals(
  p: { status: string; createdAt: string | Date; lastUpdateAt: string | Date | null },
  openTasks: Array<{ dueKey: string | null }>,
  overdueMilestones: number,
  today: string,
): HealthSignal[] {
  const out: HealthSignal[] = [];
  if (p.status !== "ACTIVE") return out;
  const overdue = openTasks.filter((t) => t.dueKey && t.dueKey < today).length;
  if (overdue) out.push({ kind: "overdue", text: `${overdue} overdue task${overdue === 1 ? "" : "s"}` });
  if (overdueMilestones) out.push({ kind: "milestone", text: `${overdueMilestones} missed milestone${overdueMilestones === 1 ? "" : "s"}` });
  const last = keyOf(p.lastUpdateAt ?? p.createdAt);
  if (last && diffDays(today, last) >= STALE_UPDATE_DAYS) {
    out.push({ kind: "stale", text: p.lastUpdateAt ? `No update in ${diffDays(today, last)} days` : "No status update yet" });
  }
  return out;
}


/** Ids of tasks whose blockers are not done yet (for board badges). */
export function blockedIds(tasks: Array<{ id: string; done: boolean; blockedBy: string[] }>): Set<string> {
  const open = new Set(tasks.filter((t) => !t.done).map((t) => t.id));
  return new Set(tasks.filter((t) => t.blockedBy.some((b) => open.has(b))).map((t) => t.id));
}
