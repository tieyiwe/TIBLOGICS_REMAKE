import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
  prefix?: string;
  suffix?: string;
  dark?: boolean;
}

export default function MetricCard({
  label, value, change, icon: Icon,
  iconColor = "#2251A3", prefix = "", suffix = "", dark = false,
}: MetricCardProps) {
  // Light variant follows the admin kit tokens (components/admin/ui StatCard look).
  const bg = dark
    ? "bg-[#162D4F] border-[#1E3A60] rounded-2xl"
    : "bg-[var(--a-surface,#fff)] border-[var(--a-border,#E3E9F1)] rounded-[var(--a-radius-card,14px)] shadow-[0_1px_2px_rgba(13,27,42,.04)]";
  const labelColor = dark ? "text-[#7A9BBF] text-sm font-medium" : "a-micro text-[var(--a-ink-3,#5A6E84)]";
  const valueColor = dark ? "text-[#E8EFF8] font-syne font-extrabold" : "text-[var(--a-ink,#0D1B2A)] font-dm font-bold tracking-tight";

  return (
    <div className={`${bg} min-w-0 border p-4 sm:p-5`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className={`${labelColor} font-dm`}>{label}</span>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconColor + "1A" }}
        >
          <Icon size={15} style={{ color: iconColor }} aria-hidden />
        </div>
      </div>
      <div className={`text-2xl tabular-nums ${valueColor}`}>
        {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
      </div>
      {change !== undefined && (
        <div
          className={`mt-1.5 font-dm text-xs font-semibold ${
            dark ? (change >= 0 ? "text-green-400" : "text-red-300") : change >= 0 ? "text-[var(--a-success,#15803D)]" : "text-[var(--a-danger,#B91C1C)]"
          }`}
        >
          {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% vs last period
        </div>
      )}
    </div>
  );
}
