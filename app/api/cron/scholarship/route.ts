import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import { runScholarshipNotices } from "@/lib/learn/scholarship/notices";

// Tilo Vision Scholarship, daily:
//   npm run cron scholarship
// Offer reminders, track-choice and completion reminders, monthly progress
// and the completion congratulations (lib/learn/scholarship/notices.ts).

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  if (!secretEquals(bearer, cronSecret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const r = await runScholarshipNotices({ deadline: Date.now() + 240_000 });
  return NextResponse.json({ ok: true, ...r });
}
