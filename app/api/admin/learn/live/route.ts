import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import { createSession } from "@/lib/learn/live/sessions";
import { parseSessionInput } from "@/lib/learn/live/admin-input";

/** Create a live expert session. */
export async function POST(req: NextRequest) {
  const authErr = await requirePermission("events");
  if (authErr) return authErr;
  const parsed = parseSessionInput(await req.json().catch(() => ({})));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, id: await createSession(parsed.value) });
  } catch (err) {
    console.error("[admin/live] create", err);
    return NextResponse.json({ error: "Could not create the session" }, { status: 500 });
  }
}
