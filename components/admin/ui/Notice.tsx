import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type NoticeTone = "info" | "warn" | "danger" | "success";

const TONE: Record<NoticeTone, { cls: string; icon: typeof Info; iconCls: string }> = {
  info: { cls: "border-[#d3def3] bg-[var(--a-info-bg)] text-[#1b3a6b]", icon: Info, iconCls: "text-[var(--a-info)]" },
  warn: { cls: "border-[#f7dcb5] bg-[var(--a-warn-bg)] text-[#7c3a06]", icon: TriangleAlert, iconCls: "text-[var(--a-warn)]" },
  danger: { cls: "border-[#f6cccc] bg-[var(--a-danger-bg)] text-[#7f1d1d]", icon: CircleAlert, iconCls: "text-[var(--a-danger)]" },
  success: { cls: "border-[#c8ead6] bg-[var(--a-success-bg)] text-[#14532d]", icon: CircleCheck, iconCls: "text-[var(--a-success)]" },
};

/** Inline callout for setup warnings, info and errors. */
export function Notice({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: NoticeTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const t = TONE[tone];
  const Icon = t.icon;
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={cn("flex gap-3 rounded-[var(--a-radius-card)] border p-4 font-dm text-[13.5px] leading-relaxed", t.cls, className)}
    >
      <Icon size={18} className={cn("mt-0.5 shrink-0", t.iconCls)} aria-hidden />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? "mt-0.5" : undefined}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}
