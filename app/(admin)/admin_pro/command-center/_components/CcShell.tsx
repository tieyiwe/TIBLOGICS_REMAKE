"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CircleStop, FileText, FolderKanban, ListChecks, Plus, Search, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, PageHeader, useToast, type Crumb } from "@/components/admin/ui";
import { localTodayKey, parseQuickAdd, relativeDay } from "@/lib/admin/command-center/dates";
import { TASK_PRIORITIES } from "@/lib/admin/command-center/constants";
import { api, errMsg } from "./api";
import { Modal } from "./Modal";
import { AssigneeChip, inputCls, SelectInput, type StaffLite } from "./fields";
import { TaskDrawer } from "./TaskDrawer";

// Shared frame for every Command Center page: header with section tabs,
// global search ("/"), quick add ("c", or "+ Task"), the running timer, and
// the task drawer. Pages refresh when the shell broadcasts a change:
//   window "cc:changed"  (detail: { kind, projectId? })

export interface ProjectLite {
  id: string;
  name: string;
  color: string;
}

interface CcCtx {
  staff: StaffLite[];
  viewerId: string;
  projects: ProjectLite[];
  canFinance: boolean;
  today: string;
  openQuickAdd: (projectId?: string | null) => void;
  openSearch: () => void;
  openTask: (taskId: string) => void;
  refreshTimer: () => void;
}

const Ctx = createContext<CcCtx | null>(null);
export function useCc(): CcCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCc outside CcShell");
  return c;
}

export function emitChanged(detail: { kind: string; projectId?: string | null }) {
  window.dispatchEvent(new CustomEvent("cc:changed", { detail }));
}

/** Calls `fn` whenever anything in the Command Center changes (debounced). */
export function useOnCcChange(fn: (detail: { kind: string; projectId?: string | null }) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const h = (e: Event) => ref.current((e as CustomEvent).detail ?? { kind: "unknown" });
    window.addEventListener("cc:changed", h);
    return () => window.removeEventListener("cc:changed", h);
  }, []);
}

export function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

const TABS = [
  { href: "/admin_pro/command-center", label: "Projects", match: (p: string) => p === "/admin_pro/command-center" || p.startsWith("/admin_pro/command-center/projects") },
  { href: "/admin_pro/command-center/my-work", label: "My work", match: (p: string) => p.startsWith("/admin_pro/command-center/my-work") },
  { href: "/admin_pro/command-center/calendar", label: "Calendar", match: (p: string) => p.startsWith("/admin_pro/command-center/calendar") },
  { href: "/admin_pro/command-center/updates", label: "Updates", match: (p: string) => p.startsWith("/admin_pro/command-center/updates") },
];

