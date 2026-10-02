import type { SeedLesson, SeedQuestion } from "../types";

// AI-Forward Professional: safe use of AI tools at work, drawing on the 30
// Doors security checklist. Appended to the end of Module 4 ("Your Field,
// AI-Forward"); existing titles and positions unchanged.

export const FWD_DOORS_LESSON: SeedLesson = {
  title: "Safe AI use at work: keys, connected apps and agents",
  objective: "Protect your accounts, data and budget when you use and connect AI tools at work, and check the basics before sharing an AI tool with colleagues.",
  durationMinutes: 22,
  contentType: "article",
  bodyMd: `## AI tools now hold keys

A year or two ago, using AI at work mostly meant typing into a chat window. Now assistants connect to your email, calendar and files, browser extensions read the pages you visit, and agents can send messages or book things on your behalf. Each connection is a key you have handed over. The more an AI tool can reach and do, the more it matters who else can steer it.

This lesson borrows from a 30-door security checklist used for apps built with AI, and picks the doors that apply to a professional using and sharing AI tools.

## Your keys and your data

- **Never paste secrets into a chat.** Passwords, API keys, access codes and client account numbers do not belong in prompts, even "just this once". Treat a key like a house key: if it is copied, the only fix is to change the lock.
- **Confidential and personal data** follow your organisation's policy and the habits from earlier in this module: remove names and identifiers, or use an approved tool.
- **Turn on two-step sign-in** for every AI account, and for any account an AI tool connects to.

## Connected apps and agents

When an assistant asks to connect to your email or files, the request lists what it wants: read, send, delete, all files or one folder. Read it.

- **Grant the narrowest access** that does the job: read-only rather than send, one folder rather than the whole drive.
- **Anything the AI reads can carry instructions.** An email or web page can contain hidden text telling the assistant to forward data or click a link. This is called prompt injection. Prefer assistants that ask before sending, deleting or paying, and keep that setting on.
- **Review your connected apps** every few months and remove the ones you no longer use.
- **Treat shared add-ons, extensions, "skills" and templates like software.** Install them from sources you trust, and check what they can access.

## Money

If you pay for AI tools or an API on a company card, **set a spending limit or alert**. A leaked key or a forgotten automation can run up charges quickly.

## If you share an AI tool with colleagues

Perhaps you build a small assistant, automation or app for your team. Then you are its owner, and more doors apply: who can see which data, where its keys live, what it can do without approval, and how to recover if it goes wrong. The tool below shows those doors with plain questions. Use it before you share, or with whoever builds it for you:

\`\`\`studio
security-doors:view-commission
\`\`\`

\`\`\`try
I use these AI tools at work: [LIST TOOLS AND WHAT EACH IS CONNECTED TO,
for example "assistant connected to my email (read and send)"]. For each
connection, tell me the narrowest access that would still do the job,
the worst thing that could happen if the tool were misled by a malicious
email or web page, and one setting or habit that reduces that risk.
Keep it to a short table.
\`\`\`

## Try it now

1. Open the connected-apps or integrations page of the AI tools you use at work. List what each can access.
2. Remove any you no longer use and reduce any access that is wider than needed.
3. Check two-step sign-in and spending limits on every paid AI account.

You are done when every AI connection you keep has the narrowest access that works, and every paid AI account has two-step sign-in and a spending limit or alert.`,
  microCheck: [
    {
      question: "An AI assistant asks for access to 'read, send and delete all email'. You only want it to draft replies. What should you do?",
      options: [
        "Choose narrower access, such as reading and drafting without sending",
        "Accept it, since the assistant will only ever use what it actually needs",
        "Accept it now and remember to check the settings again next year",
        "Accept it, but tell the assistant in a prompt never to delete email",
      ],
      correctIndex: 0,
      explanation:
        "Access you grant is access an attacker can use if the assistant is misled. The narrowest permission that does the job limits the damage of any mistake.",
    },
    {
      question: "Why can an email you ask an AI assistant to summarise be a security risk?",
      options: [
        "It may hide instructions that the assistant tries to follow",
        "Summaries use up the monthly allowance of the email account",
        "The sender is told automatically that the email was summarised",
        "Long emails make the assistant's next answers less accurate",
      ],
      correctIndex: 0,
      explanation:
        "This is prompt injection: text in the email can try to steer the assistant. It matters most when the assistant can also send, delete or pay.",
    },
    {
      question: "A colleague asks you to paste the team's API key into a chatbot so it can 'help configure' a tool. What is the safest response?",
      options: [
        "Decline; keys never go into prompts, and use the tool's settings page",
        "Paste it, but delete the whole conversation from the history afterwards",
        "Paste only half of the key so the chatbot cannot use all of it",
        "Paste it into a private chat window so nobody else can see it",
      ],
      correctIndex: 0,
      explanation:
        "Once a key leaves its proper store you cannot be sure where it ends up. Keys are entered only in the tool's own settings or a secrets manager, never in a prompt.",
    },
    {
      question: "You built a small AI assistant that your whole team will use. What changes for you?",
      options: [
        "You become its owner, so access, keys, limits and recovery are yours",
        "Nothing, because the AI provider is responsible for all of the security",
        "Only the visual design matters, since colleagues are trusted users",
        "You must rebuild it in a programming language before sharing it",
      ],
      correctIndex: 0,
      explanation:
        "Sharing a tool makes you responsible for who sees which data, where keys live, what it can do and how to recover. The 30-door view lists those checks.",
    },
  ],
};

export const FWD_DOORS_QUIZ: SeedQuestion[] = [
  {
    question: "You pay for an AI API on a company card for an automation you set up. Which control matters most for cost?",
    options: [
      "A spending limit or alert on the account, checked by a named owner",
      "A note in the automation's description asking people to use it less",
      "A longer prompt so that each call does more work per request",
      "A shared password so the whole team can check the bill monthly",
    ],
    correctIndex: 0,
    explanation:
      "A leaked key or a stuck automation can spend quickly. A limit or alert with a named owner catches it before it becomes a large bill.",
  },
  {
    question: "A browser extension promises AI summaries of every page you visit, including internal systems. What should you check before installing?",
    options: [
      "What data it can read and send, and whether your organisation approves it",
      "Whether its toolbar icon matches the colours of your organisation's own brand",
      "How many languages its summaries can be translated into today",
      "Whether it can also summarise videos as well as written pages",
    ],
    correctIndex: 0,
    explanation:
      "An extension that reads every page can see confidential internal systems. Its access and data handling, and your organisation's approval, come before features.",
  },
];
