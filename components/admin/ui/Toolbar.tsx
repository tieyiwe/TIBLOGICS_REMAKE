import type { InputHTMLAttributes, ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** A row of filters / search / view switches above a list. Wraps on mobile. */
export function Toolbar({ children, className, end }: { children?: ReactNode; className?: string; end?: ReactNode }) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>
      {children}
      {end ? <div className="ml-auto flex flex-wrap items-center gap-2">{end}</div> : null}
    </div>
  );
}

export function SearchInput({
  className,
  label = "Search",
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: string }) {
  return (
    <label className={cn("relative flex min-w-0 flex-1 items-center sm:max-w-xs", className)}>
      <span className="sr-only">{label}</span>
      <Search size={15} className="pointer-events-none absolute left-3 text-[var(--a-ink-3)]" aria-hidden />
      <input
        type="search"
        placeholder={rest.placeholder ?? "Search"}
        {...rest}
        className={cn(
          "h-10 w-full rounded-[var(--a-radius-control)] border sm:h-9 border-[var(--a-border-strong)] bg-[var(--a-surface)] pl-9 pr-3",
          "font-dm text-[13.5px] text-[var(--a-ink)] placeholder:text-[var(--a-ink-3)]",
          "transition-colors duration-150 hover:border-[#b5c3d6] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20",
        )}
      />
    </label>
  );
}

export type SegmentedOption = { value: string; label: ReactNode; count?: number };

export function Segmented({
  options,
  value,
  onChange,
  ariaLabel = "View",
  size = "md",
  className,
}: {
  options: SegmentedOption[];
  value: string;
  onChange: (v: string) => void;
  ariaLabel?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex max-w-full overflow-x-auto rounded-[var(--a-radius-control)] border border-[var(--a-border)] bg-[var(--a-surface-2)] p-0.5",
        className,
      )}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-[8px] font-dm font-semibold transition-colors duration-150",
              size === "sm" ? "h-10 px-2.5 text-[12.5px] sm:h-7" : "h-10 px-3 text-[13px] sm:h-8",
              on
                ? "bg-[var(--a-surface)] text-[var(--a-ink)] shadow-[0_1px_2px_rgba(13,27,42,.08)] ring-1 ring-[var(--a-border)]"
                : "text-[var(--a-ink-3)] hover:text-[var(--a-ink)]",
            )}
          >
            {o.label}
            {o.count !== undefined ? <span className="tabular-nums text-[11.5px] text-[var(--a-ink-3)]">{o.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/** Native select styled to match. */
export function Select({
  className,
  children,
  label,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <select
      aria-label={label ?? rest["aria-label"]}
      {...rest}
      className={cn(
        "h-10 max-w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 pr-8 sm:h-9 font-dm text-[13.5px] text-[var(--a-ink)]",
        "focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20",
        className,
      )}
    >
      {children}
    </select>
  );
}
