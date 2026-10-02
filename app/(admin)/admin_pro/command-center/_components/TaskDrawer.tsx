"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ban, CirclePlay, Clock, Link2, MessageSquare, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Button, Drawer, useConfirm, useToast } from "@/components/admin/ui";
import type { ActivityDTO, CommentDTO, MilestoneDTO, ProjectBundle, TaskDTO, TimeEntryDTO } from "@/lib/admin/command-center/pm";
import { fmtDay, fmtMinutes, localTodayKey, parseDuration } from "@/lib/admin/command-center/dates";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/admin/command-center/constants";
import { api, ApiError, errMsg } from "./api";
import { emitChanged, useCc, useOnCcChange } from "./CcShell";
import { Field, inputCls, SelectInput, SmartDateInput, TextInput } from "./fields";
import { Markdown } from "./Markdown";
import { MarkdownEditor } from "./MarkdownEditor";

type Detail = { task: TaskDTO; comments: CommentDTO[]; activity: ActivityDTO[] };

export function TaskDrawer({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  return (
    <Drawer open={!!taskId} onClose={onClose} width={640} hideHeader ariaLabel="Task details">
      {taskId ? <TaskPanel key={taskId} taskId={taskId} onClose={onClose} /> : null}
    </Drawer>
  );
}

function TaskPanel({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { staff, viewerId, refreshTimer, openTask } = useCc();
  const toast = useToast();
  const confirm = useConfirm();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [bundle, setBundle] = useState<ProjectBundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api<Detail>(`/api/admin/pm/tasks/${taskId}`);
      setDetail(d);
      const b = await api<ProjectBundle>(`/api/admin/pm/projects/${d.task.projectId}`);
      setBundle(b);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [taskId]);
  useEffect(() => {
    void load();
  }, [load]);
  useOnCcChange((d) => {
    if (d.kind === "drawer") return;
    if (!detail || !d.projectId || d.projectId === detail.task.projectId) void load();
  });

  const task = detail?.task;
  const siblings = useMemo(() => (bundle?.tasks ?? []).filter((t) => t.id !== taskId), [bundle, taskId]);
  const subtasks = useMemo(() => siblings.filter((t) => t.parentId === taskId).sort((a, b) => a.order - b.order), [siblings, taskId]);
  const time = useMemo(() => (bundle?.time ?? []).filter((t) => t.taskId === taskId), [bundle, taskId]);
  const loggedMin = time.reduce((n, t) => n + t.minutes, 0);

  const patch = async (body: Record<string, unknown>, okMsg?: string): Promise<boolean> => {
    if (!task) return false;
    try {
      const r = await api<{ task: TaskDTO; spawned: TaskDTO | null }>(`/api/admin/pm/tasks/${task.id}`, { method: "PATCH", body });
      setDetail((d) => (d ? { ...d, task: r.task } : d));
      emitChanged({ kind: "drawer", projectId: r.task.projectId });
      if (r.spawned) toast.info("Next occurrence scheduled", `Due ${fmtDay(r.spawned.dueKey)}`);
      else if (okMsg) toast.success(okMsg);
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && body.status === "done") {
        const ok = await confirm({ title: "This task is still blocked", body: `${e.message}. Complete it anyway?`, confirmLabel: "Complete anyway" });
        if (ok) return patch({ ...body, force: true }, okMsg);
        return false;
      }
      toast.error("Could not save", errMsg(e));
      return false;
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <p className="font-dm text-sm text-[var(--a-danger)]">{error}</p>
        <Button className="mt-4" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }
  if (!task || !bundle) {
    return (
      <div className="space-y-3 p-6" aria-busy>
        <div className="a-skeleton h-6 w-2/3 rounded" />
        <div className="a-skeleton h-4 w-1/2 rounded" />
        <div className="a-skeleton h-40 w-full rounded" />
      </div>
    );
  }

  const parent = task.parentId ? bundle.tasks.find((t) => t.id === task.parentId) : null;
  const openBlockers = task.blockedBy.map((id) => bundle.tasks.find((t) => t.id === id)).filter((t): t is TaskDTO => !!t && !t.done);

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[var(--a-border)] bg-[var(--a-surface)] px-5 py-3">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: bundle.project.color }} aria-hidden />
        <Link href={`/admin_pro/command-center/projects/${bundle.project.id}`} className="min-w-0 truncate font-dm text-[13px] font-semibold text-[var(--a-ink-3)] hover:text-[var(--a-ink)] hover:underline">
          {bundle.project.name}
        </Link>
        {parent ? (
          <>
            <span className="text-[var(--a-ink-3)]">/</span>
            <button type="button" onClick={() => openTask(parent.id)} className="min-w-0 truncate font-dm text-[13px] text-[var(--a-ink-3)] hover:text-[var(--a-ink)] hover:underline">
              {parent.title}
            </button>
          </>
        ) : null}
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
            aria-label="Delete task"
            onClick={async () => {
              const ok = await confirm({ title: `Delete "${task.title}"?`, body: subtasks.length ? `Its ${subtasks.length} subtasks go too.` : "This cannot be undone.", danger: true, confirmLabel: "Delete task" });
              if (!ok) return;
              try {
                await api(`/api/admin/pm/tasks/${task.id}`, { method: "DELETE" });
                toast.success("Task deleted");
                emitChanged({ kind: "task", projectId: task.projectId });
                onClose();
              } catch (e) {
                toast.error("Could not delete", errMsg(e));
              }
            }}
          />
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-[var(--a-radius-control)] text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)] hover:text-[var(--a-ink)]">
            <X size={18} aria-hidden />
          </button>
        </div>
      </div>

      <div className="space-y-6 px-5 py-5">
        {/* Title + complete */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={task.done}
            onChange={(e) => void patch({ status: e.target.checked ? "done" : "todo" }, e.target.checked ? "Task completed" : "Task reopened")}
            aria-label={task.done ? "Mark as not done" : "Mark as done"}
            className="mt-2 h-5 w-5 shrink-0 accent-[var(--a-success)]"
          />
          <TitleInput value={task.title} onSave={(v) => void patch({ title: v })} done={task.done} />
        </div>
        {openBlockers.length ? (
          <div className="flex items-start gap-2 rounded-[10px] border border-[#f6cccc] bg-[var(--a-danger-bg)] px-3 py-2 font-dm text-[13px] text-[#7f1d1d]">
            <Ban size={15} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              Blocked by{" "}
              {openBlockers.map((b, i) => (
                <span key={b.id}>
                  {i ? ", " : ""}
                  <button type="button" className="font-semibold underline" onClick={() => openTask(b.id)}>
                    {b.title}
                  </button>
                </span>
              ))}
            </span>
          </div>
        ) : null}

        {/* Properties */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Status" htmlFor="td-status">
            <SelectInput id="td-status" value={task.status} onChange={(e) => void patch({ status: e.target.value })}>
              {TASK_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Priority" htmlFor="td-priority">
            <SelectInput id="td-priority" value={task.priority} onChange={(e) => void patch({ priority: e.target.value })}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Assignee" htmlFor="td-assignee">
            <SelectInput id="td-assignee" value={task.assigneeId ?? ""} onChange={(e) => void patch({ assigneeId: e.target.value || null }, "Assignee updated")}>
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.id === viewerId ? " (me)" : ""}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Due date" htmlFor="td-due">
            <SmartDateInput id="td-due" ariaLabel="Due date" value={task.dueKey} onChange={(k) => void patch({ dueKey: k })} />
          </Field>
          <Field label="Start date" htmlFor="td-start" hint="Shows the task as a bar on the timeline.">
            <SmartDateInput id="td-start" ariaLabel="Start date" value={task.startKey} onChange={(k) => void patch({ startKey: k })} />
          </Field>
          <Field label="Estimate" htmlFor="td-est" hint={loggedMin ? `${fmtMinutes(loggedMin)} logged` : "e.g. 90m, 2h, 1h 30m"}>
            <EstimateInput id="td-est" value={task.estimateMinutes} onSave={(m) => void patch({ estimateMinutes: m })} />
          </Field>
          <Field label="Repeats" htmlFor="td-rec" hint={task.recurrence ? "Completing it schedules the next one." : undefined}>
            <SelectInput id="td-rec" value={task.recurrence ?? ""} onChange={(e) => void patch({ recurrence: e.target.value || null })}>
              <option value="">Does not repeat</option>
              <option value="weekly">Every week</option>
              <option value="monthly">Every month</option>
            </SelectInput>
          </Field>
          <Field label="Milestone" htmlFor="td-ms">
            <SelectInput id="td-ms" value={task.milestoneId ?? ""} onChange={(e) => void patch({ milestoneId: e.target.value || null })}>
              <option value="">None</option>
              {bundle.milestones.map((m: MilestoneDTO) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({fmtDay(m.dueKey)})
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <LabelsEditor labels={task.labels} onSave={(labels) => void patch({ labels })} />

        <BlockersEditor task={task} siblings={siblings.filter((t) => !t.parentId || t.parentId !== task.id)} onSave={(ids) => void patch({ blockedBy: ids }, "Dependencies updated")} openTask={openTask} />

        {/* Description */}
        <DescriptionEditor value={task.description ?? ""} onSave={(v) => patch({ description: v || null }, "Description saved")} />

        {/* Subtasks */}
        {!task.parentId ? <Subtasks task={task} subtasks={subtasks} reload={load} /> : null}

        {/* Links */}
        <LinksEditor links={task.links} onSave={(links) => patch({ links }, "Links saved")} />

        {/* Time */}
        <TimeSection
          task={task}
          entries={time}
          logged={loggedMin}
          onChanged={() => {
            refreshTimer();
            void load();
            emitChanged({ kind: "time", projectId: task.projectId });
          }}
        />

        {/* Comments */}
        <Comments taskId={task.id} comments={detail.comments} onAdded={(c) => setDetail((d) => (d ? { ...d, comments: [...d.comments, c] } : d))} />

        {/* Activity */}
        {detail.activity.length ? (
          <section>
            <h3 className="a-micro font-dm mb-2">Activity</h3>
            <ul className="space-y-1.5">
              {detail.activity.slice(0, 15).map((a) => (
                <li key={a.id} className="font-dm text-[12.5px] text-[var(--a-ink-3)]">
                  <span className="font-semibold text-[var(--a-ink-2)]">{a.actorName}</span> {a.summary}
                  <span className="ml-1.5">· {timeAgo(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TitleInput({ value, onSave, done }: { value: string; onSave: (v: string) => void; done: boolean }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <textarea
      value={v}
      rows={1}
      onChange={(e) => setV(e.target.value.replace(/\n/g, " "))}
      onBlur={() => v.trim() && v.trim() !== value && onSave(v.trim())}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLTextAreaElement).blur();
        }
      }}
      aria-label="Task title"
      className={cn(
        "min-w-0 flex-1 resize-none rounded-md border border-transparent bg-transparent px-1 py-0.5 font-syne text-[20px] font-bold leading-snug text-[var(--a-ink)] hover:border-[var(--a-border)] focus:border-[var(--a-blue)] focus:outline-none",
        done && "text-[var(--a-ink-3)] line-through",
      )}
      style={{ fieldSizing: "content" } as React.CSSProperties}
    />
  );
}

function EstimateInput({ id, value, onSave }: { id: string; value: number | null; onSave: (m: number | null) => void }) {
  const [v, setV] = useState(value ? fmtMinutes(value) : "");
  const [bad, setBad] = useState(false);
  useEffect(() => setV(value ? fmtMinutes(value) : ""), [value]);
  const commit = () => {
    if (!v.trim()) {
      setBad(false);
      if (value) onSave(null);
      return;
    }
    const m = parseDuration(v);
    if (m === null) return setBad(true);
    setBad(false);
    if (m !== value) onSave(m);
  };
  return (
    <TextInput
      id={id}
      value={v}
      placeholder="e.g. 2h"
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), commit())}
      aria-invalid={bad || undefined}
      className={bad ? "border-[var(--a-danger)]" : undefined}
    />
  );
}

function LabelsEditor({ labels, onSave }: { labels: string[]; onSave: (l: string[]) => void }) {
  const [v, setV] = useState("");
  const add = () => {
    const l = v.trim().toLowerCase().replace(/^#/, "");
    if (!l || labels.includes(l)) return setV("");
    onSave([...labels, l]);
    setV("");
  };
  return (
    <section>
      <h3 className="a-micro font-dm mb-2">Labels</h3>
      <div className="flex flex-wrap items-center gap-1.5">
        {labels.map((l) => (
          <span key={l} className="inline-flex items-center gap-1 rounded-md bg-[var(--a-surface-2)] py-0.5 pl-2 pr-1 font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)] ring-1 ring-inset ring-[var(--a-border)]">
            #{l}
            <button type="button" aria-label={`Remove label ${l}`} onClick={() => onSave(labels.filter((x) => x !== l))} className="rounded p-0.5 hover:bg-white">
              <X size={12} aria-hidden />
            </button>
          </span>
        ))}
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder="Add label"
          aria-label="Add label"
          className={cn(inputCls, "h-8 w-32")}
        />
      </div>
    </section>
  );
}

function BlockersEditor({ task, siblings, onSave, openTask }: { task: TaskDTO; siblings: TaskDTO[]; onSave: (ids: string[]) => void; openTask: (id: string) => void }) {
  const options = siblings.filter((t) => !task.blockedBy.includes(t.id) && t.id !== task.id);
  return (
    <section>
      <h3 className="a-micro font-dm mb-2">Blocked by</h3>
      <div className="space-y-1.5">
        {task.blockedBy.map((id) => {
          const t = siblings.find((x) => x.id === id);
          if (!t) return null;
          return (
            <div key={id} className="flex items-center gap-2 rounded-[10px] border border-[var(--a-border)] px-3 py-1.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", t.done ? "bg-[var(--a-success)]" : "bg-[var(--a-danger)]")} aria-hidden />
              <button type="button" onClick={() => openTask(t.id)} className={cn("min-w-0 flex-1 truncate text-left font-dm text-[13px] hover:underline", t.done ? "text-[var(--a-ink-3)] line-through" : "text-[var(--a-ink)]")}>
                {t.title}
              </button>
              <button type="button" aria-label={`Remove dependency on ${t.title}`} onClick={() => onSave(task.blockedBy.filter((b) => b !== id))} className="rounded p-1 text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)]">
                <X size={14} aria-hidden />
              </button>
            </div>
          );
        })}
        <SelectInput
          value=""
          aria-label="Add a task this one waits on"
          onChange={(e) => e.target.value && onSave([...task.blockedBy, e.target.value])}
          className="text-[var(--a-ink-3)]"
        >
          <option value="">{options.length ? "Add a task this one waits on" : "No other tasks in this project"}</option>
          {options.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
              {t.done ? " (done)" : ""}
            </option>
          ))}
        </SelectInput>
      </div>
    </section>
  );
}

