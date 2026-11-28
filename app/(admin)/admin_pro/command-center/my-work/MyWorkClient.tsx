"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ban, Bell, CalendarDays, CheckCheck, CircleCheckBig, Inbox, ListChecks, Mail, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Card, EmptyState, StatCard, useConfirm, useToast } from "@/components/admin/ui";
import type { WorkTask } from "@/lib/admin/command-center/pm";
import { addDays, localTodayKey, relativeDay, startOfWeek } from "@/lib/admin/command-center/dates";
import { api, ApiError, errMsg } from "../_components/api";
import { CcShell, emitChanged, isTypingTarget, useCc, useOnCcChange, type ProjectLite } from "../_components/CcShell";
import { DueChip, Label, PriorityIcon, type StaffLite } from "../_components/fields";
import { timeAgo } from "../_components/TaskDrawer";

interface Meeting {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  serviceType: string;
  dateKey: string;
  timeSlot: string;
  timezone: string;
  zoomLink: string | null;
  status: string;
}

interface Notif {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string;
  readAt: string | null;
  createdAt: string;
}

export default function MyWorkClient({
  shell,
  initial,
  meetings,
  emailDigest,
}: {
  shell: { staff: StaffLite[]; viewerId: string; projects: ProjectLite[]; canFinance: boolean };
  initial: { open: WorkTask[]; doneRecently: WorkTask[] };
  meetings: Meeting[] | null;
  emailDigest: boolean;
}) {
  return (
    <CcShell {...shell} title="My work" subtitle="Everything assigned to you, by when it is due.">
      <MyWork initial={initial} meetings={meetings} emailDigest={emailDigest} />
    </CcShell>
  );
}

