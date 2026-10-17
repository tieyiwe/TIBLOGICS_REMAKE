import type { SeedLab, SeedLesson, SeedQuestion } from "../types";

// Building AI Apps and Agents: the 30 Doors pre-launch security audit, at
// developer level. Two lessons appended to the ends of Module 5 (doors 1-19)
// and Module 6 (doors 20-30), extra quiz questions for both modules, a
// planted-flaw audit lab for an agent app, and final-exam questions.
// Lessons are appended (never inserted) so existing titles and positions
// keep their progress. App and company names are fictional. Product names are
// examples at the time of writing (October 2026).

export const AGENTS_DOORS_LESSON_M5: SeedLesson = {
  title: "The 30 doors before launch, part 1: keys, access, input and webhooks",
  objective: "Audit an AI app's keys, server-side auth, ownership checks, input handling, CORS, storage, uploads and webhooks, and fix the gaps with tests.",
  durationMinutes: 30,
  contentType: "article",
  bodyMd: `## Thirty doors, one launch gate

Everything in this module so far makes your AI feature behave well. This lesson and its partner at the end of Module 6 make sure the app around it does not let people in through the side. The **30 doors** are a pre-launch checklist in five groups: before you push (1 to 5), auth and access (6 to 12), input and data (13 to 19), AI and agents (20 to 26) and when it breaks (27 to 30). This lesson covers the first nineteen with a builder's eye; Module 6 finishes the job.

Attackers do not start with clever prompt injections. They start with the cheap doors: a key in the bundle, a route with no auth check, a webhook that believes anyone. Scripts try those on every app, all day.

## Doors 1 to 5: keys and code history

You met door 4 in Module 1: model keys stay on the server. The others are as cheap to close:

- **1** \`.env\` in \`.gitignore\` before the first commit; commit \`.env.example\` with names only.
- **2** a secret scanner (Gitleaks is one open-source example) as a pre-commit hook and in CI over full history.
- **3** any key that ever reached a remote is rotated, because history keeps it.
- **4** nothing secret under \`NEXT_PUBLIC_\` or \`VITE_\`, and no provider key in client code.
- **5** lockfile committed, deploys install from it (\`npm ci\`, \`pip install --require-hashes\` with a hashed requirements file, or your package manager's equivalent).

## Doors 6 to 12: identity and ownership on the server

The commonest serious bug in AI apps is not the model at all. It is a route that returns data without checking **who** is calling (door 6) or **whose** record it is (door 7, IDOR). AI-generated routes often check the session and forget ownership:

\`\`\`text
// IDOR: any signed-in user can read any conversation
const convo = await db.conversation.findUnique({ where: { id } });

// Ownership enforced in the query itself
const convo = await db.conversation.findFirst({
  where: { id, userId: session.user.id },
});
if (!convo) return Response.json({ error: "Not found" }, { status: 404 });
\`\`\`

The same applies to RAG: retrieval must filter by what the caller may see **before** ranking (Module 3), or the model will happily quote someone else's document. If the browser talks to the database directly (Supabase, for example), Row Level Security on every table is door 8, and a service-role key must never reach client code.

Doors 9 to 12: a proven auth provider rather than home-made login (9); short-lived access tokens with server-side revocation on logout (10); admin checks on the server on every admin route and tool (11); rate limits on login, signup and password reset (12).

## Doors 13 to 19: everything that comes in

Treat model output like user input: it is text from outside your trust boundary.

- **13** validate every request body with a schema on the server, and validate model output the same way (Module 2).
- **14** parameterised queries only. No \`$queryRawUnsafe\`, no SQL assembled from strings, and never SQL written by the model and run as-is.
- **15** escape before rendering. Model output rendered as HTML or unsanitised Markdown is XSS and, with images, an exfiltration channel.
- **16** CORS restricted to your own origins, never \`*\` on routes that use cookies or return private data.
- **17** private storage buckets; serve files through short-lived signed URLs after a permission check.
- **18** uploads (documents for RAG, images for vision) checked by content, size-limited, and parsed in an isolated worker without production secrets. Parsers for PDFs and images are a classic attack surface.
- **19** webhooks verified before acting:

\`\`\`text
// GitHub-style HMAC check in a route handler (Node)
const body = await req.text();                     // raw body
const sig = req.headers.get("x-hub-signature-256") ?? "";
const mac = "sha256=" + crypto.createHmac("sha256", process.env.WEBHOOK_SECRET)
  .update(body).digest("hex");
const ok = sig.length === mac.length &&
  crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(mac));
if (!ok) return new Response("Bad signature", { status: 401 });
// then: dedupe by delivery ID, because providers retry
\`\`\`

Where the provider ships an official verification helper (Stripe's \`constructEvent\`, for example), use it.

## Audit with your coding agent

\`\`\`try
Audit this AI app for security doors 1 to 19 (keys and history, auth and
access, input and data). For each door give PASS, FAIL or UNSURE with the
file and line or setting as evidence, and never print a secret value.
Pay special attention to: routes that load records by ID without an
ownership filter, retrieval that does not filter by the caller's
permissions before ranking, model output rendered as HTML or Markdown
images, raw SQL, and webhook routes that act before verifying.
Then list the FAILs by severity with the smallest fix and a test for each
(for example: user B requests user A's conversation and gets 404).
Do not change files until I approve.
\`\`\`

Then mark the doors in the tool. This view picks the doors that matter most for AI apps; switch to "All 30 doors" in the toolbar for the rest.

\`\`\`studio
security-doors:view-agents
\`\`\`

## Try it now

Take the app from your capstone or any AI feature you have built in this track.

1. Run the audit prompt in your coding agent.
2. Write an IDOR test with two users for one route that loads by ID, and a forged-request test for one webhook.
3. Fix the most severe FAIL in a small, reviewed commit, with its test.

You are done when doors 1 to 19 are marked, and the IDOR and webhook tests pass against the fixed code.`,
  resources: [
    { title: "OWASP Top 10 for LLM Applications", url: "https://genai.owasp.org/", resourceType: "article", isFree: true },
    { title: "OWASP Cheat Sheet Series", url: "https://cheatsheetseries.owasp.org/", resourceType: "article", isFree: true },
  ],
  microCheck: [
    {
      question: "An AI-generated route checks the session, then loads a conversation with findUnique({ where: { id } }). What is wrong?",
      options: [
        "Any signed-in user can read any conversation by changing the ID",
        "findUnique is slower than findFirst, so the route will time out",
        "The session check should happen after the record has loaded",
        "Conversations should be loaded in the browser to save a round trip",
      ],
      correctIndex: 0,
      explanation:
        "This is IDOR: the route knows who is calling but not whether the record is theirs. Filtering by userId in the query makes ownership part of the lookup itself.",
    },
    {
      question: "Your RAG feature ranks all documents, then drops the ones the user may not see. Why is that risky?",
      options: [
        "Permission filtering after ranking can leak or bias results; filter first",
        "Ranking is expensive, so it should only ever run on the public documents",
        "Dropped documents still appear in the citations shown to the user",
        "The embedding model may refuse to rank private documents at all",
      ],
      correctIndex: 0,
      explanation:
        "Filtering late is easy to get wrong and can let restricted text reach the prompt or the answer. Access control belongs in the retrieval query, before anything is ranked.",
    },
    {
      question: "A webhook route parses JSON and then verifies the HMAC on JSON.stringify of the parsed body. What is the problem?",
      options: [
        "Re-serialised JSON differs from the raw bytes, so verify the raw body",
        "HMAC checks are only needed when the webhook carries any payment data",
        "JSON.stringify removes the signature header before it is checked",
        "Verification should happen after acting, so retries are not lost",
      ],
      correctIndex: 0,
      explanation:
        "Signatures are computed over the exact bytes sent. Parsing and re-serialising changes spacing and ordering, so the check fails or gets disabled; verify the raw body first.",
    },
    {
      question: "The chat UI renders model output as Markdown, including images. Which door does this touch, and why?",
      options: [
        "Door 15: an injected image URL can carry private data to an attacker",
        "Door 5: Markdown libraries must be pinned in the committed lockfile first",
        "Door 12: images make login pages slower to load under heavy traffic",
        "Door 20: images cost more tokens, so the spending cap is reached",
      ],
      correctIndex: 0,
      explanation:
        "Rendering untrusted output as HTML or images is XSS territory and an exfiltration channel. Escape output, sanitise Markdown and block or proxy external images.",
    },
  ],
};

