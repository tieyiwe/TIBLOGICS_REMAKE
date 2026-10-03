import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: ReactNode;
  /** Cell renderer; defaults to row[key]. */
  render?: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  /** Hide this column in the mobile card view. */
  hideOnMobile?: boolean;
  /** Use this column as the mobile card title (first column by default). */
  primary?: boolean;
  width?: string;
};

/**
 * Hook-free so it works in server and client components alike.
 * Selection is controlled: pass `selected` + `onSelectionChange` (client only).
 * On < md screens rows collapse to cards.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  onRowClick,
  selected,
  onSelectionChange,
  empty,
  className,
  stickyHeader = true,
  dense,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string | undefined;
  onRowClick?: (row: T) => void;
  selected?: Set<string> | string[];
  onSelectionChange?: (next: Set<string>) => void;
  empty?: ReactNode;
  className?: string;
  stickyHeader?: boolean;
  dense?: boolean;
  caption?: string;
}) {
  const selectable = !!onSelectionChange;
  const sel = selected instanceof Set ? selected : new Set(selected ?? []);
  const allIds = rows.map(rowKey);
  const allOn = selectable && allIds.length > 0 && allIds.every((id) => sel.has(id));
  const someOn = selectable && !allOn && allIds.some((id) => sel.has(id));

  const toggle = (id: string) => {
    const next = new Set(sel);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange?.(next);
  };
  const toggleAll = () => onSelectionChange?.(allOn ? new Set() : new Set(allIds));

  const cell = (row: T, c: Column<T>) =>
    c.render ? c.render(row) : ((row as Record<string, unknown>)[c.key] as ReactNode) ?? "";

  if (rows.length === 0 && empty) {
    return (
      <div className={cn("rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)]", className)}>
        {empty}
      </div>
    );
  }

  const primaryCol = columns.find((c) => c.primary) ?? columns[0];
  const align = (a?: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]",
        className,
      )}
    >
      {/* Desktop table */}
      <div className="relative hidden max-h-[70vh] overflow-auto md:block">
        <table className="w-full border-collapse font-dm text-[13.5px]">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className={cn(stickyHeader && "sticky top-0 z-[1]")}>
            <tr className="bg-[var(--a-surface-2)]">
              {selectable ? (
                <th className="w-10 border-b border-[var(--a-border)] px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={allOn}
                    ref={(el) => {
                      if (el) el.indeterminate = someOn;
                    }}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-[var(--a-blue)]"
                  />
                </th>
              ) : null}
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  style={c.width ? { width: c.width } : undefined}
                  className={cn(
                    "whitespace-nowrap border-b border-[var(--a-border)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]",
                    align(c.align),
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = rowKey(row);
              const href = rowHref?.(row);
              const on = sel.has(id);
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-[var(--a-border)] last:border-b-0 transition-colors duration-100 hover:bg-[#f8fafd]",
                    on && "bg-[var(--a-info-bg)] hover:bg-[var(--a-info-bg)]",
                    (onRowClick || href) && "cursor-pointer",
                  )}
                >
                  {selectable ? (
                    <td className="px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={on}
                        onChange={() => toggle(id)}
                        className="h-4 w-4 accent-[var(--a-blue)]"
                      />
                    </td>
                  ) : null}
                  {columns.map((c, i) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-4 align-middle text-[var(--a-ink-2)]",
                        dense ? "py-2" : "py-3",
                        i === 0 && "font-medium text-[var(--a-ink)]",
                        align(c.align),
                        c.className,
                      )}
                    >
                      {href && c === primaryCol ? (
                        <Link href={href} className="hover:underline">
                          {cell(row, c)}
                        </Link>
                      ) : (
                        cell(row, c)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-[var(--a-border)] md:hidden">
        {rows.map((row) => {
          const id = rowKey(row);
          const href = rowHref?.(row);
          const on = sel.has(id);
          const title = cell(row, primaryCol);
          return (
            <li
              key={id}
              className={cn("flex gap-3 px-4 py-3", on && "bg-[var(--a-info-bg)]")}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {selectable ? (
                <input
                  type="checkbox"
                  aria-label="Select row"
                  checked={on}
                  onChange={() => toggle(id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--a-blue)]"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="font-dm text-[14px] font-semibold text-[var(--a-ink)] break-words">
                  {href ? (
                    <Link href={href} className="hover:underline">
                      {title}
                    </Link>
                  ) : (
                    title
                  )}
                </div>
                <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-dm text-[12.5px]">
                  {columns
                    .filter((c) => c !== primaryCol && !c.hideOnMobile)
                    .map((c) => (
                      <div key={c.key} className="contents">
                        <dt className="text-[var(--a-ink-3)]">{c.header}</dt>
                        <dd className="min-w-0 break-words text-[var(--a-ink-2)]">{cell(row, c)}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Class names for pages that keep their own <table> markup but want the kit
 * look. Usage: <div className={tableStyles.wrap}><table className={tableStyles.table}>...
 */
export const tableStyles = {
  wrap: "relative min-w-0 overflow-x-auto rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]",
  table: "w-full border-collapse font-dm text-[13.5px]",
  thead: "bg-[var(--a-surface-2)]",
  th: "whitespace-nowrap border-b border-[var(--a-border)] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]",
  tr: "border-b border-[var(--a-border)] last:border-b-0 transition-colors duration-100 hover:bg-[#f8fafd]",
  td: "px-4 py-3 align-middle text-[var(--a-ink-2)]",
};
