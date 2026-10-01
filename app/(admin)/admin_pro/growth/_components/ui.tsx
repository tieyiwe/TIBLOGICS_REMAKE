import type { ReactNode } from "react";

// Small shared building blocks for the Growth pages (server or client).

export const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: cents % 100 === 0 ? 0 : 2, minimumFractionDigits: cents % 100 === 0 ? 0 : 2 })}`;

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">{title}</h1>
        {subtitle && <p className="font-dm text-sm text-[#7A8FA6] mt-0.5 max-w-3xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, subtitle, action, children, className = "" }: { title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`bg-white border border-[#D2DCE8] rounded-2xl p-4 sm:p-5 min-w-0 ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            {title && <h2 className="font-syne font-bold text-base text-[#0D1B2A]">{title}</h2>}
            {subtitle && <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: "warn" | "good" }) {
  return (
    <div className="bg-white border border-[#D2DCE8] rounded-2xl p-4 min-w-0">
      <p className="font-dm text-xs text-[#7A8FA6] leading-snug">{label}</p>
      <p className={`mt-1 font-syne font-bold text-2xl tabular-nums ${tone === "warn" ? "text-[#B42318]" : tone === "good" ? "text-[#0F6E56]" : "text-[#0D1B2A]"}`}>{value}</p>
      {note && <p className="mt-1 font-dm text-[11px] text-[#7A8FA6] leading-snug">{note}</p>}
    </div>
  );
}

export const btn = {
  primary: "inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#F47C20] hover:bg-[#e06d15] disabled:opacity-50 px-3.5 py-2 font-dm text-sm font-semibold text-white transition-colors",
  dark: "inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1B3A6B] hover:bg-[#2251A3] disabled:opacity-50 px-3.5 py-2 font-dm text-sm font-semibold text-white transition-colors",
  ghost: "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#D2DCE8] bg-white hover:bg-[#F4F7FB] disabled:opacity-50 px-3 py-2 font-dm text-sm font-medium text-[#2251A3] transition-colors",
  danger: "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#F3C5C0] bg-white hover:bg-[#FEF3F2] disabled:opacity-50 px-3 py-2 font-dm text-sm font-medium text-[#B42318] transition-colors",
};

export const input =
  "w-full rounded-lg border border-[#D2DCE8] bg-white px-3 py-2 font-dm text-sm text-[#0D1B2A] placeholder:text-[#9AAABB] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]";

export const label = "block font-dm text-xs font-semibold text-[#3A4A5C] mb-1";

export const STATUS_STYLE: Record<string, string> = {
  draft: "bg-[#F4F7FB] text-[#3A4A5C] border-[#D2DCE8]",
  scheduled: "bg-[#EAF1FB] text-[#2251A3] border-[#BBD0EE]",
  publishing: "bg-[#FFF6E5] text-[#9A5B00] border-[#F5D9A8]",
  published: "bg-[#E7F6F0] text-[#0F6E56] border-[#B6E2D0]",
  ready: "bg-[#FEF0E3] text-[#B8500A] border-[#F7CBA3]",
  failed: "bg-[#FEF3F2] text-[#B42318] border-[#F3C5C0]",
  rejected: "bg-[#F4F4F5] text-[#71717A] border-[#E4E4E7] line-through",
};

export function StatusPill({ status, label: text }: { status: string; label: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-dm text-[11px] font-semibold ${STATUS_STYLE[status] ?? STATUS_STYLE.draft}`}>{text}</span>;
}
