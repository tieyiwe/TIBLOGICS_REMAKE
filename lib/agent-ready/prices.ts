// AI Agent Readiness prices, from the server's settings (never the request).
//
//   AGENT_READY_REPORT_CENTS  full report, default 2500 ($25; "0" takes it off sale)
//   AGENT_READY_KIT_CENTS     fix kit, default 5000 ($50); after the report, the difference
//   AGENT_READY_FREE_PER_DAY  free scans of one site per day (default 5)

export type Tier = "free" | "report" | "kit";
export type Buy = "report" | "kit";

function cents(name: string, fallback: number): number | null {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 100 ? n : null;
}
export const reportCents = () => cents("AGENT_READY_REPORT_CENTS", 2500);
export const kitCents = () => cents("AGENT_READY_KIT_CENTS", 5000);
export function freePerDay(): number {
  const n = Number(process.env.AGENT_READY_FREE_PER_DAY);
  return Number.isInteger(n) && n >= 1 ? n : 5;
}

/** What a buyer pays now for `buy`, given what they already have. null: not on sale or nothing to buy. */
export function priceFor(tier: Tier, buy: Buy): number | null {
  const report = reportCents();
  const kit = kitCents();
  if (buy === "report") return tier === "free" ? report : null;
  if (!kit || tier === "kit") return null;
  if (tier === "report") return report ? Math.max(100, kit - report) : kit;
  return kit;
}
