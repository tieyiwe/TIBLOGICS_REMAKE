// TIBLOGICS Learn — translation dictionary.
//
// English is fully populated. French keys are present but empty: `t()` falls
// back to English for any missing string, so shipping a partial translation
// degrades to English rather than to a blank screen or a raw key. Translators
// fill FR in place; no code changes are needed to enable it.
//
// The Student model already carries a `locale` column, and /api/learn/account
// accepts "en" | "fr", so switching a learner over is a data change.

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

type Dict = Record<string, string>;

const en: Dict = {
  // ── Navigation ──────────────────────────────────────────────────────────
  "nav.dashboard": "Dashboard",
  "nav.myTracks": "My tracks",
  "nav.certificates": "Certificates",
  "nav.account": "Account",
  "nav.signOut": "Sign out",
  "nav.signIn": "Sign in",
  "nav.signedInAs": "Signed in as",

  // ── Dashboard ───────────────────────────────────────────────────────────
  "dash.welcome": "Welcome",
  "dash.welcomeBack": "Welcome back",
  "dash.points": "Points",
  "dash.streak": "Streak",
  "dash.certificates": "Certificates",
  "dash.continueLearning": "Continue learning",
  "dash.startHere": "Start here",
  "dash.resume": "Resume",
  "dash.begin": "Begin",
  "dash.yourTracks": "Your tracks",
  "dash.noTracks": "No tracks are published yet. They'll appear here as soon as they open.",
  "dash.toNextLevel": "to next level",
  "dash.streakNone": "Finish a lesson today to start one.",
  "dash.streakBonusEarned": "Bonus earned — keep it going.",
  "dash.earnFirstCertificate": "Earn your first one.",
  "dash.certificatesPermanent": "Verifiable and permanent.",

  // ── Lessons ─────────────────────────────────────────────────────────────
  "lesson.objective": "By the end of this lesson:",
  "lesson.markComplete": "Mark complete",
  "lesson.completed": "Completed",
  "lesson.previous": "Previous",
  "lesson.next": "Next lesson",
  "lesson.backToTrack": "Back to track",
  "lesson.outline": "Track outline",
  "lesson.saving": "Saving…",
  "lesson.moduleFinished": "You've finished every lesson in this module.",
  "lesson.takeQuizToUnlock": "Take the module quiz to unlock the final exam.",

  // ── Practice It ─────────────────────────────────────────────────────────
  "practice.title": "Practice it",
  "practice.intro": "Reading about this isn't the same as doing it. Open these and try it yourself.",
  "practice.optional": "Optional — go deeper",
  "practice.free": "Free",
  "practice.paid": "Paid",

  // ── Assessments ─────────────────────────────────────────────────────────
  "check.title": "Quick check",
  "check.intro":
    "A couple of questions to make sure that landed. No pressure — you can retake it as many times as you like.",
  "check.start": "Start quick check",
  "check.submit": "Check my answers",
  "check.answerAll": "Answer every question",
  "check.tryDifferent": "Try a different set",
  "check.niceWork": "Nice work",
  "check.worthAnotherLook": "Worth another look",

  "quiz.title": "Module quiz",
  "quiz.questions": "Questions",
  "quiz.toPass": "To pass",
  "quiz.bestSoFar": "Your best so far",
  "quiz.noTimeLimit":
    "No time limit. Retake as often as you like — the questions are drawn from a larger bank, so you'll get a different set each time.",
  "quiz.start": "Start the quiz",
  "quiz.retakeForPractice": "Retake for practice",
  "quiz.submit": "Submit quiz",
  "quiz.scoring": "Scoring…",
  "quiz.passed": "Passed",
  "quiz.notYet": "Not quite yet",
  "quiz.answered": "answered",
  "quiz.tryFreshSet": "Try a fresh set",

  "exam.timeLimit": "Time limit",
  "exam.distinction": "Distinction",
  "exam.start": "Start the exam",
  "exam.resume": "Resume your exam",
  "exam.preparing": "Preparing…",
  "exam.submit": "Submit exam",
  "exam.submitting": "Submitting…",
  "exam.beforeYouBegin": "Before you begin",
  "exam.ruleClock": "The clock runs on our server. Closing this tab won't pause it.",
  "exam.ruleAutosave":
    "Every answer is saved the moment you pick it — a dropped connection won't cost you.",
  "exam.ruleNoZero":
    "If time runs out, we score what you've saved. You never get a zero for a technical failure.",
  "exam.extendedTime": "Accessibility mode is on, so you have 1.5× the standard time.",
  "exam.urgentWarning":
    "Under five minutes left. Your answers are already saved — if the clock runs out we'll score what you have.",
  "exam.timeExpired": "Time ran out, so we scored the answers you'd saved. Nothing was lost.",
  "exam.alreadyPassed": "You've already passed this exam.",
  "exam.passedWithDistinction": "Passed with Distinction",
  "exam.notThisTime": "Not this time",
  "exam.reviewAnswers": "Review every question and explanation",
  "exam.yourAttempts": "Your attempts",
  "exam.lockedTitle": "The final exam unlocks once you've passed the quiz in every module.",
  "exam.confirmSubmit": "Submit your exam? You can't change answers afterwards.",
  "exam.saved": "saved",
  "exam.saveFailed": "save failed — retrying on next answer",

  // ── Capstone ────────────────────────────────────────────────────────────
  "capstone.title": "Capstone project",
  "capstone.subtitle": "The last requirement. A person reads this and writes you real feedback.",
  "capstone.brief": "The brief",
  "capstone.howScored": "How it's scored",
  "capstone.criterion": "Criterion",
  "capstone.weight": "Weight",
  "capstone.submit": "Submit for review",
  "capstone.resubmit": "Resubmit for review",
  "capstone.linkLabel": "Link to your work",
  "capstone.notesLabel": "Notes for the reviewer",
  "capstone.reviewTime":
    "Reviews typically take up to 5 business days. You'll get an email when the status changes.",
  "capstone.statusSubmitted": "Submitted",
  "capstone.statusInReview": "In review",
  "capstone.statusRevisions": "Revisions requested",
  "capstone.statusPassed": "Passed",
  "capstone.statusFailed": "Not passed",
  "capstone.reviewerFeedback": "Reviewer feedback",
  "capstone.examFirst": "Pass the final exam before submitting",

  // ── Certificates ────────────────────────────────────────────────────────
  "cert.title": "Certificates",
  "cert.verified": "Verified — this is a genuine TIBLOGICS certificate",
  "cert.revoked": "Certificate revoked",
  "cert.notFound": "No certificate found",
  "cert.certifies": "This certifies that",
  "cert.hasCompleted": "has successfully completed",
  "cert.withDistinction": "With Distinction",
  "cert.issued": "Issued",
  "cert.verificationId": "Verification ID",
  "cert.addToLinkedIn": "Add to LinkedIn",
  "cert.saveAsPdf": "Save as PDF",
  "cert.copyLink": "Copy verification link",
  "cert.linkCopied": "Link copied",
  "cert.whatRequired": "What this certificate required",
  "cert.noneYet": "No certificates yet",

  // ── Progress gates ──────────────────────────────────────────────────────
  "gates.title": "Your path to the certificate",
  "gates.microChecks": "Quick checks attempted",
  "gates.quizzes": "All module quizzes passed",
  "gates.exam": "Final exam passed",
  "gates.capstone": "Capstone approved",
  "gates.allMet": "All requirements met — your certificate is being issued.",

  // ── Account ─────────────────────────────────────────────────────────────
  "account.title": "Account",
  "account.profile": "Profile",
  "account.nameOnCertificates": "Name on certificates",
  "account.email": "Email",
  "account.memberSince": "Member since",
  "account.preferences": "Preferences",
  "account.saved": "Saved",
  "account.accessibilityMode": "Accessibility mode",
  "account.accessibilityDesc":
    "Larger text, higher contrast, bigger tap targets, reduced motion — and 1.5× time on every timed exam. You can turn this on or off whenever you like; it applies to exams you start afterwards.",
  "account.leaderboard": "Show me on the leaderboard",
  "account.leaderboardDesc":
    "Off by default. Learning at your own pace shouldn't mean being ranked against strangers unless you want to be.",
  "account.subscription": "Subscription",
  "account.status": "Status",
  "account.plan": "Plan",
  "account.renews": "Renews",
  "account.accessUntil": "Access until",
  "account.manageBilling": "Manage billing",
  "account.willCancel":
    "Your subscription is set to cancel. Your certificates stay valid permanently.",

  // ── Billing ─────────────────────────────────────────────────────────────
  "billing.graceTitle": "We couldn't process your last payment.",
  "billing.graceBody": "You still have full access",
  "billing.updateCard": "Update payment method",
  "billing.everyTrack": "every track included",
  "billing.cancelAnytime": "Cancel anytime.",
  "billing.foundingRate": "Founding rate",
  "billing.bestValue": "Best value",
  "billing.secureCheckout": "Secure checkout. Cancel anytime from your account.",

  // ── Catalog ─────────────────────────────────────────────────────────────
  "catalog.allTracks": "All tracks",
  "catalog.comingSoon": "Coming soon",
  "catalog.viewTrack": "View track",
  "catalog.length": "Length",
  "catalog.content": "Content",
  "catalog.modules": "modules",
  "catalog.lessons": "lessons",
  "catalog.notSureWhereToStart": "Not sure where to start?",
  "catalog.findMyTrack": "Find my track",
  "catalog.recommended": "Recommended for you",
  "catalog.notifyMe": "Notify me",
  "catalog.waitlistJoined": "You're on the list — we'll email you when it opens.",
  "catalog.startLearning": "Start learning",
  "catalog.whatIncluded": "What every track includes",
  "catalog.outcomes": "What you'll be able to do",
  "catalog.about": "About this track",
  "catalog.whoFor": "Who it's for:",
  "catalog.curriculum": "Curriculum",
  "catalog.howAssessed": "How you're assessed",
  "catalog.questions": "Questions",
  "catalog.freePreview": "Free preview",

  // ── Auth ────────────────────────────────────────────────────────────────
  "auth.welcomeBack": "Welcome back",
  "auth.signInToContinue": "Sign in to continue your track.",
  "auth.createAccount": "Create your account",
  "auth.fullName": "Full name",
  "auth.nameOnCert": "This is the name printed on your certificate.",
  "auth.password": "Password",
  "auth.passwordHint": "At least 8 characters.",
  "auth.newHere": "New here?",
  "auth.alreadyHaveAccount": "Already have an account?",
  "auth.badCredentials": "That email and password don't match an account.",

  // ── Generic ─────────────────────────────────────────────────────────────
  "common.loading": "Loading…",
  "common.close": "Close",
  "common.startOver": "Start over",
  "common.somethingWrong": "Something went wrong",
  "common.tryAgain": "Try again",
};

// French — keys intentionally present and empty. t() falls back to English
// for anything blank, so a partial translation is safe to ship.
const fr: Dict = Object.fromEntries(Object.keys(en).map((k) => [k, ""]));

const DICTS: Record<Locale, Dict> = { en, fr };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Translate a key. Falls back to English, then to the key itself so a missing
 * string is visible in development rather than rendering as empty.
 *
 *   const t = translator(student.locale);
 *   t("dash.points")
 *   t("exam.attemptsLeft", { count: "2" })
 */
export function translator(locale: string | null | undefined) {
  const loc: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return (key: string, vars?: Record<string, string | number>): string => {
    const raw = DICTS[loc]?.[key] || DICTS[DEFAULT_LOCALE][key] || key;
    if (!vars) return raw;
    return Object.entries(vars).reduce(
      (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
      raw,
    );
  };
}

/** Coverage report — used by the admin console to show translation progress. */
export function localeCoverage(locale: Locale): { total: number; translated: number; percent: number } {
  const total = Object.keys(en).length;
  const translated = Object.values(DICTS[locale] ?? {}).filter((v) => v.trim() !== "").length;
  return { total, translated, percent: total === 0 ? 0 : Math.round((translated / total) * 100) };
}
