"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Archive, ArchiveRestore, Check, Flag, Link2, MoreHorizontal, Plus, Star, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Button, Card, Menu, Tabs, useConfirm, useToast, type BadgeTone } from "@/components/admin/ui";
import type { ProjectBundle } from "@/lib/admin/command-center/pm";
import { healthSignals } from "@/lib/admin/command-center/pm-client";
import { HEALTH, PROJECT_CATEGORIES, PROJECT_PRIORITIES, PROJECT_STATUSES } from "@/lib/admin/command-center/constants";
import { fmtMinutes, localTodayKey, relativeDay } from "@/lib/admin/command-center/dates";
import { fmtUsd } from "@/lib/admin/command-center/money";
import { api, errMsg } from "../../_components/api";
import { CcShell, emitChanged, useOnCcChange, type ProjectLite } from "../../_components/CcShell";
import { Field, HealthBadge, inputCls, Progress, SelectInput, SmartDateInput, TextArea, TextInput, type StaffLite } from "../../_components/fields";
import { Markdown } from "../../_components/Markdown";
import { MarkdownEditor } from "../../_components/MarkdownEditor";
import { TasksTab } from "./TasksTab";
import { TimelineTab } from "./TimelineTab";
import { NotesTab } from "./NotesTab";
import { ActivityTab, FinanceTab, TimeTab, UpdatesTab } from "./OtherTabs";

export type Prospect = { id: string; name: string; business: string };

const TAB_IDS = ["overview", "tasks", "timeline", "notes", "updates", "activity", "time", "finance"] as const;
type TabId = (typeof TAB_IDS)[number];

