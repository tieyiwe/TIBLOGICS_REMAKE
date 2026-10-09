import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/require-admin";
import { GOAL_METRICS, getGoals, monthKey, setGoal, type GoalMetric } from "@/lib/analytics/insights";

export const dynamic = "force-dynamic";

// Monthly targets on the Insights page: revenue (cents), bookings, sign-ups.
// Reading: Business analytics. Setting: the owner and admins only.

const Body = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  goals: z
    .object({
      revenue: z.number().int().min(0).max(100_000_000_00).nullable().optional(),
      bookings: z.number().int().min(0).max(1_000_000).nullable().optional(),
      signups: z.number().int().min(0).max(10_000_000).nullable().optional(),
    })
    .strict(),
});

export async function GET(req: NextRequest) {
  const denied = await requirePermission("insights");
  if (denied) return denied;
  const m = req.nextUrl.searchParams.get("month");
  const month = m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? m : monthKey();
  return NextResponse.json({ month, goals: await getGoals(month) });
}

export async function POST(req: NextRequest) {
  const denied = await requirePermission("__admin__");
  if (denied) return denied;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter whole numbers (revenue in cents)." }, { status: 400 });
  const month = parsed.data.month ?? monthKey();
  for (const k of Object.keys(GOAL_METRICS) as GoalMetric[]) {
    const v = parsed.data.goals[k];
    if (v !== undefined) await setGoal(month, k, v);
  }
  return NextResponse.json({ ok: true, month, goals: await getGoals(month) });
}
