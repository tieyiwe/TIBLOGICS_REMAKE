# TIBLOGICS platform: the 30 security doors

This is the same "30 doors" checklist we teach in the Learning Box, applied to
tiblogics.com itself. Each door has one of three statuses:

- **Done**: in place. The note says how, so you can check it.
- **Owner action needed**: the code side is done or not possible, and a
  setting only you can change is still needed. The exact steps are given.
- **Not applicable**: the door does not apply to how this platform is built.
  The note says why.

Last full audit: 2 October 2026.

## Summary

| # | Door | Status |
|---|------|--------|
| 1 | `.env` and secrets ignored by git | Done |
| 2 | Secret scanning | Done, plus Owner action (turn on GitHub secret scanning) |
| 3 | Key rotation plan | Owner action needed (nothing leaked, plan below) |
| 4 | No secrets in the browser code | Done |
| 5 | Lockfile, pinned versions, known vulnerabilities | Done, plus one planned upgrade |
| 6 | Every API route checks who is calling | Done |
| 7 | Nobody can open someone else's records (IDOR) | Done |
| 8 | Database row-level security (RLS) | Not applicable |
| 9 | Proven sign-in provider | Done |
| 10 | Sessions expire and can be revoked | Done |
| 11 | Admin checks happen on the server | Done |
| 12 | Rate limits on login, signup, reset and Google | Done, plus Owner check (client address) |
| 13 | Server-side validation of input | Done |
| 14 | No SQL built from user text | Done |
| 15 | No script injection (XSS) | Done |
| 16 | CORS locked down | Done |
| 17 | Private files are not public | Done |
| 18 | Uploads are limited and never executed | Done |
| 19 | Webhooks are verified | Done |
| 20 | AI spending caps | Done, plus Owner action (provider limits) |
| 21 | Rate limits on every AI feature | Done |
| 22 | Prompt injection: user text is treated as data | Done |
| 23 | AI output is never executed | Done |
| 24 | Packages are real and maintained | Done |
| 25 | Agent instructions and MCP configs are safe | Done |
| 26 | Production credentials out of agents' reach | Owner action needed |
| 27 | Errors do not reveal internals | Done |
| 28 | Logs do not hold secrets or personal data | Done |
| 29 | Audit trail of staff actions | Done |
| 30 | Backups and restore drills | Owner action needed |

Also covered: browser security headers (see the end of this page).

---

## Before you push

### Door 1: `.env` and secrets ignored. Done

`.gitignore` now ignores every `.env` variant (`.env`, `.env.local`,
`.env.production`...) except the template `.env.example`, plus key and
certificate files (`*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.crt`, `id_rsa*`,
service-account JSON files) and scratch files (`*.log`, `*.tmp`, `*.bak`,
`tmp/`, `scratch/`). Database dumps were already ignored. No secret file is
tracked in git today. The real secrets live only in Replit Secrets.

### Door 2: Secret scanning. Done, plus Owner action

What is in place:

- `.gitleaks.toml`: the scanner rules. It uses gitleaks' standard rules
  (Stripe, Anthropic, Google, GitHub, AWS, private keys, generic API keys) and
  adds rules for this project: Postgres URLs with a password, and real values
  for `NEXTAUTH_SECRET`, `CRON_SECRET`, `RESET_TOKEN`, `ADMIN_PASSWORD` and
  the SMTP passwords. The deliberately fake keys used in course lessons are
  on an allowlist by exact value.
- `.github/workflows/secret-scan.yml`: runs gitleaks on every push and pull
  request and fails the check if anything is found.
