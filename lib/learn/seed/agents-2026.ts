import type { SeedLesson, SeedResource } from "./types";

// Personal AI agents released in September 2026: Meta Muse and OpenAI's
// ChatGPT dots. Facts here were checked against launch coverage and the
// vendors' own pages at the time of writing (October 2026). Availability,
// plans and features of new products change quickly: lessons say so, and the
// resources point to the official pages.

export const AGENT_RESOURCES: SeedResource[] = [
  {
    title: "Meta Muse (web, iOS and Android)",
    url: "https://muse.ai",
    resourceType: "account_signup",
    isFree: true,
    notes: "Free tier available at the time of writing; a payment card is required even for the free tier. US and Canada only, adults 18+. Apps for iOS and Android are linked from this page.",
  },
  {
    title: "OpenAI: Introducing dots",
    url: "https://openai.com/index/introducing-dots/",
    resourceType: "article",
    isFree: true,
    notes: "OpenAI's announcement: what dots are, how approvals and Custom Rules work, and where they are available.",
  },
  {
    title: "OpenAI Help: Manage dots in ChatGPT workspaces",
    url: "https://help.openai.com/en/articles/20001554-manage-dots-in-chatgpt-workspaces",
    resourceType: "article",
    isFree: true,
    notes: "For Business and Enterprise workspaces: how admins enable dots and control app access.",
  },
  {
    title: "ChatGPT (where dots run)",
    url: "https://chatgpt.com",
    resourceType: "account_signup",
    isFree: false,
    notes: "At launch, dots are included in ChatGPT Pro and Business Premium (Enterprise with admin approval), not Free or Plus. Pro excludes the EEA, Switzerland and the UK. Check current plans.",
  },
];

