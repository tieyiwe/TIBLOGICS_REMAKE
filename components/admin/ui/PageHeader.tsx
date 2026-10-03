import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, type TabItem } from "./Tabs";

export type Crumb = { label: string; href?: string };

export function PageHeader({
  title,
  subtitle,
  actions,
  tabs,
  activeTab,
  breadcrumb,
  meta,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Either a ready node (e.g. <Tabs/>) or tab items rendered as link tabs. */
  tabs?: ReactNode | TabItem[];
  activeTab?: string;
  breadcrumb?: Crumb[];
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", tabs ? "border-b border-[var(--a-border)]" : "", className)}>
      {breadcrumb && breadcrumb.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex flex-wrap items-center gap-1 font-dm text-[12.5px] text-[var(--a-ink-3)]">
            {breadcrumb.map((c, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 ? <ChevronRight size={12} aria-hidden /> : null}
                {c.href ? (
                  <Link href={c.href} className="hover:text-[var(--a-ink)] hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-syne text-[24px] font-bold leading-tight text-[var(--a-ink)] sm:text-[26px]">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-2xl font-dm text-[14px] text-[var(--a-ink-3)]">{subtitle}</p> : null}
          {meta ? <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">{actions}</div> : null}
      </div>
      {tabs ? (
        <div className="mt-4">{Array.isArray(tabs) ? <Tabs items={tabs as TabItem[]} active={activeTab} /> : tabs}</div>
      ) : null}
    </div>
  );
}

/** Small section title used inside pages (between cards). */
export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="font-syne text-[17px] font-bold text-[var(--a-ink)]">{children}</h2>
      {action}
    </div>
  );
}