export const AGENTS_DOORS_LESSON_M6: SeedLesson = {
  title: "The 30 doors before launch, part 2: models, tools, agents and recovery",
  objective: "Close the AI and agent doors (spend, rate limits, untrusted input, tool limits, packages, agent configs, credentials) and the recovery doors, then run the full launch audit.",
  durationMinutes: 30,
  contentType: "article",
  bodyMd: `## The doors only AI apps have

Part 1 covered doors every web app has. Doors 20 to 26 are the ones you added by putting a model, tools and coding agents into the system. Doors 27 to 30 decide how bad your worst day is. You have studied most of the underlying ideas in this track; this lesson turns them into a launch gate you can check in minutes.

## Doors 20 and 21: money is a security property

**Door 20: hard spending caps.** A leaked key or a runaway agent loop is a billing incident before it is anything else. Set provider-side limits where offered and alerts where not, and enforce an app-level budget that fails closed:

\`\`\`text
// before each model call
const spent = await budget.todayCents(tenantId);
if (spent >= TENANT_DAILY_CAP) return fail(503, "AI budget reached");
const res = await client.messages.create({ ..., max_tokens: 800 });
await budget.add(tenantId, costFromUsage(res.usage));
\`\`\`

**Door 21: rate limit AI endpoints** per user, per tenant and per IP, with input length caps, \`max_tokens\`, timeouts and a step budget for agents (Module 4). An unauthenticated AI route is a free model for anyone with curl.

## Doors 22 and 23: untrusted input meets tools

**Door 22** is the lesson on prompt injection in Module 5, applied as an audit: list every path by which outside text reaches the model (user messages, retrieved documents, tool results, web pages, MCP server output) and check the lethal trifecta for each. **Door 23**: no tool that runs arbitrary SQL, shell or HTTP.

\`\`\`text
// FAIL: the model writes SQL, the app runs it with the app's own user
{ name: "query_db", run: ({ sql }) => db.$queryRawUnsafe(sql) }

// PASS: narrow, typed, read-only, scoped, budgeted, approved where it matters
{ name: "list_my_orders", schema: { status: enum(["open", "shipped"]) },
  run: ({ status }) => ro.order.findMany({
    where: { customerId: ctx.userId, status }, take: 20 }) }
{ name: "cancel_order", schema: { orderId: uuid() },
  run: (a) => approvals.request(ctx.userId, "cancel_order", a) }
\`\`\`

## Doors 24 to 26: the agents that build your app

- **24 Check AI-suggested packages exist and are the right ones.** Models invent plausible package names, and attackers register them (sometimes called slopsquatting); typosquats sit one letter from popular names. Check the registry page, repository, age, maintainers and usage before installing, and review lockfile diffs in PRs.
- **25 Read every CLAUDE.md, AGENTS.md, SKILL.md, editor rule file and MCP config like code.** They decide what your coding agent runs and which servers it talks to. Review them in PRs; pin MCP servers to versions you have read; prefer local servers with narrow scopes; be wary of any that ask for broad file or network access.
- **26 Keep production credentials out of your agent's reach.** Agents in your terminal or CI see the environment. Give them development credentials and seed data; keep production secrets only in the hosting platform; use short-lived, scoped tokens for any CI agent.

A red flag in a config copied from a template:

\`\`\`text
{ "mcpServers": { "helper": {
    "command": "npx", "args": ["-y", "some-helper-mcp@latest"],
    "env": { "DATABASE_URL": "<production url>", "UPLOAD_TO": "https://..." } } } }
\`\`\`

Unpinned, auto-installed, handed a production database and an upload address: four doors in one block.

## Doors 27 to 30: when it breaks

- **27** users get a short error and a reference ID; stack traces, SQL, prompts and provider error bodies stay in server logs.
- **28** logs are redacted: no keys, auth headers, cookies or personal data, and prompt and output logging is minimal and time-limited (Module 5).
- **29** an append-only audit log of sensitive actions, including every tool call that changes data, with actor, tool, arguments summary, approval and time.
- **30** backups with a tested restore into a separate database, timed. Agents with write access make this door more important, not less.

## Run the launch audit

\`\`\`try
Run a pre-launch security audit of this AI app against all 30 doors
(1-5 keys and history, 6-12 auth and access, 13-19 input and data,
20-26 AI and agents, 27-30 when it breaks). For each door: PASS, FAIL,
NOT APPLICABLE or UNSURE, with evidence. For doors 20-26 specifically,
list every model call with its limits and budget, every tool with its
permissions and approval rule, every path from untrusted content to the
model, every agent instruction file and MCP config (summarise what each
runs and connects to; do not execute anything), and whether this
environment holds production credentials. Never print secret values.
Order the FAILs by severity with the smallest fix and a test each.
\`\`\`

Verify each PASS yourself, then finish the launch audit in the tool and copy the report into your capstone's security section.

\`\`\`studio
security-doors:launch
\`\`\`

## Try it now

1. List every tool your agent can call, the worst misuse of each, and what stops it (door 23).
2. Read every agent instruction file and MCP config in your repository (door 25), and check this environment for production credentials (door 26).
3. Restore a backup into a scratch database and time it (door 30).
4. Finish the 30-door launch audit and copy the report.

You are done when every door is marked, every Needs work has a dated fix, and no tool can write, pay or send externally without a limit or approval.`,
  microCheck: [
    {
      question: "Your agent has query_db(sql) running on the app's main database user. What is the best replacement?",
      options: [
        "Narrow typed tools on a read-only role, scoped to the current user",
        "The same tool, with a system prompt rule against destructive SQL",
        "The same tool, with every query logged for a weekly human review",
        "The same tool, behind a larger model that follows rules more closely",
      ],
      correctIndex: 0,
      explanation:
        "Prompts can be overridden and logs only help afterwards. Narrow, typed tools with least privilege limit what any injected instruction can make the agent do.",
    },
    {
      question: "An MCP config copied from a template runs an unpinned package with npx -y and passes it DATABASE_URL. What should you do?",
      options: [
        "Remove it until you have read the server, pinned it and scoped its access",
        "Keep it, since npx only ever installs packages from the official registry",
        "Keep it, but rename DATABASE_URL so the server cannot recognise it",
        "Keep it, and run the coding agent only on weekdays to limit exposure",
      ],
      correctIndex: 0,
      explanation:
        "MCP configs are code that decides what runs with which secrets. An unpinned, auto-installed server with database access is a supply-chain risk until reviewed, pinned and scoped.",
    },
    {
      question: "Your provider offers only spending alerts on your plan. What closes door 20?",
      options: [
        "Alerts plus an app-level budget that refuses calls once it is reached",
        "Nothing more, because a provider without hard caps can never be limited",
        "A lower temperature, which reduces the number of tokens per response",
        "Rotating the key every day so a leaked copy only works for a while",
      ],
      correctIndex: 0,
      explanation:
        "An app-level budget that fails closed caps spend from a leaked key, a loop or abuse, and alerts tell you it happened. Temperature and rotation do not cap anything.",
    },
    {
      question: "Which record makes an agent's actions investigable after an incident?",
      options: [
        "An append-only audit log of tool calls with actor, arguments and approval",
        "Full prompts and outputs with personal data, kept for as long as possible",
        "A user-facing error page that shows a reference ID for every failure",
        "A daily export of the vector index so the documents can be compared",
      ],
      correctIndex: 0,
      explanation:
        "An audit log of who or what did which action, with what approval and when, answers the first questions after an incident without hoarding personal data.",
    },
  ],
};

