import { NextRequest, NextResponse } from "next/server";
import { jsonBody, requireGrowthAdmin } from "@/lib/growth/content-auth";
import { getGoalProgress, getNextActions, getStreak, saveGoals } from "@/lib/growth/mission";

export const dynamic = "force-dynamic";

/** Mission control: next best actions, weekly goal progress, streak. */
export async function GET() {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const [actions, progress, streak] = await Promise.all([getNextActions(), getGoalProgress(), getStreak()]);
  return NextResponse.json({ actions, progress, streak });
}

/** Saves the weekly goals. */
export async function PUT(req: NextRequest) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const b = await jsonBody(req);
  if (!b) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const goals = await saveGoals(b.goals ?? b);
  return NextResponse.json({ goals, progress: await getGoalProgress(goals) });
}
