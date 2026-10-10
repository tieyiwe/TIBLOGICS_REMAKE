// Review invitations: by staff (/admin_pro/reviews), after a completed
// appointment, and in the ARFA certificate email. One per (email, source),
// ever: the claim is taken before sending and released if the email fails.
import { isLocale, type Locale } from "@/lib/i18n/config";
import { claimInvite, findInvite, releaseInvite, reviewExists } from "./db";
import { reviewLink, sendReviewInviteEmail } from "./emails";
import { logSafe, type ReviewSource } from "./types";

export type InviteResult =
  | { sent: true }
  | { sent: false; reason: "already_invited" | "already_reviewed" | "send_failed"; at?: Date };

/** Claims the invite for (email, source) and emails the link. */
export async function inviteToReview(i: { email: string; name: string; source: ReviewSource; locale: Locale; via: string; refId?: string | null; createdBy?: string | null }): Promise<InviteResult> {
  if (await reviewExists(i.email, i.source)) return { sent: false, reason: "already_reviewed" };
  if (!(await claimInvite(i))) {
    const prior = await findInvite(i.email, i.source);
    return { sent: false, reason: prior ? "already_invited" : "already_reviewed", at: prior?.createdAt };
  }
  try {
    await sendReviewInviteEmail(i);
    return { sent: true };
  } catch (err) {
    await releaseInvite(i.email, i.source);
    console.error("[reviews] invite email failed", logSafe(err));
    return { sent: false, reason: "send_failed" };
  }
}

/**
 * An appointment was just marked COMPLETED: invite the client once. Fire and
 * forget from the status change; never throws.
 */
export async function inviteAfterAppointment(a: { id: string; email: string; firstName: string; lastName: string }): Promise<void> {
  try {
    const name = `${a.firstName} ${a.lastName}`.trim() || a.firstName;
    // Appointments do not store a language; the booking site is English first.
    await inviteToReview({ email: a.email, name, source: "consultation", locale: "en", via: "appointment", refId: a.id });
  } catch (err) {
    console.error("[reviews] appointment invite", logSafe(err));
  }
}

/**
 * The "Tell us how it went" link for an ARFA certificate email, claimed now.
 * Null when this learner was already invited or already reviewed ARFA.
 * `release` gives the claim back if the certificate email is not sent.
 */
export async function claimArfaReviewLink(s: { email: string; name: string; locale: string | null; refId: string }): Promise<{ url: string; release: () => Promise<void> } | null> {
  try {
    const locale: Locale = isLocale(s.locale) ? s.locale : "en";
    const claimed = await claimInvite({ email: s.email, name: s.name, source: "arfa", locale, via: "certificate", refId: s.refId });
    if (!claimed) return null;
    return { url: reviewLink({ email: s.email, name: s.name, source: "arfa", locale }), release: () => releaseInvite(s.email, "arfa") };
  } catch (err) {
    console.error("[reviews] certificate review link", logSafe(err));
    return null;
  }
}