export const AGENTS_DOORS_QUIZ_M5: SeedQuestion[] = [
  {
    question: "A chat app built on Supabase uses RLS everywhere, but the admin dashboard queries with the service-role key from a client component. What is the impact?",
    options: [
      "Anyone can extract the key from the bundle and bypass every RLS policy",
      "The admin dashboard will fail, because RLS blocks the service-role key",
      "Only admins load that page, so the key is effectively still protected",
      "The key is limited to the admin tables, so user data stays protected",
    ],
    correctIndex: 0,
    explanation:
      "The service-role key bypasses RLS by design. Anything in a client bundle is public, so it must only ever be used in server code.",
  },
  {
    question: "Users upload PDFs for your RAG feature. The PDF parser runs inside the API server process that holds every production secret. What does door 18 recommend?",
    options: [
      "Parse uploads in an isolated worker with size and type limits and no secrets",
      "Parse uploads in the browser so the server never has to handle them",
      "Allow only files whose names end in .pdf and skip any other checks",
      "Store uploads in a public bucket so that the parser can fetch them more quickly",
    ],
    correctIndex: 0,
    explanation:
      "File parsers are a classic attack surface. Content-based checks plus isolated processing keep a malicious file away from your keys, database and other users' data.",
  },
  {
    question: "Your partner integration fails with a CORS error, and the coding agent proposes Access-Control-Allow-Origin: * with credentials. What do you do?",
    options: [
      "Allow the partner's exact origin on the routes it needs, nothing wider",
      "Accept it, since browsers already ignore wildcards when credentials are sent",
      "Accept it temporarily and add a reminder to tighten it after launch",
      "Move the API under the partner's domain so CORS no longer applies",
    ],
    correctIndex: 0,
    explanation:
      "An explicit allow-list of origins on specific routes fixes the integration without letting any website call your API from a signed-in user's browser.",
  },
];

