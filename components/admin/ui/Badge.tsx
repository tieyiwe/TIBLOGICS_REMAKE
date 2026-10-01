import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "success" | "warn" | "danger" | "info" | "orange";

const TONE: Record<BadgeTone, string> = {
  neutral: "bg-[var(--a-surface-2)] text-[var(--a-ink-2)] ring-[var(--a-border)]",
  success: "bg-[var(--a-success-bg)] text-[var(--a-success)] ring-[#c8ead6]",
  warn: "bg-[var(--a-warn-bg)] text-[var(--a-warn)] ring-[#f7dcb5]",
  danger: "bg-[var(--a-danger-bg)] text-[var(--a-danger)] ring-[#f6cccc]",
  info: "bg-[var(--a-info-bg)] text-[var(--a-info)] ring-[#d3def3]",
  orange: "bg-[var(--a-orange-bg)] text-[var(--a-orange-text)] ring-[#f9d6b8]",
};

const DOT: Record<BadgeTone, string> = {
  neutral: "bg-[var(--a-ink-3)]",
  success: "bg-[var(--a-success)]",
  warn: "bg-[var(--a-warn)]",
  danger: "bg-[var(--a-danger)]",
  info: "bg-[var(--a-info)]",
  orange: "bg-[var(--a-orange)]",
};

export function Badge({
  tone = "neutral",
  children,
  dot,
  className,
  title,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-dm font-semibold leading-5 ring-1 ring-inset whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", DOT[tone])} aria-hidden /> : null}
      {children}
    </span>
  );
}
