import type { SeedLesson, SeedQuestion } from "../types";

// AI Practitioner: the 30 Doors security checklist for people who build or
// commission AI automations. Appended to the end of Module 6 ("Using AI
// Responsibly at Work"); existing titles and positions are unchanged.
// Product names are examples at the time of writing (October 2026).

export const T2_DOORS_LESSON: SeedLesson = {
  title: "Before you switch it on: security doors for AI automations",
  objective: "Check an AI automation or small app against the security doors that matter for it, and ask the right questions of whoever built it.",
  durationMinutes: 25,
  contentType: "article",
  bodyMd: `## An automation is a building with doors

In Module 5 you designed automations: a trigger, some steps, an AI step and an action. Every one of those parts is a way in. The trigger might be a web address anyone can call. The AI step reads text written by strangers. The action can send emails or update records. The connection to your email or CRM is a key.

Security people sometimes describe this as a set of **doors**. A thirty-door checklist exists for apps built with AI; you do not need all thirty to switch on a workflow, but about seventeen apply to almost every automation or small AI tool you build or commission. This lesson walks through them in plain language, and the **30 Doors** tool below shows exactly those seventeen.

## Keys and who can see what

- **Keys in the right place (door 4).** API keys and connection passwords belong in the automation platform's credentials store or the app's server settings. Never in a prompt, a shared document, a spreadsheet cell or a web page.
- **Every step checks who is asking (doors 6, 7 and 11).** If your automation produces a report or answers questions, check that a person can only see their own data. A good test: ask, as a colleague without access, for something only a manager should see.
- **Limits on sign-in (door 12)**, if your tool has its own login.
- **Webhooks verified (door 19).** Many automations start when a web address (a webhook) is called. If anyone who learns the address can trigger it, they can feed it whatever they like. Use the platform's secret or signature option, and keep the address private.

## The AI parts

You met prompt injection earlier in this module. Here it becomes a checklist:

- **Spending caps and limits (doors 20 and 21).** Set a monthly cap or alert on every AI account the automation uses, and a limit on how many runs per hour it can make. A loop or a flood of emails should hit a ceiling, not your budget.
- **Untrusted input (door 22).** Any email, form or document the AI step reads may contain instructions. Assume it will, one day.
- **Limits on actions (door 23).** The AI step should draft, not send; propose, not pay. Put a human approval step before anything that leaves the organisation or cannot be undone.
- **Shared templates and add-ons (doors 24 and 25).** A template, plugin or "skill" someone shared is code you are about to run. Read what it connects to and what it sends before you import it.
- **Least-privilege connections (door 26).** Connect the automation with an account that can do only what it needs, not your administrator account.

## When it breaks

- **Plain errors (door 27)** to the people using it, details in the logs.
- **No secrets or personal data in run history (door 28).** Automation platforms often keep a copy of every run, including the full email or form. Check what is stored and for how long.
- **A record of who did what (door 29)**, especially for approvals and changes.
- **A tested way back (door 30).** If the automation updates a spreadsheet or database, know how to restore yesterday's version, and try it once.

Mark each door as you check it. Your marks are saved:

\`\`\`studio
security-doors:view-commission
\`\`\`

## If someone else built it

Each door in the tool has a question to ask your developer, agency or internal team. Use them before launch, not after an incident. A short version for your next meeting:

\`\`\`try
I am about to switch on an AI automation built by [WHO BUILT IT] that
[WHAT IT DOES: trigger, AI step, actions]. Turn these security checks
into ten plain-language questions I should ask them before launch, and
for each, what a good answer sounds like and what a worrying one sounds
like: where keys are stored, who can see which outputs, whether the
trigger can be called by strangers, spending caps, what the AI can do
without approval, what is kept in run history, and how we restore data
if it goes wrong.
\`\`\`

## Try it now

Pick one automation you designed in Module 5, or one already running in your team.

1. Work through the doors in the tool, marking each Checked, Not applicable or Needs work.
2. For every Needs work, write the fix and who owns it.
3. Copy the report from the Live panel and share it with whoever maintains the automation.

You are done when every door in the view is marked and each Needs work has an owner and a date.`,
  microCheck: [
    {
      question: "Your automation starts when a web address receives a form submission. What is the main risk if that address has no secret or signature check?",
      options: [
        "Anyone who learns the address can trigger runs with any content",
        "The automation will run more slowly at busy times of the day",
        "The AI step will forget the instructions you gave it last week",
        "The form will stop working when it is opened on mobile phones",
      ],
      correctIndex: 0,
      explanation:
        "A webhook address is a door. Without a secret or signature, it trusts whoever calls it, so strangers can feed in content or trigger actions and costs.",
    },
    {
      question: "An AI step drafts replies to customer emails. Where should the human approval sit?",
      options: [
        "Before the reply is sent, since it leaves the organisation",
        "After the reply is sent, so customers are not kept waiting",
        "Before the AI reads the email, to check it is from a customer",
        "Nowhere, if the prompt tells the AI to be careful and polite",
      ],
      correctIndex: 0,
      explanation:
        "Customer emails are untrusted input that may carry instructions. Approval before anything leaves the organisation caps what a manipulated AI step can do.",
    },
    {
      question: "A colleague shares an automation template that connects to your CRM and an outside web address. What should you do first?",
      options: [
        "Read what it connects to and sends before you import it",
        "Import it, because templates from colleagues are always safe",
        "Import it, then delete the parts you do not understand later",
        "Ask the AI inside the template whether it is safe to use",
      ],
      correctIndex: 0,
      explanation:
        "A shared template is code you are about to run with your access. Checking its connections and outbound addresses first is the same as reviewing any software you install.",
    },
    {
      question: "Your automation platform keeps the full content of every run for a year. Which door does that touch?",
      options: [
        "Door 28: run history can hold personal data and secrets",
        "Door 16: other websites can read the platform's history",
        "Door 5: the platform's versions must be pinned and locked",
        "Door 12: the history makes sign-in slower for every user",
      ],
      correctIndex: 0,
      explanation:
        "Run history is a log. If it keeps full emails and forms, it holds personal data far longer than needed; check what is stored and shorten retention.",
    },
  ],
};

export const T2_DOORS_QUIZ: SeedQuestion[] = [
  {
    question: "An AI automation is connected to the shared mailbox using the IT administrator's account because it was quickest. What is the better setup?",
    options: [
      "A dedicated account with only the access the automation needs",
      "The administrator account, with a stronger password added to it",
      "The administrator account, used only during working hours",
      "A personal account of whoever built the automation in the team",
    ],
    correctIndex: 0,
    explanation:
      "Least privilege limits the damage if the automation is misused or manipulated. An administrator connection turns any mistake into an organisation-wide problem.",
  },
  {
    question: "An agency built your AI assistant. Which question best tests whether one user can see another user's data?",
    options: [
      "Has it been tested with two accounts trying each other's records?",
      "Which AI model did you choose, and why is it the best available?",
      "How quickly does the assistant answer a typical customer question?",
      "Can we change the assistant's tone of voice after it launches?",
    ],
    correctIndex: 0,
    explanation:
      "Access problems are invisible when you only test as yourself. A test with two accounts, each trying to reach the other's data, is the evidence to ask for.",
  },
];
