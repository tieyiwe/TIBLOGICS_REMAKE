import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { findBlueprintByToken } from "@/lib/blueprint/access";
import { generateBlueprint } from "@/lib/blueprint/generate";
import { MAX_ATTEMPTS } from "@/lib/blueprint/config";

// "Try again" on a blueprint whose writing failed. Bounded by MAX_ATTEMPTS
// across every caller, so it cannot become an unlimited model spend.
export const maxDuration = 300;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const bp = await findBlueprintByToken((await params).token);
  if (!bp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (bp.status !== "failed") return NextResponse.json({ error: "Nothing to retry." }, { status: 409 });
  if (bp.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "We've been notified and will finish this one by hand." }, { status: 409 });
  }
  if (!(await checkRateLimit(`blueprint-retry:${bp.id}`, 2, 600_000))) {
    return NextResponse.json({ error: "Please wait a few minutes before trying again." }, { status: 429 });
  }
  const outcome = await generateBlueprint(bp.id);
  return NextResponse.json({ outcome }, { status: outcome === "ready" ? 200 : outcome === "busy" ? 202 : 500 });
}
