#!/usr/bin/env node
// Scheduled jobs runner.
//
// Why this exists: vercel.json declares the cron schedule, and this site is
// deployed on Replit, which ignores that file. Nothing was calling the news
// agent, the abandoned-cart reminders or the exam sweep at all.
//
// Run one job, or all the ones due:
//   node scripts/cron.mjs news
//   node scripts/cron.mjs carts
//   node scripts/cron.mjs exams
//   node scripts/cron.mjs monitor
//   node scripts/cron.mjs blueprints
//   node scripts/cron.mjs translate
//   node scripts/cron.mjs cohorts
//   node scripts/cron.mjs teams
//   node scripts/cron.mjs reminders
//   node scripts/cron.mjs live
//   node scripts/cron.mjs growth
//   node scripts/cron.mjs outreach
//   node scripts/cron.mjs comms
//   node scripts/cron.mjs all
//
// Needs two environment variables:
//   CRON_SECRET  — the same value the server has; every job endpoint requires it
//   CRON_BASE_URL (or NEXT_PUBLIC_APP_URL) — e.g. https://tiblogics.com
//
// Exits non-zero if any job fails, so a Replit Scheduled Deployment reports the
// failure rather than looking successful.

const JOBS = {
  // The route itself only publishes if 48h have passed, so calling it more
  // often is safe — it answers "not due yet" and does nothing.
  news: { path: "/api/blog/auto-refresh", suggested: "every 6 hours" },
  carts: { path: "/api/cron/cart-reminders", suggested: "hourly" },
  exams: { path: "/api/cron/exam-sweep", suggested: "every 15 minutes" },
  // Readiness Monitor rescans. Only subscribers whose week is up are scanned.
  monitor: { path: "/api/cron/monitor-scans", suggested: "hourly" },
  // Automation Blueprints whose first write-up did not finish.
  blueprints: { path: "/api/cron/blueprints", suggested: "every 15 minutes" },
  // French and Swahili pre-translation of courses, labs, prompts and articles.
  // Bounded per run (TRANSLATE_BATCH, default 20 model calls); free once done.
  translate: { path: "/api/cron/translate", suggested: "hourly" },
  // Learn community: cohort live-session reminders (24h before), weekly
  // "falling behind" nudges and discussion reply digests. Idempotent.
  cohorts: { path: "/api/cron/cohorts", suggested: "hourly" },
  // Team plans: weekly reminder emails for overdue track assignments.
  // Idempotent (each assignment at most once every 7 days).
  teams: { path: "/api/cron/teams", suggested: "daily" },
  // Study reminders (WhatsApp, or email for learners who chose only email) at
  // each learner's chosen local time. At most one a day, claimed before
  // sending; a no-op for WhatsApp until the WHATSAPP_* variables are set.
  reminders: { path: "/api/cron/reminders", suggested: "hourly" },
  // Live expert sessions: 24h and 1h reminders, "recording available"
  // emails. Idempotent (each send is claimed per learner before it goes out).
  live: { path: "/api/cron/live", suggested: "every 15 minutes" },
  // Growth content: publishes approved posts whose time has come (claimed
  // first, never double-posted; platforms without tokens become "ready to
  // post"), and drafts posts for new articles/tracks/products/events.
  growth: { path: "/api/cron/growth", suggested: "every 15 minutes" },
  // Growth outreach: drains the lead-enrichment queue and sends APPROVED,
  // due cold emails within the daily cap (OUTREACH_DAILY_CAP), sending hours
  // and suppression list. Each email is claimed before sending; idempotent.
  outreach: { path: "/api/cron/outreach", suggested: "every 15 minutes" },
  // Communications center: sends scheduled admin messages to learners
  // (email and in-app), within COMMS_HOURLY_CAP emails per hour (default
  // 300). Each recipient is claimed before sending; idempotent.
  comms: { path: "/api/cron/comms", suggested: "every 15 minutes" },
};

/**
 * Which deployment to drive.
 *
 * Resolved the same way next.config.js resolves NEXTAUTH_URL, so this needs no
 * variable of its own on a deployment that is already configured. CRON_BASE_URL
 * is only for pointing a run somewhere else, such as a local server.
 */
function resolveBase() {
  const explicit = process.env.CRON_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
  if (explicit) return explicit;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://tiblogics.com";
}

const secret = process.env.CRON_SECRET;
const base = resolveBase().replace(/\/$/, "");

if (!secret) {
  console.error(
    "CRON_SECRET is not set in this shell.\n" +
      "It is a Replit Secret, so add it to the Scheduled Deployment's secrets too —\n" +
      "the job endpoints return 503 without it rather than running unauthenticated.",
  );
  process.exit(2);
}

console.log(`Target: ${base}`);

const which = (process.argv[2] ?? "all").toLowerCase();
const names = which === "all" ? Object.keys(JOBS) : [which];

for (const name of names) {
  if (!JOBS[name]) {
    console.error(`Unknown job "${name}". Known jobs: ${Object.keys(JOBS).join(", ")}, all`);
    process.exit(2);
  }
}

let failed = 0;

for (const name of names) {
  const { path } = JOBS[name];
  const url = `${base}${path}`;
  const started = Date.now();
  try {
    // The secret goes in the header, not the query string, so it stays out of
    // access logs. Every job endpoint accepts both.
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${secret}` },
      // A news run generates several articles; give it room.
      signal: AbortSignal.timeout(name === "news" ? 600_000 : name === "monitor" || name === "blueprints" || name === "translate" || name === "growth" || name === "outreach" || name === "comms" ? 330_000 : 120_000),
    });
    const body = await res.text();
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    if (!res.ok) {
      failed++;
      console.error(`FAIL  ${name}  ${res.status} in ${secs}s  ${body.slice(0, 300)}`);
    } else {
      console.log(`OK    ${name}  in ${secs}s  ${body.slice(0, 300)}`);
    }
  } catch (err) {
    failed++;
    console.error(`FAIL  ${name}  ${err instanceof Error ? err.message : String(err)}`);
  }
}

process.exit(failed > 0 ? 1 : 0);