/** AI-Forward Professional, Module 2 ("The Key AI Tools to Learn"). */
export const AGENTS_LESSON_PROFESSIONAL: SeedLesson = {
  title: "Personal AI agents: Meta Muse and ChatGPT dots",
  objective: "Decide which tasks to hand to a personal AI agent such as Meta Muse or ChatGPT dots, and set the approvals that keep you in control.",
  durationMinutes: 26,
  contentType: "article",
  resources: AGENT_RESOURCES,
  bodyMd: `## From answering to doing

Everything in this module so far answers you: you ask, it replies, you act. In September 2026 two large companies released something different: **personal AI agents** that take a goal and carry it out over minutes, hours or days, using websites and apps on your behalf.

- **Meta Muse** (released 8 September 2026) can book appointments, compare and buy things online, fill in forms and work through multi-step errands. It runs in its own isolated cloud computer (Meta calls it the Muse Secure VM), and a separate checker reviews what it tries to reach on the internet. Meta later added the ability to control apps on a Mac and gave each agent its own email address, so you can forward it messages.
- **ChatGPT dots** (released by OpenAI on 29 September 2026) are "always-on" agents. Each dot has its own cloud computer, can connect to thousands of apps you choose, keeps working in the background, and learns from your feedback. You can reach a dot in ChatGPT, Slack or Microsoft Teams.

At the time of writing (October 2026), Muse is available to adults in the US and Canada, with a free tier and paid plans. Dots come with ChatGPT Pro and Business Premium, not the free or Plus plans, and Pro is not offered in the EEA, Switzerland or the UK. New products change quickly: check the official pages in the resources below before you plan around them.

## What they are good for at work

An agent earns its place on tasks that are **multi-step, repetitive and checkable**, where you can say clearly what "done" looks like.

| Task | Why an agent fits | Your checkpoint |
|---|---|---|
| Collect three supplier quotes and put them in a table | Many websites, same steps each time | Review the table before you contact anyone |
| Prepare a weekly status report from your project tools | Reads several apps, same format each week | Read it before it is sent |
| Turn a recorded webinar into show notes and social captions | Long input, structured output | Edit the captions, check every claim |
| Chase unpaid invoices with a polite reminder draft | Spots the overdue ones, drafts the email | Approve each reminder before it goes |
| Book travel within a budget and your preferences | Compares options across sites | Approve before anything is paid |
| Watch a channel and summarise decisions each Friday | Runs in the background | Spot-check against the actual thread |

Poor fits: anything where a mistake is costly and hard to undo (signing contracts, sending money, posting publicly in your name), anything involving other people's confidential data your organisation has not approved for the tool, and judgement calls that are your professional responsibility.

## Keeping control: the habits that matter

Agents act, so the risks move from "a wrong answer" to "a wrong action". Five habits keep you safe:

1. **Start read-only.** Connect only the apps the task needs, and let the agent read before you ever let it write or send.
2. **Require approval for anything outward-facing.** Dots let you set Custom Rules to allow, require approval for, or block actions; Muse lets you set permissions and review an activity log. Use them: approval before sending, buying, booking or deleting.
3. **Write the brief like a manager.** Goal, constraints (budget, deadline, people not to contact), what done looks like, and when to stop and ask.
4. **Review the trail.** Read the activity log for the first few runs. You are checking the process, not only the result.
5. **Follow your workplace policy.** A personal agent connected to work email or files is a data decision. Ask before you connect anything that holds client or patient information.

## A brief that works

\`\`\`try
You are my assistant for [TASK, e.g. preparing next week's supplier comparison].
Goal: [WHAT DONE LOOKS LIKE, e.g. a table of 3 quotes for 200 branded notebooks, delivered by 15 November].
Constraints: budget under [AMOUNT]; only use [WEBSITES OR APPS]; do not contact any supplier or place an order.
Steps: search, collect price, delivery date and minimum order for each, note anything unclear.
Stop and ask me before you: send any message, enter payment details, create an account, or spend more than 30 minutes.
Output: the table, your sources, and a short list of what you could not confirm.
\`\`\`

Run this brief in the practice pad first to see how a model interprets it. Notice where it asks questions or makes assumptions: those are the gaps to fix before you give a real agent the job.

## Try it now

Pick one weekly task from your own job that is multi-step and checkable. Write a brief for it using the template above, including at least two "stop and ask me" rules. Then list which apps the agent would need, and mark each one read-only or write. You are done when you have a brief and a permissions list you would be comfortable handing to a new colleague.`,
  microCheck: [
    {
      question: "Which task is the best fit for a personal AI agent like ChatGPT dots or Meta Muse?",
      options: [
        "Collecting three supplier quotes into a table for you to review",
        "Signing a supplier contract once the best price has been found",
        "Deciding which employee should be promoted this quarter",
        "Sending payment to whichever supplier answers the quickest",
      ],
      correctIndex: 0,
      explanation: "Agents fit multi-step, repetitive, checkable work with a human checkpoint. Signing, paying and people decisions are costly or hard to undo, so they stay with you.",
    },
    {
      question: "What is the safest first setting when you connect an agent to your work apps?",
      options: [
        "Read-only access to just the apps the task needs",
        "Full access to every app, so it never gets blocked",
        "Write access everywhere, with a weekly review of the log",
        "No apps at all, and paste everything into the chat",
      ],
      correctIndex: 0,
      explanation: "Least privilege: connect only what the task needs and let it read before it can write or send. Full access widens the damage a single mistake can do.",
    },
    {
      question: "Your dot drafts invoice reminders. Which rule keeps you in control without slowing it down much?",
      options: [
        "Require your approval before any reminder is sent",
        "Let it send reminders but delete the activity log",
        "Block it from reading the invoicing app entirely",
        "Allow sending as long as the tone sounds polite",
      ],
      correctIndex: 0,
      explanation: "An approval step before outward-facing actions keeps the speed of drafting while a person decides what leaves the business. Tone alone is not a safety check.",
    },
    {
      question: "Why should you read an agent's activity log during its first few runs?",
      options: [
        "To check how it worked, not only what it produced",
        "Because agents cannot produce a usable final output",
        "To prove to your manager that you used the tool",
        "Because the log replaces the need for any approvals",
      ],
      correctIndex: 0,
      explanation: "A good-looking result can hide a bad process, such as visiting the wrong site or using data it should not. The log shows the route, so you can tighten the rules.",
    },
    {
      question: "At the time of writing, who could use ChatGPT dots at launch?",
      options: [
        "ChatGPT Pro and Business Premium users in eligible markets",
        "Anyone with a free ChatGPT account in any country",
        "Only ChatGPT Plus users in the European Economic Area",
        "Only developers using the OpenAI API with their own key",
      ],
      correctIndex: 0,
      explanation: "At launch dots came with Pro and Business Premium (Enterprise with admin approval), not Free or Plus, and Pro excluded the EEA, Switzerland and the UK. Plans change, so check the official page.",
    },
  ],
};

