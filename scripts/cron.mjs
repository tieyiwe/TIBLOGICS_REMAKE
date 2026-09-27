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
};

const secret = process.env.CRON_SECRET;
const base = (process.env.CRON_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

if (!secret) {
  console.error("CRON_SECRET is not set. Set it here and in the deployment's secrets, to the same value.");
  process.exit(2);
}
if (!base) {
  console.error("Set CRON_BASE_URL (or NEXT_PUBLIC_APP_URL) to the site's URL, e.g. https://tiblogics.com");
  process.exit(2);
}

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
      signal: AbortSignal.timeout(name === "news" ? 600_000 : 120_000),
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
