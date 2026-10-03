import { NextRequest, NextResponse } from "next/server";
import { jsonBody } from "@/lib/growth/content-auth";
import { actor, requireAcquireAdmin } from "@/lib/growth/acquire/admin";
import { approveReward, markCreditApplied, rejectReward, RewardError } from "@/lib/learn/referrals/service";
import { referralTablesReady } from "@/lib/learn/referrals/db";

// Owner decisions on a referral reward: approve (grants the free month, or
// marks a Stripe credit as due), reject, or mark a due credit as applied.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAcquireAdmin(req);
  if (denied) return denied;
  if (!(await referralTablesReady())) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const { id } = await params;
  const b = await jsonBody(req);
  const by = await actor();
  try {
    if (b?.action === "approve") return NextResponse.json(await approveReward(id, by));
    if (b?.action === "reject") {
      await rejectReward(id, by, typeof b.note === "string" ? b.note : null);
      return NextResponse.json({ status: "rejected" });
    }
    if (b?.action === "applied") {
      await markCreditApplied(id, by);
      return NextResponse.json({ status: "applied" });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    if (err instanceof RewardError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("[acquire/referrals]", err);
    return NextResponse.json({ error: "Could not update the reward. Try again." }, { status: 500 });
  }
}
