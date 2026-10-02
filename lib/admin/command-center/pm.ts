import { Prisma, type Project, type ProjectTask } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensurePmTables } from "./db";
import { addDays, addMonths, dayToDate, diffDays, keyOf } from "./dates";
import { STALE_UPDATE_DAYS, TASK_PRIORITIES } from "./constants";
import { templateByKey } from "./templates";
import { PERM_COMMAND_CENTER } from "./permissions";
import type { Staff } from "./guard";

// Server-side project management: reads shaped for the pages, and the writes
// that carry side effects (activity, notifications, recurring tasks, auto
// progress). Routes validate input and check permissions before calling in.

// ── Staff directory ──────────────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  name: string;
  email: string;
}

export const OWNER_ID = "owner";
const OWNER_EMAIL = "tieyiwebass@gmail.com";

/** The owner plus active collaborators who can open the Command Center. */
export async function listStaff(): Promise<StaffMember[]> {
  const collabs = await prisma.collaborator
    .findMany({ where: { active: true }, select: { id: true, name: true, email: true, isAdmin: true, permissions: true }, orderBy: { name: "asc" } })
    .catch(() => []);
  return [
    { id: OWNER_ID, name: process.env.ADMIN_NAME ?? "Tieyiwe", email: OWNER_EMAIL },
    ...collabs
      .filter((c) => c.isAdmin || c.permissions.includes("*") || c.permissions.includes(PERM_COMMAND_CENTER))
      .map((c) => ({ id: c.id, name: c.name, email: c.email })),
  ];
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface LinkItem {
  label: string;
  url: string;
}

export interface TaskDTO {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeId: string | null;
  labels: string[];
  parentId: string | null;
  startKey: string | null;
  dueKey: string | null;
  estimateMinutes: number | null;
  blockedBy: string[];
  recurrence: string | null;
  milestoneId: string | null;
  links: LinkItem[];
  order: number;
  done: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDTO {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  progress: number;
  progressMode: string;
  color: string;
  revenueEarned: number;
  revenuePotential: number;
  monthlyRecurring: number;
  startKey: string | null;
  deadlineKey: string | null;
  starred: boolean;
  archived: boolean;
  notes: string | null;
  ownerId: string | null;
  health: string;
  healthNote: string | null;
  goals: string | null;
  links: LinkItem[];
  hourlyRateCents: number | null;
  clientName: string | null;
  clientEmail: string | null;
  prospectId: string | null;
  templateKey: string | null;
  lastUpdateAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function asLinks(v: Prisma.JsonValue): LinkItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is { label?: string; url: string } => !!x && typeof x === "object" && typeof (x as { url?: unknown }).url === "string")
    .map((x) => ({ label: typeof x.label === "string" ? x.label : "", url: x.url }));
}

export function taskDTO(t: ProjectTask): TaskDTO {
  const status = t.done ? "done" : t.status === "done" ? "done" : t.status;
  return {
    id: t.id,
    projectId: t.projectId,
    title: t.text,
    description: t.description,
    status,
    priority: t.priority,
    assigneeId: t.assigneeId,
    labels: t.labels ?? [],
    parentId: t.parentId,
    startKey: keyOf(t.startDate),
    dueKey: keyOf(t.dueDate),
    estimateMinutes: t.estimateMinutes,
    blockedBy: t.blockedBy ?? [],
    recurrence: t.recurrence,
    milestoneId: t.milestoneId,
    links: asLinks(t.links),
    order: t.order,
    done: status === "done",
    completedAt: t.completedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export function projectDTO(p: Project): ProjectDTO {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    status: p.status,
    priority: p.priority,
    progress: p.progress,
    progressMode: p.progressMode,
    color: p.color,
    revenueEarned: p.revenueEarned,
    revenuePotential: p.revenuePotential,
    monthlyRecurring: p.monthlyRecurring,
    startKey: keyOf(p.startDate),
    deadlineKey: keyOf(p.deadline),
    starred: p.starred,
    archived: p.archived,
    notes: p.notes,
    ownerId: p.ownerId,
    health: p.health,
    healthNote: p.healthNote,
    goals: p.goals,
    links: asLinks(p.links),
    hourlyRateCents: p.hourlyRateCents,
    clientName: p.clientName,
    clientEmail: p.clientEmail,
    prospectId: p.prospectId,
    templateKey: p.templateKey,
    lastUpdateAt: p.lastUpdateAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// ── Activity and notifications ───────────────────────────────────────────────

export async function logActivity(projectId: string, actor: Pick<Staff, "id" | "name">, kind: string, summary: string, taskId?: string | null) {
  try {
    await prisma.pmActivity.create({
      data: { projectId, taskId: taskId ?? null, actorId: actor.id, actorName: actor.name, kind, summary: summary.slice(0, 500) },
    });
  } catch (err) {
    console.error("[command-center] activity", err);
  }
}

export interface NotifyInput {
  kind: string;
  title: string;
  body?: string | null;
  href: string;
  /** One notification per key, ever (e.g. a due-date reminder per task per day). */
  dedupeKey?: string;
}

/** In-app notifications. Never notifies the actor about their own action. Never throws. */
export async function notify(recipients: Array<string | null | undefined>, n: NotifyInput, actorId?: string) {
  const ids = [...new Set(recipients.filter((r): r is string => !!r && r !== actorId))];
  for (const recipientId of ids) {
    try {
      await prisma.pmNotification.create({
        data: {
          recipientId,
          kind: n.kind,
          title: n.title.slice(0, 200),
          body: n.body?.slice(0, 500) ?? null,
          href: n.href,
          dedupeKey: n.dedupeKey ? `${n.dedupeKey}:${recipientId}` : null,
        },
      });
    } catch (err) {
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) console.error("[command-center] notify", err);
    }
  }
}

export const taskHref = (projectId: string, taskId: string) => `/admin_pro/command-center/projects/${projectId}?task=${taskId}`;
export const projectHref = (projectId: string) => `/admin_pro/command-center/projects/${projectId}`;

/** Bell entries for one person (last 7 days, newest first). */
export async function notificationsFor(recipientId: string, limit = 30) {
  try {
    await ensurePmTables();
    return await prisma.pmNotification.findMany({
      where: { recipientId, createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (err) {
    console.error("[command-center] notifications", err);
    return [];
  }
}

// ── Progress and health ──────────────────────────────────────────────────────

/** Auto progress: share of top-level tasks and milestones that are done. */
export async function recomputeProgress(projectId: string): Promise<number | null> {
  const p = await prisma.project.findUnique({ where: { id: projectId }, select: { progressMode: true } });
  if (!p || p.progressMode !== "auto") return null;
  const [tasks, done, ms, msDone] = await Promise.all([
    prisma.projectTask.count({ where: { projectId, parentId: null } }),
    prisma.projectTask.count({ where: { projectId, parentId: null, OR: [{ done: true }, { status: "done" }] } }),
    prisma.pmMilestone.count({ where: { projectId } }),
    prisma.pmMilestone.count({ where: { projectId, done: true } }),
  ]);
  const total = tasks + ms;
  const progress = total ? Math.round(((done + msDone) / total) * 100) : 0;
  await prisma.project.update({ where: { id: projectId }, data: { progress } });
  return progress;
}

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

// ── Portfolio ────────────────────────────────────────────────────────────────

export interface PortfolioProject extends ProjectDTO {
  taskCount: number;
  openCount: number;
  doneCount: number;
  overdueCount: number;
  nextMilestone: { title: string; dueKey: string } | null;
  overdueMilestones: number;
  signals: HealthSignal[];
  /** Paid income linked in Finance, USD cents (only with the finance permission). */
  ledgerIncomeCents: number | null;
  ledgerExpenseCents: number | null;
  lastUpdate: { health: string; createdAt: string; authorName: string } | null;
}

export async function getPortfolio(opts: { includeArchived?: boolean; withFinance: boolean; today: string }): Promise<PortfolioProject[]> {
  await ensurePmTables();
  const projects = await prisma.project.findMany({
    where: opts.includeArchived ? {} : { archived: false },
    orderBy: [{ starred: "desc" }, { updatedAt: "desc" }],
  });
  if (!projects.length) return [];
  const ids = projects.map((p) => p.id);
  const [tasks, milestones, updates] = await Promise.all([
    prisma.projectTask.findMany({
      where: { projectId: { in: ids }, parentId: null },
      select: { projectId: true, done: true, status: true, dueDate: true },
    }),
    prisma.pmMilestone.findMany({ where: { projectId: { in: ids } }, orderBy: { dueDate: "asc" } }),
    prisma.$queryRaw<Array<{ projectId: string; health: string; createdAt: Date; authorName: string }>>`
      SELECT DISTINCT ON ("projectId") "projectId", "health", "createdAt", "authorName"
      FROM "PmUpdate" WHERE "projectId" IN (${Prisma.join(ids)}) ORDER BY "projectId", "createdAt" DESC`,
  ]);
  let fin: Map<string, { inc: number; exp: number }> | null = null;
  if (opts.withFinance) {
    const { projectLedgerTotals } = await import("./finance");
    fin = await projectLedgerTotals(ids);
  }
  return projects.map((p) => {
    const mine = tasks.filter((t) => t.projectId === p.id);
    const open = mine.filter((t) => !(t.done || t.status === "done")).map((t) => ({ dueKey: keyOf(t.dueDate) }));
    const ms = milestones.filter((m) => m.projectId === p.id);
    const next = ms.find((m) => !m.done);
    const overdueMs = ms.filter((m) => !m.done && keyOf(m.dueDate)! < opts.today).length;
    const dto = projectDTO(p);
    const u = updates.find((x) => x.projectId === p.id);
    return {
      ...dto,
      taskCount: mine.length,
      openCount: open.length,
      doneCount: mine.length - open.length,
      overdueCount: open.filter((t) => t.dueKey && t.dueKey < opts.today).length,
      nextMilestone: next ? { title: next.title, dueKey: keyOf(next.dueDate)! } : null,
      overdueMilestones: overdueMs,
      signals: healthSignals(dto, open, overdueMs, opts.today),
      ledgerIncomeCents: fin ? fin.get(p.id)?.inc ?? 0 : null,
      ledgerExpenseCents: fin ? fin.get(p.id)?.exp ?? 0 : null,
      lastUpdate: u ? { health: u.health, createdAt: u.createdAt.toISOString(), authorName: u.authorName } : null,
    };
  });
}

// ── Project page bundle ──────────────────────────────────────────────────────

export interface MilestoneDTO {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  dueKey: string;
  done: boolean;
  completedAt: string | null;
}

export interface NoteDTO {
  id: string;
  projectId: string;
  title: string;
  bodyMd: string;
  kind: string;
  pinned: boolean;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDTO {
  id: string;
  projectId: string;
  authorName: string;
  health: string;
  progress: number;
  doneMd: string;
  nextMd: string;
  blockersMd: string;
  createdAt: string;
}

export interface ActivityDTO {
  id: string;
  taskId: string | null;
  actorName: string;
  kind: string;
  summary: string;
  createdAt: string;
}

export interface TimeEntryDTO {
  id: string;
  projectId: string;
  taskId: string | null;
  staffId: string;
  staffName: string;
  startedAt: string;
  endedAt: string | null;
  minutes: number;
  note: string | null;
}

export const milestoneDTO = (m: { id: string; projectId: string; title: string; description: string | null; dueDate: Date; done: boolean; completedAt: Date | null }): MilestoneDTO => ({
  id: m.id,
  projectId: m.projectId,
  title: m.title,
  description: m.description,
  dueKey: keyOf(m.dueDate)!,
  done: m.done,
  completedAt: m.completedAt?.toISOString() ?? null,
});

export const noteDTO = (n: { id: string; projectId: string; title: string; bodyMd: string; kind: string; pinned: boolean; createdByName: string; createdAt: Date; updatedAt: Date }): NoteDTO => ({
  id: n.id,
  projectId: n.projectId,
  title: n.title,
  bodyMd: n.bodyMd,
  kind: n.kind,
  pinned: n.pinned,
  createdByName: n.createdByName,
  createdAt: n.createdAt.toISOString(),
  updatedAt: n.updatedAt.toISOString(),
});

export const updateDTO = (u: { id: string; projectId: string; authorName: string; health: string; progress: number; doneMd: string; nextMd: string; blockersMd: string; createdAt: Date }): UpdateDTO => ({
  id: u.id,
  projectId: u.projectId,
  authorName: u.authorName,
  health: u.health,
  progress: u.progress,
  doneMd: u.doneMd,
  nextMd: u.nextMd,
  blockersMd: u.blockersMd,
  createdAt: u.createdAt.toISOString(),
});

export const timeDTO = (t: { id: string; projectId: string; taskId: string | null; staffId: string; staffName: string; startedAt: Date; endedAt: Date | null; minutes: number; note: string | null }): TimeEntryDTO => ({
  id: t.id,
  projectId: t.projectId,
  taskId: t.taskId,
  staffId: t.staffId,
  staffName: t.staffName,
  startedAt: t.startedAt.toISOString(),
  endedAt: t.endedAt?.toISOString() ?? null,
  minutes: t.minutes,
  note: t.note,
});

export interface ProjectBundle {
  project: ProjectDTO;
  tasks: TaskDTO[];
  milestones: MilestoneDTO[];
  notes: NoteDTO[];
  updates: UpdateDTO[];
  activity: ActivityDTO[];
  time: TimeEntryDTO[];
  commentCounts: Record<string, number>;
  finance: import("./finance").ProjectFinance | null;
}

export async function getProjectBundle(id: string, opts: { withFinance: boolean }): Promise<ProjectBundle | null> {
  await ensurePmTables();
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return null;
  const [tasks, milestones, notes, updates, activity, time, comments] = await Promise.all([
    prisma.projectTask.findMany({ where: { projectId: id }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    prisma.pmMilestone.findMany({ where: { projectId: id }, orderBy: [{ dueDate: "asc" }] }),
    prisma.pmNote.findMany({ where: { projectId: id }, orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }] }),
    prisma.pmUpdate.findMany({ where: { projectId: id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.pmActivity.findMany({ where: { projectId: id }, orderBy: { createdAt: "desc" }, take: 150 }),
    prisma.pmTimeEntry.findMany({ where: { projectId: id }, orderBy: { startedAt: "desc" }, take: 500 }),
    prisma.pmComment.groupBy({ by: ["taskId"], where: { projectId: id }, _count: { _all: true } }),
  ]);
  let finance = null;
  if (opts.withFinance) {
    const { projectFinance } = await import("./finance");
    const loggedMinutes = time.reduce((n, t) => n + t.minutes, 0);
    finance = await projectFinance(id, project.hourlyRateCents, loggedMinutes);
  }
  return {
    project: projectDTO(project),
    tasks: tasks.map(taskDTO),
    milestones: milestones.map(milestoneDTO),
    notes: notes.map(noteDTO),
    updates: updates.map(updateDTO),
    activity: activity.map((a) => ({ id: a.id, taskId: a.taskId, actorName: a.actorName, kind: a.kind, summary: a.summary, createdAt: a.createdAt.toISOString() })),
    time: time.map(timeDTO),
    commentCounts: Object.fromEntries(comments.map((c) => [c.taskId, c._count._all])),
    finance,
  };
}

export interface CommentDTO {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  mentions: string[];
  createdAt: string;
}

export async function getTaskDetail(taskId: string) {
  await ensurePmTables();
  const task = await prisma.projectTask.findUnique({ where: { id: taskId } });
  if (!task) return null;
  const [comments, activity] = await Promise.all([
    prisma.pmComment.findMany({ where: { taskId }, orderBy: { createdAt: "asc" }, take: 300 }),
    prisma.pmActivity.findMany({ where: { taskId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return {
    task: taskDTO(task),
    comments: comments.map((c) => ({ id: c.id, authorId: c.authorId, authorName: c.authorName, body: c.body, mentions: c.mentions ?? [], createdAt: c.createdAt.toISOString() })) as CommentDTO[],
    activity: activity.map((a) => ({ id: a.id, taskId: a.taskId, actorName: a.actorName, kind: a.kind, summary: a.summary, createdAt: a.createdAt.toISOString() })) as ActivityDTO[],
  };
}

// ── Projects: create (with template) ─────────────────────────────────────────

export async function createProject(
  input: {
    name: string;
    description?: string;
    category: Project["category"];
    status: Project["status"];
    priority: Project["priority"];
    color?: string;
    ownerId?: string | null;
    startKey?: string | null;
    deadlineKey?: string | null;
    templateKey?: string | null;
    clientName?: string | null;
    revenuePotential?: number;
  },
  actor: Staff,
  today: string,
): Promise<Project> {
  await ensurePmTables();
  const tpl = templateByKey(input.templateKey);
  const start = input.startKey ?? today;
  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description ?? tpl?.description ?? null,
      category: input.category ?? tpl?.category,
      status: input.status,
      priority: input.priority,
      color: input.color ?? tpl?.color ?? "#2251A3",
      ownerId: input.ownerId ?? actor.id,
      startDate: dayToDate(start),
      deadline: input.deadlineKey ? dayToDate(input.deadlineKey) : tpl ? dayToDate(addDays(start, tpl.days)) : null,
      templateKey: tpl?.key ?? null,
      goals: tpl?.goals ?? null,
      clientName: input.clientName ?? null,
      revenuePotential: input.revenuePotential ?? 0,
      progressMode: "auto",
      lastUpdateAt: new Date(),
    },
  });
  if (tpl) {
    for (const [i, m] of tpl.milestones.entries()) {
      await prisma.pmMilestone.create({ data: { projectId: project.id, title: m.title, dueDate: dayToDate(addDays(start, m.due)), order: i } });
    }
    let order = 0;
    for (const t of tpl.tasks) {
      const parent = await prisma.projectTask.create({
        data: {
          projectId: project.id,
          text: t.title,
          order: order++,
          priority: t.priority ?? "none",
          labels: t.labels ?? [],
          dueDate: t.due !== undefined ? dayToDate(addDays(start, t.due)) : null,
          recurrence: t.recurrence ?? null,
          estimateMinutes: t.estimateMinutes ?? null,
          assigneeId: input.ownerId ?? actor.id,
          createdById: actor.id,
        },
      });
      if (t.subtasks?.length) {
        await prisma.projectTask.createMany({
          data: t.subtasks.map((s, j) => ({ projectId: project.id, text: s, order: j, parentId: parent.id, createdById: actor.id })),
        });
      }
    }
  }
  await logActivity(project.id, actor, "project.create", tpl ? `created the project from the "${tpl.name}" template` : "created the project");
  return project;
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export async function nextOrder(projectId: string, parentId: string | null): Promise<number> {
  const agg = await prisma.projectTask.aggregate({ where: { projectId, parentId }, _max: { order: true } });
  return (agg._max.order ?? -1) + 1;
}

/** Spawns the next occurrence of a recurring task that has just been completed. */
async function spawnRecurrence(t: ProjectTask, actor: Staff, today: string): Promise<ProjectTask | null> {
  if (!t.recurrence) return null;
  const step = (k: string) => (t.recurrence === "monthly" ? addMonths(k, 1) : addDays(k, 7));
  const base = keyOf(t.dueDate) ?? today;
  let due = step(base);
  // Completed late: next one lands in the future, not in the past.
  while (due < today) due = step(due);
  const startKey = keyOf(t.startDate);
  const next = await prisma.projectTask.create({
    data: {
      projectId: t.projectId,
      text: t.text,
      description: t.description,
      priority: t.priority,
      assigneeId: t.assigneeId,
      labels: t.labels,
      recurrence: t.recurrence,
      estimateMinutes: t.estimateMinutes,
      milestoneId: null,
      links: t.links ?? [],
      dueDate: dayToDate(due),
      startDate: startKey ? dayToDate(addDays(startKey, diffDays(due, base))) : null,
      order: await nextOrder(t.projectId, t.parentId),
      parentId: t.parentId,
      createdById: actor.id,
    },
  });
  const subs = await prisma.projectTask.findMany({ where: { parentId: t.id }, orderBy: { order: "asc" } });
  if (subs.length) {
    await prisma.projectTask.createMany({
      data: subs.map((s, i) => ({ projectId: t.projectId, text: s.text, order: i, parentId: next.id, createdById: actor.id })),
    });
  }
  await logActivity(t.projectId, actor, "task.recur", `scheduled the next "${t.text}" for ${due}`, next.id);
  return next;
}

export interface TaskChange {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  labels?: string[];
  parentId?: string | null;
  startKey?: string | null;
  dueKey?: string | null;
  estimateMinutes?: number | null;
  recurrence?: string | null;
  milestoneId?: string | null;
  blockedBy?: string[];
  links?: LinkItem[];
  projectId?: string;
  order?: number;
  force?: boolean;
}

export class TaskError extends Error {
  constructor(
    message: string,
    public status = 400,
    public extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

const PRIORITY_LABEL = Object.fromEntries(TASK_PRIORITIES.map((p) => [p.value, p.label]));

/**
 * Applies a change to one task with its side effects: done/status kept in
 * step, blockers enforced on completion, recurring tasks rescheduled,
 * assignee notified, activity logged, auto progress refreshed.
 */
export async function applyTaskChange(
  taskId: string,
  change: TaskChange,
  actor: Staff,
  today: string,
  staff: StaffMember[],
): Promise<{ task: TaskDTO; spawned: TaskDTO | null }> {
  const t = await prisma.projectTask.findUnique({ where: { id: taskId } });
  if (!t) throw new TaskError("Task not found", 404);
  const data: Prisma.ProjectTaskUncheckedUpdateInput = {};
  const notes: string[] = [];
  const wasDone = t.done || t.status === "done";

  if (change.projectId !== undefined && change.projectId !== t.projectId) {
    const target = await prisma.project.findUnique({ where: { id: change.projectId }, select: { id: true, name: true } });
    if (!target) throw new TaskError("Project not found", 404);
    data.projectId = target.id;
    data.parentId = null;
    data.milestoneId = null;
    data.blockedBy = [];
    data.order = await nextOrder(target.id, null);
    notes.push(`moved the task to ${target.name}`);
  }
  if (change.title !== undefined && change.title !== t.text) {
    data.text = change.title;
    notes.push(`renamed the task to "${change.title}"`);
  }
  if (change.description !== undefined) data.description = change.description || null;
  if (change.priority !== undefined && change.priority !== t.priority) {
    data.priority = change.priority;
    notes.push(`set priority to ${PRIORITY_LABEL[change.priority] ?? change.priority}`);
  }
  if (change.labels !== undefined) data.labels = [...new Set(change.labels)];
  if (change.links !== undefined) data.links = change.links as unknown as Prisma.InputJsonValue;
  if (change.estimateMinutes !== undefined) data.estimateMinutes = change.estimateMinutes;
  if (change.recurrence !== undefined) data.recurrence = change.recurrence;
  if (change.order !== undefined) data.order = change.order;
  if (change.startKey !== undefined) data.startDate = change.startKey ? dayToDate(change.startKey) : null;
  if (change.dueKey !== undefined && change.dueKey !== keyOf(t.dueDate)) {
    data.dueDate = change.dueKey ? dayToDate(change.dueKey) : null;
    notes.push(change.dueKey ? `set the due date to ${change.dueKey}` : "cleared the due date");
  }
  const projectId = (data.projectId as string | undefined) ?? t.projectId;
  if (change.milestoneId !== undefined) {
    if (change.milestoneId) {
      const m = await prisma.pmMilestone.findFirst({ where: { id: change.milestoneId, projectId } });
      if (!m) throw new TaskError("That milestone is not in this project");
    }
    data.milestoneId = change.milestoneId;
  }
  if (change.parentId !== undefined) {
    if (change.parentId) {
      if (change.parentId === t.id) throw new TaskError("A task cannot be its own subtask");
      const parent = await prisma.projectTask.findFirst({ where: { id: change.parentId, projectId } });
      if (!parent) throw new TaskError("Parent task not found in this project");
      if (parent.parentId) throw new TaskError("Subtasks go one level deep");
    }
    data.parentId = change.parentId;
  }
  if (change.blockedBy !== undefined) {
    const ids = [...new Set(change.blockedBy.filter((b) => b !== t.id))];
    if (ids.length) {
      const found = await prisma.projectTask.findMany({ where: { id: { in: ids }, projectId }, select: { id: true, blockedBy: true } });
      if (found.length !== ids.length) throw new TaskError("Blocking tasks must be in the same project");
      // Refuse a direct cycle (A blocked by B while B is blocked by A).
      if (found.some((f) => (f.blockedBy ?? []).includes(t.id))) throw new TaskError("That would make the two tasks block each other");
    }
    data.blockedBy = ids;
    notes.push(ids.length ? `set ${ids.length} blocking task${ids.length === 1 ? "" : "s"}` : "cleared blockers");
  }
  if (change.assigneeId !== undefined && change.assigneeId !== t.assigneeId) {
    if (change.assigneeId && !staff.some((s) => s.id === change.assigneeId)) throw new TaskError("Assignee must be a staff member with Command Center access");
    data.assigneeId = change.assigneeId;
    const who = staff.find((s) => s.id === change.assigneeId)?.name;
    notes.push(who ? `assigned the task to ${who}` : "unassigned the task");
  }
  let completing = false;
  if (change.status !== undefined && change.status !== (wasDone ? "done" : t.status)) {
    if (change.status === "done" && !wasDone) {
      const blockers = (data.blockedBy as string[] | undefined) ?? t.blockedBy ?? [];
      if (blockers.length && !change.force) {
        const open = await prisma.projectTask.findMany({
          where: { id: { in: blockers }, done: false, status: { not: "done" } },
          select: { id: true, text: true },
        });
        if (open.length) {
          throw new TaskError(`Blocked by ${open.map((o) => `"${o.text}"`).join(", ")}`, 409, { blockers: open.map((o) => ({ id: o.id, title: o.text })) });
        }
      }
      completing = true;
    }
    data.status = change.status;
    data.done = change.status === "done";
    data.completedAt = change.status === "done" ? new Date() : null;
    notes.push(change.status === "done" ? "completed the task" : `moved the task to ${change.status.replace("_", " ")}`);
  }

  const updated = await prisma.projectTask.update({ where: { id: taskId }, data });
  if (notes.length) await logActivity(updated.projectId, actor, "task.update", `${notes.join(", ")} (${updated.text})`, updated.id);

  if (data.assigneeId && data.assigneeId !== actor.id) {
    await notify([data.assigneeId as string], {
      kind: "assigned",
      title: `${actor.name} assigned you "${updated.text}"`,
      body: updated.dueDate ? `Due ${keyOf(updated.dueDate)}` : null,
      href: taskHref(updated.projectId, updated.id),
    }, actor.id);
  }
  if (completing && t.assigneeId && t.createdById && t.createdById !== actor.id) {
    await notify([t.createdById], { kind: "completed", title: `${actor.name} completed "${updated.text}"`, href: taskHref(updated.projectId, updated.id) }, actor.id);
  }
  const spawned = completing ? await spawnRecurrence(updated, actor, today) : null;
  if (change.status !== undefined || data.parentId !== undefined || data.projectId !== undefined) {
    await recomputeProgress(updated.projectId);
    if (data.projectId) await recomputeProgress(t.projectId);
  }
  return { task: taskDTO(updated), spawned: spawned ? taskDTO(spawned) : null };
}

export async function createTask(
  input: {
    projectId: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: string | null;
    labels?: string[];
    parentId?: string | null;
    startKey?: string | null;
    dueKey?: string | null;
    estimateMinutes?: number | null;
    recurrence?: string | null;
    milestoneId?: string | null;
  },
  actor: Staff,
  staff: StaffMember[],
): Promise<TaskDTO> {
  await ensurePmTables();
  const project = await prisma.project.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw new TaskError("Project not found", 404);
  if (input.assigneeId && !staff.some((s) => s.id === input.assigneeId)) throw new TaskError("Assignee must be a staff member with Command Center access");
  if (input.parentId) {
    const parent = await prisma.projectTask.findFirst({ where: { id: input.parentId, projectId: input.projectId } });
    if (!parent) throw new TaskError("Parent task not found in this project");
    if (parent.parentId) throw new TaskError("Subtasks go one level deep");
  }
  if (input.milestoneId && !(await prisma.pmMilestone.findFirst({ where: { id: input.milestoneId, projectId: input.projectId } }))) {
    throw new TaskError("That milestone is not in this project");
  }
  const status = input.status ?? "todo";
  const t = await prisma.projectTask.create({
    data: {
      projectId: input.projectId,
      text: input.title,
      description: input.description || null,
      status,
      done: status === "done",
      completedAt: status === "done" ? new Date() : null,
      priority: input.priority ?? "none",
      assigneeId: input.assigneeId ?? null,
      labels: [...new Set(input.labels ?? [])],
      parentId: input.parentId ?? null,
      startDate: input.startKey ? dayToDate(input.startKey) : null,
      dueDate: input.dueKey ? dayToDate(input.dueKey) : null,
      estimateMinutes: input.estimateMinutes ?? null,
      recurrence: input.recurrence ?? null,
      milestoneId: input.milestoneId ?? null,
      order: await nextOrder(input.projectId, input.parentId ?? null),
      createdById: actor.id,
    },
  });
  await logActivity(t.projectId, actor, "task.create", input.parentId ? `added the subtask "${t.text}"` : `added the task "${t.text}"`, t.id);
  if (t.assigneeId && t.assigneeId !== actor.id) {
    await notify([t.assigneeId], {
      kind: "assigned",
      title: `${actor.name} assigned you "${t.text}"`,
      body: t.dueDate ? `Due ${keyOf(t.dueDate)}` : null,
      href: taskHref(t.projectId, t.id),
    }, actor.id);
  }
  await recomputeProgress(t.projectId);
  return taskDTO(t);
}

export async function deleteTask(taskId: string, actor: Staff) {
  const t = await prisma.projectTask.findUnique({ where: { id: taskId } });
  if (!t) return false;
  await prisma.$transaction([
    prisma.projectTask.deleteMany({ where: { parentId: taskId } }),
    prisma.projectTask.delete({ where: { id: taskId } }),
  ]);
  // Unblock tasks that waited on this one.
  await prisma.$executeRaw`UPDATE "ProjectTask" SET "blockedBy" = array_remove("blockedBy", ${taskId}) WHERE ${taskId} = ANY("blockedBy")`;
  await logActivity(t.projectId, actor, "task.delete", `deleted the task "${t.text}"`);
  await recomputeProgress(t.projectId);
  return true;
}

// ── My work, calendar, search, digest ────────────────────────────────────────

export interface WorkTask extends TaskDTO {
  projectName: string;
  projectColor: string;
  subtaskCount: number;
  subtaskDone: number;
  blocked: boolean;
}

async function withProjectInfo(tasks: ProjectTask[]): Promise<WorkTask[]> {
  if (!tasks.length) return [];
  const projectIds = [...new Set(tasks.map((t) => t.projectId))];
  const [projects, subs, blockers] = await Promise.all([
    prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, name: true, color: true } }),
    prisma.projectTask.findMany({ where: { parentId: { in: tasks.map((t) => t.id) } }, select: { parentId: true, done: true, status: true } }),
    prisma.projectTask.findMany({
      where: { id: { in: [...new Set(tasks.flatMap((t) => t.blockedBy ?? []))] }, done: false, status: { not: "done" } },
      select: { id: true },
    }),
  ]);
  const open = new Set(blockers.map((b) => b.id));
  return tasks.map((t) => {
    const p = projects.find((x) => x.id === t.projectId);
    const mine = subs.filter((s) => s.parentId === t.id);
    return {
      ...taskDTO(t),
      projectName: p?.name ?? "Project",
      projectColor: p?.color ?? "#2251A3",
      subtaskCount: mine.length,
      subtaskDone: mine.filter((s) => s.done || s.status === "done").length,
      blocked: (t.blockedBy ?? []).some((b) => open.has(b)),
    };
  });
}

export async function myWork(staffId: string): Promise<{ open: WorkTask[]; doneRecently: WorkTask[] }> {
  await ensurePmTables();
  const [open, done] = await Promise.all([
    prisma.projectTask.findMany({
      where: { assigneeId: staffId, done: false, status: { not: "done" }, project: { archived: false } },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { order: "asc" }],
      take: 500,
    }),
    prisma.projectTask.findMany({
      where: { assigneeId: staffId, OR: [{ done: true }, { status: "done" }], completedAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
      orderBy: { completedAt: "desc" },
      take: 30,
    }),
  ]);
  return { open: await withProjectInfo(open), doneRecently: await withProjectInfo(done) };
}

export async function tasksDueBetween(fromKey: string, toKey: string, assigneeId?: string | null): Promise<WorkTask[]> {
  await ensurePmTables();
  const tasks = await prisma.projectTask.findMany({
    where: {
      dueDate: { gte: dayToDate(fromKey), lte: dayToDate(toKey) },
      project: { archived: false },
      ...(assigneeId ? { assigneeId } : {}),
    },
    orderBy: [{ dueDate: "asc" }, { order: "asc" }],
    take: 1500,
  });
  return withProjectInfo(tasks);
}

export async function milestonesBetween(fromKey: string, toKey: string) {
  await ensurePmTables();
  const rows = await prisma.pmMilestone.findMany({
    where: { dueDate: { gte: dayToDate(fromKey), lte: dayToDate(toKey) } },
    orderBy: { dueDate: "asc" },
  });
  const projects = await prisma.project.findMany({
    where: { id: { in: [...new Set(rows.map((r) => r.projectId))] }, archived: false },
    select: { id: true, name: true, color: true },
  });
  return rows
    .filter((r) => projects.some((p) => p.id === r.projectId))
    .map((r) => {
      const p = projects.find((x) => x.id === r.projectId)!;
      return { ...milestoneDTO(r), projectName: p.name, projectColor: p.color };
    });
}

export interface SearchResult {
  kind: "project" | "task" | "note";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export async function searchPm(q: string, limit = 8): Promise<SearchResult[]> {
  await ensurePmTables();
  const ci = { contains: q, mode: "insensitive" as const };
  const [projects, tasks, notes] = await Promise.all([
    prisma.project.findMany({
      where: { OR: [{ name: ci }, { description: ci }, { clientName: ci }] },
      select: { id: true, name: true, status: true, archived: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),
    prisma.projectTask.findMany({
      where: { OR: [{ text: ci }, { description: ci }] },
      select: { id: true, text: true, projectId: true, status: true, done: true, project: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),
    prisma.pmNote.findMany({
      where: { OR: [{ title: ci }, { bodyMd: ci }] },
      select: { id: true, title: true, projectId: true, kind: true, bodyMd: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),
  ]);
  const noteProjects = await prisma.project.findMany({ where: { id: { in: notes.map((n) => n.projectId) } }, select: { id: true, name: true } });
  const snippet = (body: string) => {
    const i = body.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return "";
    return body.slice(Math.max(0, i - 30), i + 60).replace(/\s+/g, " ").trim();
  };
  return [
    ...projects.map((p) => ({
      kind: "project" as const,
      id: p.id,
      title: p.name,
      subtitle: p.archived ? "Archived project" : `Project · ${p.status.toLowerCase()}`,
      href: projectHref(p.id),
    })),
    ...tasks.map((t) => ({
      kind: "task" as const,
      id: t.id,
      title: t.text,
      subtitle: `Task in ${t.project.name}${t.done || t.status === "done" ? " · done" : ""}`,
      href: taskHref(t.projectId, t.id),
    })),
    ...notes.map((n) => ({
      kind: "note" as const,
      id: n.id,
      title: n.title,
      subtitle: `${noteProjects.find((p) => p.id === n.projectId)?.name ?? "Project"} · ${snippet(n.bodyMd) || n.kind}`,
      href: `${projectHref(n.projectId)}?tab=notes&note=${n.id}`,
    })),
  ];
}

export async function updatesDigest(weeks = 8) {
  await ensurePmTables();
  const since = new Date(Date.now() - weeks * 7 * 86_400_000);
  const rows = await prisma.pmUpdate.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 300 });
  const projects = await prisma.project.findMany({
    where: { id: { in: [...new Set(rows.map((r) => r.projectId))] } },
    select: { id: true, name: true, color: true },
  });
  return rows.map((r) => {
    const p = projects.find((x) => x.id === r.projectId);
    return { ...updateDTO(r), projectName: p?.name ?? "Project", projectColor: p?.color ?? "#2251A3" };
  });
}

/** Ids of tasks whose blockers are not done yet (for board badges). */
export function blockedIds(tasks: TaskDTO[]): Set<string> {
  const open = new Set(tasks.filter((t) => !t.done).map((t) => t.id));
  return new Set(tasks.filter((t) => t.blockedBy.some((b) => open.has(b))).map((t) => t.id));
}
