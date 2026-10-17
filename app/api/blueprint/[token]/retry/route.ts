import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { findBlueprintByToken } from "@/lib/blueprint/access";
import { generateBlueprint } from "@/lib/blueprint/generate";
import { MAX_ATTEMPTS } from "@/lib/blueprint/config";
import { getT } from "@/lib/i18n/server";

// "Try again" on a blueprint whose writing failed. Bounded by MAX_ATTEMPTS
// across every caller, so it cannot become an unlimited model spend.
export const maxDuration = 300;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const t = await getT();
  const bp = await findBlueprintByToken((await params).token);
  if (!bp) return NextResponse.json({ error: t("tools.api.notFound") }, { status: 404 });
  if (bp.status !== "failed") return NextResponse.json({ error: t("tools.bp.api.nothingToRetry") }, { status: 409 });
  if (bp.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: t("tools.bp.api.byHand") }, { status: 409 });
  }
  if (!(await checkRateLimit(`blueprint-retry:${bp.id}`, 2, 600_000))) {
    return NextResponse.json({ error: t("tools.bp.api.wait") }, { status: 429 });
  }
  const outcome = await generateBlueprint(bp.id);
  return NextResponse.json({ outcome }, { status: outcome === "ready" ? 200 : outcome === "busy" ? 202 : 500 });
}