function MyWork({ initial, meetings, emailDigest }: { initial: { open: WorkTask[]; doneRecently: WorkTask[] }; meetings: Meeting[] | null; emailDigest: boolean }) {
  const { openTask } = useCc();
  const toast = useToast();
  const confirm = useConfirm();
  const [work, setWork] = useState(initial);
  const [cursor, setCursor] = useState(0);
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));
  useEffect(() => setToday(localTodayKey()), []);

  const reload = useCallback(async () => {
    try {
      setWork(await api<{ open: WorkTask[]; doneRecently: WorkTask[] }>("/api/admin/pm/tasks?view=mine"));
    } catch {
      /* keep */
    }
  }, []);
  useOnCcChange(() => void reload());

  const weekEnd = addDays(startOfWeek(today), 6);
  const groups = useMemo(() => {
    const o = work.open;
    return [
      { id: "overdue", title: "Overdue", tone: "danger", items: o.filter((t) => t.dueKey && t.dueKey < today) },
      { id: "today", title: "Today", tone: "orange", items: o.filter((t) => t.dueKey === today) },
      { id: "week", title: "This week", tone: "info", items: o.filter((t) => t.dueKey && t.dueKey > today && t.dueKey <= weekEnd) },
      { id: "later", title: "Later", tone: "neutral", items: o.filter((t) => t.dueKey && t.dueKey > weekEnd) },
      { id: "nodate", title: "No due date", tone: "neutral", items: o.filter((t) => !t.dueKey) },
    ];
  }, [work.open, today, weekEnd]);
  const flat = groups.flatMap((g) => g.items);
  const flatRef = useRef(flat);
  flatRef.current = flat;
  const meetingsToday = (meetings ?? []).filter((m) => m.dateKey === today);
  const meetingsSoon = (meetings ?? []).filter((m) => m.dateKey > today);

  const complete = async (t: WorkTask, force = false) => {
    setWork((w) => ({ ...w, open: w.open.filter((x) => x.id !== t.id) }));
    try {
      const r = await api<{ spawned: { dueKey: string | null } | null }>(`/api/admin/pm/tasks/${t.id}`, { method: "PATCH", body: { status: "done", ...(force ? { force: true } : {}) } });
      toast.success("Completed", r.spawned ? `Next one due ${relativeDay(r.spawned.dueKey, today)}` : t.title);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && (await confirm({ title: "This task is still blocked", body: `${e.message}. Complete it anyway?`, confirmLabel: "Complete anyway" }))) {
        return complete(t, true);
      }
      if (!(e instanceof ApiError && e.status === 409)) toast.error("Could not complete", errMsg(e));
    }
    await reload();
    emitChanged({ kind: "task", projectId: t.projectId });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target) || document.querySelector('[role="dialog"]')) return;
      const rows = flatRef.current;
      if (!rows.length) return;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(rows.length - 1, c + 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if ((e.key === "Enter" || e.key === "o") && rows[cursor]) {
        e.preventDefault();
        openTask(rows[cursor].id);
      } else if ((e.key === "d" || e.key === "x") && rows[cursor]) {
        e.preventDefault();
        void complete(rows[cursor]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, openTask]);
  useEffect(() => {
    document.querySelector(`[data-work-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  let idx = -1;
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Overdue" value={groups[0].items.length} tone={groups[0].items.length ? "danger" : "default"} />
          <StatCard label="Due today" value={groups[1].items.length} tone={groups[1].items.length ? "orange" : "default"} />
          <StatCard label="This week" value={groups[2].items.length} tone="navy" />
          <StatCard label={meetings ? "Meetings today" : "Done this week"} value={meetings ? meetingsToday.length : work.doneRecently.length} />
        </div>

        {meetings && meetingsToday.length ? (
          <Card title="Today's meetings" icon={CalendarDays} padded={false}>
            <ul className="divide-y divide-[var(--a-border)]">
              {meetingsToday.map((m) => (
                <MeetingRow key={m.id} m={m} today={today} />
              ))}
            </ul>
          </Card>
        ) : null}

        {flat.length === 0 ? (
          <EmptyState icon={CircleCheckBig} title="Nothing assigned to you" body="Tasks assigned to you in any project show up here. Press C to add one." />
        ) : (
          groups.map((g) =>
            g.items.length ? (
              <section key={g.id} aria-labelledby={`grp-${g.id}`}>
                <h2 id={`grp-${g.id}`} className={cn("mb-2 flex items-center gap-2 font-syne text-[16px] font-bold", g.id === "overdue" ? "text-[var(--a-danger)]" : "text-[var(--a-ink)]")}>
                  {g.title}
                  <span className="font-dm text-[12.5px] font-semibold tabular-nums text-[var(--a-ink-3)]">{g.items.length}</span>
                </h2>
                <ul className="overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]">
                  {g.items.map((t) => {
                    idx++;
                    const i = idx;
                    return (
                      <li
                        key={t.id}
                        data-work-index={i}
                        onMouseEnter={() => setCursor(i)}
                        className={cn("flex items-center gap-3 border-b border-[var(--a-border)] px-4 py-2.5 last:border-b-0", i === cursor && "bg-[#f3f6fb] shadow-[inset_2px_0_0_var(--a-blue)]")}
                      >
                        <button
                          type="button"
                          onClick={() => void complete(t)}
                          aria-label={`Complete ${t.title}`}
                          className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--a-border-strong)] hover:border-[var(--a-success)] hover:bg-[var(--a-success-bg)]"
                        />
                        <PriorityIcon priority={t.priority} className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <button type="button" onClick={() => openTask(t.id)} className="block max-w-full truncate text-left font-dm text-[14px] font-semibold text-[var(--a-ink)] hover:underline">
                            {t.title}
                          </button>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-dm text-[12px] text-[var(--a-ink-3)]">
                            <Link href={`/admin_pro/command-center/projects/${t.projectId}`} className="inline-flex items-center gap-1 hover:underline">
                              <span className="h-2 w-2 rounded-full" style={{ background: t.projectColor }} aria-hidden />
                              {t.projectName}
                            </Link>
                            {t.blocked ? (
                              <span className="inline-flex items-center gap-0.5 font-semibold text-[var(--a-danger)]">
                                <Ban size={11} aria-hidden /> Blocked
                              </span>
                            ) : null}
                            {t.subtaskCount ? (
                              <span className="inline-flex items-center gap-0.5">
                                <ListChecks size={11} aria-hidden /> {t.subtaskDone}/{t.subtaskCount}
                              </span>
                            ) : null}
                            {t.labels.slice(0, 2).map((l) => (
                              <Label key={l}>#{l}</Label>
                            ))}
                          </div>
                        </div>
                        <DueChip dueKey={t.dueKey} today={today} />
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null,
          )
        )}
        <p className="hidden font-dm text-[12px] text-[var(--a-ink-3)] sm:block">
          Keys: <b>j</b>/<b>k</b> move, <b>Enter</b> open, <b>d</b> complete, <b>c</b> new task, <b>/</b> search.
        </p>
      </div>

      <aside className="min-w-0 space-y-5">
        <InboxCard />
        {meetings && meetingsSoon.length ? (
          <Card title="Coming up" icon={CalendarDays} padded={false}>
            <ul className="divide-y divide-[var(--a-border)]">
              {meetingsSoon.slice(0, 6).map((m) => (
                <MeetingRow key={m.id} m={m} today={today} />
              ))}
            </ul>
          </Card>
        ) : null}
        {work.doneRecently.length ? (
          <Card title="Done in the last 7 days" icon={CheckCheck} padded={false}>
            <ul className="divide-y divide-[var(--a-border)]">
              {work.doneRecently.slice(0, 8).map((t) => (
                <li key={t.id} className="px-5 py-2">
                  <button type="button" onClick={() => openTask(t.id)} className="block max-w-full truncate text-left font-dm text-[13px] text-[var(--a-ink-3)] line-through hover:underline">
                    {t.title}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        <DigestCard initial={emailDigest} />
      </aside>
    </div>
  );
}

function MeetingRow({ m, today }: { m: Meeting; today: string }) {
  return (
    <li className="flex items-center gap-3 px-5 py-2.5">
      <div className="w-16 shrink-0 font-dm text-[12.5px] font-semibold tabular-nums text-[var(--a-ink)]">{m.timeSlot}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">
          {m.firstName} {m.lastName}
          {m.company ? <span className="font-normal text-[var(--a-ink-3)]"> · {m.company}</span> : null}
        </p>
        <p className="truncate font-dm text-[12px] text-[var(--a-ink-3)]">
          {m.serviceType.replace(/_/g, " ").toLowerCase()} · {m.dateKey === today ? m.timezone : relativeDay(m.dateKey, today)}
        </p>
      </div>
      {m.zoomLink ? (
        <a href={m.zoomLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1 rounded-md px-2 font-dm text-[12.5px] font-semibold text-[var(--a-blue)] hover:bg-[var(--a-info-bg)]">
          <Video size={14} aria-hidden /> Join
        </a>
      ) : (
        <Link href="/admin_pro/appointments" className="font-dm text-[12.5px] font-semibold text-[var(--a-blue)] hover:underline">
          Open
        </Link>
      )}
    </li>
  );
}

function InboxCard() {
  const toast = useToast();
  const [items, setItems] = useState<Notif[] | null>(null);
  const load = useCallback(() => {
    api<{ items: Notif[] }>("/api/admin/pm/notifications")
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));
  }, []);
  useEffect(load, [load]);
  useOnCcChange(() => load());
  const unread = (items ?? []).filter((n) => !n.readAt).length;
  return (
    <Card
      title="Inbox"
      icon={Inbox}
      padded={false}
      action={
        unread ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              try {
                await api("/api/admin/pm/notifications", { body: {} });
                load();
              } catch (e) {
                toast.error("Could not mark read", errMsg(e));
              }
            }}
          >
            Mark all read
          </Button>
        ) : null
      }
    >
      {items === null ? (
        <div className="space-y-2 p-5">
          <div className="a-skeleton h-4 w-3/4 rounded" />
          <div className="a-skeleton h-4 w-1/2 rounded" />
        </div>
      ) : items.length ? (
        <ul className="max-h-[360px] divide-y divide-[var(--a-border)] overflow-y-auto">
          {items.map((n) => (
            <li key={n.id}>
              <Link href={n.href} className="flex gap-2.5 px-5 py-2.5 hover:bg-[var(--a-surface-2)]">
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-[var(--a-blue)]")} aria-label={n.readAt ? undefined : "Unread"} />
                <span className="min-w-0 flex-1">
                  <span className="block font-dm text-[13px] font-semibold leading-snug text-[var(--a-ink)]">{n.title}</span>
                  {n.body ? <span className="block truncate font-dm text-[12px] text-[var(--a-ink-3)]">{n.body}</span> : null}
                  <span className="font-dm text-[11.5px] text-[var(--a-ink-3)]">{timeAgo(n.createdAt)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 px-5 py-5 font-dm text-[13px] text-[var(--a-ink-3)]">
          <Bell size={14} aria-hidden /> Mentions, assignments and reminders land here.
        </p>
      )}
    </Card>
  );
}

function DigestCard({ initial }: { initial: boolean }) {
  const toast = useToast();
  const [on, setOn] = useState(initial);
  return (
    <Card title="Email digest" icon={Mail}>
      <label className="flex items-start gap-3 font-dm text-[13.5px] text-[var(--a-ink-2)]">
        <input
          type="checkbox"
          checked={on}
          onChange={async (e) => {
            const v = e.target.checked;
            setOn(v);
            try {
              await api("/api/admin/pm/prefs", { method: "PATCH", body: { emailDigest: v } });
              toast.success(v ? "Daily digest on" : "Daily digest off");
            } catch (err) {
              setOn(!v);
              toast.error("Could not save", errMsg(err));
            }
          }}
          className="mt-0.5 h-4 w-4 accent-[var(--a-blue)]"
        />
        <span>
          Send me a morning email when I have tasks overdue or due today.
          <span className="mt-0.5 block text-[12px] text-[var(--a-ink-3)]">At most one a day. Nothing is sent on days with nothing due.</span>
        </span>
      </label>
    </Card>
  );
}
