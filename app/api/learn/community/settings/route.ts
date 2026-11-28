import { NextRequest, NextResponse } from "next/server";
import { communityGuard } from "@/lib/learn/community/api";
import { getProfile, setReplyDigest } from "@/lib/learn/community/discussion";

/** Community settings: { replyDigest }. */
export async function GET() {
  const g = await communityGuard();
  if (g.error) return g.error;
  const p = await getProfile(g.student.id);
  return NextResponse.json({ replyDigest: p.replyDigest });
}

export async function PATCH(req: NextRequest) {
  const g = await communityGuard();
  if (g.error) return g.error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof body.replyDigest === "boolean") await setReplyDigest(g.student.id, body.replyDigest);
  const p = await getProfile(g.student.id);
  return NextResponse.json({ ok: true, replyDigest: p.replyDigest });
}
