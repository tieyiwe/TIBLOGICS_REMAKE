import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/admin/audit";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { reviewsStaff } from "@/lib/reviews/admin";
import { createReview, DuplicateReviewError, listReviews, reviewCounts } from "@/lib/reviews/db";
import { sendNewReviewAlert } from "@/lib/reviews/emails";
import { StaffReviewBody, cleanReviewText } from "@/lib/reviews/validate";
import { REVIEW_STATUSES, logSafe, type ReviewStatus } from "@/lib/reviews/types";

export const dynamic = "force-dynamic";

// Staff: list reviews by status (contacts), and add a real review received
// elsewhere, by email or on LinkedIn (contacts:manage). An added review needs
// a note saying where it came from and the reviewer's agreement to publish;
// it lands as pending like any other, and its words are never edited.

export async function GET(req: NextRequest) {
  const { error } = await reviewsStaff("view");
  if (error) return error;
  const s = req.nextUrl.searchParams.get("status") ?? "pending";
  const status: ReviewStatus = (REVIEW_STATUSES as readonly string[]).includes(s) ? (s as ReviewStatus) : "pending";
  const [reviews, counts] = await Promise.all([listReviews(status), reviewCounts()]);
  return NextResponse.json({ reviews, counts });
}

export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { session, error } = await reviewsStaff("manage");
  if (error) return error;
  if (!(await checkRateLimit(`admin-review-add:${session.user.email ?? "staff"}`, 30, 3_600_000))) {
    return NextResponse.json({ error: "Too many requests. Wait a moment." }, { status: 429 });
  }
  const parsed = StaffReviewBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    const msg =
      field === "consent" ? "Tick the box confirming the reviewer agreed to publication."
      : field === "staffNote" ? "Say where this review came from (at least 5 characters)."
      : field === "email" ? "Enter the reviewer's email address."
      : field === "rating" ? "Choose a rating from 1 to 5."
      : "Check the form and try again.";
    return NextResponse.json({ error: msg, field }, { status: 400 });
  }
  const b = parsed.data;
  const clean = cleanReviewText(b);
  if (!clean.ok) {
    const what = clean.field === "quote" ? "The review" : clean.field === "company" ? "The company" : clean.field === "role" ? "The role" : "The name";
    const msg =
      clean.code === "filtered" ? `${what} contains a link, contact details or a rude word. Reviews are published as written, so it cannot be added.`
      : clean.field === "quote" ? "The review must be 20 to 600 characters."
      : `${what} is missing or too long.`;
    return NextResponse.json({ error: msg, field: clean.field }, { status: 400 });
  }
  const review = { ...clean.data, rating: b.rating, source: b.source, locale: b.locale, email: b.email, consentPublish: true, addedByStaff: true, staffNote: b.staffNote };
  let id: string;
  try {
    id = await createReview(review);
  } catch (err) {
    if (err instanceof DuplicateReviewError) {
      return NextResponse.json({ error: "This person already has a review for this source." }, { status: 409 });
    }
    console.error("[POST /api/admin/reviews]", logSafe(err));
    return NextResponse.json({ error: "Could not save the review." }, { status: 500 });
  }
  await audit(session, "review.add", { type: "review", id, label: clean.data.name }, { source: b.source, note: b.staffNote });
  void sendNewReviewAlert(review).catch(() => {});
  return NextResponse.json({ ok: true, id });
}
