import prisma from "@/lib/prisma";
import { TEAM_DEFAULT_MIN_SEATS, TEAM_DEFAULT_SEAT_PRICE_CENTS, TEAM_MAX_SEATS } from "./config";

// Team pricing defaults. Order of precedence:
//   1. Admin > Learn > Teams > Defaults (AdminSettings "learn.team.pricing")
//   2. LEARN_TEAM_SEAT_PRICE_CENTS / LEARN_TEAM_MIN_SEATS
//   3. $69 per seat per month, 5 seats minimum
// A team's own Team.seatPriceCents (set by staff) beats all of these.

export const TEAM_SETTINGS_KEY = "learn.team.pricing";

export interface TeamPricing {
  seatPriceCents: number;
  minSeats: number;
}

const int = (v: unknown, min: number, max: number): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

export function envTeamPricing(): TeamPricing {
  return {
    seatPriceCents: int(process.env.LEARN_TEAM_SEAT_PRICE_CENTS, 100, 1_000_000) ?? TEAM_DEFAULT_SEAT_PRICE_CENTS,
    minSeats: int(process.env.LEARN_TEAM_MIN_SEATS, 1, TEAM_MAX_SEATS) ?? TEAM_DEFAULT_MIN_SEATS,
  };
}

export async function getTeamPricing(): Promise<TeamPricing> {
  const base = envTeamPricing();
  const row = await prisma.adminSettings.findUnique({ where: { key: TEAM_SETTINGS_KEY } }).catch(() => null);
  if (!row) return base;
  try {
    const v = JSON.parse(row.value) as Partial<TeamPricing>;
    return {
      seatPriceCents: int(v.seatPriceCents, 100, 1_000_000) ?? base.seatPriceCents,
      minSeats: int(v.minSeats, 1, TEAM_MAX_SEATS) ?? base.minSeats,
    };
  } catch {
    return base;
  }
}

export async function setTeamPricing(p: TeamPricing): Promise<void> {
  const value = JSON.stringify({ seatPriceCents: p.seatPriceCents, minSeats: p.minSeats });
  await prisma.adminSettings.upsert({
    where: { key: TEAM_SETTINGS_KEY },
    create: { key: TEAM_SETTINGS_KEY, value },
    update: { value },
  });
}

/** What one seat of this team costs per month. */
export function seatPrice(team: { seatPriceCents: number | null }, pricing: TeamPricing): number {
  return team.seatPriceCents != null && team.seatPriceCents > 0 ? team.seatPriceCents : pricing.seatPriceCents;
}
