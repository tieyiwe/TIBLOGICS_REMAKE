import { NextResponse } from "next/server";
import { requireGrowth } from "@/lib/growth/outreach/auth";
import { syncSources } from "@/lib/growth/outreach/leads";

export const maxDuration = 60;

/** Pull new Aria leads and Prospects into the workspace (idempotent). */
export async function POST() {
  const deny = await requireGrowth();
  if (deny) return deny;
  return NextResponse.json(await syncSources());
}
