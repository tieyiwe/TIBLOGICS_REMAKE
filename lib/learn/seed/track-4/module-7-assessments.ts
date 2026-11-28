import type { SeedLab, SeedQuestion } from "../types";

// Vibe Coding Like a Software Engineer: Module 7 ("Ship Safe") labs and
// final-exam questions. The app, business and package names are fictional.

export const TRACK_4_MODULE_7_LABS: SeedLab[] = [
  {
    slug: "vibe-coding-lab-7-security-audit",
    title: "Security audit of a vibe-coded app",
    labType: "critique",
    moduleNumber: 7,
    estimatedMinutes: 35,
    points: 80,
    passScore: 70,
    briefMd: `A grooming salon owner built **PawPlan**, a booking app, with an AI coding agent over a few weekends. Before launch, she asked the agent: *"Is the app secure enough to launch?"* It replied with a confident launch summary and the key code.

Audit it with the 30 doors. Select every statement that leaves a door open: keys where they should not be, routes that do not check who is calling or whose record it is, input trusted as code, settings that let anyone in, AI features without limits, and failures that leak.

Some of what the agent did is genuinely right. Leave it alone: a reviewer who flags everything is as unhelpful as one who flags nothing, and it is scored that way. Keep the 30 Doors tool open beside you if it helps.`,
    scenarioMd: `Read the whole summary and every code excerpt first. Then go door by door and ask of each line: *what could a stranger do with this?*

PawPlan, the salon and every name in the code are fictional and exist only for this exercise.`,
    objectives: [
      {
        id: "recall",
        label: "Found the open doors",
        weight: 3,
        guidance:
          "Credit for each planted flaw selected: the AI key in the browser, the bookings route with no sign-in check, the booking lookup by ID with no ownership check, SQL built from the search text, the wildcard CORS, the unverified Stripe webhook, stack traces returned to users, the AI endpoint with no limits, the public pet-photos bucket, the model's unrestricted SQL tool and the tokens in the logs.",
      },
      {
        id: "precision",
        label: "Left the closed doors alone",
        weight: 2,
        guidance:
          "Credit for not selecting the sound decisions: .env in .gitignore with a secret scanner, the committed lockfile with npm ci, the established auth provider, the admin check on the server, schema validation on the booking form, React rendering notes as text, and the tested restore.",
      },
    ],
    config: {
      kind: "critique",
      answerMd: `### The question

*Is PawPlan secure enough to launch? Customers will book grooming slots, pay a deposit, upload a photo of their dog and ask the assistant questions.*

---

### The coding agent's launch summary

PawPlan is production-ready. Here is what I set up.

**Secrets.** The .env file is listed in .gitignore and a Gitleaks pre-commit hook scans every commit. The lockfile is committed and Vercel installs with npm ci.

**The assistant.** To keep it fast, the chat widget calls the AI provider straight from the browser using NEXT_PUBLIC_AI_KEY, so no server round trip is needed. The route /api/assistant has no rate limit, because customers will only ask a few questions each.

**Sign-in.** Login uses an established hosted auth provider, so passwords, resets and sessions are handled by them.

\`\`\`ts
// app/api/bookings/route.ts
export async function GET() {
  // The bookings page is only linked from the dashboard, so no session check is needed here.
  return Response.json(await prisma.booking.findMany());
}

// app/api/bookings/[id]/route.ts
export async function GET(req, { params }) {
  const session = await auth();
  if (!session) return new Response("Sign in", { status: 401 });
  const { id } = await params;
  return Response.json(await prisma.booking.findUnique({ where: { id } }));
}

// app/api/admin/bookings/[id]/route.ts
export async function DELETE(req, { params }) {
  const session = await auth();
  if (session?.user.role !== "admin") return new Response("Forbidden", { status: 403 });
  // ...delete the booking
}
\`\`\`

**Input.** The booking form is validated on the server with a Zod schema that rejects unknown fields. Customers' notes are shown in React as normal text, never as HTML. The salon search builds its query from the search box:

\`\`\`ts
const rows = await prisma.$queryRawUnsafe("SELECT * FROM salons WHERE town = '" + town + "'");
\`\`\`

**Other websites.** To stop CORS errors from the salon's partner sites, next.config.js sends Access-Control-Allow-Origin: * on every API route.

**Payments.** The /api/stripe-webhook route reads the JSON body and marks the booking paid when type is checkout.session.completed. Signature checking was removed because it kept failing locally.

**Photos.** Dog photos go to the pet-photos storage bucket, which is set to public so images load without signed URLs.

**The assistant's database access.** The assistant has one tool, run_sql, connected with the main database user, so it can answer any question about bookings.

**Errors and logs.** When a route throws, it returns the full error message and stack trace to the user so they can report bugs precisely. Every request is logged with its headers, including the Authorization header, to help with debugging.

**Backups.** The database host takes nightly backups, and last month I restored one into a separate test database to confirm it works.

Everything is ready for launch.`,
      flaws: [
        {
          id: "f1",
          quote: "calls the AI provider straight from the browser using NEXT_PUBLIC_AI_KEY",
          explanation:
            "Door 4. NEXT_PUBLIC_ variables are inlined into browser JavaScript, so any visitor can copy the key and spend the salon's money. Move the call to a server route that reads a server-only key, and rotate this one.",
          category: "privacy",
        },
        {
          id: "f2",
          quote: "no session check is needed here",
          explanation:
            "Door 6. Not linking a page does not lock its route. Anyone can call /api/bookings directly and download every customer's bookings. The route must check the session on the server and filter by the salon's account.",
          category: "logic",
        },
        {
          id: "f3",
          quote: "prisma.booking.findUnique({ where: { id } })",
          explanation:
            "Door 7 (IDOR). The route checks that someone is signed in, but not that the booking is theirs, so any customer can read any booking by changing the ID. Filter by the signed-in user, for example findFirst({ where: { id, customerId: session.user.id } }).",
          category: "logic",
        },
        {
          id: "f4",
          quote: "$queryRawUnsafe(\"SELECT * FROM salons WHERE town = '\" + town + \"'\")",
          explanation:
            "Door 14. Gluing the search text into SQL is injection waiting to happen: a quote mark and a few words can read or change other data. Use Prisma's normal query methods or the tagged $queryRaw with parameters.",
          category: "logic",
        },
        {
          id: "f5",
          quote: "sends Access-Control-Allow-Origin: * on every API route",
          explanation:
            "Door 16. A wildcard lets any website call the API from a visitor's browser. List the partner sites' domains explicitly, and only on the routes they actually need.",
          category: "overconfidence",
        },
        {
          id: "f6",
          quote: "Signature checking was removed because it kept failing locally",
          explanation:
            "Door 19. Without verifying Stripe's signature, anyone who finds the webhook address can mark bookings as paid. Local failures usually mean the raw body or the local signing secret is wrong; fix that and keep the check.",
          category: "overconfidence",
        },
        {
          id: "f7",
          quote: "returns the full error message and stack trace to the user",
          explanation:
            "Door 27. Stack traces reveal file paths, libraries, SQL and sometimes secrets. Return a short message with a reference ID and keep the details in private server logs.",
          category: "privacy",
        },
        {
          id: "f8",
          quote: "has no rate limit, because customers will only ask a few questions each",
          explanation:
            "Door 21 (and 20). Honest customers ask a few questions; a script asks thousands. Every call costs money, so the AI route needs sign-in, per-user limits, input and output caps, and a budget.",
          category: "overconfidence",
        },
        {
          id: "f9",
          quote: "set to public so images load without signed URLs",
          explanation:
            "Door 17. A public bucket lets anyone with or able to guess a link open customers' photos, which may show their homes or children. Keep it private and serve short-lived signed links after a permission check.",
          category: "privacy",
        },
        {
          id: "f10",
          quote: "one tool, run_sql, connected with the main database user",
          explanation:
            "Doors 22 and 23. A customer's message can steer the model, and this tool would then run any SQL with full rights: read every booking, change prices, drop tables. Replace it with narrow read-only tools scoped to the customer.",
          category: "logic",
        },
        {
          id: "f11",
          quote: "including the Authorization header",
          explanation:
            "Door 28. Logging Authorization headers writes live session tokens into every log viewer and log export. Redact headers, cookies, tokens and personal data; log the action, an ID and the outcome.",
          category: "privacy",
        },
      ],
      candidates: [
        { id: "c1", text: "Keeping .env in .gitignore with a Gitleaks pre-commit hook", isFlaw: false },
        { id: "c2", text: "Committing the lockfile and installing with npm ci on Vercel", isFlaw: false },
        { id: "c3", text: "Calling the AI provider from the browser with NEXT_PUBLIC_AI_KEY", isFlaw: true, flawId: "f1" },
        { id: "c4", text: "Leaving /api/assistant without a rate limit because customers ask little", isFlaw: true, flawId: "f8" },
        { id: "c5", text: "Using an established hosted auth provider for sign-in", isFlaw: false },
        { id: "c6", text: "Returning all bookings from /api/bookings without a session check", isFlaw: true, flawId: "f2" },
        { id: "c7", text: "Loading a booking by ID for any signed-in user without checking it is theirs", isFlaw: true, flawId: "f3" },
        { id: "c8", text: "Checking the admin role on the server before deleting a booking", isFlaw: false },
        { id: "c9", text: "Validating the booking form on the server with a Zod schema", isFlaw: false },
        { id: "c10", text: "Showing customers' notes in React as text, never as HTML", isFlaw: false },
        { id: "c11", text: "Building the salon search with $queryRawUnsafe and the town text", isFlaw: true, flawId: "f4" },
        { id: "c12", text: "Sending Access-Control-Allow-Origin: * on every API route", isFlaw: true, flawId: "f5" },
        { id: "c13", text: "Marking bookings paid from the webhook without checking Stripe's signature", isFlaw: true, flawId: "f6" },
        { id: "c14", text: "Keeping the pet-photos bucket public so images load without signed URLs", isFlaw: true, flawId: "f9" },
        { id: "c15", text: "Giving the assistant a run_sql tool on the main database user", isFlaw: true, flawId: "f10" },
        { id: "c16", text: "Returning the full error and stack trace to users when a route fails", isFlaw: true, flawId: "f7" },
        { id: "c17", text: "Logging every request's headers, including Authorization", isFlaw: true, flawId: "f11" },
        { id: "c18", text: "Restoring a nightly backup into a separate test database to prove it works", isFlaw: false },
      ],
    },
  },
  {
    slug: "vibe-coding-lab-8-your-app-security-report",
    title: "Your app's security report",
    labType: "workbench",
    moduleNumber: 7,
    estimatedMinutes: 60,
    points: 80,
    passScore: 70,
    briefMd: `Run the 30 doors on **your own app**: your capstone project, an app from an earlier lab, or any project you have built with AI. Use the 30 Doors tool to mark each door, then write the report below. You can paste the tool's copied report into the first field as a starting point.

This is the security section your capstone will need, so write it for a reviewer who has never seen your app. Be honest: a door marked Needs work with a clear plan scores better than a door marked Checked that you never tested. Never paste real keys, passwords or customer data into any field.`,
    scenarioMd: `If you have no app of your own yet, audit the PawPlan app from the previous lab as if you had to fix it, and say so in the first field.`,
    objectives: [
      {
        id: "coverage",
        label: "Audited all 30 doors with evidence",
        weight: 3,
        guidance:
          "Full credit when the summary covers all five groups (before you push, auth and access, input and data, AI and agents, when it breaks), gives a status for every door, and names how at least eight doors were actually tested (a command run, a request sent, a setting checked), not only what the AI said. Part credit when doors are listed without evidence, or a group is missing.",
      },
      {
        id: "fixes",
        label: "Fixed the most dangerous doors and proved it",
        weight: 3,
        guidance:
          "Full credit for at least three doors fixed during the audit, each with what was wrong, the change made (including the prompt given to the AI and what was reviewed or rejected) and a test that now passes, such as user B being refused user A's record or a fake webhook being rejected. Part credit for fixes without a test, or only one or two fixes.",
      },
      {
        id: "plan",
        label: "Honest plan for what is still open",
        weight: 2,
        guidance:
          "Full credit when every door still marked Needs work has a specific fix, an owner and a date, ordered by risk (doors that expose data, money or admin power first), and every Not applicable has a reason that holds up. Part credit for a generic list such as 'improve security later'.",
      },
      {
        id: "system",
        label: "Sees the app as a system",
        weight: 2,
        guidance:
          "Credit when the report links doors to the system map from Module 1: which data flows, integrations, people and AI components each open door affects, at least one knock-on effect (for example a leaked key leading to cost and data exposure), and which doors protect the highest-value parts of the system.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "summary",
          label: "1. The audit at a glance",
          prompt:
            "Name the app and its stack, then list all 30 doors grouped by the five groups with a status for each (Checked, Not applicable, Needs work). For at least eight doors, say how you tested them yourself. You can paste the report copied from the 30 Doors tool and add your evidence.",
          minWords: 150,
        },
        {
          id: "fixes",
          label: "2. Doors you fixed",
          prompt:
            "For at least three doors you fixed during this audit: what was open, the prompt you gave your AI assistant, what you checked or rejected in its change, and the test that now proves the door is closed.",
          minWords: 120,
        },
        {
          id: "open",
          label: "3. What is still open",
          prompt:
            "Every door still marked Needs work, in order of risk, with the fix, who will do it and by when. Then the reason for each Not applicable.",
          minWords: 60,
        },
        {
          id: "system",
          label: "4. The system view",
          prompt:
            "Using your system map from Module 1: which parts of the system (data, integrations, people, AI components) do the open doors expose, and what knock-on effects could one open door cause? Which doors protect the most valuable parts?",
          minWords: 60,
        },
      ],
    },
  },
];

