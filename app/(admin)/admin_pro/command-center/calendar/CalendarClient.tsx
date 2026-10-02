"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Segmented } from "@/components/admin/ui";
import type { MilestoneDTO, WorkTask } from "@/lib/admin/command-center/pm";
import { addDays, addMonths, fmtDay, localTodayKey, startOfWeek } from "@/lib/admin/command-center/dates";
import { api } from "../_components/api";
import { CcShell, useCc, useOnCcChange, type ProjectLite } from "../_components/CcShell";
import { AssigneeChip, type StaffLite } from "../_components/fields";

type Ms = MilestoneDTO & { projectName: string; projectColor: string };

export default function CalendarClient({ shell }: { shell: { staff: StaffLite[]; viewerId: string; projects: ProjectLite[]; canFinance: boolean } }) {
  return (
    <CcShell {...shell} title="Calendar" subtitle="Task due dates and milestones across every project.">
      <Calendar />
    </CcShell>
  );
}

const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Calendar() {
  const { openTask, staff } = useCc();
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));
  const [month, setMonth] = useState(() => `${new Date().toISOString().slice(0, 7)}-01`);
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [data, setData] = useState<{ tasks: WorkTask[]; milestones: Ms[] }>({ tasks: [], milestones: [] });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = localTodayKey();
    setToday(t);
    setMonth(`${t.slice(0, 7)}-01`);
  }, []);

  const gridStart = startOfWeek(month);
  const gridEnd = addDays(startOfWeek(addDays(addMonths(month, 1), -1)), 6);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(`/api/admin/pm/tasks?from=${gridStart}&to=${gridEnd}${scope === "mine" ? "&mine=1" : ""}`));
    } catch {
      setData({ tasks: [], milestones: [] });
    } finally {
      setLoading(false);
    }
  }, [gridStart, gridEnd, scope]);
  useEffect(() => {
    void load();
  }, [load]);
  useOnCcChange(() => void load());

  const days = useMemo(() => {
    const out: string[] = [];
    for (let k = gridStart; k <= gridEnd; k = addDays(k, 1)) out.push(k);
    return out;
  }, [gridStart, gridEnd]);
  const byDay = useMemo(() => {
    const m = new Map<string, { tasks: WorkTask[]; ms: Ms[] }>();
    for (const t of data.tasks) if (t.dueKey) m.set(t.dueKey, { tasks: [...(m.get(t.dueKey)?.tasks ?? []), t], ms: m.get(t.dueKey)?.ms ?? [] });
    for (const x of data.milestones) m.set(x.dueKey, { tasks: m.get(x.dueKey)?.tasks ?? [], ms: [...(m.get(x.dueKey)?.ms ?? []), x] });
    return m;
  }, [data]);

  const label = new Date(`${month}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const agenda = days.filter((d) => d.slice(0, 7) === month.slice(0, 7) && byDay.has(d));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" icon={ChevronLeft} aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))} />
          <Button size="sm" variant="ghost" icon={ChevronRight} aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))} />
        </div>
        <h2 className="font-syne text-[18px] font-bold text-[var(--a-ink)]" aria-live="polite">
          {label}
        </h2>
        <Button size="sm" onClick={() => setMonth(`${today.slice(0, 7)}-01`)}>
          Today
        </Button>
        <div className="ml-auto">
          <Segmented
            ariaLabel="Whose work"
            value={scope}
            onChange={(v) => setScope(v as "all" | "mine")}
            options={[
              { value: "all", label: "Everyone" },
              { value: "mine", label: "Mine" },
            ]}
          />
        </div>
      </div>

      <div className={cn("hidden overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)] md:block", loading && "opacity-70")}>
        <div className="grid grid-cols-7 border-b border-[var(--a-border)] bg-[var(--a-surface-2)]">
          {WD.map((d) => (
            <div key={d} className="px-2 py-2 text-center font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const items = byDay.get(d);
            const inMonth = d.slice(0, 7) === month.slice(0, 7);
            const all = [...(items?.ms ?? []).map((m) => ({ kind: "ms" as const, m })), ...(items?.tasks ?? []).map((t) => ({ kind: "task" as const, t }))];
            return (
              <div key={d} className={cn("min-h-[118px] border-b border-r border-[var(--a-border)] p-1.5 [&:nth-child(7n)]:border-r-0", !inMonth && "bg-[var(--a-surface-2)]/50")} data-day={d}>
                <div className="mb-1 flex justify-end">
                  <span className={cn("flex h-6 min-w-6 items-center justify-center rounded-full px-1 font-dm text-[12px] tabular-nums", d === today ? "bg-[var(--a-orange)] font-bold text-white" : inMonth ? "text-[var(--a-ink-2)]" : "text-[var(--a-ink-3)]")}>
                    {Number(d.slice(8))}
                  </span>
                </div>
                <ul className="space-y-1">
                  {all.slice(0, 4).map((x) =>
                    x.kind === "ms" ? (
                      <li key={`m-${x.m.id}`}>
                        <Link href={`/admin_pro/command-center/projects/${x.m.projectId}`} className="flex items-center gap-1 truncate rounded-md bg-[var(--a-navy)] px-1.5 py-0.5 font-dm text-[11.5px] font-semibold text-white hover:opacity-90" title={`${x.m.projectName}: ${x.m.title}`}>
                          <Flag size={10} aria-hidden className="shrink-0" /> <span className="truncate">{x.m.title}</span>
                        </Link>
                      </li>
                    ) : (
                      <li key={`t-${x.t.id}`}>
                        <button
                          type="button"
                          onClick={() => openTask(x.t.id)}
                          className={cn(
                            "flex w-full items-center gap-1 truncate rounded-md border-l-[3px] bg-[var(--a-surface-2)] px-1.5 py-0.5 text-left font-dm text-[11.5px] hover:bg-[var(--a-info-bg)]",
                            x.t.done ? "text-[var(--a-ink-3)] line-through" : x.t.dueKey! < today ? "text-[var(--a-danger)]" : "text-[var(--a-ink)]",
                          )}
                          style={{ borderLeftColor: x.t.projectColor }}
                          title={`${x.t.projectName}: ${x.t.title}`}
                        >
                          <span className="truncate">{x.t.title}</span>
                        </button>
                      </li>
                    ),
                  )}
                  {all.length > 4 ? <li className="px-1.5 font-dm text-[11px] text-[var(--a-ink-3)]">+{all.length - 4} more</li> : null}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phone: agenda list */}
      <div className="space-y-3 md:hidden">
        {agenda.length ? (
          agenda.map((d) => (
            <section key={d}>
              <h3 className={cn("a-micro font-dm mb-1.5", d === today && "!text-[var(--a-orange-text)]")}>{fmtDay(d, { withYear: false })}{d === today ? " · Today" : ""}</h3>
              <ul className="overflow-hidden rounded-[12px] border border-[var(--a-border)] bg-[var(--a-surface)]">
                {byDay.get(d)!.ms.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 border-b border-[var(--a-border)] px-3 py-2 last:border-b-0">
                    <Flag size={13} className="text-[var(--a-navy)]" aria-hidden />
                    <Link href={`/admin_pro/command-center/projects/${m.projectId}`} className="min-w-0 flex-1 truncate font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">
                      {m.title}
                    </Link>
                    <span className="truncate font-dm text-[12px] text-[var(--a-ink-3)]">{m.projectName}</span>
                  </li>
                ))}
                {byDay.get(d)!.tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 border-b border-[var(--a-border)] px-3 py-2 last:border-b-0">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: t.projectColor }} aria-hidden />
                    <button type="button" onClick={() => openTask(t.id)} className={cn("min-w-0 flex-1 truncate text-left font-dm text-[13.5px]", t.done ? "text-[var(--a-ink-3)] line-through" : "text-[var(--a-ink)]")}>
                      {t.title}
                    </button>
                    <AssigneeChip staff={staff} id={t.assigneeId} size={20} />
                  </li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <p className="font-dm text-[13.5px] text-[var(--a-ink-3)]">{loading ? "Loading" : "Nothing due this month."}</p>
        )}
      </div>
    </div>
  );
}
