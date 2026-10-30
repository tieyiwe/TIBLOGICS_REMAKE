import { redirect } from "next/navigation";
import { requireAdminPage } from "../_lib/admin-page-auth";
import { can } from "@/lib/admin/permissions";
import { listReviews, reviewCounts } from "@/lib/reviews/db";
import { REVIEWS_PERMISSION } from "@/lib/reviews/admin";
import { REVIEW_STATUSES, logSafe, type ReviewStatus } from "@/lib/reviews/types";
import ReviewsClient from "./ReviewsClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

// Reviews and testimonials (lib/reviews): approve, hide or feature real
// reviews, invite clients and learners, and add a review received elsewhere.
// Reading needs "contacts", changes need "contacts:manage" (the API checks).
export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireAdminPage();
  if (!can(session.user, REVIEWS_PERMISSION)) redirect("/admin_pro/no-access");
  const sp = await searchParams;
  const status: ReviewStatus = (REVIEW_STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as ReviewStatus) : "pending";
  const [reviews, counts] = await Promise.all([
    listReviews(status).catch((err) => {
      console.error("[admin/reviews page]", logSafe(err));
      return [];
    }),
    reviewCounts().catch(() => ({ pending: 0, approved: 0, hidden: 0 })),
  ]);
  return <ReviewsClient status={status} reviews={reviews} counts={counts} canManage={can(session.user, `${REVIEWS_PERMISSION}:manage`)} />;
}