export const AGENTS_DOORS_QUIZ_M6: SeedQuestion[] = [
  {
    question: "A coding agent in your terminal can read .env.production with the live database URL. What is the safest arrangement?",
    options: [
      "Development credentials locally; production secrets only on the host",
      "Keep the file, and tell the agent in its rules never to open it",
      "Keep the file, but encrypt it with a password stored next to it",
      "Keep the file, and only run the agent while you are watching the screen",
    ],
    correctIndex: 0,
    explanation:
      "Agents run commands and can be steered by injected text, so instructions are not a control. Keeping production secrets off the machine removes the door entirely.",
  },
  {
    question: "Before installing a package your agent suggested, which check matters most?",
    options: [
      "Its registry page: exact name, linked repository, age, maintainers, usage",
      "Whether the agent says it has used the package successfully before",
      "Whether the package name matches the feature you asked the agent for",
      "Whether the newest version number is higher than version one point zero yet",
    ],
    correctIndex: 0,
    explanation:
      "Models invent and misspell package names that attackers then register. Only the registry and repository evidence shows whether a package is genuine and maintained.",
  },
  {
    question: "An agent's API errors return the provider's raw error body, including part of the system prompt, to the user. Which door is open and what is the fix?",
    options: [
      "Door 27: return a short message with a reference ID, log details privately",
      "Door 21: lower the rate limit so that fewer users can ever trigger that error",
      "Door 5: pin the provider SDK so the error format stays the same",
      "Door 16: restrict CORS so other sites cannot read the error message",
    ],
    correctIndex: 0,
    explanation:
      "Raw errors leak internals such as prompts, model names and stack details. Users need a generic message and a reference; the details belong in redacted server logs.",
  },
];