function DescriptionEditor({ value, onSave }: { value: string; onSave: (v: string) => Promise<boolean> }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!editing) setV(value);
  }, [value, editing]);
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="a-micro font-dm">Description</h3>
        {!editing ? (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            {value ? "Edit" : "Add description"}
          </Button>
        ) : null}
      </div>
      {editing ? (
        <div className="space-y-2">
          <MarkdownEditor value={v} onChange={setV} ariaLabel="Task description" placeholder="Context, acceptance criteria, links" minRows={6} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => (setEditing(false), setV(value))}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                if (await onSave(v)) setEditing(false);
                setBusy(false);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      ) : value ? (
        <button type="button" onClick={() => setEditing(true)} className="block w-full rounded-[10px] px-1 py-1 text-left hover:bg-[var(--a-surface-2)]" aria-label="Edit description">
          <Markdown source={value} />
        </button>
      ) : null}
    </section>
  );
}

function Subtasks({ task, subtasks, reload }: { task: TaskDTO; subtasks: TaskDTO[]; reload: () => Promise<void> }) {
  const toast = useToast();
  const [v, setV] = useState("");
  const [busy, setBusy] = useState(false);
  const done = subtasks.filter((s) => s.done).length;
  const toggle = async (s: TaskDTO) => {
    try {
      await api(`/api/admin/pm/tasks/${s.id}`, { method: "PATCH", body: { status: s.done ? "todo" : "done", force: true } });
      await reload();
      emitChanged({ kind: "drawer", projectId: task.projectId });
    } catch (e) {
      toast.error("Could not update", errMsg(e));
    }
  };
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="a-micro font-dm">Subtasks</h3>
        {subtasks.length ? <span className="font-dm text-[12px] tabular-nums text-[var(--a-ink-3)]">{done}/{subtasks.length}</span> : null}
      </div>
      <ul className="space-y-1">
        {subtasks.map((s) => (
          <li key={s.id} className="group flex items-center gap-2 rounded-[8px] px-1 py-1 hover:bg-[var(--a-surface-2)]">
            <input type="checkbox" checked={s.done} onChange={() => void toggle(s)} aria-label={`${s.title}: ${s.done ? "done" : "not done"}`} className="h-4 w-4 accent-[var(--a-success)]" />
            <span className={cn("min-w-0 flex-1 truncate font-dm text-[13.5px]", s.done ? "text-[var(--a-ink-3)] line-through" : "text-[var(--a-ink)]")}>{s.title}</span>
            <button
              type="button"
              aria-label={`Delete subtask ${s.title}`}
              onClick={async () => {
                await api(`/api/admin/pm/tasks/${s.id}`, { method: "DELETE" }).catch((e) => toast.error("Could not delete", errMsg(e)));
                await reload();
                emitChanged({ kind: "drawer", projectId: task.projectId });
              }}
              className="rounded p-1 text-[var(--a-ink-3)] opacity-0 hover:bg-white group-hover:opacity-100 focus:opacity-100"
            >
              <X size={14} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-1.5 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!v.trim() || busy) return;
          setBusy(true);
          try {
            await api("/api/admin/pm/tasks", { body: { projectId: task.projectId, parentId: task.id, title: v.trim() } });
            setV("");
            await reload();
            emitChanged({ kind: "drawer", projectId: task.projectId });
          } catch (err) {
            toast.error("Could not add", errMsg(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <TextInput value={v} onChange={(e) => setV(e.target.value)} placeholder="Add a subtask or checklist item" aria-label="New subtask" className="h-8" />
        <Button size="sm" type="submit" icon={Plus} loading={busy} disabled={!v.trim()} aria-label="Add subtask">
          Add
        </Button>
      </form>
    </section>
  );
}

function LinksEditor({ links, onSave }: { links: Array<{ label: string; url: string }>; onSave: (l: Array<{ label: string; url: string }>) => Promise<boolean> }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  return (
    <section>
      <h3 className="a-micro font-dm mb-2">Attachments and links</h3>
      <ul className="space-y-1">
        {links.map((l, i) => (
          <li key={i} className="flex items-center gap-2">
            <Link2 size={14} className="shrink-0 text-[var(--a-ink-3)]" aria-hidden />
            <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="min-w-0 flex-1 truncate font-dm text-[13.5px] text-[var(--a-blue)] hover:underline">
              {l.label || l.url}
            </a>
            <button type="button" aria-label={`Remove link ${l.label || l.url}`} onClick={() => void onSave(links.filter((_, j) => j !== i))} className="rounded p-1 text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)]">
              <X size={14} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.4fr_auto]"
        onSubmit={async (e) => {
          e.preventDefault();
          const u = url.trim();
          if (!u) return;
          const full = /^https?:\/\//i.test(u) ? u : `https://${u}`;
          if (await onSave([...links, { label: label.trim(), url: full }])) {
            setLabel("");
            setUrl("");
          }
        }}
      >
        <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional)" aria-label="Link label" className="h-8" />
        <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs.google.com/..." aria-label="Link URL" className="h-8" />
        <Button size="sm" type="submit" icon={Plus} disabled={!url.trim()}>
          Add link
        </Button>
      </form>
    </section>
  );
}

function TimeSection({ task, entries, logged, onChanged }: { task: TaskDTO; entries: TimeEntryDTO[]; logged: number; onChanged: () => void }) {
  const toast = useToast();
  const [v, setV] = useState("");
  const running = entries.find((e) => !e.endedAt);
  const pctOfEstimate = task.estimateMinutes ? Math.round((logged / task.estimateMinutes) * 100) : null;
  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="a-micro font-dm">Time</h3>
        <span className="font-dm text-[12.5px] tabular-nums text-[var(--a-ink-3)]">
          {fmtMinutes(logged)} logged{task.estimateMinutes ? ` of ${fmtMinutes(task.estimateMinutes)} (${pctOfEstimate}%)` : ""}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={running ? "secondary" : "primary"}
          icon={running ? Clock : CirclePlay}
          onClick={async () => {
            try {
              if (running) await api("/api/admin/pm/time", { body: { action: "stop" } });
              else await api("/api/admin/pm/time", { body: { action: "start", projectId: task.projectId, taskId: task.id } });
              toast.success(running ? "Timer stopped" : "Timer started");
              emitChanged({ kind: "timer" });
              onChanged();
            } catch (e) {
              toast.error("Timer", errMsg(e));
            }
          }}
        >
          {running ? "Stop timer" : "Start timer"}
        </Button>
        <form
          className="flex items-center gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const m = parseDuration(v);
            if (!m) return toast.error("Enter time like 45m or 1h 30m");
            try {
              await api("/api/admin/pm/time", { body: { action: "log", projectId: task.projectId, taskId: task.id, minutes: m, dayKey: localTodayKey() } });
              setV("");
              toast.success("Time logged", fmtMinutes(m));
              onChanged();
            } catch (err) {
              toast.error("Could not log time", errMsg(err));
            }
          }}
        >
          <TextInput value={v} onChange={(e) => setV(e.target.value)} placeholder="45m" aria-label="Log time" className="h-8 w-24" />
          <Button size="sm" type="submit" disabled={!v.trim()}>
            Log
          </Button>
        </form>
      </div>
      {entries.filter((e) => e.endedAt).length ? (
        <ul className="mt-2 space-y-1">
          {entries
            .filter((e) => e.endedAt)
            .slice(0, 8)
            .map((e) => (
              <li key={e.id} className="flex items-center gap-2 font-dm text-[12.5px] text-[var(--a-ink-3)]">
                <Clock size={12} aria-hidden />
                <span className="font-semibold tabular-nums text-[var(--a-ink-2)]">{fmtMinutes(e.minutes)}</span>
                <span>{e.staffName}</span>
                <span>· {fmtDay(e.startedAt.slice(0, 10))}</span>
              </li>
            ))}
        </ul>
      ) : null}
    </section>
  );
}

function Comments({ taskId, comments, onAdded }: { taskId: string; comments: CommentDTO[]; onAdded: (c: CommentDTO) => void }) {
  const { staff } = useCc();
  const toast = useToast();
  const [v, setV] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [suggest, setSuggest] = useState<{ q: string; at: number } | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const matches = suggest
    ? staff
        .filter((s) => s.name.toLowerCase().includes(suggest.q.toLowerCase()))
        .sort((a, b) => Number(!a.name.toLowerCase().startsWith(suggest.q.toLowerCase())) - Number(!b.name.toLowerCase().startsWith(suggest.q.toLowerCase())))
        .slice(0, 6)
    : [];

  const onInput = (text: string, caret: number) => {
    setV(text);
    const before = text.slice(0, caret);
    // First name, optionally followed by a space and the start of a surname.
    const m = before.match(/(^|\s)@([\w.]{0,30}(?: [\w.]{0,30})?)$/);
    setSuggest(m ? { q: m[2], at: caret - m[2].length - 1 } : null);
  };
  const pick = (s: { id: string; name: string }) => {
    if (!suggest) return;
    const caret = ref.current?.selectionStart ?? v.length;
    const next = `${v.slice(0, suggest.at)}@${s.name} ${v.slice(caret)}`;
    setV(next);
    setMentions((m) => [...new Set([...m, s.id])]);
    setSuggest(null);
    requestAnimationFrame(() => {
      const pos = suggest.at + s.name.length + 2;
      ref.current?.focus();
      ref.current?.setSelectionRange(pos, pos);
    });
  };
  const renderBody = (c: CommentDTO) => {
    const names = staff.filter((s) => c.mentions.includes(s.id)).map((s) => `@${s.name}`);
    if (!names.length) return c.body;
    const re = new RegExp(`(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
    return c.body.split(re).map((part, i) =>
      names.includes(part) ? (
        <span key={i} className="rounded bg-[var(--a-info-bg)] px-1 font-semibold text-[var(--a-info)]">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  return (
    <section>
      <h3 className="a-micro font-dm mb-2 flex items-center gap-1.5">
        <MessageSquare size={13} aria-hidden /> Comments {comments.length ? <span className="tabular-nums">({comments.length})</span> : null}
      </h3>
      <ul className="space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-2.5">
            <Avatar name={c.authorName} seed={c.authorId} size={28} />
            <div className="min-w-0 flex-1">
              <p className="font-dm text-[12.5px]">
                <span className="font-semibold text-[var(--a-ink)]">{c.authorName}</span> <span className="text-[var(--a-ink-3)]">· {timeAgo(c.createdAt)}</span>
              </p>
              <p className="mt-0.5 whitespace-pre-wrap break-words font-dm text-[13.5px] leading-relaxed text-[var(--a-ink-2)]">{renderBody(c)}</p>
            </div>
          </li>
        ))}
      </ul>
      <form
        className="relative mt-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!v.trim() || busy) return;
          setBusy(true);
          try {
            const live = mentions.filter((id) => v.includes(`@${staff.find((s) => s.id === id)?.name}`));
            const r = await api<{ comment: CommentDTO }>(`/api/admin/pm/tasks/${taskId}/comments`, { body: { body: v.trim(), mentions: live } });
            onAdded(r.comment);
            setV("");
            setMentions([]);
          } catch (err) {
            toast.error("Could not comment", errMsg(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <textarea
          ref={ref}
          value={v}
          onChange={(e) => onInput(e.target.value, e.target.selectionStart)}
          onKeyDown={(e) => {
            if (suggest && matches.length && (e.key === "Enter" || e.key === "Tab")) {
              e.preventDefault();
              pick(matches[0]);
            } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement).requestSubmit();
            } else if (e.key === "Escape" && suggest) {
              e.stopPropagation();
              setSuggest(null);
            }
          }}
          rows={3}
          placeholder="Write a comment. Type @ to mention someone."
          aria-label="Comment"
          className={cn(inputCls, "h-auto py-2 leading-relaxed")}
        />
        {suggest && matches.length ? (
          <ul className="absolute bottom-full left-0 z-10 mb-1 w-64 overflow-hidden rounded-[10px] border border-[var(--a-border)] bg-[var(--a-surface)] py-1 shadow-[var(--a-shadow-pop)]" role="listbox" aria-label="Mention">
            {matches.map((s) => (
              <li key={s.id}>
                <button type="button" role="option" aria-selected={false} onMouseDown={(e) => (e.preventDefault(), pick(s))} className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-dm text-[13px] hover:bg-[var(--a-surface-2)]">
                  <Avatar name={s.name} seed={s.id} size={20} />
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-dm text-[12px] text-[var(--a-ink-3)]">Ctrl or Cmd + Enter to send</span>
          <Button size="sm" type="submit" variant="primary" loading={busy} disabled={!v.trim()}>
            Comment
          </Button>
        </div>
      </form>
    </section>
  );
}

