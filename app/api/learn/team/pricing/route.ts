import { NextResponse } from "next/server";
import { getTeamPricing } from "@/lib/learn/team/settings";
import { TEAM_CURRENCY } from "@/lib/learn/team/config";

/**
 * Public team price book (base price, minimum seats, optional volume bands).
 * The offer on the plans pages reads it so the price it shows always comes
 * from the same seatPriceFor() that checkout charges.
 */
export async function GET() {
  const p = await getTeamPricing();
  return NextResponse.json(
    { seatPriceCents: p.seatPriceCents, minSeats: p.minSeats, tiers: p.tiers, currency: TEAM_CURRENCY },
    { headers: { "cache-control": "public, max-age=60" } },
  );
}
