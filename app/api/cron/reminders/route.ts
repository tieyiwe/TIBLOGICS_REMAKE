import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import { runReminders } from "@/lib/learn/reminders/cron";

// Study reminders by WhatsApp (or email for learners who chose only email).
// At most one per learner per local day, claimed before sending, so run it
// hourly: npm run cron reminders. Bearer CRON_SECRET only (no query string).
// Also sends the owner's weekly growth email on Monday mornings.
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!secretEquals(bearer, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const report = await runReminders();
    // The owner's weekly growth email rides on this hourly job: it goes out
    // once, on Monday from 8:00 owner time (lib/analytics/weekly-email.ts).
    const weeklyGrowthEmail = await import("@/lib/analytics/weekly-email").then((m) => m.maybeSendWeeklyEmail()).catch(() => "failed");
    return NextResponse.json({ ...report, weeklyGrowthEmail }, { status: report.errors.length > 0 ? 207 : 200 });
  } catch (err) {
    console.error("[cron/reminders]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
