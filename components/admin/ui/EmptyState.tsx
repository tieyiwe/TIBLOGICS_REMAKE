import type { ElementType, ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  body,
  action,
  className,
  compact,
}: {
  icon?: ElementType;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "px-4 py-8" : "px-6 py-14", className)}>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--a-surface-2)] text-[var(--a-ink-3)] ring-1 ring-inset ring-[var(--a-border)]">
        <Icon size={20} aria-hidden />
      </div>
      <p className="font-dm text-[15px] font-semibold text-[var(--a-ink)]">{title}</p>
      {body ? <div className="mt-1 max-w-sm font-dm text-[13px] text-[var(--a-ink-3)]">{body}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