export default function ProjectClient({
  shell,
  initial,
  prospects,
}: {
  shell: { staff: StaffLite[]; viewerId: string; projects: ProjectLite[]; canFinance: boolean };
  initial: ProjectBundle;
  prospects: Prospect[] | null;
}) {
  const [b, setB] = useState(initial);
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const toast = useToast();
  const confirm = useConfirm();
  const today = localTodayKey();
  const tabParam = search?.get("tab") as TabId | null;
  const [tab, setTab] = useState<TabId>(tabParam && TAB_IDS.includes(tabParam) ? tabParam : "overview");
  useEffect(() => {
    if (tabParam && TAB_IDS.includes(tabParam)) setTab(tabParam);
  }, [tabParam]);
  const p = b.project;

  const reload = useCallback(async () => {
    try {
      setB(await api<ProjectBundle>(`/api/admin/pm/projects/${initial.project.id}`));
    } catch {
      /* keep current */
    }
  }, [initial.project.id]);
  useOnCcChange((d) => {
    if (!d.projectId || d.projectId === initial.project.id) void reload();
  });

  const switchTab = (t: string) => {
    setTab(t as TabId);
    const sp = new URLSearchParams(search?.toString());
    sp.set("tab", t);
    sp.delete("note");
    router.replace(`${pathname}?${sp}`, { scroll: false });
  };

  const patch = async (body: Record<string, unknown>, msg?: string) => {
    setB((x) => ({ ...x, project: { ...x.project, ...body } as ProjectBundle["project"] }));
    try {
      await api(`/api/admin/pm/projects/${p.id}`, { method: "PATCH", body });
      if (msg) toast.success(msg);
      await reload();
      emitChanged({ kind: "project", projectId: p.id });
      return true;
    } catch (e) {
      toast.error("Could not save", errMsg(e));
      await reload();
      return false;
    }
  };

  const topTasks = b.tasks.filter((t) => !t.parentId);
  const open = topTasks.filter((t) => !t.done);
  const overdueMs = b.milestones.filter((m) => !m.done && m.dueKey < today).length;
  const signals = healthSignals(p, open, overdueMs, today);
  const st = PROJECT_STATUSES.find((s) => s.value === p.status) ?? PROJECT_STATUSES[1];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "tasks", label: "Tasks", count: open.length },
    { id: "timeline", label: "Timeline" },
    { id: "notes", label: "Notes", count: b.notes.length || null },
    { id: "updates", label: "Updates", count: b.updates.length || null },
    { id: "activity", label: "Activity" },
    { id: "time", label: "Time" },
    ...(shell.canFinance ? [{ id: "finance", label: "Finance" }] : []),
  ];

  const menu = [
    { label: p.starred ? "Unstar" : "Star", icon: Star, onSelect: () => void patch({ starred: !p.starred }) },
    p.archived
      ? { label: "Restore project", icon: ArchiveRestore, onSelect: () => void patch({ archived: false }, "Project restored") }
      : {
          label: "Archive project",
          icon: Archive,
          onSelect: async () => {
            if (await confirm({ title: `Archive ${p.name}?`, body: "It leaves the portfolio and My work. You can restore it from the Archived filter.", confirmLabel: "Archive" })) {
              await patch({ archived: true }, "Project archived");
            }
          },
        },
    { separator: true as const },
    {
      label: "Delete permanently",
      icon: Trash2,
      danger: true,
      onSelect: async () => {
        const ok = await confirm({
          title: `Delete ${p.name} permanently?`,
          body: "Tasks, milestones, notes, updates and time go with it. Finance entries stay but lose the link. This cannot be undone.",
          danger: true,
          typeToConfirm: p.name,
          confirmLabel: "Delete project",
        });
        if (!ok) return;
        try {
          await api(`/api/admin/pm/projects/${p.id}?mode=delete`, { method: "DELETE" });
          toast.success("Project deleted");
          router.push("/admin_pro/command-center");
        } catch (e) {
          toast.error("Could not delete", errMsg(e));
        }
      },
    },
  ];

  return (
    <CcShell
      {...shell}
      defaultProjectId={p.id}
      breadcrumb={[{ label: "Command Center", href: "/admin_pro/command-center" }, { label: p.name }]}
      title={
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
          <span className="min-w-0 break-words">{p.name}</span>
          {p.starred ? <Star size={18} className="shrink-0 text-[var(--a-orange)]" fill="currentColor" aria-label="Starred" /> : null}
        </span>
      }
      meta={
        <>
          <Badge tone={st.tone as BadgeTone}>{p.archived ? "Archived" : st.label}</Badge>
          <HealthBadge health={p.health} />
          {signals.map((s) => (
            <Badge key={s.kind} tone={s.kind === "stale" ? "warn" : "danger"}>
              <AlertTriangle size={11} aria-hidden className="mr-1" />
              {s.text}
            </Badge>
          ))}
          <span className="font-dm text-[12.5px] text-[var(--a-ink-3)]">
            {p.progress}% · {topTasks.length - open.length}/{topTasks.length} tasks
          </span>
        </>
      }
      actions={
        <Menu
          label="Project actions"
          items={menu}
          trigger={(tp) => (
            <button {...tp} aria-label="Project actions" className="flex h-8 w-8 items-center justify-center rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] text-[var(--a-ink-2)] hover:bg-[var(--a-surface-2)]">
              <MoreHorizontal size={16} aria-hidden />
            </button>
          )}
        />
      }
    >
      <Tabs items={tabs} active={tab} onChange={switchTab} ariaLabel="Project sections" className="mb-5" />
      {tab === "overview" ? (
        <Overview b={b} staff={shell.staff} today={today} canFinance={shell.canFinance} prospects={prospects} patch={patch} reload={reload} signals={signals} onTab={switchTab} />
      ) : tab === "tasks" ? (
        <TasksTab b={b} staff={shell.staff} viewerId={shell.viewerId} projects={shell.projects} today={today} reload={reload} />
      ) : tab === "timeline" ? (
        <TimelineTab b={b} today={today} reload={reload} />
      ) : tab === "notes" ? (
        <NotesTab b={b} reload={reload} setB={setB} />
      ) : tab === "updates" ? (
        <UpdatesTab b={b} today={today} reload={reload} />
      ) : tab === "activity" ? (
        <ActivityTab b={b} />
      ) : tab === "time" ? (
        <TimeTab b={b} staff={shell.staff} viewerId={shell.viewerId} today={today} reload={reload} canFinance={shell.canFinance} />
      ) : (
        <FinanceTab b={b} canFinance={shell.canFinance} patch={patch} />
      )}
    </CcShell>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────

function EditableMd({ label, value, placeholder, onSave }: { label: string; value: string; placeholder: string; onSave: (v: string) => Promise<boolean> }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!editing) setV(value);
  }, [value, editing]);
  return (
    <Card
      title={label}
      action={
        !editing ? (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            {value ? "Edit" : "Add"}
          </Button>
        ) : null
      }
    >
      {editing ? (
        <div className="space-y-2">
          <MarkdownEditor value={v} onChange={setV} ariaLabel={label} placeholder={placeholder} />
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
        <Markdown source={value} />
      ) : (
        <p className="font-dm text-[13.5px] text-[var(--a-ink-3)]">{placeholder}</p>
      )}
    </Card>
  );
}

