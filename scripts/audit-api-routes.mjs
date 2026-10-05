#!/usr/bin/env node
// Security door 6: every /api route checks access appropriately.
//
// Lists every app/api/**/route.ts handler and classifies it by reading the
// code for the guards it calls:
//
//   staff     requireAdmin / requirePermission / growth, acquire, learner-staff
//             and toolkit guards, or a getServerSession check for staff flags
//   learner   requireStudent / requireEntitledStudent / getStudent / team or
//             tutor guards
//   cron      Bearer CRON_SECRET
//   webhook   Stripe constructEvent, WhatsApp HMAC, other signature checks
//   token     a signed or hashed token in the URL/body (unsubscribe links,
//             invites, password reset, monitor share links...)
//   public    none of the above: public by design or a finding
//
// Public handlers that change state (POST/PUT/PATCH/DELETE) must be rate
// limited; any listed under FINDINGS need a look. A route that is public by
// design is listed in PUBLIC_BY_DESIGN with the reason, so a new public route
// shows up here until someone has decided it should be public.
//
//   node scripts/audit-api-routes.mjs           table + findings
//   node scripts/audit-api-routes.mjs --json    machine-readable
//   node scripts/audit-api-routes.mjs --strict  exit 1 when there are findings

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const API = join(ROOT, "app/api");

