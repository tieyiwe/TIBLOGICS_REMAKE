"use client";

import { forwardRef, useEffect, useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Avatar, Badge, type BadgeTone } from "@/components/admin/ui";
import { fmtDay, localTodayKey, parseNaturalDate, relativeDay } from "@/lib/admin/command-center/dates";
import { HEALTH, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/admin/command-center/constants";

export const inputCls =
  "h-9 w-full min-w-0 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 font-dm text-[13.5px] text-[var(--a-ink)] placeholder:text-[var(--a-ink-3)] transition-colors duration-150 hover:border-[#b5c3d6] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 disabled:opacity-60";

export function Field({ label, hint, children, className, htmlFor }: { label: string; hint?: ReactNode; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 font-dm text-[12px] text-[var(--a-ink-3)]">{hint}</p> : null}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput({ className, ...rest }, ref) {
  return <input ref={ref} {...rest} className={cn(inputCls, className)} />;
});

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={cn(inputCls, "h-auto min-h-[84px] py-2 leading-relaxed", className)} />;
}

export function SelectInput({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cn(inputCls, "pr-8", className)}>
      {children}
    </select>
  );
}

export interface StaffLite {
  id: string;
  name: string;
}

export function staffName(staff: StaffLite[], id: string | null | undefined): string | null {
  if (!id) return null;
  return staff.find((s) => s.id === id)?.name ?? "Former staff";
}

export function AssigneeChip({ staff, id, size = 22, showName = false }: { staff: StaffLite[]; id: string | null | undefined; size?: number; showName?: boolean }) {
  const name = staffName(staff, id);
  if (!name) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full border border-dashed border-[var(--a-border-strong)] text-[var(--a-ink-3)]"
        style={{ width: size, height: size }}
        title="Unassigned"
        aria-label="Unassigned"
      />
    );
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Avatar name={name} seed={id ?? name} size={size} title={name} />
      {showName ? <span className="truncate font-dm text-[13px] text-[var(--a-ink-2)]">{name}</span> : null}
    </span>
  );
}

export const statusMeta = (v: string) => TASK_STATUSES.find((s) => s.value === v) ?? TASK_STATUSES[0];
export const priorityMeta = (v: string) => TASK_PRIORITIES.find((p) => p.value === v) ?? TASK_PRIORITIES[4];
export const healthMeta = (v: string) => HEALTH.find((h) => h.value === v) ?? HEALTH[0];

export function StatusBadge({ status }: { status: string }) {
  const m = statusMeta(status);
  return (
    <Badge tone={m.tone as BadgeTone} dot>
      {m.label}
    </Badge>
  );
}

export function HealthBadge({ health }: { health: string }) {
  const m = healthMeta(health);
  return (
    <Badge tone={m.tone as BadgeTone} dot>
      {m.label}
    </Badge>
  );
}

/** Four bars, filled by rank; urgent is a red square. */
export function PriorityIcon({ priority, className }: { priority: string; className?: string }) {
  const m = priorityMeta(priority);
  if (m.value === "urgent") {
    return (
      <span className={cn("inline-flex h-4 w-4 items-center justify-center rounded-[4px] bg-[var(--a-danger)] font-dm text-[10px] font-bold text-white", className)} title="Urgent" aria-label="Urgent">
        !
      </span>
    );
  }
  return (
    <span className={cn("inline-flex h-4 w-4 items-end gap-[2px]", className)} title={m.label} aria-label={m.label}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-sm", i <= m.rank ? "bg-[var(--a-ink-2)]" : "bg-[var(--a-border-strong)]")}
          style={{ height: 4 + i * 3 }}
        />
      ))}
    </span>
  );
}

/** Due date chip: red when overdue, orange today, neutral otherwise. */
export function DueChip({ dueKey, done, today }: { dueKey: string | null; done?: boolean; today: string }) {
  if (!dueKey) return null;
  const overdue = !done && dueKey < today;
  const isToday = !done && dueKey === today;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 font-dm text-[12px] font-semibold tabular-nums",
        overdue ? "bg-[var(--a-danger-bg)] text-[var(--a-danger)]" : isToday ? "bg-[var(--a-orange-bg)] text-[var(--a-orange-text)]" : "text-[var(--a-ink-3)]",
      )}
      title={fmtDay(dueKey, { withYear: true })}
    >
      {relativeDay(dueKey, today)}
    </span>
  );
}

/**
 * Date field that takes plain words ("fri", "next week", "in 3 days") or a
 * picked date. Commits on blur / Enter.
 */
export function SmartDateInput({
  value,
  onChange,
  placeholder = "e.g. fri, next week",
  id,
  className,
  ariaLabel,
}: {
  value: string | null;
  onChange: (key: string | null) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const autoId = useId();
  const [text, setText] = useState(value ? fmtDay(value, { withYear: true }) : "");
  const [bad, setBad] = useState(false);
  useEffect(() => setText(value ? fmtDay(value, { withYear: true }) : ""), [value]);
  const commit = () => {
    const t = text.trim();
    if (!t) {
      setBad(false);
      if (value) onChange(null);
      return;
    }
    if (value && t === fmtDay(value, { withYear: true })) return;
    const k = parseNaturalDate(t, localTodayKey()) ?? (Date.parse(t) ? new Date(t).toISOString().slice(0, 10) : null);
    if (!k) {
      setBad(true);
      return;
    }
    setBad(false);
    onChange(k);
  };
  return (
    <div className={cn("flex min-w-0 gap-1.5", className)}>
      <input
        id={id ?? autoId}
        aria-label={ariaLabel}
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        aria-invalid={bad || undefined}
        className={cn(inputCls, bad && "border-[var(--a-danger)]")}
      />
      <input
        type="date"
        aria-label={`${ariaLabel ?? "Date"}: pick from calendar`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn(inputCls, "w-10 shrink-0 cursor-pointer px-2 text-transparent [&::-webkit-calendar-picker-indicator]:m-0")}
      />
    </div>
  );
}

export function Progress({ value, color = "var(--a-blue)", className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[var(--a-surface-2)]", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

export function Label({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <Badge tone={tone} className="!px-1.5 !py-0 !text-[11.5px]">
      {children}
    </Badge>
  );
}

export const kbdHint = (k: string) => <kbd className="ml-1 rounded border border-[var(--a-border)] bg-[var(--a-surface-2)] px-1 font-dm text-[11px] text-[var(--a-ink-3)]">{k}</kbd>;