export function CcShell({
  staff,
  viewerId,
  projects,
  canFinance,
  title,
  subtitle,
  actions,
  breadcrumb,
  meta,
  defaultProjectId,
  hideTabs,
  children,
}: {
  staff: StaffLite[];
  viewerId: string;
  projects: ProjectLite[];
  canFinance: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: Crumb[];
  meta?: ReactNode;
  defaultProjectId?: string | null;
  /** Pages with their own section tabs (a project) drop the Command Center tabs. */
  hideTabs?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const search = useSearchParams();
  const router = useRouter();
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));
  useEffect(() => setToday(localTodayKey()), []);
  const [quick, setQuick] = useState<{ open: boolean; projectId: string | null }>({ open: false, projectId: null });
  const [searchOpen, setSearchOpen] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [timerTick, setTimerTick] = useState(0);

  const openQuickAdd = useCallback((projectId?: string | null) => setQuick({ open: true, projectId: projectId ?? defaultProjectId ?? null }), [defaultProjectId]);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const openTask = useCallback((id: string) => setTaskId(id), []);
  const refreshTimer = useCallback(() => setTimerTick((n) => n + 1), []);

  // Deep links: ?task=<id> opens the drawer, ?new=task opens quick add.
  useEffect(() => {
    const t = search?.get("task");
    if (t) setTaskId(t);
    if (search?.get("new") === "task") setQuick({ open: true, projectId: defaultProjectId ?? null });
  }, [search, defaultProjectId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === "c") {
        e.preventDefault();
        openQuickAdd();
      } else if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openQuickAdd]);

  const closeTask = useCallback(() => {
    setTaskId(null);
    if (search?.get("task")) {
      const sp = new URLSearchParams(search.toString());
      sp.delete("task");
      router.replace(`${pathname}${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
    }
  }, [search, router, pathname]);

  const ctx = useMemo<CcCtx>(
    () => ({ staff, viewerId, projects, canFinance, today, openQuickAdd, openSearch, openTask, refreshTimer }),
    [staff, viewerId, projects, canFinance, today, openQuickAdd, openSearch, openTask, refreshTimer],
  );

  const tabs = [
    ...TABS.map((t) => ({ href: t.href, label: t.label, id: t.href })),
    ...(canFinance ? [{ href: "/admin_pro/command-center/finance", label: "Finance", id: "/admin_pro/command-center/finance" }] : []),
  ];
  const active = TABS.find((t) => t.match(pathname))?.href;

  return (
    <Ctx.Provider value={ctx}>
      <div className="mx-auto w-full max-w-[1400px]">
        <PageHeader
          title={title}
          subtitle={subtitle}
          breadcrumb={breadcrumb}
          meta={meta}
          tabs={hideTabs ? undefined : tabs}
          activeTab={active}
          actions={
            <>
              <TimerChip tick={timerTick} />
              <Button variant="ghost" size="sm" icon={Search} onClick={() => setSearchOpen(true)} aria-label="Search projects, tasks and notes (/)">
                <span className="hidden sm:inline">Search</span>
                <kbd className="ml-1 hidden rounded border border-[var(--a-border)] bg-[var(--a-surface-2)] px-1 font-dm text-[11px] text-[var(--a-ink-3)] sm:inline">/</kbd>
              </Button>
              {actions}
              <Button variant="primary" size="sm" icon={Plus} onClick={() => openQuickAdd()} aria-label="New task (c)">
                Task
                <kbd className="ml-1 hidden rounded border border-white/30 px-1 font-dm text-[11px] text-white/80 sm:inline">C</kbd>
              </Button>
            </>
          }
        />
        {children}
      </div>
      <QuickAdd
        open={quick.open}
        initialProjectId={quick.projectId}
        onClose={() => setQuick({ open: false, projectId: null })}
        onCreated={(t) => {
          emitChanged({ kind: "task", projectId: t.projectId });
        }}
      />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <TaskDrawer taskId={taskId} onClose={closeTask} />
    </Ctx.Provider>
  );
}

// ── Running timer ────────────────────────────────────────────────────────────

interface Running {
  id: string;
  projectId: string;
  projectName: string;
  taskTitle: string | null;
  startedAt: string;
}

function TimerChip({ tick }: { tick: number }) {
  const [running, setRunning] = useState<Running | null>(null);
  const [now, setNow] = useState(Date.now());
  const toast = useToast();
  useEffect(() => {
    let alive = true;
    api<{ running: Running | null }>("/api/admin/pm/time")
      .then((r) => alive && setRunning(r.running))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [tick]);
  useOnCcChange((d) => {
    if (d.kind === "timer") api<{ running: Running | null }>("/api/admin/pm/time").then((r) => setRunning(r.running)).catch(() => undefined);
  });
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  if (!running) return null;
  const secs = Math.max(0, Math.floor((now - Date.parse(running.startedAt)) / 1000));
  const hh = String(Math.floor(secs / 3600)).padStart(2, "0");
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return (
    <div className="flex h-8 min-w-0 items-center gap-2 rounded-[var(--a-radius-control)] border border-[#c8ead6] bg-[var(--a-success-bg)] pl-2.5 pr-1 font-dm text-[12.5px] text-[var(--a-success)]" role="status">
      <Timer size={14} aria-hidden className="shrink-0 animate-pulse" />
      <Link href={`/admin_pro/command-center/projects/${running.projectId}?tab=time`} className="max-w-[160px] truncate font-semibold hover:underline" title={running.taskTitle ?? running.projectName}>
        {running.taskTitle ?? running.projectName}
      </Link>
      <span className="tabular-nums">{`${hh}:${mm}:${ss}`}</span>
      <button
        type="button"
        onClick={async () => {
          try {
            await api("/api/admin/pm/time", { body: { action: "stop" } });
            setRunning(null);
            toast.success("Timer stopped", "Time logged");
            emitChanged({ kind: "time", projectId: running.projectId });
          } catch (e) {
            toast.error("Could not stop the timer", errMsg(e));
          }
        }}
        className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/60"
        aria-label="Stop timer"
      >
        <CircleStop size={15} aria-hidden />
      </button>
    </div>
  );
}

// ── Quick add ────────────────────────────────────────────────────────────────

const LAST_PROJECT_KEY = "tib.cc.lastProject";

function QuickAdd({
  open,
  initialProjectId,
  onClose,
  onCreated,
}: {
  open: boolean;
  initialProjectId: string | null;
  onClose: () => void;
  onCreated: (t: { id: string; projectId: string }) => void;
}) {
  const { projects, staff, viewerId } = useCc();
  const toast = useToast();
  const [text, setText] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [keepOpen, setKeepOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let last = "";
    try {
      last = window.localStorage.getItem(LAST_PROJECT_KEY) ?? "";
    } catch {
      /* private mode */
    }
    const pick = initialProjectId ?? (projects.some((p) => p.id === last) ? last : projects[0]?.id ?? "");
    setProjectId(pick);
    setText("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, initialProjectId, projects]);

  const today = localTodayKey();
  const parsed = parseQuickAdd(text, today, staff);
  const assignee = parsed.assigneeId ?? viewerId;
  const prio = TASK_PRIORITIES.find((p) => p.value === parsed.priority);

  const submit = async () => {
    if (!parsed.title || !projectId || busy) return;
    setBusy(true);
    try {
      const r = await api<{ task: { id: string; projectId: string; title: string } }>("/api/admin/pm/tasks", {
        body: {
          projectId,
          title: parsed.title,
          dueKey: parsed.dueKey,
          ...(parsed.priority ? { priority: parsed.priority } : {}),
          labels: parsed.labels,
          assigneeId: assignee,
        },
      });
      try {
        window.localStorage.setItem(LAST_PROJECT_KEY, projectId);
      } catch {
        /* ignore */
      }
      onCreated(r.task);
      toast.success("Task created", `${r.task.title} in ${projects.find((p) => p.id === projectId)?.name ?? "the project"}`);
      if (keepOpen) {
        setText("");
        inputRef.current?.focus();
      } else onClose();
    } catch (e) {
      toast.error("Could not create the task", errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={620} top title="New task">
      <form
        className="space-y-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='e.g. "Send proposal to Maple fri !high #sales @jane"'
          aria-label="Task title"
          className={cn(inputCls, "h-11 text-[15px]")}
        />
        <div className="flex min-h-[26px] flex-wrap items-center gap-1.5 font-dm text-[12.5px] text-[var(--a-ink-3)]" aria-live="polite">
          {parsed.dueKey ? <Chip>Due {relativeDay(parsed.dueKey, today)}</Chip> : null}
          {prio ? <Chip>{prio.label} priority</Chip> : null}
          {parsed.labels.map((l) => (
            <Chip key={l}>#{l}</Chip>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <AssigneeChip staff={staff} id={assignee} size={20} showName />
          </span>
          {!text ? <span>Type a date (fri, next week, oct 12), !high, #label or @name.</span> : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-2 font-dm text-[13px] text-[var(--a-ink-2)]">
            <span className="shrink-0 font-semibold">In</span>
            <SelectInput value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Project">
              {projects.length === 0 ? <option value="">Create a project first</option> : null}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </SelectInput>
          </label>
          <label className="flex items-center gap-2 font-dm text-[13px] text-[var(--a-ink-2)]">
            <input type="checkbox" checked={keepOpen} onChange={(e) => setKeepOpen(e.target.checked)} className="h-4 w-4 accent-[var(--a-blue)]" />
            Create more
          </label>
          <Button type="submit" variant="primary" loading={busy} disabled={!parsed.title || !projectId}>
            Create task
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-md bg-[var(--a-info-bg)] px-1.5 py-0.5 font-semibold text-[var(--a-info)]">{children}</span>;
}

// ── Search ───────────────────────────────────────────────────────────────────

interface Hit {
  kind: "project" | "task" | "note";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setQ("");
      setHits([]);
      setSel(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);
  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      api<{ results: Hit[] }>(`/api/admin/pm/search?q=${encodeURIComponent(q.trim())}`)
        .then((r) => {
          setHits(r.results);
          setSel(0);
        })
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 180);
    return () => clearTimeout(t);
  }, [q]);
  const go = (h: Hit) => {
    onClose();
    router.push(h.href);
  };
  const Icon = (k: Hit["kind"]) => (k === "project" ? FolderKanban : k === "task" ? ListChecks : FileText);
  return (
    <Modal open={open} onClose={onClose} width={640} top>
      <div className="border-b border-[var(--a-border)] p-3">
        <label className="relative flex items-center">
          <Search size={16} className="pointer-events-none absolute left-3 text-[var(--a-ink-3)]" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel((s) => Math.min(hits.length - 1, s + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel((s) => Math.max(0, s - 1));
              } else if (e.key === "Enter" && hits[sel]) {
                e.preventDefault();
                go(hits[sel]);
              }
            }}
            placeholder="Search projects, tasks and notes"
            aria-label="Search projects, tasks and notes"
            className={cn(inputCls, "h-11 pl-9 text-[15px]")}
          />
        </label>
      </div>
      <div className="max-h-[50vh] overflow-y-auto p-2" role="listbox" aria-label="Results">
        {q.trim().length < 2 ? (
          <p className="px-3 py-6 text-center font-dm text-[13px] text-[var(--a-ink-3)]">Type at least two letters.</p>
        ) : loading && !hits.length ? (
          <p className="px-3 py-6 text-center font-dm text-[13px] text-[var(--a-ink-3)]">Searching</p>
        ) : !hits.length ? (
          <p className="px-3 py-6 text-center font-dm text-[13px] text-[var(--a-ink-3)]">No matches for &ldquo;{q}&rdquo;.</p>
        ) : (
          hits.map((h, i) => {
            const I = Icon(h.kind);
            return (
              <button
                key={`${h.kind}-${h.id}`}
                type="button"
                role="option"
                aria-selected={i === sel}
                onMouseEnter={() => setSel(i)}
                onClick={() => go(h)}
                className={cn("flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left", i === sel ? "bg-[var(--a-surface-2)]" : "")}
              >
                <I size={16} className="shrink-0 text-[var(--a-ink-3)]" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-dm text-[14px] font-semibold text-[var(--a-ink)]">{h.title}</span>
                  <span className="block truncate font-dm text-[12.5px] text-[var(--a-ink-3)]">{h.subtitle}</span>
                </span>
                <span className="shrink-0 font-dm text-[11px] uppercase tracking-[.08em] text-[var(--a-ink-3)]">{h.kind}</span>
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}
