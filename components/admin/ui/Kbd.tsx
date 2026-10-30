import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-1.5",
        "font-dm text-[11px] font-semibold text-[var(--a-ink-3)] shadow-[0_1px_0_var(--a-border)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
