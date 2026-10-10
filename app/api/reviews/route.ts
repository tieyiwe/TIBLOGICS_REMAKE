import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { clientIp } from "@/lib/growth/acquire/security";
import { translatorFor } from "@/lib/i18n/server";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { verifyReviewToken } from "@/lib/reviews/token";
import { PublicReviewBody, cleanReviewText } from "@/lib/reviews/validate";
import { createReview, DuplicateReviewError } from "@/lib/reviews/db";
import { sendNewReviewAlert } from "@/lib/reviews/emails";
import { QUOTE_MAX, QUOTE_MIN, logSafe } from "@/lib/reviews/types";

export const dynamic = "force-dynamic";

// A review from the /review?t=TOKEN form. Public, but only with a signed,
// unexpired invitation (lib/reviews/token.ts): the reviewer's email and the
// source come from the token, never from the body. JSON from this site only,
// rate limited per network and per invitee, honeypot and minimum fill time
// (bots get a fake success, nothing is stored), the platform's free-text
// filter, one review per (email, source). Lands as "pending" for staff.

export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const locale: Locale = isLocale(raw?.locale) ? (raw!.locale as Locale) : "en";
  const t = translatorFor(locale);
  if (!(await checkRateLimit(`review-submit:${clientIp(req)}`, 12, 3_600_000))) {
    return NextResponse.json({ error: t("reviews.err.tooMany") }, { status: 429 });
  }
  const parsed = PublicReviewBody.safeParse(raw ?? {});
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    const key = field === "rating" ? "reviews.err.rating" : field === "token" ? "reviews.err.link" : "reviews.err.generic";
    return NextResponse.json({ error: t(key), field }, { status: 400 });
  }
  const b = parsed.data;
  if (b.website || (b.ts && Date.now() - b.ts < 3000)) {
    // Looks automated: answer like a success, store nothing.
    return NextResponse.json({ ok: true, published: b.consent });
  }
  const check = verifyReviewToken(b.token);
  if (!check.ok) return NextResponse.json({ error: t("reviews.err.link"), reason: check.reason }, { status: 410 });
  const { email, source } = check.claims;
  if (!(await checkRateLimit(`review-email:${email}`, 6, 3_600_000))) {
    return NextResponse.json({ error: t("reviews.err.tooMany") }, { status: 429 });
  }
  const clean = cleanReviewText({ name: b.name, role: b.role, company: b.company, quote: b.quote });
  if (!clean.ok) {
    const error =
      clean.field === "quote" && clean.code === "short" ? t("reviews.err.quoteShort", { min: QUOTE_MIN })
      : clean.field === "quote" && clean.code === "long" ? t("reviews.err.quoteLong", { max: QUOTE_MAX })
      : clean.code === "filtered" ? t("reviews.err.filtered", { field: t(`reviews.err.field.${clean.field}`) })
      : clean.field === "name" ? t("reviews.err.name")
      : clean.field === "role" ? t("reviews.err.role")
      : clean.field === "quote" ? t("reviews.err.quoteShort", { min: QUOTE_MIN })
      : t("reviews.err.generic");
    return NextResponse.json({ error, field: clean.field }, { status: 400 });
  }
  const review = { ...clean.data, rating: b.rating, source, locale, email, consentPublish: b.consent, addedByStaff: false, staffNote: null };
  try {
    await createReview(review);
  } catch (err) {
    if (err instanceof DuplicateReviewError) {
      return NextResponse.json({ error: t("reviews.already.title"), code: "duplicate" }, { status: 409 });
    }
    console.error("[POST /api/reviews]", logSafe(err));
    return NextResponse.json({ error: t("reviews.err.generic") }, { status: 500 });
  }
  void sendNewReviewAlert(review).catch((err) => console.error("[reviews] admin alert", logSafe(err)));
  return NextResponse.json({ ok: true, published: b.consent });
}
