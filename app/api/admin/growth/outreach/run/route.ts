import { NextResponse } from "next/server";
import { requireSender } from "@/lib/growth/outreach/auth";
import { runSender } from "@/lib/growth/outreach/sender";

export const maxDuration = 300;

/** "Run sender now": the same gated, capped, claimed run the cron does. */
export async function POST() {
  const deny = await requireSender();
  if (deny) return deny;
  return NextResponse.json(await runSender());
}