- `scripts/pre-commit`: an optional hook that scans your staged changes
  before each commit and refuses to commit any `.env` file. To install it on
  your computer:
  1. Install gitleaks (Mac: `brew install gitleaks`; others: download it from
     https://github.com/gitleaks/gitleaks/releases).
  2. In the project folder, run
     `cp scripts/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit`.

**History scan result (all 232 commits): no real secret has ever been
committed.** The scan found only placeholders and fake teaching examples:

| Type | Commit | File | Verdict |
|------|--------|------|---------|
| Stripe-style key `sk_live_9f2c…` (18 characters) | 443c1144b | lib/learn/seed/track-4/assessments.ts | Fake lesson example (a real key is far longer). No action. |
| Generic API key `sk-live-7d1f…` | 443c1144b | lib/learn/seed/track-4/assessments.ts | Fake lesson example. No action. |
| Generic API key `sk-live-4f9a…` | 4f1eba9ee | lib/learn/seed/track-agents/assessments.ts | Fake lesson example. No action. |
| Generic API key `sk_live_51Hx9...` (truncated) | fb5037651 | components/learn/studio/tools/risk/decks.ts | Fake lesson example. No action. |
| Postgres URL `postgres://user:password@host` | 443c1144b | lib/learn/seed/track-4/modules-4-6.ts | Placeholder. No action. |
| Postgres URL with `PASSWORD` placeholder | 18a15f3c6 | scripts/migrate-database.sh | Placeholder. No action. |
| `ADMIN_PASSWORD`, SMTP passwords, `DATABASE_URL` | daa03f137, 5bf5ea324 | .env.example | Placeholders ("your...", `[PASSWORD]`). No action. |

Searched for: `sk_live`, `sk_test`, `rk_live`, `whsec_`, `sk-ant-`, OpenAI
keys, `AIza`, Postgres URLs with passwords, `BEGIN PRIVATE KEY`, `ghp_` and
other GitHub tokens, Resend, Slack and AWS keys, and assigned values for the
project's own secrets.

**Owner action:** turn on GitHub's own secret scanning and push protection.
On GitHub, open the repository, then **Settings → Code security** (called
"Code security and analysis" on some accounts) and turn on **Secret
scanning** and **Push protection**. This blocks a push that contains a known
key format before it reaches GitHub at all.

### Door 3: Rotation plan. Owner action needed (only if a key ever leaks)

Nothing needs rotating today (see door 2). If a key is ever exposed (pushed to
git, pasted in a chat, shown in a screenshot or a log), **rotate it first and
clean up afterwards**: deleting the commit does not help, because copies
already exist.

| Secret | Where to rotate | Then |
|--------|----------------|------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → "Roll key" on the secret key | Paste the new key in Replit Secrets (Deployment) and republish. |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → your endpoint → "Roll secret" | Update the secret in Replit and republish. |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys → create a new key, then disable the old one | Update in Replit, republish, then delete the old key. |
| `GOOGLE_CLIENT_SECRET`, `GOOGLE_TTS_API_KEY` | console.cloud.google.com → APIs & Services → Credentials | Reset the secret or create a new key; restrict API keys to the APIs they need. |
| `NEXTAUTH_SECRET` | Generate a new random value (`openssl rand -base64 32`) | Update in Replit and republish. Everyone (staff and learners) is signed out once. |
| `CRON_SECRET` | Generate a new random value | Update it both in Replit Secrets and wherever the scheduled jobs are configured. |
| `ADMIN_PASSWORD` | Choose a new long password | Update in Replit, republish, then sign in to the admin with it. |
| `RESET_TOKEN` | Generate a new random value | Update in Replit. |
| `TITAN_SMTP_PASS`, `ARFA_SMTP_PASS` | Titan mail admin panel → change the mailbox password | Update in Replit. |
| `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` | Meta for Developers → your app → Settings → Basic (app secret) | Update in Replit. |
| `DATABASE_URL` password | Replit → Database pane → reset the password (or your Postgres provider's console) | Update `DATABASE_URL` and `DIRECT_URL`, republish. |

After rotating: check the service's logs for use of the old key during the
exposure window, and note the incident in your own records.

### Door 4: No secrets in the browser code. Done

A production build was made and every file the browser downloads
(`.next/static`, 7 MB) was searched for key formats (Stripe, Anthropic,
Google, GitHub, Postgres URLs, private keys) and for the actual values of the
test secrets. Nothing was found. The only secret *names* that appear are in
help text ("use the ADMIN_PASSWORD secret", "set GOOGLE_TTS_API_KEY"), with
no values. No client component reads a server environment variable: only
`NEXT_PUBLIC_*` values (the site URL and the Stripe publishable key, both
meant to be public) reach the browser.

### Door 5: Lockfile, pinned versions, vulnerabilities. Done, plus one planned upgrade

- `package-lock.json` is committed, so every install gets the same versions.
- The security-critical packages are now pinned to exact versions (no `^`):
  `next`, `next-auth`, `@prisma/client`, `prisma`, `stripe`,
  `@anthropic-ai/sdk`, `bcryptjs`, `zod`, `nodemailer`,
  `eslint-config-next`. They were pinned at the versions already installed,
  so nothing changed in what runs. Upgrade them on purpose, one at a time.
- `npm audit --omit=dev`: 1 high, 6 moderate, 0 critical.
  - **High, nodemailer 8.0.11**: the flaw needs the app to pass a message's
    `raw` option from user input. This app never uses `raw`, so it cannot be
    triggered here. The fix is nodemailer 10, a major version: plan it as its
    own change and test every email after.
  - **Moderate (6)**: all come from `@replit/object-storage` and the Google
    Cloud SDK it uses (`uuid`, `gaxios`, `teeny-request`, `retry-request`).
    No patch-level fix exists for most; they need an update of
    `@replit/object-storage` from Replit. Low risk: the app only uses it to
    store generated lesson videos.

---

## Auth and access

### Door 6: Every API route checks who is calling. Done

`npm run security:routes` (script `scripts/audit-api-routes.mjs`) reads every
API route and classifies each handler by the checks in its code. Result: 418
handlers in 301 files:

| Access | Handlers |
|--------|----------|
| Staff (admin, owner or collaborator with permission) | 255 |
| Learner (signed in; most also need a paid track) | 87 |
| Cron (Bearer `CRON_SECRET`) | 17 |
| Signed link or token (unsubscribe, invite, monitor, blueprint, download) | 17 |
| Webhook signature (Stripe, WhatsApp) | 2 |
| Public by design (forms, free tools, public pages, sign-up) | 40 |

Every public route is on a reviewed list with the reason, and every public
route that changes data is rate limited. The script fails (`--strict`) when a
new route appears that is neither guarded nor on the list.

Fixed during this audit:

- `/api/admin/setup` let anyone set the **owner password** on a database that
  had none stored yet (a fresh or restored database) even though
  `ADMIN_PASSWORD` was set. It now refuses whenever `ADMIN_PASSWORD` is set,
  always refuses in production, and is rate limited.
- `/api/admin/change-password` (the owner password) could be called by any
  staff member who knew it; now owner only.
- `/api/scanner-leads/[id]/email` let anyone with a lead id overwrite that
  lead's email and read the whole lead back. Now an email can only be added to
  a lead created in the last 6 hours that has none yet, and the reply is just
  `{ ok: true }`. (The scanner page was also calling a wrong address, so
  captured emails were never saved; fixed.)
- `/api/stripe/checkout` (appointment payment) is now rate limited.
- A non-owner admin could give a collaborator the `*` permission (everything),
  getting around "only the Owner grants admin". Permissions sent to the API
  are now checked: known shape only, and `*` only from the Owner.

### Door 7: Nobody can open someone else's records. Done

Spot-checked every learner route that takes an id: community threads and
posts (edit and delete check the author), inbox threads (looked up by id
**and** the signed-in learner), exam sessions (must belong to the learner),
team members (must be in the manager's own team), live sessions and cohorts
(track access checked). Purchased downloads use unguessable single-purpose
tokens. Staff routes are scoped by staff permission. The scanner-lead fix
above was the one IDOR found.

### Door 8: Row-level security. Not applicable

The database is only reached from the server, through Prisma, with one
database user. Browsers never talk to the database and never receive its
address or password (checked in door 4). Every access rule is enforced in
server code instead (doors 6 and 7). Optional extra: give the app a database
user that can read and write data but not drop tables, and keep the owner
user for migrations only.

### Door 9: Proven sign-in provider. Done

NextAuth (Auth.js) 4.24.15: email and password with bcrypt hashes, and Google
sign-in for learners. No home-made session or password code.

### Door 10: Sessions expire and can be revoked. Done

- **Learners**: 14 days, rolling (each visit extends it).
- **Staff** (owner, admins, collaborators): 12 hours from sign-in, not
  extended by activity. Change with `STAFF_SESSION_HOURS` if needed.
- **Deactivating, deleting or signing out a staff member** (Team & Roles,
  /admin_pro/team) ends their open sessions on their next request, and role
  or permission changes apply on the next request too: the proxy and the
  session check read the person's live access (cached for 3 seconds, dropped
  at once on every change; "Sign out everywhere" moves a session version).
- **Learner "sign out everywhere"** (admin action), **password reset**,
  suspension, block and deletion all invalidate existing learner sessions
  (session version). Verified in the code.

### Door 11: Admin checks on the server. Done

Every admin page is gated by the proxy (`proxy.ts`) **and** every admin API
route calls `requireAdmin` / `requirePermission` (or a stricter guard) on the
server: confirmed by the route audit (door 6). Learners share the sign-in
system but are explicitly refused by every staff guard.

### Door 12: Rate limits on login, signup, reset and Google. Done, plus Owner check

All limits use the shared database counter (they survive restarts and work
across instances):

| Action | Limit |
|--------|-------|
| Staff login | 10 tries per email per 15 min, **plus** 60 per address per 15 min (new) |
| Learner login | 10 tries per email per 15 min, plus 60 per address (new) |
| Google sign-in | 20 per Google account per 15 min (new) |
| Learner signup, one-page join | 5 per address per minute |
| Forgot password | 5 per address and 3 per email per hour (same answer for unknown emails) |
| Password reset with the emailed link | 10 per address per hour |
| Owner password recovery and setup | 5 per address per hour |
| Collaborator invite acceptance | 5 per address per 15 min |

**Owner check (5 minutes):** rate limits by address rely on the
`X-Forwarded-For` header that Replit adds. Confirm Replit replaces a value
sent by the visitor rather than adding to it:
1. From your computer run
   `curl -s -o /dev/null -w "%{http_code}\n" -X POST https://tiblogics.com/api/learn/auth/forgot -H "content-type: application/json" -H "X-Forwarded-For: 1.2.3.$RANDOM" -d '{"email":"test@example.com"}'`
   about 15 times in a row.
2. If it starts answering `429` (too many requests), the limits hold. If it
   never does, tell your developer: the address should then be read from the
   last entry of that header instead of the first.

---

## Input and data

### Door 13: Server-side validation. Done

State-changing routes validate input on the server (zod schemas or explicit
type and length checks). Fixed in this audit: anonymous analytics beacons and
the scanner could store JSON blobs of any size (now capped, helper
`lib/validate/json.ts`), the collaborator invite and edit APIs accepted any
permissions list (now validated), and several admin routes crashed on a
malformed body (now answer 400).

### Door 14: No SQL built from user text. Done

Every raw SQL call was reviewed (54). All use fixed SQL text or tagged
templates that send values as parameters. The only dynamic names are table
or column names from fixed lists in the code. No user text is ever inserted
into SQL.

### Door 15: No script injection (XSS). Done

Every `dangerouslySetInnerHTML` was traced to its source. Learner and inbox
messages are escaped before the small Markdown renderer; AI-written articles
go through `lib/ai-html.ts` (allowlist of tags, safe links only) and
translations through `lib/i18n/sanitize-html.ts`; the remaining uses are our
own translation strings, fixed CSS and JSON-LD.

Fixed in this audit: the admin news agent showed AI-written article titles
and headlines as HTML (a malicious news page could have planted script there);
the newsletter sign-up alert email inserted the visitor's name and "source"
into HTML without escaping. Both are escaped now.

Trusted by design: staff who can edit blog posts can write HTML in them. Only
give the blog permission to people you trust.

### Door 16: CORS. Done

No API route sends `Access-Control-Allow-Origin: *`. Only three public,
read-only files do, on purpose, so other sites can verify a badge: the badge
credential JSON, the badge image, and `/.well-known/did.json`.

### Door 17: Private files are not public. Done

`public/` holds only logos, covers, icons, the service worker and the offline
page. Paid downloads live in `private/downloads`, outside the public folder,
and are served only through `/api/shop/download/[token]` with a purchase
token, an expiry and a download count; the file path cannot escape that
folder. Lesson video files are being moved behind an entitlement check by the
video work in progress (see "for other areas" in the audit report).

### Door 18: Uploads. Done

There are no file uploads to the server. The three "upload" features (growth
leads CSV import, team invite CSV, lesson caption VTT files) read the file in
the browser and send its text as JSON, with server limits (2,000 rows; 200
invites and 20,000 characters; caption length limits). Nothing is saved to
disk or executed.

### Door 19: Webhooks verified. Done

Stripe: signature checked with `STRIPE_WEBHOOK_SECRET` on the raw body, and
refused when the secret is missing. WhatsApp: HMAC SHA-256 of the raw body
with `WHATSAPP_APP_SECRET`, compared in constant time; the subscription check
uses `WHATSAPP_VERIFY_TOKEN`. Command Center sync: Bearer token compared in
constant time. Cron jobs: Bearer `CRON_SECRET` only (never in the address).

---

## AI and agents

### Door 20: AI spending caps. Done, plus Owner action

New platform budget guard (`lib/ai-spend-guard.ts`), checked before every
Claude call:

| Spend (today or this month, whichever is higher) | What happens |
|------|--------------|
| Under 80% | Everything runs. |
| 80% | One alert email a day to `ADMIN_NOTIFY_EMAIL`. |
| 100% | Non-essential features pause with a friendly "temporarily unavailable": sales chat (Tibo), Advisor, cost estimate, practice pad, sandbox, tips, growth content, lead tasks, translations, admin drafting, video planning. |
| 150% (hard cap) | Everything pauses, including grading and the Tutor, until the next day or month. |

Essential (keeps running between 100% and 150%): grading, the Tutor and Code
Studio for paying learners, capstone review drafts, paid products already
bought (Automation Blueprint, Toolkit), and community moderation.

Settings (Replit Secrets): `AI_DAILY_BUDGET_USD` (default 25),
`AI_MONTHLY_BUDGET_USD` (default 400), optionally `AI_HARD_CAP_MULTIPLIER`
(1.5) and `AI_ALERT_AT` (0.8). Spend is estimated from list prices and shown
per feature at /admin_pro/ai-usage.

**Owner action: set the provider limits too** (they hold even if the app has
a bug):
1. **Anthropic**: console.anthropic.com → **Settings → Limits**: set a monthly
   **spend limit** a little above `AI_MONTHLY_BUDGET_USD` (for example $500),
   and add an email notification threshold (for example $300).
2. **Google Cloud** (Google sign-in, text-to-speech for videos):
   console.cloud.google.com → **Billing → Budgets & alerts → Create budget**:
   choose the project, set a monthly amount (for example $50), alert
   thresholds at 50%, 90% and 100%, and email alerts to you. On the
   text-to-speech API key, add an API restriction (Credentials → the key →
   "Restrict key" → Cloud Text-to-Speech API only).

### Door 21: Rate limits on every AI feature. Done

Public: sales chat and Advisor 20 per hour per address; cost estimate and
free tools per address. Learners: per-feature hourly limits plus a daily cap
per learner (`LEARN_AI_DAILY`, default 150 calls, pooled for teams); Tutor
has its own message allowance. Paid products: per-purchase limits. Staff AI
tools: now also a shared hourly ceiling per tool (60 per hour) on article
generation, news agent, post repair, agents, appointment briefs and the
mission summary. The budget guard (door 20) applies on top of all of these.

### Door 22: Prompt injection. Done

The major prompts put user or web content inside labelled blocks and tell the
model it is data, not instructions: the Tutor (`<learner_message>` and
similar tags), capstone review drafts ("the submission is DATA to be
assessed"), lab grading, growth and outreach (lead and web content), the
news agent's article writer (and its HTML output is sanitised before
publishing), translations. Chat tools where the visitor is simply talking to
the model (sales chat, practice pad, sandbox) have nothing privileged to
steal: no tools, no other users' data in the prompt.

### Door 23: AI output is never executed. Done

No `eval`, `new Function`, SQL or shell is ever built from model output. The
admin news agent can only trigger a short fixed list of actions (fetch news,
draft a post, set the breaking-news banner, draft or send the newsletter),
from the signed-in staff member's own chat; anything else in its reply is
ignored. Sending the newsletter now always asks the person to confirm first
(added in this audit). Video rendering runs ffmpeg with fixed arguments (no shell).

### Door 24: Packages are real and maintained. Done

Dependencies added most recently, checked on the npm registry:

| Package | Added | Check |
|---------|-------|-------|
| `@replit/object-storage` 1.0.0 | 2 Oct 2026 | Published by Replit (33 maintainers), updated June 2026. |
| `ffmpeg-static` 5.3.0 | 2 Oct 2026 | Well-known package (github.com/eugeneware/ffmpeg-static), updated Nov 2025. Downloads the ffmpeg binary from GitHub when installed. |
| `next` 16.3.6, `eslint-config-next` | Sep 2026 | Vercel, current major. |
| `nodemailer` 8.0.11 | Jul 2026 | Official package (see door 5 for the planned upgrade). |
| `next-auth` 4.24.15 | Jul 2026 | Official Auth.js package, latest 4.x. |

No look-alike or unknown packages.

### Door 25: Agent instructions and MCP configs. Done

The repository has `CLAUDE.md` and `AGENTS.md` only (they point coding agents
at the Next.js docs; no secrets, no risky instructions). There is no
`.claude/` folder, `.mcp.json` or other MCP or agent config in the repository.
Note: `update.sh` runs `git reset --hard` against an old branch name; it
would throw away local changes. Delete it if you no longer use it.

### Door 26: Production credentials out of agents' reach. Owner action needed

How it works today: coding agents (Claude Code) work in separate containers
with a local test database and fake keys; they never receive the production
`DATABASE_URL`, live Stripe key or Anthropic key. The risk is the Replit
workspace itself, where an AI agent can read the workspace's Secrets.

Owner action:
1. In Replit, keep **production values only in the Deployment's secrets**
   (Deployments → your deployment → Settings/Secrets) and **development values
   in the Workspace Secrets**: a Stripe **test** key (`sk_test_...`), a
   development database, and a separate Anthropic key with its own low spend
   limit.
2. Make sure the workspace `DATABASE_URL` points at the development database,
   not production. Use a separate production database (Replit's production
   database for the deployment).
3. Never paste a production key into an AI chat. If it happens, rotate it
   (door 3).
4. Give collaborators their own admin accounts (Settings → Team), never the
   owner password.

---

## When it breaks

### Door 27: Errors do not reveal internals. Done

Public and learner API routes answer with short generic messages ("Something
went wrong", "Registration failed") and log the details on the server only.
Routes that return a specific reason use deliberate, written messages
(validation errors, "already under review"). Raw error text is only returned
to staff and cron tools (database preparation reports), never to visitors.
Next.js production error pages show a generic message and a reference code,
not the stack trace.

### Door 28: Logs do not hold secrets or personal data. Done

Searched every log line for passwords, tokens, keys, emails, phone numbers and
request bodies. Fixed: the ARFA mail startup line printed the password length
(now just "set"); the Stripe webhook and event messaging printed full email
addresses (now masked, `j***@example.com`). New helper `lib/log/redact.ts`
(`maskEmail`, `maskPhone`, `redact` for objects) for future logging. Rate
limit keys store a keyed hash of addresses and emails, never the plain value.

### Door 29: Audit trail. Done

`/admin_pro/audit` records who did what and when. Team & Roles adds a staff
footprint (`/admin_pro/team/activity`): every staff sign-in and failed
attempt (device, /24 network, country when the host sends it), admin page
views (one per page per person per 10 minutes), every API change and export,
merged with the audit entries; CSV export for the owner and admins; email
alerts to `ADMIN_NOTIFY_EMAIL` for exports, learner deletions, access
changes, new-device sign-ins and 5+ failed staff sign-ins in 15 minutes; a
retention setting (default 12 months) applied daily by the teams job. Already recorded: learner
actions (suspend, block, delete, sign out everywhere, notes, exports),
communications, test access grants, certificate and capstone decisions,
product publishing, promotions. Added in this audit: collaborator invite,
edit (including activation, admin flag and permissions) and delete; owner
password change, recovery, setup and reset; "clear dev data"; order status
changes; team plan changes; and the learners CSV export. Audit entries never
store passwords, tokens or hashes.

### Door 30: Backups and restore drills. Owner action needed

Today: Replit's point-in-time recovery for the production database is on
(about 7 days back).

Owner action:
1. **Turn on scheduled backups**: Replit → your deployment's database →
   **Backups** → enable scheduled backups (daily), keeping at least 30 days.
   If your plan offers it, also keep a monthly copy outside Replit (for
   example a `pg_dump` saved to your own storage; dumps contain customer data,
   so store them encrypted and never in git).
2. **Quarterly restore drill** (about 30 minutes, put it in your calendar):
   1. Restore the latest backup **to a new database**, never over production
      (Replit → Database → Backups / point-in-time → restore to a new
      database). Copy its connection string.
   2. In the Replit Shell run:
      `npm run db:verify -- "postgresql://...the restored database..."`
      It connects read-only and prints whether every critical table is
      present, row counts, and the newest records (your restore point). It
      ends with PASS or FAIL.
   3. Optional: start a copy of the app against the restored database
      (`DATABASE_URL=<restored> npm run start` in a separate workspace) and
      check that you can sign in to the admin and open a learner record.
   4. Write down the date, how long the restore took and the restore point.
      Then delete the restored database.

---

## Browser security headers. Done

Sent on every page (checked with `curl -I`): `Strict-Transport-Security`
(2 years, subdomains, preload), `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
(no camera, microphone or location), `X-Frame-Options: SAMEORIGIN` and a
Content Security Policy with `frame-ancestors 'self'`, `object-src 'none'`,
`form-action 'self'`, allowing YouTube, Vimeo and Stripe frames. Known
limitation: the policy still allows inline scripts (`'unsafe-inline'`),
which Next.js needs without nonces; moving to nonces is a possible future
improvement.

## Re-running the checks

```
npm run security:routes          # every API route and its access check
npm run db:verify                # database health (or pass a restored copy)
gitleaks git . --config .gitleaks.toml --redact   # secret scan of history
npm audit --omit=dev             # known vulnerabilities in dependencies
```