const MARKERS = {
  staff: /\b(teamApi|requireAdmin|requirePermission|requireGrowth|requireGrowthAdmin|requireSender|requireAcquireAdmin|learnerStaff|requireToolkit|isGrowthAdmin|requireLearnerAdmin|requireStaff|promoAdmin|canViewAnalytics|canSee)\s*\(|session\??\.user\??\.(isAdmin|isOwner|collaboratorId)/,
  learner: /\b(requireStudent|requireEntitledStudent|getStudent|requireTeamMember|requireTeamManager|requireTeamOwner|tutorGuard|getLearnContext|communityGuard|liveGuard)\s*\(|session\??\.user\??\.studentId/,
  cron: /CRON_SECRET/,
  webhook: /constructEvent|x-hub-signature|createHmac\([^)]*\)[\s\S]{0,400}timingSafeEqual|verifyWebhook|verifySignature/,
  token: /\b(verifyUnsubscribeToken|verifyJwt|verifyCardSig|verifyDocument|secretEquals|tokenHash|hashToken|verifyToken|verifyInvite|unsubscribeToken|shareToken|findMonitorByToken)\b/,
};

const RATE = /\b(checkRateLimit|limitGrowthAi|teamRateLimit|withinDailyAiBudget|rateLimit[A-Z]\w*)\s*\(/;
const BODY = /\b(req|request)\.(json|formData|text)\(\)|jsonBody\(/;
const ZOD = /\bfrom "zod"|\.safeParse\(|\.parse\(/;

// Public on purpose. Prefix match on the route path.
const PUBLIC_BY_DESIGN = {
  "/api/auth/[...nextauth]": "NextAuth itself (rate limited per email inside lib/auth.ts)",
  "/api/i18n": "locale switch cookie",
  "/api/indexnow-key": "IndexNow key file (public by protocol)",
  "/api/blog": "public articles and cover images",
  "/api/badges": "public badge verification / Open Badges JSON",
  "/api/learn/certificates/verify": "public certificate verification",
  "/api/learn/catalog": "public catalog",
  "/api/events": "public event listings and registration (rate limited)",
  "/api/shop": "public store and checkout (rate limited, Stripe holds payment data)",
  "/api/newsletter": "newsletter signup (rate limited)",
  "/api/waitlist": "waitlist signup (rate limited)",
  "/api/contacts": "contact form (rate limited)",
  "/api/claude": "public sales chat / advisor (rate limited, AI budget guarded)",
  "/api/tools": "public free tools (rate limited)",
  "/api/scanner": "public website scanner (rate limited, SSRF-guarded)",
  "/api/analytics": "first-party page-view beacon (rate limited)",
  "/api/tool-usage": "anonymous tool usage counter (rate limited)",
  "/api/appointments": "public booking (rate limited)",
  "/api/service-requests": "public service request form (rate limited)",
  "/api/partnerships": "public partnership form (rate limited)",
  "/api/recommendations": "public recommendations quiz (rate limited)",
  "/api/acquire": "public lead-magnet capture (rate limited)",
  "/api/monitor": "public monitor signup / share links (rate limited)",
  "/api/learn/auth/signup": "learner signup (rate limited)",
  "/api/learn/auth/forgot": "password reset request (rate limited, same answer for unknown emails)",
  "/api/learn/auth/reset": "password reset with emailed single-use token (rate limited)",
  "/api/learn/join": "one-page join flow account step (rate limited)",
  "/api/learn/waitlist": "Learning Box waitlist (rate limited)",
  "/api/learn/team/pricing": "public team price list (read-only)",
  "/api/learn/comms/unsubscribe": "unsubscribe link (signed token, rate limited)",
  "/api/admin/collaborators/accept": "invite acceptance (single-use invite token, rate limited)",
  "/api/blueprint": "paid blueprint links (unguessable token, rate limited)",
  "/api/scanner-leads": "GET is staff (scanner leads list); POST answers 410 (the scanner saves server-side)",
  "/api/sessions/chat": "anonymous chat history keyed by an unguessable client session id (rate limited, bounded)",
  "/api/stripe/checkout": "appointment payment (amount must match the stored appointment; rate limited)",
  "/api/learn/checkout": "checkout start (rate limited)",
  "/api/promotions": "public banner / promo code check (rate limited)",
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name === "route.ts" || name === "route.tsx") out.push(p);
  }
  return out;
}

/** Split a route file into its exported handlers (each with its own body). */
function handlers(src) {
  const re = /export\s+(?:async\s+function\s+|const\s+)(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;
  const found = [];
  let m;
  while ((m = re.exec(src))) found.push({ method: m[1], start: m.index });
  return found.map((h, i) => ({ method: h.method, body: src.slice(h.start, found[i + 1]?.start ?? src.length) }));
}

function classify(text) {
  return Object.entries(MARKERS).filter(([, re]) => re.test(text)).map(([k]) => k);
}

const rows = [];
for (const file of walk(API).sort()) {
  const src = readFileSync(file, "utf8");
  const route = "/" + relative(join(ROOT, "app"), file).replace(/\/route\.tsx?$/, "");
  // Helpers defined in the file (outside the handler) count for every handler.
  const fileLevel = classify(src.replace(/export\s+(async\s+function|const)\s+(GET|POST|PUT|PATCH|DELETE)[\s\S]*/m, ""));
  for (const h of handlers(src)) {
    let kinds = [...new Set([...classify(h.body), ...fileLevel])];
    // A wrapper (`export const GET = withX(...)`) or a helper defined below the
    // handlers: fall back to the whole file.
    if (!kinds.length) kinds = classify(src);
    const designed = Object.keys(PUBLIC_BY_DESIGN).find((p) => route === p || route.startsWith(p + "/"));
    const mutating = !["GET", "HEAD", "OPTIONS"].includes(h.method);
    const rateLimited = RATE.test(h.body) || RATE.test(src);
    const parsesBody = BODY.test(h.body);
    const validated = ZOD.test(src);
    const finding = [];
    if (!kinds.length && !designed) finding.push("no auth check and not listed as public by design");
    if (!kinds.length && mutating && !rateLimited) finding.push("public state-changing handler without a rate limit");
    rows.push({
      route,
      method: h.method,
      access: kinds.length ? kinds.join("+") : "public",
      designed: designed ? PUBLIC_BY_DESIGN[designed] : "",
      rateLimited,
      parsesBody,
      validated,
      finding: finding.join("; "),
    });
  }
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  const count = {};
  for (const r of rows) count[r.access] = (count[r.access] ?? 0) + 1;
  console.log(`${rows.length} handlers in ${new Set(rows.map((r) => r.route)).size} route files`);
  console.log(Object.entries(count).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k.padEnd(22)} ${v}`).join("\n"));
  console.log("\nPublic handlers:");
  for (const r of rows.filter((r) => r.access === "public")) {
    console.log(`  ${r.method.padEnd(6)} ${r.route.padEnd(58)} ${r.rateLimited ? "rate-limited" : "NO LIMIT    "}  ${r.designed}`);
  }
  const unvalidated = rows.filter((r) => r.parsesBody && !r.validated && r.access === "public");
  console.log(`\nPublic handlers parsing a body without zod (${unvalidated.length}; manual checks may still exist):`);
  for (const r of unvalidated) console.log(`  ${r.method.padEnd(6)} ${r.route}`);
  const findings = rows.filter((r) => r.finding);
  console.log(`\nFINDINGS (${findings.length}):`);
  for (const r of findings) console.log(`  ${r.method.padEnd(6)} ${r.route}  — ${r.finding}`);
  if (process.argv.includes("--strict") && findings.length) process.exit(1);
}
