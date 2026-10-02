import type { SeedLesson, SeedQuestion } from "../types";

// AI Systems Expert: the 30 Doors as an organisational launch gate for AI
// systems people commission or build. Appended to the end of Module 4
// ("Security and Failure Modes"); existing titles and positions unchanged.
// Product names are examples at the time of writing (October 2026).

export const T3_DOORS_LESSON: SeedLesson = {
  title: "The 30 doors: a launch gate for AI systems you commission",
  objective: "Turn a 30-door security checklist into a launch gate with owners and evidence, and use it to challenge teams and vendors building AI systems.",
  durationMinutes: 30,
  contentType: "article",
  bodyMd: `## Why a checklist belongs in an expert's toolkit

This module has covered injection, guardrails, incident response and red-teaming. Those are deep practices. But many AI incidents in organisations do not come from sophisticated attacks. They come from cheap, boring doors left open: a key in a browser bundle, an API route that does not check whose record it returns, an agent connected with an administrator account, a webhook that trusts anyone.

As more of your organisation's software is built quickly with AI, often by people who are not traditional developers, these doors multiply. A short, concrete checklist applied at the right moment catches them reliably. The **30 doors** are one such checklist, in five groups: before you push (keys and code history), auth and access, input and data, AI and agents, and when it breaks.

## The doors that matter most when you commission AI

You will rarely run the checks yourself. You need to know which doors to insist on and what evidence looks like. Seventeen doors apply to almost every AI system you commission:

| Doors | What you insist on | Evidence to ask for |
|---|---|---|
| 4 | No secret keys in code that runs in browsers | A search of the shipped bundle, not an assurance |
| 6, 7, 11 | Every request checks identity and ownership on the server; admin checks on the server | A test where user B tries user A's records and is refused |
| 12 | Rate limits on sign-in, sign-up and reset | The configured limits and a test result |
| 19 | Webhooks verify signatures | A forged request being rejected |
| 20, 21 | Spending caps and per-user limits on AI calls | Provider settings plus an app-level budget |
| 22, 23 | Untrusted content cannot drive consequential actions | A tool inventory with permissions and approval rules |
| 24, 25 | Dependencies, agent instruction files and MCP configs reviewed like code | Who reviewed them, and when |
| 26 | Coding agents never hold production credentials | How environments are separated |
| 27 to 30 | Generic errors, redacted logs, an audit trail, a tested restore | A restore drill with a measured time |

## Making it a gate, not a document

A checklist changes nothing unless it sits in the system at a point where it can stop things. Applying the systems thinking from Module 1:

- **Place it at the launch decision**, the leverage point, not after go-live. A door found before launch costs a change; after launch it may cost an incident.
- **Give each door an owner** in the delivering team and require **evidence**, not ticks. "Checked" means someone tried the handle.
- **Allow honest Needs work.** A gate that only accepts "all green" teaches people to tick boxes (Goodhart's law). Accept Needs work with a dated fix and a named risk owner, and block launch only for doors that expose personal data, money or admin power.
- **Feed findings back.** Doors that fail repeatedly point to a missing platform control (a shared auth library, a secrets manager, a default-private storage setting). Fix the structure, not just the instance.

## Use it with vendors

The same doors make good due-diligence questions. Each door in the tool carries a plain question to ask a developer or vendor. Two that separate mature suppliers quickly: "Show me the test where one customer tries to read another's data" and "When did you last restore a backup, and how long did it take?"

\`\`\`studio
security-doors:view-commission
\`\`\`

\`\`\`try
I am reviewing an AI system before launch: [DESCRIBE THE SYSTEM, ITS
USERS, DATA, TOOLS AND WHO BUILT IT]. Using a 30-door security
checklist (keys and history, auth and access, input and data, AI and
agents, when it breaks), draft a launch-gate template for my
organisation: for each door, the evidence the delivery team must
provide, the role that should own it, and whether an open door should
block launch or can launch with a dated fix. Keep it to one page.
\`\`\`

## Try it now

Choose one AI system your organisation is building or buying.

1. Work through the doors in the tool from the commissioner's side: for each, write the evidence you would ask for in the note.
2. Mark the doors you already have evidence for as Checked, and the rest as Needs work.
3. Turn the Needs work list into three questions for the delivery team's next review.

You are done when every door in the view is marked and you have sent or scheduled the three questions.`,
  microCheck: [
    {
      question: "A delivery team reports 'auth is handled' for a new AI assistant. What evidence best supports that claim?",
      options: [
        "A test where one user tries to read another user's records and fails",
        "A screenshot of the login page working correctly for the team lead",
        "A statement from the vendor that their product is secure by design",
        "A list of the AI models used and their published safety ratings",
      ],
      correctIndex: 0,
      explanation:
        "Login working says nothing about ownership checks. A cross-account test is direct evidence that the server enforces who can see which record.",
    },
    {
      question: "Your launch gate only accepts 'all doors green'. What is the likely side effect?",
      options: [
        "Teams tick boxes without testing, so the gate loses its meaning",
        "Teams launch faster, because the criteria are clear and simple",
        "Vendors offer discounts to meet the stricter launch standard",
        "The number of doors in the checklist steadily falls over time",
      ],
      correctIndex: 0,
      explanation:
        "When a measure becomes a target, people optimise the measure (Goodhart's law). Allowing honest Needs work with a dated fix keeps the gate truthful.",
    },
    {
      question: "The same door (secrets in front-end code) fails in three different teams' apps. What is the highest-leverage response?",
      options: [
        "Provide a shared platform control so the mistake is hard to make",
        "Add a fourth reminder about secrets to the launch checklist",
        "Ask each team to try harder and report back in a month",
        "Remove the door from the checklist since it keeps failing",
      ],
      correctIndex: 0,
      explanation:
        "Repeated failures point to the structure, not the people. A shared secrets setup or template changes the system so the right thing is the easy thing.",
    },
    {
      question: "Where should the 30-door review sit in the delivery process?",
      options: [
        "At the launch decision, where an open door can still stop release",
        "Six months after launch, once real users have tested the system",
        "Only after an incident, to explain what went wrong to the board",
        "At the very start, before any requirements have been agreed",
      ],
      correctIndex: 0,
      explanation:
        "The launch decision is the leverage point: findings still change what ships. Afterwards they are incidents; before requirements there is nothing to check.",
    },
  ],
};

export const T3_DOORS_QUIZ: SeedQuestion[] = [
  {
    question: "A vendor's AI agent will be connected to your CRM. Which question most directly tests door 23 (limits on what the model can do)?",
    options: [
      "Which actions can it take alone, and which require human approval?",
      "Which large language model powers the agent, and in which region?",
      "How many customers already use the agent in your industry today?",
      "How often does the vendor release new features for the agent?",
    ],
    correctIndex: 0,
    explanation:
      "Door 23 is about bounding what a possibly manipulated model can do. The split between autonomous and approved actions is the control that matters.",
  },
  {
    question: "An internal team built an AI tool with a coding agent that had the production database URL in its environment. Which door, and why does it matter at scale?",
    options: [
      "Door 26: one wrong or injected command can reach real customer data",
      "Door 5: the production URL changes the versions of installed packages",
      "Door 16: the URL lets other websites call the internal tool's API",
      "Door 27: the URL will appear in error messages shown to customers",
    ],
    correctIndex: 0,
    explanation:
      "Coding agents run commands and can be steered by text they read. Keeping production credentials out of their reach is a structural control worth standardising.",
  },
];
