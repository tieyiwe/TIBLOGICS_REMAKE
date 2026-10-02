"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, CirclePlay, Clock, Megaphone, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Button, Card, EmptyState, StatCard, useConfirm, useToast } from "@/components/admin/ui";
import type { ProjectBundle } from "@/lib/admin/command-center/pm";
import { HEALTH, categoryLabel } from "@/lib/admin/command-center/constants";
import { fmtDay, fmtMinutes, localTodayKey, parseDuration, relativeDay } from "@/lib/admin/command-center/dates";
import { fmtMoney, fmtUsd } from "@/lib/admin/command-center/money";
import { api, errMsg } from "../../_components/api";
import { emitChanged } from "../../_components/CcShell";
import { Field, HealthBadge, SelectInput, SmartDateInput, TextInput, type StaffLite } from "../../_components/fields";
import { Markdown } from "../../_components/Markdown";
import { MarkdownEditor } from "../../_components/MarkdownEditor";


// ── Updates ──────────────────────────────────────────────────────────────────

export function UpdatesTab({ b, today, reload }: { b: ProjectBundle; today: string; reload: () => Promise<void> }) {
  const toast = useToast();
  const p = b.project;
  const top = b.tasks.filter((t) => !t.parentId);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  // Prefill from the last week: what got done, what is due next.
  const suggestedDone = top.filter((t) => t.done && t.completedAt && t.completedAt >= weekAgo).map((t) => `- ${t.title}`).join("\n");
  const suggestedNext = top
    .filter((t) => !t.done && t.dueKey)
    .sort((a, c) => (a.dueKey! < c.dueKey! ? -1 : 1))
    .slice(0, 5)
    .map((t) => `- ${t.title} (${relativeDay(t.dueKey, today)})`)
    .join("\n");
  const [health, setHealth] = useState(p.health);
  const [progress, setProgress] = useState(p.progress);
  const [done, setDone] = useState(suggestedDone);
  const [next, setNext] = useState(suggestedNext);
  const [blockers, setBlockers] = useState("");
  const [busy, setBusy] = useState(false);
  const lastDays = p.lastUpdateAt ? Math.round((Date.now() - Date.parse(p.lastUpdateAt)) / 86_400_000) : null;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card title="Post a status update" subtitle={lastDays === null ? "No update posted yet." : `Last update ${lastDays === 0 ? "today" : `${lastDays} day${lastDays === 1 ? "" : "s"} ago`}. Aim for one a week.`}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api("/api/admin/pm/updates", { body: { projectId: p.id, health, progress, doneMd: done, nextMd: next, blockersMd: blockers } });
              toast.success("Update posted");
              setBlockers("");
              await reload();
              emitChanged({ kind: "update", projectId: p.id });
            } catch (err) {
              toast.error("Could not post", errMsg(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Health" htmlFor="up-health">
              <SelectInput id="up-health" value={health} onChange={(e) => setHealth(e.target.value)}>
                {HEALTH.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label={p.progressMode === "auto" ? "Progress (from tasks)" : "Progress"} htmlFor="up-progress">
              <div className="flex h-9 items-center gap-3">
                <input id="up-progress" type="range" min={0} max={100} step={5} value={p.progressMode === "auto" ? p.progress : progress} disabled={p.progressMode === "auto"} onChange={(e) => setProgress(Number(e.target.value))} className="flex-1 accent-[var(--a-blue)] disabled:opacity-50" />
                <span className="w-10 text-right font-dm text-[13px] font-semibold tabular-nums">{p.progressMode === "auto" ? p.progress : progress}%</span>
              </div>
            </Field>
          </div>
          <Field label="Done this week">
            <MarkdownEditor value={done} onChange={setDone} ariaLabel="Done this week" minRows={4} placeholder="- Shipped the prototype" />
          </Field>
          <Field label="Next">
            <MarkdownEditor value={next} onChange={setNext} ariaLabel="Next" minRows={4} placeholder="- Pilot with the client team" />
          </Field>
          <Field label="Blockers">
            <MarkdownEditor value={blockers} onChange={setBlockers} ariaLabel="Blockers" minRows={3} placeholder="Waiting on API keys from the client" />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" icon={Megaphone} loading={busy}>
              Post update
            </Button>
          </div>
        </form>
      </Card>
      <div className="min-w-0 space-y-3">
        {b.updates.length ? (
          b.updates.map((u) => (
            <article key={u.id} className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-5 shadow-[var(--a-shadow-card)]">
              <header className="mb-3 flex flex-wrap items-center gap-2">
                <Avatar name={u.authorName} size={26} />
                <span className="font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{u.authorName}</span>
                <span className="font-dm text-[12.5px] text-[var(--a-ink-3)]">{fmtDay(u.createdAt.slice(0, 10), { withYear: true })}</span>
                <span className="ml-auto flex items-center gap-2">
                  <HealthBadge health={u.health} />
                  <span className="font-dm text-[12.5px] font-semibold tabular-nums text-[var(--a-ink-2)]">{u.progress}%</span>
                </span>
              </header>
              {u.doneMd ? <UpdatePart title="Done" md={u.doneMd} /> : null}
              {u.nextMd ? <UpdatePart title="Next" md={u.nextMd} /> : null}
              {u.blockersMd ? <UpdatePart title="Blockers" md={u.blockersMd} tone="danger" /> : null}
            </article>
          ))
        ) : (
          <EmptyState icon={Megaphone} title="No updates yet" body="A short weekly update keeps everyone aligned and clears the 14 day warning." compact />
        )}
      </div>
    </div>
  );
}

function UpdatePart({ title, md, tone }: { title: string; md: string; tone?: "danger" }) {
  return (
    <div className="mt-2">
      <p className={cn("a-micro mb-1", tone === "danger" && "!text-[var(--a-danger)]")}>{title}</p>
      <Markdown source={md} />
    </div>
  );
}

// ── Activity ─────────────────────────────────────────────────────────────────

export function ActivityTab({ b }: { b: ProjectBundle }) {
  if (!b.activity.length) return <EmptyState icon={Activity} title="No activity yet" compact />;
  const byDay = new Map<string, typeof b.activity>();
  for (const a of b.activity) {
    const k = a.createdAt.slice(0, 10);
    byDay.set(k, [...(byDay.get(k) ?? []), a]);
  }
  const today = localTodayKey();
  return (
    <div className="max-w-3xl space-y-5">
      {[...byDay.entries()].map(([day, items]) => (
        <section key={day}>
          <h3 className="a-micro mb-2">{relativeDay(day, today)}</h3>
          <ol className="space-y-0 border-l-2 border-[var(--a-border)] pl-4">
            {items.map((a) => (
              <li key={a.id} className="relative py-1.5 font-dm text-[13.5px] text-[var(--a-ink-2)]">
                <span className="absolute -left-[21px] top-3 h-2 w-2 rounded-full bg-[var(--a-border-strong)]" aria-hidden />
                <span className="font-semibold text-[var(--a-ink)]">{a.actorName}</span> {a.summary}
                <span className="ml-2 text-[12px] text-[var(--a-ink-3)]">{new Date(a.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

// ── Time ─────────────────────────────────────────────────────────────────────

export function TimeTab({ b, staff, viewerId, today, reload, canFinance }: { b: ProjectBundle; staff: StaffLite[]; viewerId: string; today: string; reload: () => Promise<void>; canFinance: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [taskId, setTaskId] = useState("");
  const [dur, setDur] = useState("");
  const [day, setDay] = useState<string | null>(today);
  const total = b.time.reduce((n, t) => n + t.minutes, 0);
  const week = b.time.filter((t) => t.startedAt.slice(0, 10) >= new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10)).reduce((n, t) => n + t.minutes, 0);
  const estimate = b.tasks.reduce((n, t) => n + (t.estimateMinutes ?? 0), 0);
  const byPerson = useMemo(() => {
    const m = new Map<string, { name: string; min: number }>();
    for (const t of b.time) m.set(t.staffId, { name: t.staffName, min: (m.get(t.staffId)?.min ?? 0) + t.minutes });
    return [...m.entries()].sort((a, c) => c[1].min - a[1].min);
  }, [b.time]);
  const running = b.time.find((t) => !t.endedAt && t.staffId === viewerId);
  const rate = b.project.hourlyRateCents;
  const after = async (msg: string) => {
    toast.success(msg);
    await reload();
    emitChanged({ kind: "timer" });
    emitChanged({ kind: "time", projectId: b.project.id });
  };
  void staff;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Logged" value={fmtMinutes(total)} hint={estimate ? `of ${fmtMinutes(estimate)} estimated` : "No estimates yet"} tone="navy" />
        <StatCard label="Last 7 days" value={fmtMinutes(week)} />
        <StatCard label="People" value={byPerson.length} hint={byPerson[0] ? `Most: ${byPerson[0][1].name}` : undefined} />
        <StatCard label="Time cost" value={canFinance && rate ? fmtUsd(Math.round((total / 60) * rate)) : "Not priced"} hint={canFinance ? (rate ? `${fmtUsd(rate)} per hour` : "Set an hourly rate in Overview") : "Needs Finance access"} />
      </div>
      <Card title="Track time">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <Field label="Task (optional)" htmlFor="tt-task" className="lg:w-72">
            <SelectInput id="tt-task" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
              <option value="">Whole project</option>
              {b.tasks
                .filter((t) => !t.done)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </SelectInput>
          </Field>
          <Button
            variant={running ? "secondary" : "primary"}
            icon={running ? Clock : CirclePlay}
            onClick={async () => {
              try {
                if (running) await api("/api/admin/pm/time", { body: { action: "stop" } });
                else await api("/api/admin/pm/time", { body: { action: "start", projectId: b.project.id, taskId: taskId || null } });
                await after(running ? "Timer stopped" : "Timer started");
              } catch (e) {
                toast.error("Timer", errMsg(e));
              }
            }}
          >
            {running ? "Stop timer" : "Start timer"}
          </Button>
          <span className="hidden font-dm text-[13px] text-[var(--a-ink-3)] lg:block lg:pb-2">or log</span>
          <Field label="Duration" htmlFor="tt-dur" className="lg:w-32">
            <TextInput id="tt-dur" value={dur} onChange={(e) => setDur(e.target.value)} placeholder="1h 30m" />
          </Field>
          <Field label="Day" htmlFor="tt-day" className="lg:w-52">
            <SmartDateInput id="tt-day" ariaLabel="Day" value={day} onChange={setDay} />
          </Field>
          <Button
            icon={Plus}
            onClick={async () => {
              const m = parseDuration(dur);
              if (!m || !day) return toast.error("Enter a duration like 45m or 1h 30m, and a day");
              try {
                await api("/api/admin/pm/time", { body: { action: "log", projectId: b.project.id, taskId: taskId || null, minutes: m, dayKey: day } });
                setDur("");
                await after(`Logged ${fmtMinutes(m)}`);
              } catch (e) {
                toast.error("Could not log time", errMsg(e));
              }
            }}
          >
            Log time
          </Button>
        </div>
      </Card>
      <Card title="Entries" padded={false}>
        {b.time.length ? (
          <ul className="divide-y divide-[var(--a-border)]">
            {b.time.slice(0, 100).map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 font-dm text-[13.5px]">
                <Avatar name={t.staffName} seed={t.staffId} size={24} />
                <span className="w-16 font-semibold tabular-nums text-[var(--a-ink)]">{t.endedAt ? fmtMinutes(t.minutes) : <Badge tone="success" dot>Running</Badge>}</span>
                <span className="min-w-0 flex-1 truncate text-[var(--a-ink-2)]">{t.taskId ? b.tasks.find((x) => x.id === t.taskId)?.title ?? "Deleted task" : "Project"}</span>
                <span className="text-[12.5px] text-[var(--a-ink-3)]">
                  {t.staffName} · {fmtDay(t.startedAt.slice(0, 10))}
                </span>
                {t.endedAt ? (
                  <button
                    type="button"
                    aria-label="Delete time entry"
                    onClick={async () => {
                      if (!(await confirm({ title: `Delete ${fmtMinutes(t.minutes)} of time?`, danger: true, confirmLabel: "Delete" }))) return;
                      try {
                        await api(`/api/admin/pm/time/${t.id}`, { method: "DELETE" });
                        await after("Time entry deleted");
                      } catch (e) {
                        toast.error("Could not delete", errMsg(e));
                      }
                    }}
                    className="rounded p-1 text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)]"
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-6 font-dm text-[13.5px] text-[var(--a-ink-3)]">No time logged yet.</p>
        )}
      </Card>
    </div>
  );
}

// ── Finance ──────────────────────────────────────────────────────────────────

export function FinanceTab({ b, canFinance }: { b: ProjectBundle; canFinance: boolean; patch: (body: Record<string, unknown>, msg?: string) => Promise<boolean> }) {
  const f = b.finance;
  if (!canFinance || !f) return <EmptyState title="Finance needs the Finance permission" compact />;
  const today = localTodayKey();
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Income received" value={fmtUsd(f.paidIncomeCents)} tone="success" />
        <StatCard label="Outstanding" value={fmtUsd(f.outstandingCents)} tone={f.outstandingCents ? "warn" : "default"} hint="Invoiced, not paid" />
        <StatCard label="Expenses" value={fmtUsd(f.expenseCents)} tone="danger" />
        <StatCard label="Time cost" value={fmtUsd(f.laborCents)} hint={f.hourlyRateCents ? `${fmtMinutes(f.laborMinutes)} at ${fmtUsd(f.hourlyRateCents)}/h` : "Set an hourly rate in Overview"} />
        <StatCard label="Profit" value={fmtUsd(f.profitCents)} tone={f.profitCents >= 0 ? "navy" : "danger"} hint="Received minus expenses and time" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card
          title="Income"
          padded={false}
          action={
            <Button size="sm" icon={Plus} href={`/admin_pro/command-center/finance/income?new=1&project=${b.project.id}`}>
              Add income
            </Button>
          }
        >
          {f.income.length ? (
            <ul className="divide-y divide-[var(--a-border)]">
              {f.income.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-2.5 font-dm text-[13.5px]">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-[var(--a-ink)]">{r.client}</span>
                    <span className="block truncate text-[12px] text-[var(--a-ink-3)]">
                      {fmtDay(r.dateKey, { withYear: true })}
                      {r.invoiceNumber ? ` · #${r.invoiceNumber}` : ""}
                      {r.dueKey && r.status !== "paid" ? ` · due ${relativeDay(r.dueKey, today)}` : ""}
                    </span>
                  </span>
                  <Badge tone={r.status === "paid" ? "success" : r.status === "overdue" ? "danger" : "info"}>{r.status}</Badge>
                  <span className="w-24 text-right font-semibold tabular-nums text-[var(--a-ink)]">{fmtUsd(r.amountUsdCents)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 font-dm text-[13.5px] text-[var(--a-ink-3)]">No income linked to this project.</p>
          )}
        </Card>
        <Card
          title="Expenses"
          padded={false}
          action={
            <Button size="sm" icon={Plus} href={`/admin_pro/command-center/finance/expenses?new=1&project=${b.project.id}`}>
              Add expense
            </Button>
          }
        >
          {f.expenses.length ? (
            <ul className="divide-y divide-[var(--a-border)]">
              {f.expenses.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-2.5 font-dm text-[13.5px]">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-[var(--a-ink)]">{r.vendor}</span>
                    <span className="block truncate text-[12px] text-[var(--a-ink-3)]">
                      {fmtDay(r.dateKey, { withYear: true })} · {categoryLabel(r.category)}
                      {r.currency !== "USD" ? ` · ${fmtMoney(r.amountCents, r.currency)}` : ""}
                    </span>
                  </span>
                  <span className="w-24 text-right font-semibold tabular-nums text-[var(--a-ink)]">{fmtUsd(r.amountUsdCents)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 font-dm text-[13.5px] text-[var(--a-ink-3)]">No expenses linked to this project.</p>
          )}
        </Card>
      </div>
      <p className="font-dm text-[12.5px] text-[var(--a-ink-3)]">
        Link entries to this project from <Link href="/admin_pro/command-center/finance" className="text-[var(--a-blue)] underline">Finance</Link>. Revenue recorded on the project ({fmtUsd(b.project.revenueEarned * 100)}) is shown on the portfolio, not here.{" "}
        {b.time.length ? `${fmtMinutes(b.time.reduce((n, t) => n + t.minutes, 0))} of time logged. ` : ""}
      </p>
    </div>
  );
}


