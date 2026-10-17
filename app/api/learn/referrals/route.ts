import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getOrCreateCode, recordReferralEvent, visitorHash } from "@/lib/learn/referrals/service";
import { isSameSiteJson } from "@/lib/growth/acquire/security";

// Counts a share-button click on /learn/referrals (one per channel, learner
// and day), for the learner's stats and the owner's acquisition overview.
export const dynamic = "force-dynamic";

const Body = z.object({ channel: z.enum(["whatsapp", "linkedin", "x", "email", "copy", "native"]) });

export async function POST(req: NextRequest) {
  if (!isSameSiteJson(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  if (!(await checkRateLimit(`ref-share:${student.id}`, 30, 60 * 60_000))) return NextResponse.json({ ok: true });
  try {
    const code = await getOrCreateCode(student.id);
    await recordReferralEvent(code, `share:${parsed.data.channel}`, visitorHash(student.id, "learner"), parsed.data.channel);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/learn/referrals]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
