import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import { runReminders } from "@/lib/learn/reminders/cron";

// Study reminders by WhatsApp (or email for learners who chose only email).
// At most one per learner per local day, claimed before sending, so run it
// hourly: npm run cron reminders. Bearer CRON_SECRET only (no query string).
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
    return NextResponse.json(report, { status: report.errors.length > 0 ? 207 : 200 });
  } catch (err) {
    console.error("[cron/reminders]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
