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
  const bg = dark ? "bg-[#162D4F] border-[#1E3A60]" : "bg-white border-[#D2DCE8]";
  const labelColor = dark ? "text-[#7A9BBF]" : "text-[#7A8FA6]";
  const valueColor = dark ? "text-[#E8EFF8]" : "text-[#0D1B2A]";

  return (
    <div className={`${bg} border rounded-2xl p-5`}>
      <div className="flex items-start justify-between mb-3">
        <span className={`${labelColor} font-dm text-sm font-medium`}>{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: iconColor + "25" }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>
      </div>
      <div className={`font-syne font-extrabold text-2xl ${valueColor}`}>{prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}</div>
      {change !== undefined && (
        <div className={`text-xs font-dm mt-1 ${change >= 0 ? "text-green-500" : "text-red-400"}`}>
          {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% vs last period
        </div>
      )}
    </div>
  );
}
