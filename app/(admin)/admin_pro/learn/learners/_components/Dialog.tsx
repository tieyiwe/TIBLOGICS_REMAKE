"use client";

// TODO: switch to components/admin/ui (the kit has Drawer but no centered
// dialog yet). Same tokens and behaviour as the kit's Drawer: focus trapped,
// Escape closes, focus returns to the opener.
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  tone = "default",
  icon: Icon,
  width = 480,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  tone?: "default" | "danger" | "warn";
  icon?: React.ElementType;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="a-anim-fade absolute inset-0 bg-[rgba(13,27,42,.45)]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        style={{ maxWidth: width }}
        className="a-anim-pop relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[var(--a-radius-hero)] bg-[var(--a-surface)] shadow-[var(--a-shadow-pop)] sm:rounded-[var(--a-radius-hero)]"
      >
        <div className="flex items-start gap-3 px-5 pb-1 pt-5 sm:px-6">
          {Icon ? (
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                tone === "danger"
                  ? "bg-[var(--a-danger-bg)] text-[var(--a-danger)] ring-[#f6cccc]"
                  : tone === "warn"
                    ? "bg-[var(--a-warn-bg)] text-[var(--a-warn)] ring-[#f7dcb5]"
                    : "bg-[var(--a-info-bg)] text-[var(--a-info)] ring-[#d3def3]",
              )}
              aria-hidden
            >
              <Icon size={19} />
            </span>
          ) : null}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id={titleId} className="font-syne text-[18px] font-bold leading-snug text-[var(--a-ink)]">
              {title}
            </h2>
            {description ? (
              <div id={descId} className="mt-1 font-dm text-[13.5px] leading-relaxed text-[var(--a-ink-3)]">
                {description}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--a-radius-control)] text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)] hover:text-[var(--a-ink)]"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--a-border)] bg-[var(--a-surface-2)]/60 px-5 py-3 sm:px-6">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
