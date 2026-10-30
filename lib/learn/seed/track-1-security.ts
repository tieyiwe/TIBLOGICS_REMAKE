import type { SeedLesson, SeedQuestion } from "./types";

// AI Foundations for Everyone: safe everyday AI use, drawing on the ideas
// behind the 30 Doors security checklist (keys, who can see what, limits,
// scams). Appended to the end of Module 5 ("Your Data and Your Privacy") in
// ./tracks.ts; existing titles and positions are unchanged.

export const T1_SAFE_USE_LESSON: SeedLesson = {
  title: "Safe AI use: keys, data and scams",
  objective: "Keep secrets and other people's data out of chatbots, check what AI apps and agents can access, set spending limits, and spot AI-assisted phishing.",
  durationMinutes: 20,
  contentType: "article",
  bodyMd: `## Keys, doors and AI

People who build software use a security checklist of thirty "doors": the ways someone could get into an app, its data or its owner's bank account. You are not building apps here, but the same ideas protect anyone who uses AI. Think of your accounts as rooms, your passwords and codes as keys, and every app you connect as someone you have given a key to.

## Never paste keys or other people's data

Earlier in this module you saw what never to paste into a chatbot. Two kinds of thing deserve special care:

- **Keys.** Passwords, sign-in codes, API keys (the long codes that let software use a paid service), bank details and access codes. A key in a chat may be stored, reviewed or leaked. If one is copied, the only fix is to change it. If you have ever pasted a password into a chatbot, change that password today.
- **Other people's data.** Customer lists, a colleague's health details, a friend's messages. It is not yours to share, even with a helpful tool.

## Check what apps and agents can reach

AI assistants increasingly connect to your email, calendar, files and browser, and AI agents can act for you: send messages, fill in forms, buy things. Each connection is a key you hand over.

- When an app asks to connect, **read what it wants**: read only, or read and send? One folder, or everything?
- **Give the least access** that does the job, and keep "ask me before sending or paying" switched on.
- **Remember that anything the AI reads can contain instructions.** A web page or email can hide text that tries to steer the assistant. This is called prompt injection, and it is why actions like sending and paying should need your approval.
- **Every few months, review connected apps** and remove the ones you no longer use.

## Put a ceiling on spending

If you pay for an AI service, or one is linked to your card, **set a spending limit or alert** where the service offers one. Mistakes, forgotten subscriptions and stolen accounts all show up first as charges.

## Spot AI-assisted phishing

Scam messages used to give themselves away with poor spelling. AI removes that clue, and can also clone voices and fake videos. Watch for the pattern instead:

- **Urgency** ("act now"), **secrecy** ("don't tell anyone") and a request for **money, codes or a click**.
- A familiar name or voice asking for something unusual.

Check through a second route you already trust: call back on a known number, or log in through the official app rather than a link. No genuine organisation will ask you for a sign-in code.

\`\`\`try
I received this message: [PASTE THE MESSAGE, WITH NAMES, NUMBERS AND
LINKS REMOVED]. Without clicking anything, list the warning signs of a
scam you can see, what the sender seems to want, and the safest way for
me to check whether it is genuine. Remind me not to share any codes.
\`\`\`

## Try it now

1. Open the connected apps or integrations page of one AI tool you use. Remove anything you no longer need and narrow anything that has more access than it needs.
2. Turn on two-step sign-in for that AI account, and set a spending limit or alert if you pay for it.
3. If you have ever pasted a password or code into a chatbot, change it now.

You are done when your AI tool has only the access it needs, two-step sign-in is on, and no password you have shared with a chatbot is still in use.`,
  microCheck: [
    {
      question: "You pasted your email password into a chatbot last month to 'help set up a filter'. What should you do now?",
      options: [
        "Change the password, since a shared key may have been stored",
        "Delete the chat, which removes every copy of the password",
        "Nothing, because the chatbot only used it for the filter",
        "Ask the chatbot to forget the password it was given the last time",
      ],
      correctIndex: 0,
      explanation:
        "Once a key leaves your hands you cannot be sure where copies are. Changing the password makes any copy useless; deleting the chat or asking it to forget does not.",
    },
    {
      question: "An AI assistant wants to connect to your email with permission to read, send and delete. You only want summaries. What is best?",
      options: [
        "Choose read-only access if it is offered, or do not connect it",
        "Accept, because the assistant will only do what you ask it to do",
        "Accept, and check your sent folder now and then for problems",
        "Accept, as long as the assistant comes from a well-known company",
      ],
      correctIndex: 0,
      explanation:
        "Access you grant can be misused if the assistant is tricked by a hidden instruction. Read-only access is enough for summaries and limits what can go wrong.",
    },
    {
      question: "A message in perfect English, apparently from your bank, asks you to confirm a code sent to your phone. What is it most likely to be?",
      options: [
        "A scam, because genuine organisations never ask for your codes",
        "Genuine, because the message has no spelling or grammar mistakes",
        "Genuine, because the code arrived on your phone a moment ago",
        "A system test, since banks check codes by message every month",
      ],
      correctIndex: 0,
      explanation:
        "AI makes scam messages fluent, so good spelling proves nothing. A request for a sign-in code is the giveaway: real organisations never ask you to share one.",
    },
    {
      question: "A colleague asks you to paste the team's customer list into a free chatbot to tidy it up. What is the right call?",
      options: [
        "Decline, or use an approved tool, because it is other people's data",
        "Paste it, since the chatbot only reformats the list and keeps nothing",
        "Paste it, but only after removing the column headers from the list",
        "Paste half of it now and the other half in a separate chat later",
      ],
      correctIndex: 0,
      explanation:
        "Customer details belong to the customers and fall under your organisation's rules. Use an approved tool or remove the personal data first; splitting or tidying does not help.",
    },
  ],
};

export const T1_SAFE_USE_QUIZ: SeedQuestion[] = [
  {
    question: "Why should an AI agent that books things for you ask before paying?",
    options: [
      "Hidden instructions in pages it reads could steer it to pay the wrong party",
      "Payments made by agents are always slower than the ones you make yourself",
      "Banks refuse any payments from agents unless a person clicks the final button",
      "Asking first makes the agent learn your preferences more quickly",
    ],
    correctIndex: 0,
    explanation:
      "Agents read web pages and messages that may contain instructions meant to mislead them. An approval step keeps the consequential action in your hands.",
  },
  {
    question: "You pay for an AI app with your card. Which simple setting best protects you from surprise charges?",
    options: [
      "A spending limit or alert on the account, where the service offers one",
      "A longer password that you change every week on a set day",
      "A different email address used only for that AI application",
      "Turning off all notifications so the app can never ask you to upgrade your plan",
    ],
    correctIndex: 0,
    explanation:
      "Mistakes, forgotten subscriptions and stolen accounts show up first as charges. A limit or alert catches them early.",
  },
];
