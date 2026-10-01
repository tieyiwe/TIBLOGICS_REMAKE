import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard, learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { ComposeSchema, createCampaign } from "@/lib/learn/inbox/campaigns";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Send now, or schedule, a message to learners (owner or admin only).
export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { session, error } = await learnerStaff("manage");
  if (error) return error;
  if (!(await checkRateLimit(`comms-create:${session.user.email}`, 30, 3_600_000))) {
    return NextResponse.json({ error: "Too many sends in an hour." }, { status: 429 });
  }
  const parsed = ComposeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid message" }, { status: 400 });
  try {
    const r = await createCampaign(session, parsed.data);
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, id: r.id, recipients: r.recipients, scheduled: r.scheduled, report: r.report });
  } catch (err) {
    console.error("[comms/create]", err);
    return NextResponse.json({ error: "The message could not be created." }, { status: 500 });
  }
}
