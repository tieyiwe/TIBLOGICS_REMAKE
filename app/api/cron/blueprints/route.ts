import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import { generateBlueprint, pendingBlueprints } from "@/lib/blueprint/generate";

// Safety net for blueprints the webhook's first attempt did not finish (a
// restart mid-generation, a model outage). Run every 15 minutes:
//   npm run cron blueprints
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  if (!secretEquals(bearer, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ids = await pendingBlueprints(3);
  const outcomes: Record<string, number> = {};
  for (const id of ids) {
    const o = await generateBlueprint(id).catch(() => "failed" as const);
    outcomes[o] = (outcomes[o] ?? 0) + 1;
  }
  return NextResponse.json({ pending: ids.length, ...outcomes });
}
