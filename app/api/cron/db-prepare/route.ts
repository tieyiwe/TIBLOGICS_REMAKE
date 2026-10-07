import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

// Creates every table, column and index the app makes at runtime, all at
// once. Used to bring a fresh or lagging DEVELOPMENT database level with
// production before publishing on Replit: Replit compares the two schemas and
// would otherwise offer to drop production tables that the dev database has
// never created. Every statement is CREATE/ALTER ... IF NOT EXISTS, so running
// it again (or against production) changes nothing.
//
//   npm run cron dbprep          (CRON_SECRET bearer, like the other jobs)

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const STEPS: Array<[string, () => Promise<unknown>]> = [
  ["lib/admin/audit", () => import("@/lib/admin/audit").then((m) => m.ensureAuditTable())],
  ["lib/admin/team/db", () => import("@/lib/admin/team/db").then((m) => m.ensureTeamAccessTables())],
  ["lib/growth/acquire/db", () => import("@/lib/growth/acquire/db").then((m) => m.ensureAcquireTables())],
  ["lib/growth/outreach/db", () => import("@/lib/growth/outreach/db").then((m) => m.ensureOutreachTables())],
  ["lib/growth/db", () => import("@/lib/growth/db").then((m) => m.ensureGrowthTables())],
  ["lib/ai-usage", () => import("@/lib/ai-usage").then((m) => m.ensureAiUsageTable())],
  ["lib/toolkit/db", () => import("@/lib/toolkit/db").then((m) => m.ensureToolkitTables())],
  ["lib/promotions/db", () => import("@/lib/promotions/db").then((m) => m.ensurePromotionTables())],
  ["lib/monitor/db", () => import("@/lib/monitor/db").then((m) => m.ensureMonitorTables())],
  ["lib/payments/sale-alert", () => import("@/lib/payments/sale-alert").then((m) => m.ensureSaleAlertTable())],
  ["lib/scanner/db", () => import("@/lib/scanner/db").then((m) => m.ensureScannerColumns())],
  ["lib/blueprint/db", () => import("@/lib/blueprint/db").then((m) => m.ensureBlueprintTables())],
  ["lib/learn/community/db", () => import("@/lib/learn/community/db").then((m) => m.ensureCommunityTables())],
  ["lib/learn/admin/learners", () => import("@/lib/learn/admin/learners").then((m) => m.ensureLearnerTables())],
  ["lib/learn/admin/columns", () => import("@/lib/learn/admin/columns").then((m) => m.ensureLearnEditColumns())],
  ["lib/learn/reminders/db", () => import("@/lib/learn/reminders/db").then((m) => m.ensureReminderTables())],
  ["lib/learn/referrals/db", () => import("@/lib/learn/referrals/db").then((m) => m.ensureReferralTables())],
  ["lib/learn/team/db", () => import("@/lib/learn/team/db").then((m) => m.ensureTeamTables())],
  ["lib/learn/logins", () => import("@/lib/learn/logins").then((m) => m.ensureLoginEventTable())],
  ["lib/learn/method/db", () => import("@/lib/learn/method/db").then((m) => m.ensureMethodTables())],
  ["lib/learn/skill-badges/db", () => import("@/lib/learn/skill-badges/db").then((m) => m.ensureSkillBadgeTables())],
  ["lib/learn/drafts/db", () => import("@/lib/learn/drafts/db").then((m) => m.ensureDraftTable())],
  ["lib/learn/account-status/db", () => import("@/lib/learn/account-status/db").then((m) => m.ensureAccountTables())],
  ["lib/learn/track-subscriptions", () => import("@/lib/learn/track-subscriptions").then((m) => m.ensureTrackSubscriptionTables())],
  ["lib/learn/quiz-session", () => import("@/lib/learn/quiz-session").then((m) => m.ensureQuizSessionTable())],
  ["lib/learn/purchases", () => import("@/lib/learn/purchases").then((m) => m.ensureTrackPurchaseTable())],
  ["lib/learn/scholarship/db", () => import("@/lib/learn/scholarship/db").then((m) => m.ensureScholarshipTables())],
  ["lib/learn/join/pending", () => import("@/lib/learn/join/pending").then((m) => m.ensurePendingEnrollmentTable())],
  ["lib/learn/leaderboard", () => import("@/lib/learn/leaderboard").then((m) => m.ensureLeaderboardColumn())],
  ["lib/learn/tutor/db", () => import("@/lib/learn/tutor/db").then((m) => m.ensureTutorTables())],
  ["lib/learn/live/db", () => import("@/lib/learn/live/db").then((m) => m.ensureLiveTables())],
  ["lib/learn/inbox/db", () => import("@/lib/learn/inbox/db").then((m) => m.ensureCommsTables())],
  ["lib/learn/inbox/notifications", () => import("@/lib/learn/inbox/notifications").then((m) => m.ensureNotificationTables())],
  ["lib/learn/support/db", () => import("@/lib/learn/support/db").then((m) => m.ensureSupportTables())],
  ["lib/learn/video/db", () => import("@/lib/learn/video/db").then((m) => m.ensureVideoTables())],
  ["lib/learn/recap", () => import("@/lib/learn/recap").then((m) => m.ensureRecapTable())],
  ["lib/learn/cert/ref", () => import("@/lib/learn/cert/ref").then((m) => m.ensureCertificateColumns())],
  ["lib/learn/mastery/db", () => import("@/lib/learn/mastery/db").then((m) => m.ensureMasteryTables())],
  ["lib/i18n/content", () => import("@/lib/i18n/content").then((m) => m.ensureTable())],
  ["lib/cache/public-data", () => import("@/lib/cache/public-data").then((m) => m.ensureTable())],
  ["lib/admin/command-center/db (pm)", () => import("@/lib/admin/command-center/db").then((m) => m.ensurePmTables())],
  ["lib/admin/command-center/db (finance)", () => import("@/lib/admin/command-center/db").then((m) => m.ensureFinanceTables())],
  ["lib/db/warm", () => import("@/lib/db/warm").then((m) => m.warmDatabase())],
];

function authorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || !got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function run(req: NextRequest) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  if (!authorised(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const results: Array<{ step: string; ok: boolean; error?: string }> = [];
  for (const [step, fn] of STEPS) {
    try {
      await fn();
      results.push({ step, ok: true });
    } catch (err) {
      results.push({ step, ok: false, error: err instanceof Error ? err.message.slice(0, 300) : String(err) });
    }
  }
  const failed = results.filter((r) => !r.ok);
  return NextResponse.json({ ok: failed.length === 0, steps: results.length, failed }, { status: failed.length ? 500 : 200 });
}

export const GET = run;
export const POST = run;
