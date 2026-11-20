import type { ReactNode } from "react";
import { buttonClasses, Card as KitCard, PageHeader as KitPageHeader, StatCard } from "@/components/admin/ui";

// Growth building blocks on top of the shared admin kit
// (components/admin/ui, tokens in app/(admin)/admin.css). Older Growth pages
// import these names; they now render with the kit's look.

export const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: cents % 100 === 0 ? 0 : 2, minimumFractionDigits: cents % 100 === 0 ? 0 : 2 })}`;

export function PageHeader({ title, subtitle, actions, breadcrumb }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; breadcrumb?: { label: string; href?: string }[] }) {
  return <KitPageHeader title={title} subtitle={subtitle} actions={actions} breadcrumb={breadcrumb} className="mb-0" />;
}

export function Card({ title, subtitle, action, children, className = "", padded = true, id }: { title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; padded?: boolean; id?: string }) {
  return (
    <KitCard title={title} subtitle={subtitle} action={action} className={className} padded={padded} id={id}>
      {children}
    </KitCard>
  );
}

export function Stat({ label, value, note, tone, href, spark }: { label: string; value: ReactNode; note?: ReactNode; tone?: "warn" | "good"; href?: string; spark?: number[] }) {
  return <StatCard label={label} value={value} hint={note} href={href} spark={spark} tone={tone === "warn" ? "warn" : tone === "good" ? "success" : "default"} />;
}

export const btn = {
  primary: buttonClasses("primary", "md"),
  dark: buttonClasses("primary", "md", "bg-[var(--a-navy)] hover:bg-[var(--a-blue)]"),
  ghost: buttonClasses("secondary", "md"),
  danger: buttonClasses("secondary", "md", "text-[var(--a-danger)] hover:bg-[var(--a-danger-bg)] border-[#f3c5c0]"),
  sm: {
    primary: buttonClasses("primary", "sm"),
    dark: buttonClasses("primary", "sm", "bg-[var(--a-navy)] hover:bg-[var(--a-blue)]"),
    ghost: buttonClasses("secondary", "sm"),
    quiet: buttonClasses("ghost", "sm"),
  },
};

export const input =
  "w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 py-2 font-dm text-[13.5px] text-[var(--a-ink)] placeholder:text-[var(--a-ink-3)] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)] disabled:bg-[var(--a-surface-2)]";

export const label = "block font-dm text-[12px] font-semibold text-[var(--a-ink-2)] mb-1";

export const STATUS_STYLE: Record<string, string> = {
  draft: "bg-[var(--a-surface-2)] text-[var(--a-ink-2)] ring-[var(--a-border)]",
  scheduled: "bg-[var(--a-info-bg)] text-[var(--a-info)] ring-[#d3def3]",
  publishing: "bg-[var(--a-warn-bg)] text-[var(--a-warn)] ring-[#f7dcb5]",
  published: "bg-[var(--a-success-bg)] text-[var(--a-success)] ring-[#c8ead6]",
  ready: "bg-[var(--a-orange-bg)] text-[var(--a-orange-text)] ring-[#f9d6b8]",
  failed: "bg-[var(--a-danger-bg)] text-[var(--a-danger)] ring-[#f6cccc]",
  rejected: "bg-[var(--a-surface-2)] text-[var(--a-ink-3)] ring-[var(--a-border)] line-through",
};

export function StatusPill({ status, label: text }: { status: string; label: string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-dm text-[11px] font-semibold leading-4 ring-1 ring-inset whitespace-nowrap ${STATUS_STYLE[status] ?? STATUS_STYLE.draft}`}>{text}</span>;
}

/** A thin progress bar (goal trackers, caps). */
export function Progress({ value, max, tone = "orange", label: aria }: { value: number; max: number; tone?: "orange" | "success" | "blue" | "warn"; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const color = tone === "success" ? "bg-[var(--a-success)]" : tone === "blue" ? "bg-[var(--a-blue)]" : tone === "warn" ? "bg-[var(--a-warn)]" : "bg-[var(--a-orange)]";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--a-surface-2)] ring-1 ring-inset ring-[var(--a-border)]" role="progressbar" aria-label={aria} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className={`h-full rounded-full ${color} transition-[width] duration-300`} style={{ width: `${pct}%` }} />
    </div>
  );
}
