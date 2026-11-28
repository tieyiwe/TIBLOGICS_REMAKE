"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarRange, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, Segmented, useToast } from "@/components/admin/ui";
import type { ProjectBundle, TaskDTO } from "@/lib/admin/command-center/pm";
import { addDays, diffDays, fmtDay, weekday } from "@/lib/admin/command-center/dates";
import { api, errMsg } from "../../_components/api";
import { emitChanged, useCc } from "../../_components/CcShell";

// Gantt-style view: tasks as bars from start to due date, milestones as
// diamonds. Drag a bar to move it, drag its edges to change start or due,
// drag a diamond to move a milestone. Keyboard: focus a bar and use the
// arrow keys (Shift + arrow changes only the due date).

type Drag = { kind: "move" | "start" | "end" | "milestone"; id: string; x0: number; delta: number };
const ROW = 40;
const LEFT = 240;

export function TimelineTab({ b, today, reload }: { b: ProjectBundle; today: string; reload: () => Promise<void> }) {
  const { openTask } = useCc();
  const toast = useToast();
  const [zoom, setZoom] = useState<"week" | "month">("week");
  const dayW = zoom === "week" ? 32 : 12;
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  dragRef.current = drag;
  const scroller = useRef<HTMLDivElement>(null);

  const tasks = b.tasks.filter((t) => !t.parentId);
  const dated = tasks.filter((t) => t.startKey || t.dueKey);
  const undated = tasks.filter((t) => !t.startKey && !t.dueKey && !t.done);

  const [min, max] = useMemo(() => {
    const keys = [today, ...dated.flatMap((t) => [t.startKey ?? t.dueKey!, t.dueKey ?? t.startKey!]), ...b.milestones.map((m) => m.dueKey)];
    if (b.project.startKey) keys.push(b.project.startKey);
    if (b.project.deadlineKey) keys.push(b.project.deadlineKey);
    const lo = keys.reduce((a, c) => (a < c ? a : c));
    const hi = keys.reduce((a, c) => (a > c ? a : c));
    return [addDays(lo, -7 - weekday(lo)), addDays(hi, 21)];
  }, [dated, b.milestones, b.project.startKey, b.project.deadlineKey, today]);
  const days = diffDays(max, min) + 1;
  const x = (k: string) => diffDays(k, min) * dayW;

  // Scroll so today is in view on first render.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = Math.max(0, x(today) - 160);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  const span = (t: TaskDTO) => {
    let s = t.startKey ?? t.dueKey!;
    let e = t.dueKey ?? t.startKey!;
    if (drag && drag.id === t.id) {
      if (drag.kind === "move") {
        s = addDays(s, drag.delta);
        e = addDays(e, drag.delta);
      } else if (drag.kind === "start") s = addDays(s, Math.min(drag.delta, diffDays(e, s)));
      else if (drag.kind === "end") e = addDays(e, Math.max(drag.delta, -diffDays(e, s)));
    }
    return { s, e };
  };

  const saveTask = async (t: TaskDTO, kind: Drag["kind"], delta: number) => {
    if (!delta) return;
    const body: Record<string, string | null> = {};
    if (kind === "move") {
      if (t.startKey) body.startKey = addDays(t.startKey, delta);
      if (t.dueKey) body.dueKey = addDays(t.dueKey, delta);
    } else if (kind === "start") {
      const e = t.dueKey ?? t.startKey!;
      const s = addDays(t.startKey ?? e, delta);
      body.startKey = s > e ? e : s;
    } else if (kind === "end") {
      const s = t.startKey ?? t.dueKey!;
      const e = addDays(t.dueKey ?? s, delta);
      body.dueKey = e < s ? s : e;
      if (!t.startKey) body.startKey = s;
    }
    try {
      await api(`/api/admin/pm/tasks/${t.id}`, { method: "PATCH", body });
      toast.success("Rescheduled", `${t.title}: ${body.dueKey ? `due ${fmtDay(body.dueKey)}` : `starts ${fmtDay(body.startKey!)}`}`);
    } catch (e) {
      toast.error("Could not reschedule", errMsg(e));
    }
    await reload();
    emitChanged({ kind: "task", projectId: b.project.id });
  };

  const saveMilestone = async (id: string, delta: number) => {
    const m = b.milestones.find((x) => x.id === id);
    if (!m || !delta) return;
    try {
      await api(`/api/admin/pm/milestones/${id}`, { method: "PATCH", body: { dueKey: addDays(m.dueKey, delta) } });
      toast.success("Milestone moved", `${m.title}: ${fmtDay(addDays(m.dueKey, delta))}`);
    } catch (e) {
      toast.error("Could not move", errMsg(e));
    }
    await reload();
    emitChanged({ kind: "milestone", projectId: b.project.id });
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const delta = Math.round((e.clientX - d.x0) / dayW);
      if (delta !== d.delta) setDrag({ ...d, delta });
    };
    const up = () => {
      const d = dragRef.current;
      setDrag(null);
      if (!d || !d.delta) return;
      if (d.kind === "milestone") void saveMilestone(d.id, d.delta);
      else {
        const t = tasks.find((x) => x.id === d.id);
        if (t) void saveTask(t, d.kind, d.delta);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.id, drag?.kind, dayW]);

  const begin = (e: React.PointerEvent, kind: Drag["kind"], id: string) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setDrag({ kind, id, x0: e.clientX, delta: 0 });
  };

  if (!dated.length && !b.milestones.length) {
    return <EmptyState icon={CalendarRange} title="Nothing on the timeline yet" body="Give tasks a start or due date, or add milestones in Overview. They appear here as bars you can drag." compact />;
  }

  const months: string[] = [];
  for (let k = `${min.slice(0, 7)}-01`; k <= max; k = addDays(`${k.slice(0, 7)}-28`, 4).slice(0, 7) + "-01") months.push(k);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Segmented
          ariaLabel="Zoom"
          value={zoom}
          onChange={(v) => setZoom(v as "week" | "month")}
          options={[
            { value: "week", label: "Days" },
            { value: "month", label: "Months" },
          ]}
        />
        <p className="font-dm text-[12.5px] text-[var(--a-ink-3)]">Drag bars to reschedule, drag the ends to change start or due. Arrow keys work on a focused bar.</p>
      </div>
      <div className="overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]">
        <div ref={scroller} className="a-scroll-thin relative overflow-x-auto" style={{ cursor: drag ? "grabbing" : undefined }}>
          <div className="relative" style={{ width: LEFT + days * dayW }}>
            {/* Header */}
            <div className="sticky top-0 z-20 flex h-12 border-b border-[var(--a-border)] bg-[var(--a-surface-2)]">
              <div className="sticky left-0 z-10 flex w-[240px] shrink-0 items-end border-r border-[var(--a-border)] bg-[var(--a-surface-2)] px-4 pb-2 font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">Task</div>
              <div className="relative flex-1">
                {months.map((m) =>
                  m >= min ? (
                    <span key={m} className="absolute top-1.5 border-l border-[var(--a-border-strong)] pl-1.5 font-dm text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--a-ink-2)]" style={{ left: x(m) }}>
                      {new Date(`${m}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })}
                    </span>
                  ) : null,
                )}
                {zoom === "week"
                  ? Array.from({ length: days }, (_, i) => addDays(min, i)).map((k) => (
                      <span key={k} className={cn("absolute bottom-1 w-[32px] text-center font-dm text-[10.5px] tabular-nums", k === today ? "font-bold text-[var(--a-orange-text)]" : "text-[var(--a-ink-3)]")} style={{ left: x(k) }}>
                        {Number(k.slice(8))}
                      </span>
                    ))
                  : null}
              </div>
            </div>

            {/* Grid background: weekends + today */}
            <div className="pointer-events-none absolute bottom-0 top-12" style={{ left: LEFT, right: 0 }} aria-hidden>
              {zoom === "week"
                ? Array.from({ length: days }, (_, i) => addDays(min, i))
                    .filter((k) => weekday(k) >= 5)
                    .map((k) => <span key={k} className="absolute inset-y-0 bg-[var(--a-surface-2)]/70" style={{ left: x(k), width: dayW }} />)
                : null}
              <span className="absolute inset-y-0 z-[5] w-0.5 bg-[var(--a-orange)]" style={{ left: x(today) + dayW / 2 }} />
              {b.project.deadlineKey ? <span className="absolute inset-y-0 w-px border-l-2 border-dashed border-[var(--a-danger)]/60" style={{ left: x(b.project.deadlineKey) + dayW }} title="Project deadline" /> : null}
            </div>

            {/* Milestones row */}
            {b.milestones.length ? (
              <div className="relative flex border-b border-[var(--a-border)]" style={{ height: ROW }}>
                <div className="sticky left-0 z-10 flex w-[240px] shrink-0 items-center border-r border-[var(--a-border)] bg-[var(--a-surface)] px-4 font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Milestones</div>
                <div className="relative flex-1">
                  {b.milestones.map((m) => {
                    const k = drag?.kind === "milestone" && drag.id === m.id ? addDays(m.dueKey, drag.delta) : m.dueKey;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        data-milestone={m.id}
                        onPointerDown={(e) => begin(e, "milestone", m.id)}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                            e.preventDefault();
                            void saveMilestone(m.id, e.key === "ArrowLeft" ? -1 : 1);
                          }
                        }}
                        aria-label={`Milestone ${m.title}, ${fmtDay(m.dueKey, { withYear: true })}. Arrow keys move it a day.`}
                        className="group absolute top-1/2 flex -translate-y-1/2 cursor-grab items-center gap-1.5 active:cursor-grabbing"
                        style={{ left: x(k) + dayW / 2 - 7 }}
                      >
                        <span className={cn("h-3.5 w-3.5 rotate-45 border-2 border-white shadow", m.done ? "bg-[var(--a-success)]" : k < today ? "bg-[var(--a-danger)]" : "bg-[var(--a-navy)]")} />
                        <span className="whitespace-nowrap rounded bg-white/90 px-1 font-dm text-[11.5px] font-semibold text-[var(--a-ink-2)]">{m.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Task rows */}
            {dated.map((t) => {
              const { s, e } = span(t);
              const left = x(s);
              const width = (diffDays(e, s) + 1) * dayW;
              const late = !t.done && (t.dueKey ?? "9999") < today;
              return (
                <div key={t.id} className="relative flex border-b border-[var(--a-border)] last:border-b-0" style={{ height: ROW }}>
                  <button type="button" onClick={() => openTask(t.id)} className={cn("sticky left-0 z-10 w-[240px] shrink-0 truncate border-r border-[var(--a-border)] bg-[var(--a-surface)] px-4 text-left font-dm text-[13px] hover:underline", t.done ? "text-[var(--a-ink-3)] line-through" : "text-[var(--a-ink)]")}>
                    {t.title}
                  </button>
                  <div className="relative flex-1">
                    <div
                      role="slider"
                      tabIndex={0}
                      data-bar={t.id}
                      aria-label={`${t.title}: ${t.startKey ? `${fmtDay(s)} to ` : "due "}${fmtDay(e)}. Arrow keys move it, Shift + arrow changes the due date.`}
                      aria-valuetext={`${fmtDay(s)} to ${fmtDay(e)}`}
                      aria-valuenow={diffDays(e, min)}
                      onPointerDown={(ev) => begin(ev, "move", t.id)}
                      onDoubleClick={() => openTask(t.id)}
                      onKeyDown={(ev) => {
                        if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
                        ev.preventDefault();
                        void saveTask(t, ev.shiftKey ? "end" : "move", ev.key === "ArrowLeft" ? -1 : 1);
                      }}
                      className={cn(
                        "group absolute top-1/2 flex h-7 -translate-y-1/2 cursor-grab items-center overflow-hidden rounded-[7px] font-dm text-[11.5px] font-semibold text-white shadow-sm active:cursor-grabbing",
                        drag?.id === t.id && "ring-2 ring-[var(--a-blue)] ring-offset-1",
                      )}
                      style={{ left, width: Math.max(width, dayW), background: t.done ? "var(--a-ink-3)" : late ? "var(--a-danger)" : b.project.color }}
                      title={`${fmtDay(s)} to ${fmtDay(e)}`}
                    >
                      <span onPointerDown={(ev) => begin(ev, "start", t.id)} className="absolute inset-y-0 left-0 w-2 cursor-ew-resize bg-black/0 hover:bg-black/20" aria-hidden />
                      <GripVertical size={12} className="ml-1.5 shrink-0 opacity-60" aria-hidden />
                      <span className="truncate pr-3">{width > 60 ? t.title : ""}</span>
                      <span onPointerDown={(ev) => begin(ev, "end", t.id)} className="absolute inset-y-0 right-0 w-2 cursor-ew-resize bg-black/0 hover:bg-black/20" aria-hidden />
                    </div>
                    {drag?.id === t.id && drag.delta ? (
                      <span className="absolute -top-0.5 z-10 rounded bg-[var(--a-navy-deep)] px-1.5 py-0.5 font-dm text-[11px] font-semibold text-white" style={{ left: left + Math.max(width, dayW) + 6 }}>
                        {fmtDay(drag.kind === "start" ? s : e)}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {undated.length ? (
        <p className="mt-3 font-dm text-[12.5px] text-[var(--a-ink-3)]">
          {undated.length} open task{undated.length === 1 ? " has" : "s have"} no dates:{" "}
          {undated.slice(0, 6).map((t, i) => (
            <span key={t.id}>
              {i ? ", " : ""}
              <button type="button" onClick={() => openTask(t.id)} className="text-[var(--a-blue)] underline">
                {t.title}
              </button>
            </span>
          ))}
          {undated.length > 6 ? ` and ${undated.length - 6} more` : ""}.
        </p>
      ) : null}
    </div>
  );
}
