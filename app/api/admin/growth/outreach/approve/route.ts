import { NextRequest, NextResponse } from "next/server";
import { actorName, requireSender } from "@/lib/growth/outreach/auth";
import { approveMessages } from "@/lib/growth/outreach/sequences";

/**
 * Owner approval gate. Admin (or "*") only. Approves drafts by message id,
 * by enrollment, or every draft at once; nothing sends without this.
 */
export async function POST(req: NextRequest) {
  const deny = await requireSender();
  if (deny) return deny;
  const b = (await req.json().catch(() => null)) as { messageIds?: unknown; enrollmentIds?: unknown; all?: unknown } | null;
  const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 2000) : []);
  const messageIds = strs(b?.messageIds);
  const enrollmentIds = strs(b?.enrollmentIds);
  const all = b?.all === true;
  if (!messageIds.length && !enrollmentIds.length && !all) return NextResponse.json({ error: "Nothing to approve" }, { status: 400 });
  const approved = await approveMessages({ messageIds, enrollmentIds, all }, await actorName());
  return NextResponse.json({ approved });
}