// Final-exam questions for Module 7 (moduleNumber 7).
export const TRACK_4_MODULE_7_EXAM: SeedQuestion[] = [
  {
    moduleNumber: 7,
    difficulty: 1,
    question: "In the 30-door checklist, what does 'IDOR' describe?",
    options: [
      "Changing an ID in a request to reach another user's record",
      "Injecting SQL commands through a search box on a public page",
      "Running scripts in other people's browsers through user content",
      "Guessing passwords quickly because login has no rate limit",
    ],
    correctIndex: 0,
    explanation:
      "IDOR (insecure direct object reference) happens when the server checks that someone is logged in but not that the record belongs to them, so changing an ID exposes other users' data.",
  },
  {
    moduleNumber: 7,
    difficulty: 2,
    question: "A founder's app keeps its Stripe secret key in a server environment variable but logs every request header. Which door is open?",
    options: [
      "Logs contain secrets, since session tokens end up in every log line",
      "No secret keys in the frontend bundle, because headers reach browsers",
      "The lockfile is not committed, so headers change between deploys",
      "CORS allows every origin, because headers are visible to other sites",
    ],
    correctIndex: 0,
    explanation:
      "Authorization headers and cookies are live credentials. Logging them turns every log viewer into a leak, so logs should be redacted and record only the action, an ID and the outcome.",
  },
  {
    moduleNumber: 7,
    difficulty: 2,
    question: "Your AI feature summarises web pages users paste in, and can also email the summary to any address. What is the main risk?",
    options: [
      "A page with hidden instructions could make it email data to an attacker",
      "Summaries of long pages may be slightly shorter than users expect",
      "Users might paste pages written in a language that the model reads poorly",
      "The emails might land in spam folders if they are sent too often",
    ],
    correctIndex: 0,
    explanation:
      "Anything the model reads is untrusted (door 22), and a free-form email tool lets a steered model act on it (door 23). Restrict recipients to the user's own address or require approval.",
  },
  {
    moduleNumber: 7,
    difficulty: 2,
    question: "Your coding agent adds a package called 'nextjs-auth-helperz' to fix a login bug. What should you do before merging?",
    options: [
      "Check the official registry page: name, repository, age and usage",
      "Merge it, since the agent tested the change and the bug is fixed",
      "Pin it to its latest version so future updates cannot change it",
      "Run the app once more to confirm that the login bug is still fixed",
    ],
    correctIndex: 0,
    explanation:
      "AI tools can invent or misspell package names that attackers then register. Only checking the registry yourself shows whether the package is genuine and widely used before it runs.",
  },
  {
    moduleNumber: 7,
    difficulty: 3,
    question: "An app uses Supabase from the browser. RLS is on for all tables, but a new admin page calls a service-role key from client code. What is the consequence?",
    options: [
      "Anyone can read the key and bypass every RLS policy on every table",
      "Only admins can open the page, so the key is effectively protected",
      "RLS policies will block the key, so the admin page will stop working",
      "The key works only on the admin page, so other tables stay protected",
    ],
    correctIndex: 0,
    explanation:
      "A service-role key is designed to bypass Row Level Security. Shipped to the browser it is readable by anyone, so all the RLS work is undone; it belongs only in server code.",
  },
  {
    moduleNumber: 7,
    difficulty: 3,
    question: "Before launch you have time to fix only two open doors: public storage bucket of ID photos, or a missing audit log. Which order is right and why?",
    options: [
      "The bucket first: it exposes personal data now; the audit log helps later",
      "The audit log first: without it you cannot prove the bucket was misused",
      "Either order, because every door in the checklist carries equal weight",
      "Neither: launch first and fix both when the first users report issues",
    ],
    correctIndex: 0,
    explanation:
      "Prioritise doors that expose data, money or admin power today. A public bucket of ID photos is an active leak; an audit log matters for investigation and should follow soon after.",
  },
  {
    moduleNumber: 7,
    difficulty: 3,
    question: "Your agent's MCP config, copied from a template, connects a 'helper' server that receives your project files. What is the systems-level risk?",
    options: [
      "An outside service joins your supply chain and may receive code and secrets",
      "The agent will become slower because it waits for the helper's replies",
      "The helper server may suggest code in a style that differs from yours",
      "The config file will make the repository larger and slower to clone",
    ],
    correctIndex: 0,
    explanation:
      "MCP configs decide which servers your agent talks to and what they see. A connected outside server becomes part of your system; read it like code and remove anything you cannot vouch for.",
  },
  {
    moduleNumber: 7,
    difficulty: 1,
    question: "Which statement best sums up why the 30 doors matter more for vibe-coded apps?",
    options: [
      "AI makes building cheap, and it makes scanning for open doors cheap too",
      "AI-written code is always less secure than code that people write by hand",
      "Attackers only target apps that were built with AI coding tools",
      "Security checks are not needed once an AI has reviewed the code",
    ],
    correctIndex: 0,
    explanation:
      "The same tools that speed up building also speed up attacking, and AI optimises for code that runs rather than code that checks who is calling. Checking the doors closes that gap.",
  },
];
