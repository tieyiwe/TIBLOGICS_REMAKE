import prisma from "@/lib/prisma";
import { TEAM_DEFAULT_MIN_SEATS, TEAM_DEFAULT_SEAT_PRICE_CENTS, TEAM_MAX_SEATS, cleanTiers, quoteSeats, seatPriceFor, type SeatQuote, type SeatTier, type TeamPriceBook } from "./config";

// Team pricing defaults. Order of precedence:
//   1. Admin > Learn > Teams > Defaults (AdminSettings "learn.team.pricing")
//   2. LEARN_TEAM_SEAT_PRICE_CENTS / LEARN_TEAM_MIN_SEATS
//   3. $69 per seat per month, 5 seats minimum
// A team's own Team.seatPriceCents (set by staff, or locked in at checkout)
// beats all of these.
//
// Volume bands (optional): the same AdminSettings JSON may carry
//   "tiers": [{ "minSeats": 20, "seatPriceCents": 5900 }, { "minSeats": 50, "seatPriceCents": 4900 }]
// meaning "from 20 seats, $59 a seat; from 50 seats, $49 a seat". No tiers (the
// default) is one price for every team size. Every price, at checkout and on
// every page, comes from seatPriceFor()/quoteSeats() in ./config.ts.

export const TEAM_SETTINGS_KEY = "learn.team.pricing";

export type TeamPricing = TeamPriceBook;
export type { SeatTier, SeatQuote };

const int = (v: unknown, min: number, max: number): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

export function envTeamPricing(): TeamPricing {
  return {
    seatPriceCents: int(process.env.LEARN_TEAM_SEAT_PRICE_CENTS, 100, 1_000_000) ?? TEAM_DEFAULT_SEAT_PRICE_CENTS,
    minSeats: int(process.env.LEARN_TEAM_MIN_SEATS, 1, TEAM_MAX_SEATS) ?? TEAM_DEFAULT_MIN_SEATS,
    tiers: [],
  };
}

async function readStored(): Promise<Record<string, unknown> | null> {
  const row = await prisma.adminSettings.findUnique({ where: { key: TEAM_SETTINGS_KEY } }).catch(() => null);
  if (!row) return null;
  try {
    const v = JSON.parse(row.value);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function getTeamPricing(): Promise<TeamPricing> {
  const base = envTeamPricing();
  const v = await readStored();
  if (!v) return base;
  return {
    seatPriceCents: int(v.seatPriceCents, 100, 1_000_000) ?? base.seatPriceCents,
    minSeats: int(v.minSeats, 1, TEAM_MAX_SEATS) ?? base.minSeats,
    tiers: cleanTiers(v.tiers),
  };
}

/** Saves the defaults. Tiers already stored are kept unless `tiers` is passed. */
export async function setTeamPricing(p: { seatPriceCents: number; minSeats: number; tiers?: SeatTier[] }): Promise<void> {
  const prev = await readStored();
  const tiers = p.tiers !== undefined ? cleanTiers(p.tiers) : cleanTiers(prev?.tiers);
  const value = JSON.stringify({ seatPriceCents: p.seatPriceCents, minSeats: p.minSeats, ...(tiers.length ? { tiers } : {}) });
  await prisma.adminSettings.upsert({
    where: { key: TEAM_SETTINGS_KEY },
    create: { key: TEAM_SETTINGS_KEY, value },
    update: { value },
  });
}

/**
 * What one seat of this team costs per month: the team's own price when it
 * has one (locked at checkout or set by staff), else the price for its size.
 */
export function seatPrice(team: { seatPriceCents: number | null; seats?: number }, pricing: TeamPricing): number {
  if (team.seatPriceCents != null && team.seatPriceCents > 0) return team.seatPriceCents;
  return seatPriceFor(pricing, team.seats ?? pricing.minSeats);
}

/** Quote for a new team of `seats` (checkout and the public offer). */
export function quoteNewTeam(pricing: TeamPricing, seats: number): SeatQuote {
  return quoteSeats(pricing, seats);
}
