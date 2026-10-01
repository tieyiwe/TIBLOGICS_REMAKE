import { NextRequest, NextResponse } from "next/server";
import { limitGrowthAi, requireGrowth } from "@/lib/growth/outreach/auth";
import { draftSequenceWithAI } from "@/lib/growth/outreach/sequences";

export const maxDuration = 60;

/** Sonnet drafts a sequence's steps; the owner edits and saves them. */
export async function POST(req: NextRequest) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const limited = await limitGrowthAi("sequence-draft", 30);
  if (limited) return limited;
  const b = (await req.json().catch(() => null)) as { audience?: unknown; offerKey?: unknown; goal?: unknown; steps?: unknown } | null;
  const audience = typeof b?.audience === "string" ? b.audience.trim() : "";
  if (!audience) return NextResponse.json({ error: "Describe the audience" }, { status: 400 });
  try {
    const steps = await draftSequenceWithAI({
      audience,
      offerKey: typeof b?.offerKey === "string" ? b.offerKey : null,
      goal: typeof b?.goal === "string" ? b.goal : null,
      steps: Number(b?.steps) || 3,
    });
    return NextResponse.json({ steps });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "AI unavailable" }, { status: 502 });
  }
}
