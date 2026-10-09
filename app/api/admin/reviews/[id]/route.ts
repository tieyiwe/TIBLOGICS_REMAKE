import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/admin/audit";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { actorLabel, reviewsStaff } from "@/lib/reviews/admin";
import { applyReviewAction, ReviewActionError } from "@/lib/reviews/db";
import { ActionBody } from "@/lib/reviews/validate";
import { logSafe } from "@/lib/reviews/types";

export const dynamic = "force-dynamic";

// Staff: approve, hide, feature or unfeature one review (contacts:manage).
// There is deliberately no way to change what the reviewer wrote.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { session, error } = await reviewsStaff("manage");
  if (error) return error;
  if (!(await checkRateLimit(`admin-review-act:${session.user.email ?? "staff"}`, 120, 600_000))) {
    return NextResponse.json({ error: "Too many requests. Wait a moment." }, { status: 429 });
  }
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  const parsed = ActionBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  try {
    const review = await applyReviewAction(id, parsed.data.action, actorLabel(session));
    await audit(session, `review.${parsed.data.action}`, { type: "review", id, label: review.name });
    return NextResponse.json({ ok: true, review });
  } catch (err) {
    if (err instanceof ReviewActionError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[POST /api/admin/reviews/[id]]", logSafe(err));
    return NextResponse.json({ error: "Could not update the review." }, { status: 500 });
  }
}
