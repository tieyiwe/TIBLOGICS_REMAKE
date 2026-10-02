"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bookmark,
  CalendarClock,
  FolderKanban,

  ListChecks,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Button, EmptyState, Menu, SearchInput, Segmented, Select, StatCard, Toolbar, useToast, type BadgeTone, type MenuItem } from "@/components/admin/ui";
import type { PortfolioProject } from "@/lib/admin/command-center/pm";
import { HEALTH, PROJECT_CATEGORIES, PROJECT_COLORS, PROJECT_PRIORITIES, PROJECT_STATUSES } from "@/lib/admin/command-center/constants";
import { addDays, diffDays, fmtDay, localTodayKey, relativeDay } from "@/lib/admin/command-center/dates";
import { fmtUsd } from "@/lib/admin/command-center/money";
import { api, errMsg } from "./_components/api";
import { CcShell, useOnCcChange, type ProjectLite } from "./_components/CcShell";
import { AssigneeChip, Field, HealthBadge, Progress, SelectInput, SmartDateInput, staffName, TextInput, type StaffLite } from "./_components/fields";
import { Modal } from "./_components/Modal";

interface TemplateLite {
  key: string;
  name: string;
  description: string;
  category: string;
  color: string;
  tasks: number;
  milestones: number;
  days: number;
}

interface Filters {
  q: string;
  category: string;
  status: string;
  priority: string;
  owner: string;
  health: string;
  starred: boolean;
  view: string;
}

const DEFAULT_FILTERS: Filters = { q: "", category: "", status: "open", priority: "", owner: "", health: "", starred: false, view: "cards" };
const VIEWS = ["cards", "board", "table", "timeline"];
const FILTER_KEY = "tib.cc.portfolio";

const statusMeta = (s: string) => PROJECT_STATUSES.find((x) => x.value === s) ?? PROJECT_STATUSES[1];

