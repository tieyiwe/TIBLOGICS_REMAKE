"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import { cn } from "@/lib/utils";

/**
 * Side panel dialog. Focus is trapped while open, Escape closes, and focus
 * returns to the opener. `side="left"` is used for the mobile nav.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = 480,
  side = "right",
  className,
  hideHeader,
  ariaLabel,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number | string;
  side?: "left" | "right";
  className?: string;
  hideHeader?: boolean;
  /** Accessible name when there is no visible title. */
  ariaLabel?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="a-anim-fade absolute inset-0 bg-[rgba(13,27,42,.45)]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : (ariaLabel ?? "Panel")}
        style={{ width: typeof width === "number" ? `${width}px` : width }}
        className={cn(
          "absolute inset-y-0 flex max-w-[100vw] flex-col bg-[var(--a-surface)] shadow-[var(--a-shadow-pop)]",
          side === "right" ? "right-0 a-anim-right" : "left-0 a-anim-left",
          className,
        )}
      >
        {!hideHeader ? (
          <div className="flex items-center justify-between gap-3 border-b border-[var(--a-border)] px-5 py-3.5">
            <h2 id={titleId} className="min-w-0 font-syne text-[17px] font-bold text-[var(--a-ink)]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--a-radius-control)] text-[var(--a-ink-3)] sm:h-9 sm:w-9 hover:bg-[var(--a-surface-2)] hover:text-[var(--a-ink)]"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? (
          <div className="border-t border-[var(--a-border)] px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
