import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/admin/audit";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { reviewsStaff } from "@/lib/reviews/admin";
import { inviteToReview } from "@/lib/reviews/invites";
import { reviewLink } from "@/lib/reviews/emails";
import { claimInvite, reviewExists } from "@/lib/reviews/db";
import { InviteBody } from "@/lib/reviews/validate";

export const dynamic = "force-dynamic";

// Staff: invite a real client or learner to leave a review (contacts:manage).
//   send: true   emails the personal link, once per (email, source), ever
//   send: false  only returns the link, for staff to share another way
//                (WhatsApp, a message). Nothing is emailed; the invite is
//                still recorded, so no automatic invite follows later.
export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { session, error } = await reviewsStaff("manage");
  if (error) return error;
  if (!(await checkRateLimit(`admin-review-invite:${session.user.email ?? "staff"}`, 60, 3_600_000))) {
    return NextResponse.json({ error: "Too many invitations. Wait a moment." }, { status: 429 });
  }
  const parsed = InviteBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return NextResponse.json({ error: field === "email" ? "Enter a valid email address." : field === "name" ? "Enter the person's name." : "Check the form and try again.", field }, { status: 400 });
  }
  const b = parsed.data;
  const link = reviewLink(b);
  if (!b.send) {
    if (await reviewExists(b.email, b.source)) return NextResponse.json({ error: "This person has already left a review for this source." }, { status: 409 });
    await claimInvite({ ...b, via: "link", createdBy: session.user.email ?? null });
    await audit(session, "review.invite_link", { type: "review_invite", label: b.name }, { source: b.source });
    return NextResponse.json({ ok: true, link, sent: false });
  }
  const r = await inviteToReview({ ...b, via: "admin", createdBy: session.user.email ?? null });
  if (!r.sent) {
    const msg =
      r.reason === "already_reviewed" ? "This person has already left a review for this source."
      : r.reason === "already_invited" ? `Already invited${r.at ? ` on ${r.at.toISOString().slice(0, 10)}` : ""}. We never invite the same person twice; use "Copy invite link" to share the link another way.`
      : "The email could not be sent. Try again later.";
    return NextResponse.json({ error: msg, reason: r.reason }, { status: r.reason === "send_failed" ? 502 : 409 });
  }
  await audit(session, "review.invite", { type: "review_invite", label: b.name }, { source: b.source, locale: b.locale });
  return NextResponse.json({ ok: true, link, sent: true });
}
