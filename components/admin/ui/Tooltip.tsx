"use client";

import { cloneElement, isValidElement, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight tooltip for hover and keyboard focus. Shows after a short
 * delay, hides on Escape, and links itself with aria-describedby. Keep the
 * text short; it is supplementary, never the only label.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  delay = 250,
  className,
}: {
  content: ReactNode;
  children: ReactElement<Record<string, unknown>>;
  side?: "top" | "bottom" | "right" | "left";
  delay?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const id = useId();

  const show = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };

  const pos =
    side === "top"
      ? "bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2"
      : side === "bottom"
        ? "top-[calc(100%+6px)] left-1/2 -translate-x-1/2"
        : side === "right"
          ? "left-[calc(100%+8px)] top-1/2 -translate-y-1/2"
          : "right-[calc(100%+8px)] top-1/2 -translate-y-1/2";

  const child = isValidElement(children)
    ? cloneElement(children, {
        "aria-describedby": open ? id : undefined,
        onMouseEnter: show,
        onMouseLeave: hide,
        onFocus: show,
        onBlur: hide,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Escape") hide();
          (children.props.onKeyDown as ((e: React.KeyboardEvent) => void) | undefined)?.(e);
        },
      })
    : children;

  return (
    <span className="relative inline-flex">
      {child}
      {open ? (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "a-anim-fade pointer-events-none absolute z-[90] whitespace-nowrap rounded-[7px] bg-[var(--a-navy-deep)] px-2 py-1 font-dm text-[12px] font-medium text-white shadow-[var(--a-shadow-pop)]",
            pos,
            className,
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