/** AI for Small Business, Module 4 ("Admin and Operations on Autopilot"). */
export const AGENTS_LESSON_SMB: SeedLesson = {
  title: "Agents that run errands for your business: Muse and dots",
  objective: "Choose two errands in your business to hand to a personal AI agent, and write the rules that keep money, customers and data safe.",
  durationMinutes: 25,
  contentType: "article",
  resources: AGENT_RESOURCES,
  bodyMd: `## A new kind of helper

Automations follow fixed steps you design. A **personal AI agent** takes a goal and works out the steps itself, using websites and apps for you, sometimes for hours. Two arrived in September 2026:

- **Meta Muse**: books appointments, shops, fills in forms and handles multi-step errands, working inside its own secure cloud computer. It has a free tier and paid plans ($20 and $100 a month at launch), needs a payment card on file even for the free tier, and was available to adults in the US and Canada at the time of writing (October 2026).
- **ChatGPT dots**: always-on agents from OpenAI with their own cloud computer and connections to thousands of apps. They keep working in the background and learn from your feedback, and you can talk to one in ChatGPT, Slack or Microsoft Teams. At launch they came with ChatGPT Pro and Business Premium (not Free or Plus), and Pro was not offered in the EEA, Switzerland or the UK.

Both are new. Plans, prices and regions will change, so check the official pages in the resources before you rely on them.

## Errands worth handing over

Think back to your time audit in Module 1. Agents shine on the multi-step errands that eat your evenings:

- **Supplier and price checks**: compare three suppliers for an item and return a table with prices, delivery dates and minimum orders.
- **Invoice follow-up**: spot overdue invoices and draft polite reminders for you to approve.
- **Booking**: find and hold a venue, a courier slot or a repair appointment within your budget, for your approval.
- **Content from recordings**: turn a recorded live session or interview into captions, a short blog post and clip ideas.
- **Lead research**: gather public information about a list of potential business customers before you call.
- **A Friday report**: pull this week's sales, bookings and open tasks from your apps into one summary.

Keep for yourself: paying people, signing anything, replying to an upset customer, and any decision about staff.

## Rules that protect the business

1. **Money needs a person.** Block or require approval for any payment, order or refund. Never let an agent hold your main business card details if you can avoid it.
2. **Customers hear from you.** Agents may draft; you approve before anything reaches a customer.
3. **Least access.** Connect only the apps the errand needs, read-only first.
4. **Customer data stays protected.** Do not connect systems holding customers' personal data unless your data protection duties allow it and the vendor's terms fit.
5. **Count the cost.** Agents that run in the background use paid capacity. Start with one errand, measure the time saved against the plan price, then decide.

\`\`\`try
Act as my business errand agent for [YOUR BUSINESS].
Errand: [e.g. compare 3 local suppliers for 500 takeaway boxes].
Done means: a table with price per unit, delivery date, minimum order and a link for each.
Rules: do not contact suppliers, do not place orders, do not create accounts. Stop and ask me if a price is unclear or a site needs a login.
Time limit: 20 minutes.
\`\`\`

Run the brief in the practice pad to see where a model makes assumptions, then tighten it.

## Try it now

Choose two errands from the list above (or your own). For each, write a one-paragraph brief with a clear "done means" line and at least two rules from this lesson. Then decide, honestly, whether the time saved would cover the plan price. You are done when you have two briefs and a yes or no for each.`,
  microCheck: [
    {
      question: "Which errand should a small business owner keep for themselves rather than give to an agent?",
      options: [
        "Replying to an upset customer about a refund",
        "Comparing prices from three suppliers in a table",
        "Drafting reminders for overdue invoices to approve",
        "Pulling this week's bookings into a Friday summary",
      ],
      correctIndex: 0,
      explanation: "An upset customer needs your judgement and voice. The other errands are multi-step and checkable, with you approving the result.",
    },
    {
      question: "What is the best rule for an agent that compares suppliers for you?",
      options: [
        "It may research and report, but not contact or order",
        "It may order the cheapest option to save you time",
        "It may contact suppliers using your business email",
        "It may create accounts on any site it needs to visit",
      ],
      correctIndex: 0,
      explanation: "Keep the agent to research and reporting. Contacting, ordering and creating accounts are outward actions that need your approval.",
    },
    {
      question: "Why start with one errand and measure it before adding more?",
      options: [
        "To check the time saved actually covers what the plan costs",
        "Because agents can only ever handle one errand in total",
        "Because measuring results is required by the agent's terms",
        "To make sure the agent never needs your approval again",
      ],
      correctIndex: 0,
      explanation: "Agents that run in the background use paid capacity. A measured first errand tells you whether the value is real before you scale up.",
    },
    {
      question: "Your agent will draft social posts from a recorded live session. What is your checkpoint?",
      options: [
        "Edit the drafts and check every claim before posting",
        "Post automatically, then delete anything that gets complaints",
        "Let the agent post if the session was already public",
        "Skip review, because the words came from your own session",
      ],
      correctIndex: 0,
      explanation: "Drafts can misquote, exaggerate or invent details. Reviewing before posting protects your reputation and keeps claims accurate.",
    },
  ],
};
