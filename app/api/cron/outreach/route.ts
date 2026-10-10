import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import { outreachTablesReady } from "@/lib/growth/outreach/db";
import { processEnrichQueue } from "@/lib/growth/outreach/enrich";
import { runSender } from "@/lib/growth/outreach/sender";

// Growth outreach job (every 15 minutes; scripts/cron.mjs "outreach").
//   1. Drains a little of the lead-enrichment queue.
//   2. Sends approved, due outreach emails: rolling daily cap
//      (OUTREACH_DAILY_CAP), sending window, randomised spacing, suppression
//      list, stop-on-reply. Idempotent: every email is claimed before it is
//      sent, and a lock row keeps overlapping runs from working at once.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

async function run(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron/outreach] CRON_SECRET is not set — refusing to run");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  // Header only (a secret in the URL ends up in logs); constant-time compare.
  if (!secretEquals(bearer, cronSecret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await outreachTablesReady())) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const enrich = await processEnrichQueue(3).catch((err) => ({ error: err instanceof Error ? err.message : String(err) }));
  const sender = await runSender();
  return NextResponse.json({ ok: true, enrich, sender });
}

export const GET = run;
export const POST = run;
