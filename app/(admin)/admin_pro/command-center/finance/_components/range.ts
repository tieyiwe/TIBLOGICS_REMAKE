import { addDays, isDayKey } from "@/lib/admin/command-center/dates";

// Date range presets for the income and expense lists (server and client).
export const PRESETS = [
  { id: "month", label: "This month" },
  { id: "last", label: "Last month" },
  { id: "quarter", label: "This quarter" },
  { id: "ytd", label: "Year to date" },
  { id: "12m", label: "Last 12 months" },
] as const;

export function presetRange(id: string, today: string): { from: string; to: string } {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7));
  const first = (yy: number, mm: number) => new Date(Date.UTC(yy, mm - 1, 1)).toISOString().slice(0, 10);
  switch (id) {
    case "last":
      return { from: first(y, m - 1), to: addDays(first(y, m), -1) };
    case "quarter":
      return { from: first(y, Math.floor((m - 1) / 3) * 3 + 1), to: today };
    case "ytd":
      return { from: `${y}-01-01`, to: today };
    case "12m":
      return { from: first(y, m - 11), to: today };
    default:
      return { from: first(y, m), to: today };
  }
}

export function resolveRange(sp: { from?: string; to?: string; range?: string }, today: string) {
  if (isDayKey(sp.from) && isDayKey(sp.to) && sp.from! <= sp.to!) return { from: sp.from!, to: sp.to!, preset: "custom" };
  const preset = PRESETS.some((p) => p.id === sp.range) ? sp.range! : "month";
  return { ...presetRange(preset, today), preset };
}
