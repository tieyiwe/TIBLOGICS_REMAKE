"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MenuItem =
  | {
      label: string;
      icon?: ElementType;
      onSelect?: () => void;
      href?: string;
      external?: boolean;
      danger?: boolean;
      disabled?: boolean;
      hint?: ReactNode;
    }
  | { separator: true }
  | { heading: string };

/**
 * Accessible dropdown menu: button with aria-haspopup, arrow keys move
 * between items, Home/End, typeahead by first letter, Escape and click
 * outside close and return focus to the trigger.
 */
export function Menu({
  trigger,
  items,
  align = "end",
  label,
  className,
  width = 224,
}: {
  /** Render prop for the trigger button; spread the props onto a <button>. */
  trigger: (props: {
    ref: React.Ref<HTMLButtonElement>;
    onClick: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    "aria-haspopup": "menu";
    "aria-expanded": boolean;
    "aria-controls": string;
  }) => ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  label: string;
  className?: string;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const itemsEls = () => Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);
  const focusAt = (i: number) => {
    const els = itemsEls();
    if (els.length === 0) return;
    els[(i + els.length) % els.length].focus();
  };

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close(false);
    };
    document.addEventListener("mousedown", onDown);
    requestAnimationFrame(() => focusAt(0));
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, close]);

  const onListKey = (e: React.KeyboardEvent) => {
    const els = itemsEls();
    const cur = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusAt(cur + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusAt(cur - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusAt(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusAt(els.length - 1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") {
      close(false);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const k = e.key.toLowerCase();
      const start = cur + 1;
      for (let j = 0; j < els.length; j++) {
        const el = els[(start + j) % els.length];
        if ((el.textContent ?? "").trim().toLowerCase().startsWith(k)) {
          el.focus();
          break;
        }
      }
    }
  };

  const itemCls = (danger?: boolean, disabled?: boolean) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left font-dm text-[13.5px] transition-colors duration-150 focus:outline-none",
      disabled
        ? "cursor-not-allowed text-[var(--a-ink-3)] opacity-60"
        : danger
          ? "text-[var(--a-danger)] hover:bg-[var(--a-danger-bg)] focus:bg-[var(--a-danger-bg)]"
          : "text-[var(--a-ink-2)] hover:bg-[var(--a-surface-2)] hover:text-[var(--a-ink)] focus:bg-[var(--a-surface-2)] focus:text-[var(--a-ink)]",
    );

  return (
    <div ref={wrapRef} className={cn("relative inline-flex", className)}>
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen((o) => !o),
        onKeyDown: (e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        },
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": id,
      })}
      {open ? (
        <div
          ref={listRef}
          id={id}
          role="menu"
          aria-label={label}
          onKeyDown={onListKey}
          style={{ width }}
          className={cn(
            "a-anim-pop absolute top-[calc(100%+6px)] z-50 max-w-[calc(100vw-24px)] rounded-[12px] border border-[var(--a-border)] bg-[var(--a-surface)] p-1.5 shadow-[var(--a-shadow-pop)]",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((it, i) => {
            if ("separator" in it) return <div key={i} role="separator" className="my-1 h-px bg-[var(--a-border)]" />;
            if ("heading" in it)
              return (
                <p key={i} className="a-micro px-2.5 pb-1 pt-2" role="presentation">
                  {it.heading}
                </p>
              );
            const Icon = it.icon;
            const content = (
              <>
                {Icon ? <Icon size={15} className="shrink-0 opacity-80" aria-hidden /> : null}
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                {it.hint ? <span className="shrink-0 text-[12px] text-[var(--a-ink-3)]">{it.hint}</span> : null}
              </>
            );
            if (it.href && !it.disabled) {
              return (
                <Link
                  key={i}
                  href={it.href}
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => close(false)}
                  className={itemCls(it.danger)}
                  {...(it.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {content}
                </Link>
              );
            }
            return (
              <button
                key={i}
                type="button"
                role="menuitem"
                tabIndex={-1}
                aria-disabled={it.disabled || undefined}
                onClick={() => {
                  if (it.disabled) return;
                  close();
                  it.onSelect?.();
                }}
                className={itemCls(it.danger, it.disabled)}
              >
                {content}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
