// Team plans: constants shared by the server and the client. No database here.
//
// Defaults the owner left to us. Each one can be changed without a deploy:
//   - seat price and minimum seats: Admin > Learn > Teams > Defaults (stored in
//     AdminSettings "learn.team.pricing"), else LEARN_TEAM_SEAT_PRICE_CENTS /
//     LEARN_TEAM_MIN_SEATS, else the values below;
//   - a team's own seat price: Admin > Learn > Teams > (team).

export const TEAM_PRODUCT = "learn-team";
export const TEAM_CURRENCY = "USD";
export const TEAM_DEFAULT_SEAT_PRICE_CENTS = 6900;
export const TEAM_DEFAULT_MIN_SEATS = 5;
export const TEAM_MAX_SEATS = 500;
/** Invitation links stay valid this long. */
export const TEAM_INVITE_DAYS = 14;
/** Same read-only grace as individual subscriptions. */
export const TEAM_GRACE_DAYS = 7;

export type TeamRole = "owner" | "manager" | "member";
export type TeamMemberStatus = "invited" | "active" | "removed";
/** pending: checkout started, not paid. comped: free seats from staff. */
export type TeamStatus = "pending" | "active" | "trialing" | "past_due" | "canceled" | "comped";

export const isManagerRole = (r: string | null | undefined) => r === "owner" || r === "manager";

/**
 * What a manager can and cannot see. Shown to members word for word and
 * enforced in lib/learn/team/report.ts, which only ever reads the sources in
 * SHARED (it never touches LearnerDraft, LessonReflection, Tutor*, LabAttempt
 * text, practice pad or portfolio content).
 */
export const SHARED = ["progress", "scores", "certificates", "studio", "review"] as const;
export const NEVER_SHARED = ["drafts", "reflections", "tutor", "practice"] as const;

/** Light email check for invites (the API re-validates with zod). */
export const EMAIL_RE = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;

/** Pulls email addresses out of pasted text or CSV (any separator, any column). */
export function parseEmailList(text: string): string[] {
  const out = new Set<string>();
  for (const raw of text.split(/[\s,;\t\r\n"'<>]+/)) {
    const e = raw.trim().toLowerCase();
    if (e && EMAIL_RE.test(e) && e.length <= 254) out.add(e);
  }
  return [...out];
}