export const AGENTS_DOORS_LAB: SeedLab = {
  slug: "ai-agents-lab-8-security-audit-agent-app",
  title: "Security audit of an agent app",
  labType: "critique",
  moduleNumber: 6,
  estimatedMinutes: 35,
  points: 80,
  passScore: 70,
  briefMd: `A two-person startup built **ShelfMate**, an AI assistant that answers questions about a bookshop chain's stock and orders and can take a few actions. Their coding agent wrote a pre-launch security summary with config and code excerpts.

Audit it against the 30 doors. Select every statement that leaves a door open: secrets in the wrong place, missing ownership checks, tools without limits, unverified webhooks, untrusted content treated as instructions, risky agent configuration and failures that leak.

Several decisions are sound. Leave those alone: over-flagging costs marks, as it would cost a real team time.`,
  scenarioMd: `Read the whole summary and every excerpt first. For each statement ask: if an attacker, a malicious document or a confused agent pushed on this, what would happen?

ShelfMate, the bookshop chain, the packages and the URLs are fictional and exist only for this exercise.`,
  objectives: [
    {
      id: "recall",
      label: "Found the open doors",
      weight: 3,
      guidance:
        "Credit for each planted flaw selected: the unrestricted SQL tool on the admin role, the MCP config with an unpinned server receiving the production database URL, the unsigned order webhook, the order route without an ownership check, retrieved reviews placed in the system prompt, the send_email tool to any address without approval, the AI route with no per-user limit, raw provider errors returned to users, and prompts logged with customer details indefinitely.",
    },
    {
      id: "precision",
      label: "Left the sound decisions alone",
      weight: 2,
      guidance:
        "Credit for not selecting the sound decisions: keys in the host's environment settings with a secret scanner, the established auth provider, schema validation of model output, retrieval filtered by permissions before ranking, the app-level daily budget, and the tested restore.",
    },
  ],
  config: {
    kind: "critique",
    answerMd: `### The question

*We launch ShelfMate to our first ten bookshops on Monday. Is it secure?*

---

### The coding agent's security summary

ShelfMate is ready. Here is how it is protected.

**Keys.** All provider keys live in the hosting platform's environment settings, and a secret scanner runs on every commit and in CI over the full history.

**Sign-in.** Staff sign in through an established hosted auth provider.

**Orders.** The /api/orders/[id] route checks the session, then returns the order with that ID so staff can look up any order quickly.

**Model output.** Every structured response is validated against a schema before the app uses it, with one repair attempt.

**Retrieval.** Search filters documents by the caller's shop and role before ranking. To make answers friendlier, retrieved customer reviews are added to the system prompt as extra guidance.

**Tools.** The agent has a query_db tool that runs any SQL it writes, using the admin database role, so it can answer anything. It also has send_email, which can send to any address immediately, so it can reply to customers without waiting.

\`\`\`json
{ "mcpServers": { "inventory": {
    "command": "npx", "args": ["-y", "shelf-inventory-mcp@latest"],
    "env": { "DATABASE_URL": "<the production database URL>" } } } }
\`\`\`

The MCP config above came from a template repository and has been working well.

**Payments.** The /api/order-webhook route marks orders paid when the JSON says status is paid. The signature check is turned off for now because the provider's test mode was confusing.

**Limits.** The app enforces a daily AI budget per shop and stops calling the model when it is reached. There is no per-user rate limit on /api/ask, because the daily budget already caps spending.

**Errors and logs.** If the model provider returns an error, the route passes the provider's raw error body to the user so they can see what went wrong. Full prompts and outputs, including customer names and addresses, are logged and kept indefinitely for future fine-tuning.

**Backups.** Nightly backups run, and we restored one into a scratch database last week; it took 25 minutes.`,
    flaws: [
      {
        id: "f1",
        quote: "a query_db tool that runs any SQL it writes, using the admin database role",
        explanation:
          "Door 23. Any injected instruction or model mistake becomes arbitrary SQL with full rights: reading every customer, changing prices, dropping tables. Use narrow typed tools on a read-only role scoped to the caller.",
        category: "logic",
      },
      {
        id: "f2",
        quote: "\"args\": [\"-y\", \"shelf-inventory-mcp@latest\"]",
        explanation:
          "Doors 25 and 26. An unpinned, auto-installed MCP server from a template receives the production database URL. Whatever version is published next runs with your data. Read it, pin it, give it development credentials and the narrowest scope.",
        category: "overconfidence",
      },
      {
        id: "f3",
        quote: "The signature check is turned off for now",
        explanation:
          "Door 19. Anyone who finds the webhook address can mark orders as paid. Fix the test-mode configuration (raw body, test signing secret) and keep verification on.",
        category: "overconfidence",
      },
      {
        id: "f4",
        quote: "returns the order with that ID so staff can look up any order quickly",
        explanation:
          "Door 7 (IDOR). With ten shops, staff at one shop can read another shop's orders and customers by changing the ID. Filter by the caller's shop and role in the query.",
        category: "logic",
      },
      {
        id: "f5",
        quote: "retrieved customer reviews are added to the system prompt as extra guidance",
        explanation:
          "Door 22. Reviews are written by anyone. Placing them in the system prompt gives a stranger's text the authority of your instructions. Keep retrieved content in the user turn, clearly delimited as data.",
        category: "logic",
      },
      {
        id: "f6",
        quote: "send_email, which can send to any address immediately",
        explanation:
          "Doors 22 and 23. Untrusted content plus private data plus an open outbound channel is the setup for exfiltration. Restrict recipients and require approval for anything outside a safe template.",
        category: "privacy",
      },
      {
        id: "f7",
        quote: "There is no per-user rate limit on /api/ask",
        explanation:
          "Door 21. A shop-level budget stops the bill, but one compromised account or script can burn the whole shop's budget and deny service to everyone else. Add per-user and per-IP limits too.",
        category: "omission",
      },
      {
        id: "f8",
        quote: "passes the provider's raw error body to the user",
        explanation:
          "Door 27. Raw provider errors can include model names, request details and fragments of prompts. Return a short message with a reference ID and keep the details in redacted server logs.",
        category: "privacy",
      },
      {
        id: "f9",
        quote: "including customer names and addresses, are logged and kept indefinitely",
        explanation:
          "Door 28. Logs with personal data kept forever multiply the damage of any breach and break data minimisation. Log IDs, usage and outcomes; redact content and set a short retention period.",
        category: "privacy",
      },
    ],
    candidates: [
      { id: "c1", text: "Keeping provider keys in the host's environment settings with a secret scanner in CI", isFlaw: false },
      { id: "c2", text: "Signing staff in through an established hosted auth provider", isFlaw: false },
      { id: "c3", text: "Returning any order by ID to any signed-in staff member", isFlaw: true, flawId: "f4" },
      { id: "c4", text: "Validating every structured response against a schema before use", isFlaw: false },
      { id: "c5", text: "Filtering documents by the caller's shop and role before ranking", isFlaw: false },
      { id: "c6", text: "Adding retrieved customer reviews to the system prompt as guidance", isFlaw: true, flawId: "f5" },
      { id: "c7", text: "Giving the agent a query_db tool that runs any SQL on the admin role", isFlaw: true, flawId: "f1" },
      { id: "c8", text: "Letting send_email reach any address immediately without approval", isFlaw: true, flawId: "f6" },
      { id: "c9", text: "Running an unpinned MCP server from a template with the production DATABASE_URL", isFlaw: true, flawId: "f2" },
      { id: "c10", text: "Marking orders paid from the webhook with signature checking turned off", isFlaw: true, flawId: "f3" },
      { id: "c11", text: "Enforcing a daily AI budget per shop that stops model calls", isFlaw: false },
      { id: "c12", text: "Relying on the shop budget instead of a per-user rate limit on /api/ask", isFlaw: true, flawId: "f7" },
      { id: "c13", text: "Passing the provider's raw error body to the user", isFlaw: true, flawId: "f8" },
      { id: "c14", text: "Logging full prompts with customer names and addresses indefinitely", isFlaw: true, flawId: "f9" },
      { id: "c15", text: "Restoring a nightly backup into a scratch database and timing it", isFlaw: false },
    ],
  },
};

