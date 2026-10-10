"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import { cn } from "@/lib/utils";

// TODO: switch to components/admin/ui if the kit gains a centered dialog.
/** Centered dialog: focus trapped, Escape and backdrop close, focus returns to the opener. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 560,
  className,
  top = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  className?: string;
  /** Pin near the top (command-palette style) instead of centered. */
  top?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(ref, open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className={cn("fixed inset-0 z-[70] flex justify-center p-3 sm:p-6", top ? "items-start pt-[10vh]" : "items-center")}>
      <div className="a-anim-fade absolute inset-0 bg-[rgba(13,27,42,.45)]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "Dialog"}
        style={{ maxWidth: width }}
        className={cn(
          "a-anim-pop relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-pop)]",
          className,
        )}
      >
        {title ? (
          <div className="flex items-center justify-between gap-3 border-b border-[var(--a-border)] px-5 py-3.5">
            <h2 id={titleId} className="font-syne text-[17px] font-bold text-[var(--a-ink)]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-[var(--a-radius-control)] text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)] hover:text-[var(--a-ink)]"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--a-border)] px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}