function Overview({
  b,
  staff,
  today,
  canFinance,
  prospects,
  patch,
  reload,
  signals,
  onTab,
}: {
  b: ProjectBundle;
  staff: StaffLite[];
  today: string;
  canFinance: boolean;
  prospects: Prospect[] | null;
  patch: (body: Record<string, unknown>, msg?: string) => Promise<boolean>;
  reload: () => Promise<void>;
  signals: Array<{ kind: string; text: string }>;
  onTab: (t: string) => void;
}) {
  const p = b.project;
  const [healthNote, setHealthNote] = useState(p.healthNote ?? "");
  useEffect(() => setHealthNote(p.healthNote ?? ""), [p.healthNote]);
  const latest = b.updates[0];
  const logged = b.time.reduce((n, t) => n + t.minutes, 0);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        <EditableMd label="Description" value={p.description ?? ""} placeholder="What this project is and why it matters." onSave={(v) => patch({ description: v || null }, "Description saved")} />
        <EditableMd label="Goals" value={p.goals ?? ""} placeholder="Outcomes that mean this project worked. A checklist works well." onSave={(v) => patch({ goals: v || null }, "Goals saved")} />
        <Milestones b={b} today={today} reload={reload} />
        <LinksCard links={p.links} onSave={(links) => patch({ links }, "Links saved")} />
        {latest ? (
          <Card title="Latest update" action={<Button size="sm" variant="ghost" onClick={() => onTab("updates")}>All updates</Button>}>
            <div className="mb-2 flex flex-wrap items-center gap-2 font-dm text-[12.5px] text-[var(--a-ink-3)]">
              <HealthBadge health={latest.health} />
              <span>
                {latest.authorName} · {relativeDay(latest.createdAt.slice(0, 10), today)} · {latest.progress}%
              </span>
            </div>
            {latest.doneMd ? <Section title="Done" md={latest.doneMd} /> : null}
            {latest.nextMd ? <Section title="Next" md={latest.nextMd} /> : null}
            {latest.blockersMd ? <Section title="Blockers" md={latest.blockersMd} /> : null}
          </Card>
        ) : null}
      </div>

      <div className="min-w-0 space-y-5">
        <Card title="Health">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Project health">
              {HEALTH.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  role="radio"
                  aria-checked={p.health === h.value}
                  onClick={() => void patch({ health: h.value }, `Marked ${h.label.toLowerCase()}`)}
                  className={cn(
                    "rounded-[10px] border px-2 py-2 font-dm text-[12.5px] font-semibold transition-colors",
                    p.health === h.value
                      ? h.value === "on_track"
                        ? "border-[var(--a-success)] bg-[var(--a-success-bg)] text-[var(--a-success)]"
                        : h.value === "at_risk"
                          ? "border-[var(--a-warn)] bg-[var(--a-warn-bg)] text-[var(--a-warn)]"
                          : "border-[var(--a-danger)] bg-[var(--a-danger-bg)] text-[var(--a-danger)]"
                      : "border-[var(--a-border)] text-[var(--a-ink-2)] hover:bg-[var(--a-surface-2)]",
                  )}
                >
                  {h.label}
                </button>
              ))}
            </div>
            <TextArea
              value={healthNote}
              onChange={(e) => setHealthNote(e.target.value)}
              onBlur={() => healthNote !== (p.healthNote ?? "") && void patch({ healthNote: healthNote.trim() || null }, "Note saved")}
              placeholder="Why? One line on the risk or what is needed."
              aria-label="Health note"
              className="min-h-[64px]"
            />
            {signals.length ? (
              <ul className="space-y-1">
                {signals.map((s) => (
                  <li key={s.kind} className={cn("flex items-center gap-1.5 font-dm text-[12.5px] font-semibold", s.kind === "stale" ? "text-[var(--a-warn)]" : "text-[var(--a-danger)]")}>
                    <AlertTriangle size={13} aria-hidden /> {s.text}
                    {s.kind === "stale" ? (
                      <button type="button" onClick={() => onTab("updates")} className="ml-auto font-semibold text-[var(--a-blue)] underline">
                        Post update
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-1.5 font-dm text-[12.5px] text-[var(--a-success)]">
                <Check size={13} aria-hidden /> No overdue work, updated in the last 14 days.
              </p>
            )}
          </div>
        </Card>

        <Card title="Details">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status" htmlFor="pd-status">
                <SelectInput id="pd-status" value={p.status} onChange={(e) => void patch({ status: e.target.value }, "Status updated")}>
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Priority" htmlFor="pd-prio">
                <SelectInput id="pd-prio" value={p.priority} onChange={(e) => void patch({ priority: e.target.value })}>
                  {PROJECT_PRIORITIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Category" htmlFor="pd-cat">
                <SelectInput id="pd-cat" value={p.category} onChange={(e) => void patch({ category: e.target.value })}>
                  {PROJECT_CATEGORIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Owner" htmlFor="pd-owner">
                <SelectInput id="pd-owner" value={p.ownerId ?? ""} onChange={(e) => void patch({ ownerId: e.target.value || null }, "Owner updated")}>
                  <option value="">No owner</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Start" htmlFor="pd-start">
                <SmartDateInput id="pd-start" ariaLabel="Start date" value={p.startKey} onChange={(k) => void patch({ startKey: k })} />
              </Field>
              <Field label="Deadline" htmlFor="pd-deadline">
                <SmartDateInput id="pd-deadline" ariaLabel="Deadline" value={p.deadlineKey} onChange={(k) => void patch({ deadlineKey: k }, "Deadline updated")} />
              </Field>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Progress</span>
                <label className="flex items-center gap-1.5 font-dm text-[12.5px] text-[var(--a-ink-3)]">
                  <input
                    type="checkbox"
                    checked={p.progressMode === "auto"}
                    onChange={(e) => void patch({ progressMode: e.target.checked ? "auto" : "manual" })}
                    className="h-4 w-4 accent-[var(--a-blue)]"
                  />
                  From tasks and milestones
                </label>
              </div>
              <ProgressSlider value={p.progress} disabled={p.progressMode === "auto"} onCommit={(v) => void patch({ progress: v })} />
              <Progress value={p.progress} color={p.color} className="mt-2" />
            </div>
          </div>
        </Card>

        <ClientCard p={p} prospects={prospects} patch={patch} />

        <Card title="Money and time" action={canFinance ? <Button size="sm" variant="ghost" onClick={() => onTab("finance")}>Finance</Button> : null}>
          <div className="grid grid-cols-2 gap-3">
            <MoneyField label="Revenue earned (USD)" value={p.revenueEarned} onSave={(v) => patch({ revenueEarned: v }, "Saved")} hint="Recorded outside Finance" />
            <MoneyField label="Potential (USD)" value={p.revenuePotential} onSave={(v) => patch({ revenuePotential: v }, "Saved")} />
            <MoneyField label="Retainer per month (USD)" value={p.monthlyRecurring} onSave={(v) => patch({ monthlyRecurring: v }, "Saved")} hint="Counts toward MRR" />
            {canFinance ? (
              <MoneyField label="Hourly rate (USD)" value={p.hourlyRateCents != null ? p.hourlyRateCents / 100 : null} onSave={(v) => patch({ hourlyRateCents: v === null ? null : Math.round(v * 100) }, "Hourly rate saved")} allowEmpty hint="Prices logged time" />
            ) : null}
          </div>
          <p className="mt-3 font-dm text-[12.5px] text-[var(--a-ink-3)]">
            {fmtMinutes(logged)} logged
            {canFinance && p.hourlyRateCents ? ` · ${fmtUsd(Math.round((logged / 60) * p.hourlyRateCents))} of time` : ""}
            {canFinance && b.finance ? ` · profit ${fmtUsd(b.finance.profitCents)}` : ""}
          </p>
        </Card>
      </div>
    </div>
  );

}

function ProgressSlider({ value, disabled, onCommit }: { value: number; disabled: boolean; onCommit: (v: number) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const commit = () => v !== value && onCommit(v);
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={v}
        disabled={disabled}
        onChange={(e) => setV(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        aria-label="Progress"
        className="flex-1 accent-[var(--a-blue)] disabled:opacity-50"
      />
      <span className="w-10 text-right font-dm text-[13px] font-semibold tabular-nums text-[var(--a-ink)]">{v}%</span>
    </div>
  );
}

function Section({ title, md }: { title: string; md: string }) {
  return (
    <div className="mt-2">
      <p className="a-micro mb-1">{title}</p>
      <Markdown source={md} />
    </div>
  );
}

function MoneyField({ label, value, onSave, hint, allowEmpty }: { label: string; value: number | null; onSave: (v: number | null) => Promise<boolean>; hint?: string; allowEmpty?: boolean }) {
  const [v, setV] = useState(value == null ? "" : String(value));
  useEffect(() => setV(value == null ? "" : String(value)), [value]);
  const id = `mf-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <TextInput
        id={id}
        inputMode="decimal"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const t = v.replace(/[$,\s]/g, "");
          if (!t) {
            if (allowEmpty && value !== null) void onSave(null);
            else if (!allowEmpty) setV(String(value ?? 0));
            return;
          }
          const n = Number(t);
          if (!Number.isFinite(n) || n < 0) return setV(value == null ? "" : String(value));
          const rounded = allowEmpty ? Math.round(n * 100) / 100 : Math.round(n);
          if (rounded !== value) void onSave(rounded);
        }}
        className="tabular-nums"
      />
    </Field>
  );
}

function ClientCard({ p, prospects, patch }: { p: ProjectBundle["project"]; prospects: Prospect[] | null; patch: (b: Record<string, unknown>, m?: string) => Promise<boolean> }) {
  const [name, setName] = useState(p.clientName ?? "");
  const [email, setEmail] = useState(p.clientEmail ?? "");
  useEffect(() => {
    setName(p.clientName ?? "");
    setEmail(p.clientEmail ?? "");
  }, [p.clientName, p.clientEmail]);
  const linked = prospects?.find((x) => x.id === p.prospectId);
  return (
    <Card title="Client">
      <div className="space-y-3">
        <Field label="Client name" htmlFor="pc-name">
          <TextInput id="pc-name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name !== (p.clientName ?? "") && void patch({ clientName: name.trim() || null }, "Client saved")} placeholder="Company or person" />
        </Field>
        <Field label="Client email" htmlFor="pc-email">
          <TextInput id="pc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => email !== (p.clientEmail ?? "") && void patch({ clientEmail: email.trim() || null }, "Client saved")} placeholder="name@company.com" />
        </Field>
        {prospects ? (
          <Field label="Linked prospect" htmlFor="pc-prospect" hint={linked ? <Link href={`/admin_pro/prospects?q=${encodeURIComponent(linked.business || linked.name)}`} className="text-[var(--a-blue)] underline">Open in Prospects</Link> : undefined}>
            <SelectInput id="pc-prospect" value={p.prospectId ?? ""} onChange={(e) => void patch({ prospectId: e.target.value || null }, "Prospect linked")}>
              <option value="">Not linked</option>
              {prospects.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.business || x.name}
                  {x.business && x.name ? ` (${x.name})` : ""}
                </option>
              ))}
            </SelectInput>
          </Field>
        ) : p.prospectId ? (
          <p className="font-dm text-[12.5px] text-[var(--a-ink-3)]">Linked to a prospect.</p>
        ) : null}
      </div>
    </Card>
  );
}

function LinksCard({ links, onSave }: { links: Array<{ label: string; url: string }>; onSave: (l: Array<{ label: string; url: string }>) => Promise<boolean> }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  return (
    <Card title="Files and links" subtitle="Drive folders, Figma, contracts, repos.">
      {links.length ? (
        <ul className="mb-3 divide-y divide-[var(--a-border)]">
          {links.map((l, i) => (
            <li key={i} className="flex items-center gap-2 py-2">
              <Link2 size={14} className="shrink-0 text-[var(--a-ink-3)]" aria-hidden />
              <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="min-w-0 flex-1 truncate font-dm text-[13.5px] font-semibold text-[var(--a-blue)] hover:underline">
                {l.label || l.url}
              </a>
              <span className="hidden max-w-[200px] truncate font-dm text-[12px] text-[var(--a-ink-3)] sm:block">{l.url.replace(/^https?:\/\//, "")}</span>
              <button type="button" onClick={() => void onSave(links.filter((_, j) => j !== i))} aria-label={`Remove ${l.label || l.url}`} className="rounded p-1 text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)]">
                <X size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <form
        className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.5fr_auto]"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!url.trim()) return;
          const full = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
          if (await onSave([...links, { label: label.trim(), url: full }])) {
            setLabel("");
            setUrl("");
          }
        }}
      >
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" aria-label="Link label" className={inputCls} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" aria-label="Link URL" className={inputCls} />
        <Button type="submit" icon={Plus} disabled={!url.trim()}>
          Add
        </Button>
      </form>
    </Card>
  );
}

function Milestones({ b, today, reload }: { b: ProjectBundle; today: string; reload: () => Promise<void> }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const call = async (fn: () => Promise<unknown>, msg?: string) => {
    try {
      await fn();
      if (msg) toast.success(msg);
      await reload();
      emitChanged({ kind: "milestone", projectId: b.project.id });
    } catch (e) {
      toast.error("Could not save", errMsg(e));
    }
  };
  return (
    <Card title="Milestones" subtitle="Dates that matter. They also show on the timeline and calendar.">
      {b.milestones.length ? (
        <ol className="relative mb-3 space-y-0.5 border-l-2 border-[var(--a-border)] pl-4">
          {b.milestones.map((m) => {
            const tasks = b.tasks.filter((t) => t.milestoneId === m.id);
            const late = !m.done && m.dueKey < today;
            return (
              <li key={m.id} className="group relative flex flex-wrap items-center gap-2 py-1.5">
                <span className={cn("absolute -left-[23px] h-3 w-3 rotate-45 border-2 border-white", m.done ? "bg-[var(--a-success)]" : late ? "bg-[var(--a-danger)]" : "bg-[var(--a-navy)]")} aria-hidden />
                <input type="checkbox" checked={m.done} onChange={() => void call(() => api(`/api/admin/pm/milestones/${m.id}`, { method: "PATCH", body: { done: !m.done } }), m.done ? "Milestone reopened" : "Milestone reached")} aria-label={`${m.title}: ${m.done ? "reached" : "not reached"}`} className="h-4 w-4 accent-[var(--a-success)]" />
                <span className={cn("min-w-0 flex-1 font-dm text-[14px] font-semibold", m.done ? "text-[var(--a-ink-3)] line-through" : "text-[var(--a-ink)]")}>
                  <Flag size={12} className="mr-1 inline text-[var(--a-ink-3)]" aria-hidden />
                  {m.title}
                  {tasks.length ? <span className="ml-2 font-normal text-[var(--a-ink-3)]">{tasks.filter((t) => t.done).length}/{tasks.length} tasks</span> : null}
                </span>
                <div className="w-[170px]">
                  <SmartDateInput ariaLabel={`${m.title} date`} value={m.dueKey} onChange={(k) => k && void call(() => api(`/api/admin/pm/milestones/${m.id}`, { method: "PATCH", body: { dueKey: k } }), "Milestone moved")} />
                </div>
                <span className={cn("w-20 font-dm text-[12px]", late ? "font-semibold text-[var(--a-danger)]" : "text-[var(--a-ink-3)]")}>{relativeDay(m.dueKey, today)}</span>
                <button
                  type="button"
                  aria-label={`Delete milestone ${m.title}`}
                  onClick={async () => {
                    if (await confirm({ title: `Delete the milestone "${m.title}"?`, danger: true, confirmLabel: "Delete" })) {
                      await call(() => api(`/api/admin/pm/milestones/${m.id}`, { method: "DELETE" }), "Milestone deleted");
                    }
                  }}
                  className="rounded p-1 text-[var(--a-ink-3)] opacity-60 hover:bg-[var(--a-surface-2)] hover:opacity-100"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mb-3 font-dm text-[13.5px] text-[var(--a-ink-3)]">No milestones yet.</p>
      )}
      <form
        className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_200px_auto]"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim() || !due) return toast.error("Give the milestone a name and a date");
          setBusy(true);
          await call(() => api("/api/admin/pm/milestones", { body: { projectId: b.project.id, title: title.trim(), dueKey: due } }), "Milestone added");
          setTitle("");
          setDue(null);
          setBusy(false);
        }}
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Milestone, e.g. Pilot live" aria-label="Milestone name" className={inputCls} />
        <SmartDateInput ariaLabel="Milestone date" value={due} onChange={setDue} placeholder="Date, e.g. oct 30" />
        <Button type="submit" icon={Plus} loading={busy} disabled={!title.trim()}>
          Add milestone
        </Button>
      </form>
    </Card>
  );
}

