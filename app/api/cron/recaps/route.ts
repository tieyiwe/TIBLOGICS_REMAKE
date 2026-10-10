import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import { fillRecaps } from "@/lib/learn/recap";

// Lesson recaps (key takeaways and recall cards): writes the missing or
// out-of-date ones with the fast model, up to 80 per run (about $0.20).
//   node scripts/cron.mjs recaps
// Bearer CRON_SECRET only.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  if (!secretEquals(bearer, cronSecret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const r = await fillRecaps({ budget: 80, deadline: Date.now() + 240_000 });
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    console.error("[cron/recaps]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export const POST = GET;
