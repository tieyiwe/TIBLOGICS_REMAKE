"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Ban, ChevronDown, ListChecks, MessageSquare, Plus, Repeat, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, EmptyState, SearchInput, Segmented, Select, Toolbar, useConfirm, useToast } from "@/components/admin/ui";
import type { ProjectBundle, TaskDTO } from "@/lib/admin/command-center/pm";
import { blockedIds } from "@/lib/admin/command-center/pm-client";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/admin/command-center/constants";
import { fmtMinutes, parseQuickAdd } from "@/lib/admin/command-center/dates";
import { api, ApiError, errMsg } from "../../_components/api";
import { emitChanged, isTypingTarget, useCc, type ProjectLite } from "../../_components/CcShell";
import { AssigneeChip, DueChip, inputCls, Label, PriorityIcon, SmartDateInput, StatusBadge, type StaffLite } from "../../_components/fields";

type View = "board" | "list" | "table";
const VIEW_KEY = "tib.cc.taskView";

export function TasksTab({
  b,
  staff,
  viewerId,
  projects,
  today,
  reload,
}: {
  b: ProjectBundle;
  staff: StaffLite[];
  viewerId: string;
  projects: ProjectLite[];
  today: string;
  reload: () => Promise<void>;
}) {
  const { openTask } = useCc();
  const toast = useToast();
  const confirm = useConfirm();
  const [view, setView] = useState<View>("board");
  const [q, setQ] = useState("");
  const [who, setWho] = useState("");
  const [prio, setPrio] = useState("");
  const [label, setLabel] = useState("");
  const [showDone, setShowDone] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [tasks, setTasks] = useState<TaskDTO[]>(b.tasks);
  useEffect(() => setTasks(b.tasks), [b.tasks]);
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(VIEW_KEY) as View | null;
      if (v === "board" || v === "list" || v === "table") setView(v);
    } catch {
      /* ignore */
    }
  }, []);
  const changeView = (v: string) => {
    setView(v as View);
    try {
      window.localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  };

  const blocked = useMemo(() => blockedIds(tasks), [tasks]);
  const subCount = useMemo(() => {
    const m = new Map<string, { n: number; done: number }>();
    for (const t of tasks) {
      if (!t.parentId) continue;
      const c = m.get(t.parentId) ?? { n: 0, done: 0 };
      c.n++;
      if (t.done) c.done++;
      m.set(t.parentId, c);
    }
    return m;
  }, [tasks]);
  const timeBy = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of b.time) if (e.taskId) m.set(e.taskId, (m.get(e.taskId) ?? 0) + e.minutes);
    return m;
  }, [b.time]);
  const allLabels = useMemo(() => [...new Set(tasks.flatMap((t) => t.labels))].sort(), [tasks]);

  const visible = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return tasks
      .filter((t) => !t.parentId)
      .filter((t) => (who === "me" ? t.assigneeId === viewerId : who === "none" ? !t.assigneeId : who ? t.assigneeId === who : true))
      .filter((t) => (prio ? t.priority === prio : true))
      .filter((t) => (label ? t.labels.includes(label) : true))
      .filter((t) => (ql ? `${t.title} ${t.description ?? ""} ${t.labels.join(" ")}`.toLowerCase().includes(ql) : true))
      .sort((a, c) => a.order - c.order);
  }, [tasks, q, who, prio, label, viewerId]);
  const listRows = useMemo(
    () => TASK_STATUSES.flatMap((s) => visible.filter((t) => t.status === s.value && (showDone || s.value !== "done"))),
    [visible, showDone],
  );

  // Optimistic single-field change.
  const change = async (t: TaskDTO, body: Record<string, unknown>, okMsg?: string) => {
    setTasks((ts) => ts.map((x) => (x.id === t.id ? ({ ...x, ...body, ...(body.status ? { done: body.status === "done" } : {}) } as TaskDTO) : x)));
    try {
      const r = await api<{ task: TaskDTO; spawned: TaskDTO | null }>(`/api/admin/pm/tasks/${t.id}`, { method: "PATCH", body });
      if (r.spawned) toast.info("Next occurrence scheduled", r.spawned.dueKey ?? "");
      else if (okMsg) toast.success(okMsg);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && body.status === "done") {
        if (await confirm({ title: "This task is still blocked", body: `${e.message}. Complete it anyway?`, confirmLabel: "Complete anyway" })) {
          await change(t, { ...body, force: true }, okMsg);
          return;
        }
      } else toast.error("Could not save", errMsg(e));
    }
    await reload();
    emitChanged({ kind: "task", projectId: b.project.id });
  };

  const bulk = async (body: Record<string, unknown>, label: string) => {
    const ids = [...selected];
    if (!ids.length) return;
    try {
      const r = await api<{ done: string[]; failed: Array<{ id: string; error: string }> }>("/api/admin/pm/tasks/bulk", { body: { ids, ...body } });
      if (r.failed.length) toast.error(`${r.failed.length} not changed`, r.failed[0].error);
      if (r.done.length) toast.success(`${label}: ${r.done.length} task${r.done.length === 1 ? "" : "s"}`);
      setSelected(new Set());
      await reload();
      emitChanged({ kind: "task", projectId: b.project.id });
    } catch (e) {
      toast.error("Bulk change failed", errMsg(e));
    }
  };

  // j / k / Enter / x / d on the list and table.
  const rowsRef = useRef(listRows);
  rowsRef.current = listRows;
  useEffect(() => {
    if (view === "board") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target) || document.querySelector('[role="dialog"]')) return;
      const rows = rowsRef.current;
      if (!rows.length) return;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(rows.length - 1, c + 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === "Enter" || e.key === "o") {
        const t = rows[Math.min(cursor, rows.length - 1)];
        if (t) {
          e.preventDefault();
          openTask(t.id);
        }
      } else if (e.key === "x") {
        const t = rows[cursor];
        if (t) setSelected((s) => toggleSet(s, t.id));
      } else if (e.key === "d") {
        const t = rows[cursor];
        if (t) void change(t, { status: t.done ? "todo" : "done" }, t.done ? "Reopened" : "Completed");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, cursor, openTask]);
  useEffect(() => {
    document.querySelector(`[data-row-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const common = { staff, today, blocked, subCount, commentCounts: b.commentCounts, timeBy, openTask };

  return (
    <div>
      <Toolbar
        end={
          <Segmented
            ariaLabel="Task layout"
            value={view}
            onChange={changeView}
            options={[
              { value: "board", label: "Board" },
              { value: "list", label: "List" },
              { value: "table", label: "Table" },
            ]}
          />
        }
      >
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter tasks" label="Filter tasks" />
        <Select label="Assignee" value={who} onChange={(e) => setWho(e.target.value)}>
          <option value="">Anyone</option>
          <option value="me">Me</option>
          <option value="none">Unassigned</option>
          {staff.filter((s) => s.id !== viewerId).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select label="Priority" value={prio} onChange={(e) => setPrio(e.target.value)}>
          <option value="">Any priority</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
        {allLabels.length ? (
          <Select label="Label" value={label} onChange={(e) => setLabel(e.target.value)}>
            <option value="">Any label</option>
            {allLabels.map((l) => (
              <option key={l} value={l}>
                #{l}
              </option>
            ))}
          </Select>
        ) : null}
        {view !== "board" ? (
          <label className="flex h-9 items-center gap-2 font-dm text-[13px] text-[var(--a-ink-2)]">
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="h-4 w-4 accent-[var(--a-blue)]" />
            Show done
          </label>
        ) : null}
      </Toolbar>

      {selected.size ? <BulkBar count={selected.size} staff={staff} projects={projects} currentProject={b.project.id} onClear={() => setSelected(new Set())} onApply={bulk} confirm={confirm} /> : null}

      {!tasks.some((t) => !t.parentId) ? (
        <EmptyState icon={ListChecks} title="No tasks yet" body="Press C anywhere in the Command Center, or add one to a column below." action={<QuickInline projectId={b.project.id} status="todo" onDone={reload} big />} />
      ) : view === "board" ? (
        <Board tasks={visible} {...common} projectId={b.project.id} onStatus={(t, s) => void change(t, { status: s }, s === "done" ? "Completed" : undefined)} reload={reload} />
      ) : view === "list" ? (
        <List rows={listRows} {...common} cursor={cursor} setCursor={setCursor} selected={selected} setSelected={setSelected} onToggle={(t) => void change(t, { status: t.done ? "todo" : "done" }, t.done ? "Reopened" : "Completed")} projectId={b.project.id} reload={reload} />
      ) : (
        <Table rows={listRows} {...common} cursor={cursor} selected={selected} setSelected={setSelected} change={change} />
      )}
      {view !== "board" && listRows.length ? (
        <p className="mt-3 hidden font-dm text-[12px] text-[var(--a-ink-3)] sm:block">
          Keys: <b>j</b>/<b>k</b> move, <b>Enter</b> open, <b>x</b> select, <b>d</b> done, <b>c</b> new task, <b>/</b> search.
        </p>
      ) : null}
    </div>
  );
}

function toggleSet(s: Set<string>, id: string) {
  const n = new Set(s);
  if (n.has(id)) n.delete(id);
  else n.add(id);
  return n;
}

type Common = {
  staff: StaffLite[];
  today: string;
  blocked: Set<string>;
  subCount: Map<string, { n: number; done: number }>;
  commentCounts: Record<string, number>;
  timeBy: Map<string, number>;
  openTask: (id: string) => void;
};

function Meta({ t, c }: { t: TaskDTO; c: Common }) {
  const sub = c.subCount.get(t.id);
  const comments = c.commentCounts[t.id];
  return (
    <>
      {c.blocked.has(t.id) ? (
        <span className="inline-flex items-center gap-0.5 font-semibold text-[var(--a-danger)]" title="Blocked by another task">
          <Ban size={12} aria-hidden /> Blocked
        </span>
      ) : null}
      {sub ? (
        <span className="inline-flex items-center gap-0.5 tabular-nums" title="Subtasks">
          <ListChecks size={12} aria-hidden /> {sub.done}/{sub.n}
        </span>
      ) : null}
      {comments ? (
        <span className="inline-flex items-center gap-0.5 tabular-nums" title="Comments">
          <MessageSquare size={12} aria-hidden /> {comments}
        </span>
      ) : null}
      {t.recurrence ? <Repeat size={12} aria-label={`Repeats ${t.recurrence}`} /> : null}
      {t.estimateMinutes ? <span className="tabular-nums" title="Logged of estimate">{fmtMinutes(c.timeBy.get(t.id) ?? 0)}/{fmtMinutes(t.estimateMinutes)}</span> : null}
    </>
  );
}

// ── Board ────────────────────────────────────────────────────────────────────

function Board({ tasks, projectId, onStatus, reload, ...c }: Common & { tasks: TaskDTO[]; projectId: string; onStatus: (t: TaskDTO, s: string) => void; reload: () => Promise<void> }) {
  const [over, setOver] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  return (
    <div className="a-scroll-thin -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
      {TASK_STATUSES.map((col) => {
        const items = tasks.filter((t) => t.status === col.value);
        const shown = col.value === "done" ? items.slice(-25) : items;
        return (
          <section
            key={col.value}
            aria-label={col.label}
            data-column={col.value}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOver(col.value);
            }}
            onDragLeave={(e) => {
              if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setOver((o) => (o === col.value ? null : o));
            }}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/task");
              const t = tasks.find((x) => x.id === id);
              if (t && t.status !== col.value) onStatus(t, col.value);
            }}
            className={cn(
              "flex w-[85vw] max-w-[310px] shrink-0 flex-col rounded-[var(--a-radius-card)] border p-2 transition-colors sm:w-[300px]",
              over === col.value ? "border-[var(--a-blue)] bg-[var(--a-info-bg)]" : "border-[var(--a-border)] bg-[var(--a-surface-2)]/70",
            )}
          >
            <header className="flex items-center gap-2 px-2 pb-2 pt-1">
              <StatusBadge status={col.value} />
              <span className="font-dm text-[12px] tabular-nums text-[var(--a-ink-3)]">{items.length}</span>
            </header>
            <ul className="flex min-h-[60px] flex-col gap-2">
              {shown.map((t) => (
                <li
                  key={t.id}
                  draggable
                  data-task={t.id}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/task", t.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDragging(t.id);
                  }}
                  onDragEnd={() => setDragging(null)}
                  className={cn(
                    "group relative cursor-grab rounded-[10px] border border-[var(--a-border)] bg-[var(--a-surface)] p-3 shadow-[var(--a-shadow-card)] transition-shadow hover:border-[var(--a-border-strong)] active:cursor-grabbing",
                    dragging === t.id && "opacity-50",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <PriorityIcon priority={t.priority} className="mt-0.5 shrink-0" />
                    <button type="button" onClick={() => c.openTask(t.id)} className={cn("min-w-0 flex-1 text-left font-dm text-[13.5px] font-semibold leading-snug hover:underline", t.done ? "text-[var(--a-ink-3)] line-through" : "text-[var(--a-ink)]")}>
                      {t.title}
                    </button>
                    <AssigneeChip staff={c.staff} id={t.assigneeId} size={22} />
                  </div>
                  {t.labels.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.labels.map((l) => (
                        <Label key={l}>#{l}</Label>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-dm text-[11.5px] text-[var(--a-ink-3)]">
                    <DueChip dueKey={t.dueKey} done={t.done} today={c.today} />
                    <Meta t={t} c={c} />
                  </div>
                  <label className="sr-only" htmlFor={`st-${t.id}`}>
                    Move {t.title}
                  </label>
                  <select
                    id={`st-${t.id}`}
                    value={t.status}
                    onChange={(e) => onStatus(t, e.target.value)}
                    className="sr-only focus:not-sr-only focus:mt-2 focus:block focus:w-full focus:rounded focus:border focus:p-1 focus:font-dm focus:text-[12px]"
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
            {col.value === "done" && items.length > shown.length ? (
              <p className="px-2 pt-2 font-dm text-[12px] text-[var(--a-ink-3)]">{items.length - shown.length} older done tasks in List view</p>
            ) : null}
            {col.value !== "done" ? <QuickInline projectId={projectId} status={col.value} onDone={reload} /> : null}
          </section>
        );
      })}
    </div>
  );
}

function QuickInline({ projectId, status, onDone, big }: { projectId: string; status: string; onDone: () => Promise<void>; big?: boolean }) {
  const { staff, viewerId } = useCc();
  const toast = useToast();
  const [open, setOpen] = useState(!!big);
  const [v, setV] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 flex h-8 items-center gap-1.5 rounded-md px-2 font-dm text-[13px] font-semibold text-[var(--a-ink-3)] hover:bg-[var(--a-surface)] hover:text-[var(--a-ink)]">
        <Plus size={14} aria-hidden /> Add task
      </button>
    );
  }
  return (
    <form
      className={cn("mt-2 flex gap-1.5", big && "w-full max-w-md")}
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = parseQuickAdd(v, new Date().toISOString().slice(0, 10), staff);
        if (!parsed.title || busy) return;
        setBusy(true);
        try {
          await api("/api/admin/pm/tasks", {
            body: { projectId, status, title: parsed.title, dueKey: parsed.dueKey, labels: parsed.labels, assigneeId: parsed.assigneeId ?? viewerId, ...(parsed.priority ? { priority: parsed.priority } : {}) },
          });
          setV("");
          await onDone();
          emitChanged({ kind: "task", projectId });
        } catch (err) {
          toast.error("Could not add", errMsg(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <input
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && !big && (e.stopPropagation(), setOpen(false))}
        placeholder="Task title, e.g. Draft brief fri"
        aria-label="New task title"
        className={cn(inputCls, "h-8")}
      />
      <Button size="sm" type="submit" variant="primary" loading={busy} disabled={!v.trim()}>
        Add
      </Button>
    </form>
  );
}

// ── List ─────────────────────────────────────────────────────────────────────

function List({
  rows,
  cursor,
  setCursor,
  selected,
  setSelected,
  onToggle,
  projectId,
  reload,
  ...c
}: Common & {
  rows: TaskDTO[];
  cursor: number;
  setCursor: (n: number) => void;
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  onToggle: (t: TaskDTO) => void;
  projectId: string;
  reload: () => Promise<void>;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  let index = -1;
  return (
    <div className="overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]">
      {TASK_STATUSES.map((s) => {
        const group = rows.filter((t) => t.status === s.value);
        if (!group.length && s.value === "done") return null;
        const isCollapsed = collapsed.has(s.value);
        return (
          <div key={s.value}>
            <div className="flex items-center gap-2 border-b border-[var(--a-border)] bg-[var(--a-surface-2)] px-3 py-1.5">
              <button type="button" aria-expanded={!isCollapsed} onClick={() => setCollapsed((x) => toggleSet(x, s.value))} className="flex items-center gap-2" aria-label={`${s.label}, ${group.length} tasks`}>
                <ChevronDown size={14} className={cn("text-[var(--a-ink-3)] transition-transform", isCollapsed && "-rotate-90")} aria-hidden />
                <StatusBadge status={s.value} />
                <span className="font-dm text-[12px] tabular-nums text-[var(--a-ink-3)]">{group.length}</span>
              </button>
            </div>
            {!isCollapsed ? (
              <ul>
                {group.map((t) => {
                  index++;
                  const i = index;
                  const active = i === cursor;
                  return (
                    <li
                      key={t.id}
                      data-row-index={i}
                      onMouseEnter={() => setCursor(i)}
                      className={cn("flex items-center gap-2.5 border-b border-[var(--a-border)] px-3 py-2 last:border-b-0", active && "bg-[#f3f6fb] shadow-[inset_2px_0_0_var(--a-blue)]")}
                    >
                      <input type="checkbox" checked={selected.has(t.id)} onChange={() => setSelected(toggleSet(selected, t.id))} aria-label={`Select ${t.title}`} className="h-4 w-4 accent-[var(--a-blue)]" />
                      <button
                        type="button"
                        onClick={() => onToggle(t)}
                        aria-label={t.done ? `Reopen ${t.title}` : `Complete ${t.title}`}
                        className={cn("flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2", t.done ? "border-[var(--a-success)] bg-[var(--a-success)] text-white" : "border-[var(--a-border-strong)] hover:border-[var(--a-success)]")}
                      >
                        {t.done ? <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden><path d="M2.5 6.2 5 8.5 9.5 3.5" fill="none" stroke="currentColor" strokeWidth="2" /></svg> : null}
                      </button>
                      <PriorityIcon priority={t.priority} className="shrink-0" />
                      <button type="button" onClick={() => c.openTask(t.id)} className={cn("min-w-0 flex-1 truncate text-left font-dm text-[14px] hover:underline", t.done ? "text-[var(--a-ink-3)] line-through" : "text-[var(--a-ink)]")}>
                        {t.title}
                      </button>
                      <span className="hidden items-center gap-2 font-dm text-[12px] text-[var(--a-ink-3)] md:flex">
                        {t.labels.slice(0, 3).map((l) => (
                          <Label key={l}>#{l}</Label>
                        ))}
                        <Meta t={t} c={c} />
                      </span>
                      <DueChip dueKey={t.dueKey} done={t.done} today={c.today} />
                      <AssigneeChip staff={c.staff} id={t.assigneeId} size={22} />
                    </li>
                  );
                })}
                {s.value !== "done" ? (
                  <li className="px-3 py-1.5">
                    <QuickInline projectId={projectId} status={s.value} onDone={reload} />
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ── Table (inline edit) ──────────────────────────────────────────────────────

function Table({
  rows,
  cursor,
  selected,
  setSelected,
  change,
  ...c
}: Common & {
  rows: TaskDTO[];
  cursor: number;
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  change: (t: TaskDTO, body: Record<string, unknown>, ok?: string) => Promise<void>;
}) {
  const all = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const th = "whitespace-nowrap border-b border-[var(--a-border)] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]";
  const cell = "h-8 rounded-md border border-transparent bg-transparent px-1.5 font-dm text-[13px] text-[var(--a-ink)] hover:border-[var(--a-border)] focus:border-[var(--a-blue)] focus:bg-white focus:outline-none";
  return (
    <div className="overflow-x-auto rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]">
      <table className="w-full min-w-[920px] border-collapse font-dm text-[13px]">
        <thead className="bg-[var(--a-surface-2)]">
          <tr>
            <th className={cn(th, "w-10")}>
              <input type="checkbox" checked={all} onChange={() => setSelected(all ? new Set() : new Set(rows.map((r) => r.id)))} aria-label="Select all" className="h-4 w-4 accent-[var(--a-blue)]" />
            </th>
            <th className={th}>Task</th>
            <th className={th}>Status</th>
            <th className={th}>Priority</th>
            <th className={th}>Assignee</th>
            <th className={th}>Due</th>
            <th className={th}>Estimate</th>
            <th className={th}>Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr key={t.id} data-row-index={i} className={cn("border-b border-[var(--a-border)] last:border-b-0", i === cursor && "bg-[#f3f6fb]")}>
              <td className="px-3 py-1.5">
                <input type="checkbox" checked={selected.has(t.id)} onChange={() => setSelected(toggleSet(selected, t.id))} aria-label={`Select ${t.title}`} className="h-4 w-4 accent-[var(--a-blue)]" />
              </td>
              <td className="min-w-[280px] px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <InlineText value={t.title} onSave={(v) => void change(t, { title: v })} className={cn(cell, "flex-1", t.done && "text-[var(--a-ink-3)] line-through")} label={`Title of ${t.title}`} />
                  <button type="button" onClick={() => c.openTask(t.id)} className="shrink-0 rounded px-1.5 py-1 font-dm text-[12px] font-semibold text-[var(--a-blue)] hover:bg-[var(--a-info-bg)]">
                    Open
                  </button>
                </div>
              </td>
              <td className="px-2 py-1.5">
                <select value={t.status} onChange={(e) => void change(t, { status: e.target.value })} aria-label={`Status of ${t.title}`} className={cell}>
                  {TASK_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-2 py-1.5">
                <select value={t.priority} onChange={(e) => void change(t, { priority: e.target.value })} aria-label={`Priority of ${t.title}`} className={cell}>
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-2 py-1.5">
                <select value={t.assigneeId ?? ""} onChange={(e) => void change(t, { assigneeId: e.target.value || null })} aria-label={`Assignee of ${t.title}`} className={cell}>
                  <option value="">Unassigned</option>
                  {c.staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="w-[190px] px-2 py-1.5">
                <SmartDateInput ariaLabel={`Due date of ${t.title}`} value={t.dueKey} onChange={(k) => void change(t, { dueKey: k })} placeholder="No date" />
              </td>
              <td className="px-3 py-1.5 tabular-nums text-[var(--a-ink-2)]">{t.estimateMinutes ? fmtMinutes(t.estimateMinutes) : ""}</td>
              <td className="px-3 py-1.5 tabular-nums text-[var(--a-ink-2)]">{c.timeBy.get(t.id) ? fmtMinutes(c.timeBy.get(t.id)!) : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InlineText({ value, onSave, className, label }: { value: string; onSave: (v: string) => void; className?: string; label: string }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v.trim() && v.trim() !== value && onSave(v.trim())}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setV(value);
      }}
      aria-label={label}
      className={className}
    />
  );
}

// ── Bulk bar ─────────────────────────────────────────────────────────────────

function BulkBar({
  count,
  staff,
  projects,
  currentProject,
  onClear,
  onApply,
  confirm,
}: {
  count: number;
  staff: StaffLite[];
  projects: ProjectLite[];
  currentProject: string;
  onClear: () => void;
  onApply: (body: Record<string, unknown>, label: string) => Promise<void>;
  confirm: ReturnType<typeof useConfirm>;
}) {
  const sel = "h-8 rounded-[8px] border border-white/25 bg-white/10 px-2 font-dm text-[12.5px] text-white focus:outline-none focus:ring-2 focus:ring-white/40 [&>option]:text-[var(--a-ink)]";
  return (
    <div className="sticky top-0 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-[12px] bg-[var(--a-navy)] px-3 py-2 text-white shadow-[var(--a-shadow-pop)]" role="region" aria-label="Bulk actions">
      <span className="font-dm text-[13px] font-semibold">{count} selected</span>
      <select className={sel} aria-label="Set status" value="" onChange={(e) => e.target.value && void onApply({ action: "status", status: e.target.value }, "Status set")}>
        <option value="">Status</option>
        {TASK_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <select className={sel} aria-label="Set priority" value="" onChange={(e) => e.target.value && void onApply({ action: "priority", priority: e.target.value }, "Priority set")}>
        <option value="">Priority</option>
        {TASK_PRIORITIES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <select className={sel} aria-label="Assign to" value="" onChange={(e) => e.target.value && void onApply({ action: "assign", assigneeId: e.target.value === "__none" ? null : e.target.value }, "Assigned")}>
        <option value="">Assign</option>
        <option value="__none">Unassigned</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <input type="date" className={sel} aria-label="Set due date" onChange={(e) => e.target.value && void onApply({ action: "due", dueKey: e.target.value }, "Due date set")} />
      <select className={sel} aria-label="Move to project" value="" onChange={(e) => e.target.value && void onApply({ action: "move", projectId: e.target.value }, "Moved")}>
        <option value="">Move to</option>
        {projects
          .filter((p) => p.id !== currentProject)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
      </select>
      <button
        type="button"
        onClick={async () => {
          if (await confirm({ title: `Delete ${count} task${count === 1 ? "" : "s"}?`, body: "Their subtasks go too. This cannot be undone.", danger: true, confirmLabel: "Delete" })) {
            await onApply({ action: "delete" }, "Deleted");
          }
        }}
        className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-[var(--a-danger)] px-2.5 font-dm text-[12.5px] font-semibold hover:bg-[#991b1b]"
      >
        <Trash2 size={13} aria-hidden /> Delete
      </button>
      <button type="button" onClick={onClear} aria-label="Clear selection" className="ml-auto flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10">
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