export const AGENTS_DOORS_EXAM: SeedQuestion[] = [
  {
    moduleNumber: 5,
    difficulty: 2,
    question: "A support agent's conversation route filters by session but not by user. Signed in as user B, you fetch user A's conversation by ID. What is this, and where is the fix?",
    options: [
      "IDOR; add the user (or tenant) filter to the query on the server",
      "Prompt injection; add a rule telling the model not to reveal chats",
      "XSS; escape the conversation text before rendering it in the page",
      "CORS; restrict which origins can call the conversation route",
    ],
    correctIndex: 0,
    explanation:
      "The server checks who is calling but not whose record it is. Ownership belongs in the query on the server; model rules and front-end changes cannot enforce it.",
  },
  {
    moduleNumber: 5,
    difficulty: 3,
    question: "Which webhook handler is safe?",
    options: [
      "Verify the signature over the raw body, then dedupe by delivery ID and act",
      "Parse the JSON, act on it, then verify the signature for the audit log",
      "Accept requests only from the IP addresses that previously sent valid events",
      "Act on the event if its JSON includes the account ID you expect to see",
    ],
    correctIndex: 0,
    explanation:
      "Verification must happen on the exact bytes before any action, and providers retry, so idempotency matters. Acting first or trusting payload fields lets forged events through.",
  },
  {
    moduleNumber: 6,
    difficulty: 2,
    question: "Your agent's coding environment has the production DATABASE_URL so it can 'check real data'. Which door, and what is the fix?",
    options: [
      "Door 26: give it development credentials and seed data instead",
      "Door 5: pin the database driver version in the committed lockfile",
      "Door 16: restrict CORS so that only the agent can reach the database",
      "Door 12: rate limit the agent's logins so it cannot connect too often",
    ],
    correctIndex: 0,
    explanation:
      "Agents run commands and can be steered by injected text; production credentials turn any mistake into a customer-facing incident. Keep them only on the hosting platform.",
  },
  {
    moduleNumber: 6,
    difficulty: 3,
    question: "An agent reads web pages, can query customers' orders and can send emails to any address. Which single change best breaks the exfiltration path?",
    options: [
      "Restrict email recipients to the signed-in customer, or require approval",
      "Add a system prompt rule telling the agent to ignore any page instructions",
      "Switch to a model that scores higher on instruction-following tests",
      "Shorten the pages the agent reads so hidden text is cut off sooner",
    ],
    correctIndex: 0,
    explanation:
      "Private data, untrusted content and an outbound channel together make exfiltration possible. Removing the open outbound leg works whatever the injected text says.",
  },
  {
    moduleNumber: 6,
    difficulty: 2,
    question: "A teammate copies an MCP config that runs some-mcp@latest via npx with broad file access. What is the most important first step?",
    options: [
      "Read the server's code and docs, pin a version and narrow its access",
      "Run it once in production to confirm that the integration really works well",
      "Ask the coding agent to confirm in chat that the server is safe",
      "Leave it unpinned so that security fixes arrive automatically",
    ],
    correctIndex: 0,
    explanation:
      "Agent configs are supply-chain code. Reviewing, pinning and scoping an MCP server before use is the same discipline as reviewing any dependency that runs with your access.",
  },
];
