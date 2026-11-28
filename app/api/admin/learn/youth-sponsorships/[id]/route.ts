import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/admin/audit";
import { csrfGuard, learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { getSponsorship, resendSponsorship } from "@/lib/learn/youth-sponsor";

export const dynamic = "force-dynamic";

// Admin: resend a sponsorship's email (learners:manage). The child's welcome
// once consent is in place, otherwise the parent's consent email.
const Body = z.object({ action: z.literal("resend") });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { session, error } = await learnerStaff("manage");
  if (error) return error;
  if (!(await checkRateLimit(`admin-youth-sponsor:${session.user.email}`, 30, 600_000))) {
    return NextResponse.json({ error: "Too many requests. Wait a moment." }, { status: 429 });
  }
  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  const s = parsed.success ? await getSponsorship(id) : null;
  if (!s) return NextResponse.json({ error: "Sponsorship not found" }, { status: 404 });
  try {
    const sent = await resendSponsorship(id);
    await audit(session, "learner.youth.sponsorship_resend", { type: "learner", id: s.childStudentId ?? id, label: s.childFirstName }, { to: sent });
    return NextResponse.json({ ok: true, message: sent === "child" ? "Welcome email sent to the young person" : "Consent email sent to the parent (the child waits for consent)" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not send" }, { status: 409 });
  }
}
