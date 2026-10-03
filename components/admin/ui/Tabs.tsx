import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem = { label: ReactNode; count?: number | null; href?: string; id?: string };

/**
 * Underline tabs. Pass `href` items for route tabs, or `id` items plus
 * `onChange` for controlled tabs. `active` is the href or id of the current tab.
 */
export function Tabs({
  items,
  active,
  onChange,
  className,
  ariaLabel = "Sections",
}: {
  items: TabItem[];
  active?: string;
  onChange?: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className={cn("-mb-px flex gap-1 overflow-x-auto", className)}>
      {items.map((t) => {
        const key = t.href ?? t.id ?? String(t.label);
        const isActive = active === key;
        const cls = cn(
          "inline-flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 font-dm text-[13.5px] font-semibold transition-colors duration-150",
          isActive
            ? "border-[var(--a-orange)] text-[var(--a-ink)]"
            : "border-transparent text-[var(--a-ink-3)] hover:border-[var(--a-border-strong)] hover:text-[var(--a-ink)]",
        );
        const count =
          t.count !== undefined && t.count !== null ? (
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px] leading-[18px] tabular-nums",
                isActive ? "bg-[var(--a-orange-bg)] text-[var(--a-orange-text)]" : "bg-[var(--a-surface-2)] text-[var(--a-ink-3)]",
              )}
            >
              {t.count}
            </span>
          ) : null;
        return t.href ? (
          <Link key={key} href={t.href} className={cls} aria-current={isActive ? "page" : undefined}>
            {t.label}
            {count}
          </Link>
        ) : (
          <button
            key={key}
            type="button"
            className={cls}
            aria-pressed={isActive}
            onClick={() => t.id && onChange?.(t.id)}
          >
            {t.label}
            {count}
          </button>
        );
      })}
    </nav>
  );
}
