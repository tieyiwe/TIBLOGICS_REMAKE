import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import { staffAiLimit } from "@/lib/rate-limit";
import { fillRecaps, recapStats } from "@/lib/learn/recap";

// Staff: lesson recaps (key takeaways and recall cards).
//   GET                    how many lessons in live tracks have a current recap
//   POST { action: "fill" } write the missing ones now (up to 150 per click, about 4 minutes)

export const maxDuration = 300;

export async function GET() {
  const denied = await requirePermission("events");
  if (denied) return denied;
  try {
    return NextResponse.json(await recapStats());
  } catch (err) {
    console.error("[admin/learn/recaps]", err);
    return NextResponse.json({ error: "Could not read the recaps." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requirePermission("events");
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as { action?: string } | null;
  if (body?.action !== "fill") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  // Each click is up to 150 small model calls: a ceiling stops a loop.
  const limited = await staffAiLimit("lesson-recaps", 6);
  if (limited) return limited;
  try {
    const r = await fillRecaps({ budget: 150, deadline: Date.now() + 240_000 });
    return NextResponse.json({ ok: true, ...r, ...(await recapStats()) });
  } catch (err) {
    console.error("[admin/learn/recaps]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message.slice(0, 300) : "Something went wrong." }, { status: 500 });
  }
}