export default function PortfolioClient({
  shell,
  initialProjects,
  templates,
}: {
  shell: { staff: StaffLite[]; viewerId: string; projects: ProjectLite[]; canFinance: boolean };
  initialProjects: PortfolioProject[];
  templates: TemplateLite[];
}) {
  const search = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [projects, setProjects] = useState(initialProjects);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [views, setViews] = useState<Array<{ id: string; name: string; filters: Partial<Filters> }>>([]);
  const [newOpen, setNewOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const today = localTodayKey();

  useEffect(() => {
    let stored: Partial<Filters> = {};
    try {
      stored = JSON.parse(window.localStorage.getItem(FILTER_KEY) ?? "{}");
    } catch {
      /* ignore */
    }
    const v = search?.get("view");
    setFilters({ ...DEFAULT_FILTERS, ...stored, ...(v && VIEWS.includes(v) ? { view: v } : {}) });
    if (search?.get("new") === "project") setNewOpen(true);
    api<{ views: Array<{ id: string; name: string; filters: Partial<Filters> }> }>("/api/admin/pm/views")
      .then((r) => setViews(r.views))
      .catch(() => undefined);
  }, [search]);

  const set = (patch: Partial<Filters>) =>
    setFilters((f) => {
      const next = { ...f, ...patch };
      try {
        window.localStorage.setItem(FILTER_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

  const reload = useCallback(async () => {
    try {
      const r = await api<{ projects: PortfolioProject[] }>("/api/admin/pm/projects?archived=1");
      setProjects(r.projects);
    } catch {
      /* keep what we have */
    }
  }, []);
  useOnCcChange(() => void reload());

  const visible = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return projects.filter((p) => {
      if (filters.status === "open" ? p.archived || p.status === "COMPLETED" || p.status === "ARCHIVED" : filters.status === "archived" ? !p.archived : filters.status ? p.status !== filters.status || p.archived : p.archived) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.priority && p.priority !== filters.priority) return false;
      if (filters.owner && p.ownerId !== filters.owner) return false;
      if (filters.health === "attention" ? !p.signals.length && p.health === "on_track" : filters.health && p.health !== filters.health) return false;
      if (filters.starred && !p.starred) return false;
      if (q && !`${p.name} ${p.description ?? ""} ${p.clientName ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [projects, filters]);

  const live = projects.filter((p) => !p.archived && p.status !== "COMPLETED" && p.status !== "ARCHIVED");
  const attention = live.filter((p) => p.health !== "on_track" || p.signals.length);
  const overdueTasks = live.reduce((n, p) => n + p.overdueCount, 0);
  const pipeline = live.reduce((n, p) => n + p.revenuePotential * 100, 0);
  const earned = live.reduce((n, p) => n + p.revenueEarned * 100 + (p.ledgerIncomeCents ?? 0), 0);

  const patchProject = async (id: string, body: Record<string, unknown>, msg?: string) => {
    setProjects((ps) => ps.map((p) => (p.id === id ? ({ ...p, ...body } as PortfolioProject) : p)));
    try {
      await api(`/api/admin/pm/projects/${id}`, { method: "PATCH", body });
      if (msg) toast.success(msg);
      void reload();
    } catch (e) {
      toast.error("Could not save", errMsg(e));
      void reload();
    }
  };

  const viewMenu: MenuItem[] = [
    { heading: "Saved views" },
    ...(views.length
      ? views.map((v) => ({ label: v.name, icon: Bookmark, onSelect: () => set({ ...DEFAULT_FILTERS, ...v.filters }) }))
      : [{ label: "No saved views yet", disabled: true }]),
    { separator: true },
    { label: "Save current view", icon: Plus, onSelect: () => setSaveOpen(true) },
    ...(views.length
      ? [
          { heading: "Delete" } as MenuItem,
          ...views.map((v) => ({
            label: `Delete "${v.name}"`,
            icon: Trash2,
            danger: true,
            onSelect: async () => {
              try {
                await api(`/api/admin/pm/views/${v.id}`, { method: "DELETE" });
                setViews((vs) => vs.filter((x) => x.id !== v.id));
                toast.success("View deleted");
              } catch (e) {
                toast.error("Could not delete", errMsg(e));
              }
            },
          })),
        ]
      : []),
  ];

  return (
    <CcShell
      {...shell}
      title="Command Center"
      subtitle="Every project, its health, and what happens next."
      actions={
        <Button size="sm" icon={FolderKanban} onClick={() => setNewOpen(true)}>
          New project
        </Button>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Active projects" value={live.length} hint={`${projects.filter((p) => p.starred && !p.archived).length} starred`} tone="navy" />
        <StatCard
          label="Need attention"
          value={attention.length}
          tone={attention.length ? "warn" : "success"}
          hint={attention.length ? "At risk, off track, overdue or quiet" : "All on track"}
        />
        <StatCard label="Overdue tasks" value={overdueTasks} tone={overdueTasks ? "danger" : "default"} href="/admin_pro/command-center/my-work" hint="Across active projects" />
        <StatCard label="Revenue earned" value={fmtUsd(earned, { compact: true })} hint={shell.canFinance ? "Recorded + paid invoices" : "Recorded on projects"} />
        <StatCard label="Pipeline" value={fmtUsd(pipeline, { compact: true })} hint="Potential revenue" tone="orange" />
      </div>

      <Toolbar
        end={
          <>
            <Menu
              label="Saved views"
              items={viewMenu}
              trigger={(p) => (
                <button {...p} className="inline-flex h-9 items-center gap-1.5 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 font-dm text-[13px] font-semibold text-[var(--a-ink-2)] hover:bg-[var(--a-surface-2)]">
                  <Bookmark size={14} aria-hidden /> Views
                </button>
              )}
            />
            <Segmented
              ariaLabel="Layout"
              value={filters.view}
              onChange={(v) => set({ view: v })}
              options={[
                { value: "cards", label: "Cards" },
                { value: "board", label: "Board" },
                { value: "table", label: "Table" },
                { value: "timeline", label: "Timeline" },
              ]}
            />
          </>
        }
      >
        <SearchInput value={filters.q} onChange={(e) => set({ q: e.target.value })} placeholder="Filter projects" label="Filter projects" />
        <Select label="Status" value={filters.status} onChange={(e) => set({ status: e.target.value })}>
          <option value="open">Open</option>
          <option value="">All active</option>
          {PROJECT_STATUSES.filter((s) => s.value !== "ARCHIVED").map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
          <option value="archived">Archived</option>
        </Select>
        <Select label="Category" value={filters.category} onChange={(e) => set({ category: e.target.value })}>
          <option value="">All categories</option>
          {PROJECT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select label="Priority" value={filters.priority} onChange={(e) => set({ priority: e.target.value })}>
          <option value="">Any priority</option>
          {PROJECT_PRIORITIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select label="Owner" value={filters.owner} onChange={(e) => set({ owner: e.target.value })}>
          <option value="">Any owner</option>
          {shell.staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select label="Health" value={filters.health} onChange={(e) => set({ health: e.target.value })}>
          <option value="">Any health</option>
          <option value="attention">Needs attention</option>
          {HEALTH.map((h) => (
            <option key={h.value} value={h.value}>
              {h.label}
            </option>
          ))}
        </Select>
        <button
          type="button"
          aria-pressed={filters.starred}
          onClick={() => set({ starred: !filters.starred })}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-[var(--a-radius-control)] border px-3 font-dm text-[13px] font-semibold",
            filters.starred ? "border-[var(--a-orange)] bg-[var(--a-orange-bg)] text-[var(--a-orange-text)]" : "border-[var(--a-border-strong)] bg-[var(--a-surface)] text-[var(--a-ink-2)] hover:bg-[var(--a-surface-2)]",
          )}
        >
          <Star size={14} aria-hidden fill={filters.starred ? "currentColor" : "none"} /> Starred
        </button>
      </Toolbar>

      {visible.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={projects.length ? "No projects match these filters" : "No projects yet"}
          body={projects.length ? "Clear a filter or switch the status to All active." : "Start from a template to get a task list, milestones and dates in one step."}
          action={
            projects.length ? (
              <Button onClick={() => set({ ...DEFAULT_FILTERS, view: filters.view })}>Clear filters</Button>
            ) : (
              <Button variant="primary" icon={Plus} onClick={() => setNewOpen(true)}>
                New project
              </Button>
            )
          }
        />
      ) : filters.view === "board" ? (
        <Board projects={visible} staff={shell.staff} today={today} onMove={(id, status) => void patchProject(id, { status }, `Moved to ${statusMeta(status).label}`)} />
      ) : filters.view === "table" ? (
        <ProjectTable projects={visible} staff={shell.staff} today={today} canFinance={shell.canFinance} />
      ) : filters.view === "timeline" ? (
        <PortfolioTimeline projects={visible} today={today} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <ProjectCard key={p.id} p={p} staff={shell.staff} today={today} canFinance={shell.canFinance} onStar={() => void patchProject(p.id, { starred: !p.starred })} />
          ))}
        </div>
      )}

      <NewProjectDialog
        open={newOpen}
        onClose={() => {
          setNewOpen(false);
          if (search?.get("new")) router.replace("/admin_pro/command-center", { scroll: false });
        }}
        templates={templates}
        staff={shell.staff}
        viewerId={shell.viewerId}
        onCreated={(id) => router.push(`/admin_pro/command-center/projects/${id}`)}
      />
      <SaveViewDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSave={async (name) => {
          try {
            const { q, category, status, priority, owner, health, starred, view } = filters;
            const r = await api<{ view: { id: string; name: string; filters: Partial<Filters> } }>("/api/admin/pm/views", {
              body: { name, filters: { q, category, status, priority, owner, health, starred, view } },
            });
            setViews((v) => [...v, r.view]);
            toast.success("View saved", name);
            setSaveOpen(false);
          } catch (e) {
            toast.error("Could not save the view", errMsg(e));
          }
        }}
      />
    </CcShell>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

function revenueOf(p: PortfolioProject) {
  return p.revenueEarned * 100 + (p.ledgerIncomeCents ?? 0);
}

function ProjectCard({ p, staff, today, canFinance, onStar }: { p: PortfolioProject; staff: StaffLite[]; today: string; canFinance: boolean; onStar: () => void }) {
  const earned = revenueOf(p);
  const potential = p.revenuePotential * 100;
  const st = statusMeta(p.status);
  return (
    <article className="a-lift group relative flex min-w-0 flex-col overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)] hover:border-[var(--a-border-strong)]">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: p.color }} aria-hidden />
      <div className="flex items-start gap-3 px-5 pb-3 pt-5">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={st.tone as BadgeTone}>{p.archived ? "Archived" : st.label}</Badge>
            <HealthBadge health={p.health} />
            <span className="font-dm text-[11.5px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">{PROJECT_CATEGORIES.find((c) => c.value === p.category)?.label}</span>
          </div>
          <Link href={`/admin_pro/command-center/projects/${p.id}`} className="block font-syne text-[17px] font-bold leading-snug text-[var(--a-ink)] after:absolute after:inset-0 hover:underline">
            {p.name}
          </Link>
          {p.clientName ? <p className="mt-0.5 truncate font-dm text-[12.5px] text-[var(--a-ink-3)]">for {p.clientName}</p> : null}
        </div>
        <button
          type="button"
          onClick={onStar}
          aria-pressed={p.starred}
          aria-label={p.starred ? `Unstar ${p.name}` : `Star ${p.name}`}
          className={cn("relative z-[1] -mr-1 flex h-8 w-8 items-center justify-center rounded-md hover:bg-[var(--a-surface-2)]", p.starred ? "text-[var(--a-orange)]" : "text-[var(--a-ink-3)]")}
        >
          <Star size={16} fill={p.starred ? "currentColor" : "none"} aria-hidden />
        </button>
      </div>

      <div className="space-y-3 px-5 pb-4">
        <div>
          <div className="mb-1 flex items-center justify-between font-dm text-[12px] text-[var(--a-ink-3)]">
            <span>
              {p.doneCount}/{p.taskCount} tasks{p.progressMode === "auto" ? "" : " · manual"}
            </span>
            <span className="font-semibold tabular-nums text-[var(--a-ink-2)]">{p.progress}%</span>
          </div>
          <Progress value={p.progress} color={p.color} />
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 font-dm text-[12.5px]">
          <div className="min-w-0">
            <dt className="text-[var(--a-ink-3)]">Next milestone</dt>
            <dd className="truncate font-semibold text-[var(--a-ink-2)]">
              {p.nextMilestone ? (
                <>
                  {p.nextMilestone.title} <span className={cn("font-normal", p.nextMilestone.dueKey < today ? "text-[var(--a-danger)]" : "text-[var(--a-ink-3)]")}>· {relativeDay(p.nextMilestone.dueKey, today)}</span>
                </>
              ) : (
                <span className="font-normal text-[var(--a-ink-3)]">None set</span>
              )}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[var(--a-ink-3)]">Owner</dt>
            <dd className="mt-0.5">
              <AssigneeChip staff={staff} id={p.ownerId} size={20} showName />
            </dd>
          </div>
          <div className="col-span-2 min-w-0">
            <dt className="text-[var(--a-ink-3)]">Revenue{canFinance ? "" : " (recorded)"}</dt>
            <dd className="flex items-center gap-2">
              <span className="font-semibold tabular-nums text-[var(--a-ink-2)]">{fmtUsd(earned, { compact: true })}</span>
              <span className="text-[var(--a-ink-3)]">of {fmtUsd(potential, { compact: true })}</span>
              {potential ? <Progress value={(earned / potential) * 100} color="var(--a-success)" className="max-w-[120px]" /> : null}
            </dd>
          </div>
        </dl>
      </div>
      {p.signals.length || p.deadlineKey ? (
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--a-border)] bg-[var(--a-surface-2)]/60 px-5 py-2.5 font-dm text-[12px]">
          {p.signals.map((s) => (
            <span key={s.kind} className={cn("inline-flex items-center gap-1 font-semibold", s.kind === "stale" ? "text-[var(--a-warn)]" : "text-[var(--a-danger)]")}>
              <AlertTriangle size={12} aria-hidden /> {s.text}
            </span>
          ))}
          {p.deadlineKey ? (
            <span className={cn("ml-auto inline-flex items-center gap-1", p.deadlineKey < today && p.status === "ACTIVE" ? "text-[var(--a-danger)]" : "text-[var(--a-ink-3)]")}>
              <CalendarClock size={12} aria-hidden /> Due {fmtDay(p.deadlineKey, { withYear: p.deadlineKey.slice(0, 4) !== today.slice(0, 4) })}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

// ── Board (drag between statuses) ────────────────────────────────────────────

function Board({ projects, staff, today, onMove }: { projects: PortfolioProject[]; staff: StaffLite[]; today: string; onMove: (id: string, status: string) => void }) {
  const cols = PROJECT_STATUSES.filter((s) => s.value !== "ARCHIVED");
  const [over, setOver] = useState<string | null>(null);
  return (
    <div className="a-scroll-thin -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
      {cols.map((c) => {
        const items = projects.filter((p) => p.status === c.value);
        return (
          <section
            key={c.value}
            aria-label={c.label}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(c.value);
            }}
            onDragLeave={() => setOver((o) => (o === c.value ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/project");
              if (id && projects.find((p) => p.id === id)?.status !== c.value) onMove(id, c.value);
            }}
            className={cn(
              "flex w-[290px] shrink-0 flex-col rounded-[var(--a-radius-card)] border bg-[var(--a-surface-2)]/70 p-2 transition-colors",
              over === c.value ? "border-[var(--a-blue)] bg-[var(--a-info-bg)]" : "border-[var(--a-border)]",
            )}
          >
            <header className="flex items-center gap-2 px-2 pb-2 pt-1">
              <Badge tone={c.tone as BadgeTone} dot>
                {c.label}
              </Badge>
              <span className="font-dm text-[12px] tabular-nums text-[var(--a-ink-3)]">{items.length}</span>
            </header>
            <div className="flex min-h-[80px] flex-col gap-2">
              {items.map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/project", p.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  data-project={p.id}
                  className="cursor-grab rounded-[10px] border border-[var(--a-border)] bg-[var(--a-surface)] p-3 shadow-[var(--a-shadow-card)] active:cursor-grabbing"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
                    <Link href={`/admin_pro/command-center/projects/${p.id}`} className="min-w-0 flex-1 truncate font-dm text-[13.5px] font-semibold text-[var(--a-ink)] hover:underline">
                      {p.name}
                    </Link>
                    <AssigneeChip staff={staff} id={p.ownerId} size={20} />
                  </div>
                  <Progress value={p.progress} color={p.color} className="mt-2" />
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 font-dm text-[11.5px] text-[var(--a-ink-3)]">
                    <HealthBadge health={p.health} />
                    <span>{p.openCount} open</span>
                    {p.overdueCount ? <span className="font-semibold text-[var(--a-danger)]">{p.overdueCount} overdue</span> : null}
                    {p.deadlineKey ? <span className="ml-auto">{relativeDay(p.deadlineKey, today)}</span> : null}
                  </div>
                  <label className="sr-only" htmlFor={`mv-${p.id}`}>
                    Move {p.name}
                  </label>
                  <select
                    id={`mv-${p.id}`}
                    value={p.status}
                    onChange={(e) => onMove(p.id, e.target.value)}
                    className="sr-only focus:not-sr-only focus:mt-2 focus:block focus:w-full focus:rounded focus:border focus:p-1 focus:text-[12px]"
                  >
                    {cols.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── Table ────────────────────────────────────────────────────────────────────

function ProjectTable({ projects, staff, today, canFinance }: { projects: PortfolioProject[]; staff: StaffLite[]; today: string; canFinance: boolean }) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: "name", dir: 1 });
  const rows = [...projects].sort((a, b) => {
    const v = (p: PortfolioProject): string | number =>
      sort.key === "progress" ? p.progress : sort.key === "deadline" ? p.deadlineKey ?? "9999" : sort.key === "open" ? p.openCount : sort.key === "revenue" ? revenueOf(p) : p.name.toLowerCase();
    const x = v(a);
    const y = v(b);
    return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
  });
  const Th = ({ k, children, right }: { k: string; children: React.ReactNode; right?: boolean }) => (
    <th scope="col" aria-sort={sort.key === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className={cn("whitespace-nowrap border-b border-[var(--a-border)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]", right ? "text-right" : "text-left")}>
      <button type="button" onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? ((-s.dir) as 1 | -1) : 1 }))} className="uppercase hover:text-[var(--a-ink)]">
        {children}
        {sort.key === k ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );
  return (
    <>
      <div className="hidden overflow-x-auto rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)] md:block">
        <table className="w-full border-collapse font-dm text-[13.5px]">
          <thead className="bg-[var(--a-surface-2)]">
            <tr>
              <Th k="name">Project</Th>
              <th scope="col" className="border-b border-[var(--a-border)] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">Status</th>
              <th scope="col" className="border-b border-[var(--a-border)] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">Owner</th>
              <Th k="progress">Progress</Th>
              <Th k="open" right>
                Open
              </Th>
              <th scope="col" className="border-b border-[var(--a-border)] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">Next milestone</th>
              <Th k="deadline">Deadline</Th>
              <Th k="revenue" right>
                Revenue{canFinance ? "" : " (recorded)"}
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-[var(--a-border)] last:border-b-0 hover:bg-[#f8fafd]">
                <td className="max-w-[280px] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
                    {p.starred ? <Star size={12} className="shrink-0 text-[var(--a-orange)]" fill="currentColor" aria-label="Starred" /> : null}
                    <Link href={`/admin_pro/command-center/projects/${p.id}`} className="truncate font-semibold text-[var(--a-ink)] hover:underline">
                      {p.name}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={statusMeta(p.status).tone as BadgeTone}>{statusMeta(p.status).label}</Badge>
                    <HealthBadge health={p.health} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <AssigneeChip staff={staff} id={p.ownerId} size={22} showName />
                </td>
                <td className="w-40 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Progress value={p.progress} color={p.color} />
                    <span className="w-9 shrink-0 text-right tabular-nums text-[var(--a-ink-2)]">{p.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {p.openCount}
                  {p.overdueCount ? <span className="ml-1 font-semibold text-[var(--a-danger)]">({p.overdueCount} late)</span> : null}
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-[var(--a-ink-2)]">{p.nextMilestone ? `${p.nextMilestone.title} · ${relativeDay(p.nextMilestone.dueKey, today)}` : "None"}</td>
                <td className={cn("whitespace-nowrap px-4 py-3", p.deadlineKey && p.deadlineKey < today ? "text-[var(--a-danger)]" : "text-[var(--a-ink-2)]")}>{p.deadlineKey ? fmtDay(p.deadlineKey, { withYear: true }) : "None"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                  {fmtUsd(revenueOf(p), { compact: true })}
                  <span className="text-[var(--a-ink-3)]"> / {fmtUsd(p.revenuePotential * 100, { compact: true })}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2 md:hidden">
        {rows.map((p) => (
          <li key={p.id} className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
              <Link href={`/admin_pro/command-center/projects/${p.id}`} className="min-w-0 flex-1 truncate font-dm text-[14px] font-semibold text-[var(--a-ink)]">
                {p.name}
              </Link>
              <span className="font-dm text-[12.5px] tabular-nums text-[var(--a-ink-2)]">{p.progress}%</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 font-dm text-[12px] text-[var(--a-ink-3)]">
              <HealthBadge health={p.health} />
              <span>{staffName(staff, p.ownerId) ?? "No owner"}</span>
              <span>· {p.openCount} open</span>
              {p.deadlineKey ? <span>· due {fmtDay(p.deadlineKey)}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

// ── Portfolio timeline ───────────────────────────────────────────────────────

function PortfolioTimeline({ projects, today }: { projects: PortfolioProject[]; today: string }) {
  const rows = projects.filter((p) => p.startKey || p.deadlineKey);
  const missing = projects.length - rows.length;
  if (!rows.length) return <EmptyState icon={CalendarClock} title="No dates yet" body="Give projects a start date or deadline to see them on the timeline." compact />;
  const keys = rows.flatMap((p) => [p.startKey ?? p.deadlineKey!, p.deadlineKey ?? p.startKey!]).concat(today);
  const min = addDays(keys.reduce((a, b) => (a < b ? a : b)), -7);
  const max = addDays(keys.reduce((a, b) => (a > b ? a : b)), 14);
  const span = Math.max(30, diffDays(max, min));
  const pct = (k: string) => (diffDays(k, min) / span) * 100;
  const months: string[] = [];
  for (let m = `${min.slice(0, 7)}-01`; m <= max; m = `${new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 1)).toISOString().slice(0, 7)}-01`) months.push(m);
  return (
    <div className="overflow-x-auto rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]">
      <div className="min-w-[760px]">
        <div className="relative ml-[220px] h-8 border-b border-[var(--a-border)]">
          {months.map((m) =>
            m >= min ? (
              <span key={m} className="absolute top-2 -translate-x-0 border-l border-[var(--a-border)] pl-1.5 font-dm text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--a-ink-3)]" style={{ left: `${pct(m)}%` }}>
                {new Date(`${m}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" })}
              </span>
            ) : null,
          )}
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 z-[1] w-px bg-[var(--a-orange)]" style={{ left: `calc(220px + (100% - 220px) * ${pct(today) / 100})` }} aria-label="Today" />
          {rows.map((p) => {
            const s = p.startKey ?? p.deadlineKey!;
            const e = p.deadlineKey ?? p.startKey!;
            return (
              <div key={p.id} className="flex h-11 items-center border-b border-[var(--a-border)] last:border-b-0">
                <Link href={`/admin_pro/command-center/projects/${p.id}`} className="w-[220px] shrink-0 truncate px-4 font-dm text-[13px] font-semibold text-[var(--a-ink)] hover:underline">
                  {p.name}
                </Link>
                <div className="relative h-full flex-1">
                  <div
                    className="absolute top-1/2 flex h-6 -translate-y-1/2 items-center overflow-hidden rounded-md px-2 font-dm text-[11px] font-semibold text-white"
                    style={{ left: `${pct(s)}%`, width: `max(${Math.max(0.8, pct(e) - pct(s))}%, 8px)`, background: p.color }}
                    title={`${fmtDay(s, { withYear: true })} to ${fmtDay(e, { withYear: true })}`}
                  >
                    <span className="truncate">{p.progress}%</span>
                  </div>
                  {p.nextMilestone ? (
                    <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white bg-[var(--a-navy)]" style={{ left: `${pct(p.nextMilestone.dueKey)}%` }} title={`${p.nextMilestone.title}: ${fmtDay(p.nextMilestone.dueKey)}`} />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {missing ? <p className="border-t border-[var(--a-border)] px-4 py-2 font-dm text-[12px] text-[var(--a-ink-3)]">{missing} project{missing === 1 ? " has" : "s have"} no dates and are not shown.</p> : null}
    </div>
  );
}

// ── New project ──────────────────────────────────────────────────────────────

function NewProjectDialog({
  open,
  onClose,
  templates,
  staff,
  viewerId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  templates: TemplateLite[];
  staff: StaffLite[];
  viewerId: string;
  onCreated: (id: string) => void;
}) {
  const toast = useToast();
  const [tpl, setTpl] = useState<string>("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("INTERNAL");
  const [owner, setOwner] = useState(viewerId);
  const [startKey, setStartKey] = useState<string | null>(null);
  const [deadlineKey, setDeadlineKey] = useState<string | null>(null);
  const [client, setClient] = useState("");
  const [potential, setPotential] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setTpl("");
      setName("");
      setCategory("INTERNAL");
      setOwner(viewerId);
      setStartKey(localTodayKey());
      setDeadlineKey(null);
      setClient("");
      setPotential("");
      setColor(PROJECT_COLORS[0]);
    }
  }, [open, viewerId]);
  const chosen = templates.find((t) => t.key === tpl);
  const pickTemplate = (k: string) => {
    setTpl(k);
    const t = templates.find((x) => x.key === k);
    if (t) {
      setCategory(t.category);
      setColor(t.color);
      if (!name) setName(t.name);
      if (startKey) setDeadlineKey(addDays(startKey, t.days));
    }
  };
  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const r = await api<{ project: { id: string } }>("/api/admin/pm/projects", {
        body: {
          name: name.trim(),
          category,
          ownerId: owner,
          startKey,
          deadlineKey,
          templateKey: tpl || null,
          clientName: client.trim() || null,
          color,
          ...(potential ? { revenuePotential: Math.max(0, Math.round(Number(potential.replace(/[^\d.]/g, "")) || 0)) } : {}),
        },
      });
      toast.success("Project created", chosen ? `${chosen.tasks} tasks and ${chosen.milestones} milestones added` : name);
      onCreated(r.project.id);
      onClose();
    } catch (e) {
      toast.error("Could not create the project", errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      width={720}
      title="New project"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={busy} disabled={!name.trim()} onClick={() => void create()}>
            Create project
          </Button>
        </>
      }
    >
      <div className="space-y-5 p-5">
        <fieldset>
          <legend className="mb-2 font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Start from</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[{ key: "", name: "Blank project", description: "An empty project. Add tasks as you go.", tasks: 0, milestones: 0, color: "#5A6E84" } as Partial<TemplateLite>, ...templates].map((t) => (
              <button
                key={t.key || "blank"}
                type="button"
                aria-pressed={tpl === t.key}
                onClick={() => pickTemplate(t.key ?? "")}
                className={cn(
                  "flex items-start gap-3 rounded-[12px] border p-3 text-left transition-colors",
                  tpl === t.key ? "border-[var(--a-blue)] bg-[var(--a-info-bg)] ring-1 ring-[var(--a-blue)]" : "border-[var(--a-border)] hover:border-[var(--a-border-strong)] hover:bg-[var(--a-surface-2)]",
                )}
              >
                <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: t.color }} aria-hidden />
                <span className="min-w-0">
                  <span className="block font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{t.name}</span>
                  <span className="block font-dm text-[12.5px] text-[var(--a-ink-3)]">{t.description}</span>
                  {t.tasks ? (
                    <span className="mt-1 flex items-center gap-2 font-dm text-[11.5px] text-[var(--a-ink-3)]">
                      <ListChecks size={12} aria-hidden /> {t.tasks} tasks · {t.milestones} milestones · {t.days} days
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Name" htmlFor="np-name" className="sm:col-span-2">
            <TextInput id="np-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maple Bakery AI assistant" autoFocus />
          </Field>
          <Field label="Category" htmlFor="np-cat">
            <SelectInput id="np-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
              {PROJECT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Owner" htmlFor="np-owner">
            <SelectInput id="np-owner" value={owner} onChange={(e) => setOwner(e.target.value)}>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Start" htmlFor="np-start">
            <SmartDateInput id="np-start" ariaLabel="Start date" value={startKey} onChange={(k) => {
              setStartKey(k);
              if (k && chosen) setDeadlineKey(addDays(k, chosen.days));
            }} />
          </Field>
          <Field label="Deadline" htmlFor="np-deadline">
            <SmartDateInput id="np-deadline" ariaLabel="Deadline" value={deadlineKey} onChange={setDeadlineKey} />
          </Field>
          <Field label="Client (optional)" htmlFor="np-client">
            <TextInput id="np-client" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client or company" />
          </Field>
          <Field label="Revenue potential, USD (optional)" htmlFor="np-pot">
            <TextInput id="np-pot" inputMode="decimal" value={potential} onChange={(e) => setPotential(e.target.value)} placeholder="12000" />
          </Field>
          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Color</legend>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className={cn("h-8 w-8 rounded-full ring-offset-2", color === c && "ring-2 ring-[var(--a-blue)]")}
                  style={{ background: c }}
                />
              ))}
            </div>
          </fieldset>
        </div>
      </div>
    </Modal>
  );
}

function SaveViewDialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setName("");
  }, [open]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      width={420}
      title="Save view"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={busy}
            disabled={!name.trim()}
            onClick={async () => {
              setBusy(true);
              await onSave(name.trim());
              setBusy(false);
            }}
          >
            Save view
          </Button>
        </>
      }
    >
      <div className="p-5">
        <Field label="Name" htmlFor="sv-name" hint="Saves the current filters and layout.">
          <TextInput id="sv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Client work at risk" autoFocus />
        </Field>
      </div>
    </Modal>
  );
}


