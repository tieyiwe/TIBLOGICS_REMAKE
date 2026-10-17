import { NextRequest, NextResponse } from "next/server";
import { tutorGuard } from "@/lib/learn/tutor/guard";
import { closeThread } from "@/lib/learn/tutor/server";

// "New conversation": closes the open thread for this page. The next message
// starts a fresh one; the old one is kept for usage stats only.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const g = await tutorGuard(body?.kind, body?.ref);
  if (g.error) return g.error;
  await closeThread(g.student.id, g.page.contextKey);
  return NextResponse.json({ ok: true });
}
