import type { SeedLesson, SeedQuestion } from "../types";

// AI for Small Business Owners: a non-technical version of the 30 Doors
// security checklist. Appended to the end of Module 6 ("Your 90-Day AI Plan
// for the Business"); existing titles and positions unchanged.
// Product names are examples at the time of writing (October 2026).

export const SMB_DOORS_LESSON: SeedLesson = {
  title: "Before you let customers use your AI tool or app",
  objective: "Check the security basics of an AI tool or app before customers use it, and ask your developer or agency the questions that reveal weak spots.",
  durationMinutes: 25,
  contentType: "article",
  bodyMd: `## Doors and keys

Perhaps your 90-day plan includes a booking assistant on your website, a chatbot that answers questions about orders, or a small app a freelancer or agency built for you, maybe with AI tools. Before customers use it, think of it as a shop with several doors. The front door is the login. But there are back doors too: the address the app uses to fetch customer details, the folder where uploaded photos are stored, the key that lets it use an AI service on your account.

Most problems are not clever hackers. They are automated scripts that try every door on every website, all day, looking for a key left in the lock. Being a small business does not hide you from them.

You do not need to be technical to check the basics. You need to know which doors exist and which questions to ask.

## The doors every owner should ask about

**Keys and money**

- **Secret keys are never in the website itself (door 4)**, and any key that was ever exposed has been cancelled and replaced (door 3). A key is like your card details: if it is copied, the only fix is a new one.
- **Hard spending limits on AI and cloud accounts (door 20)**, and a limit on how many questions one person can ask the chatbot (door 21). Otherwise a stranger can run up your bill overnight.
- **The people who build your app do not have your live customer data in their AI tools (door 26).**

**Who can see what**

- **One customer cannot see another customer's details (doors 6 and 7).** The classic test: if your booking confirmation page has a number in its address, change the number. You should never see someone else's booking.
- **Only staff with the right role can use admin features (door 11)**, checked by the system, not just by hiding a button.
- **Logins are protected against repeated guessing (door 12).**
- **Uploaded files are private (door 17).** Photos, documents and ID should not be openable by anyone who has the link.

**When something goes wrong**

- **Customer details and passwords are kept out of logs (door 28)**, and there is **a record of who changed or deleted what (door 29)**.
- **Backups exist, and someone has actually restored one to prove it works (door 30).** Ask how long it took.

The tool below shows these thirteen doors, each with the question to ask first. Mark each one as you get an answer:

\`\`\`studio
security-doors:view-owner
\`\`\`

## Questions for your developer or agency

Good suppliers welcome these questions. Answers like "it's all secure" or "the AI handles that" are a reason to dig, not to relax. Ask for things you can see: a test, a setting, a date.

\`\`\`try
I run a small [TYPE OF BUSINESS]. A [FREELANCER / AGENCY] has built
[WHAT THE TOOL OR APP DOES] for us, and customers will use it from
[LAUNCH DATE]. Write a short, friendly email asking them about security
before launch, in plain English, covering: where secret keys are kept,
spending limits on AI services, whether one customer can ever see
another's details (and how they tested it), whether uploaded files are
private, what is kept in logs, and when a backup was last restored.
Ask for evidence, not just reassurance.
\`\`\`

## A note on your own accounts

Some doors are yours, not your developer's. Turn on two-step sign-in for every account connected to the app (email, payments, hosting, AI services), and keep the list of who has access short and up to date. When someone leaves, remove their access the same day.

## Try it now

1. Open the tool above and read each door's question.
2. Send the questions (or the drafted email) to whoever built your tool or app, or work through them yourself if you built it.
3. Mark each door Checked, Not applicable or Needs work as answers come in, and copy the report for your records.

You are done when every door is marked, each Needs work has a date agreed with your supplier, and spending limits are set on every AI account the tool uses.`,
  microCheck: [
    {
      question: "Your booking confirmation page has /booking/2041 in its address. What simple test should you try?",
      options: [
        "Change the number and check you cannot see someone else's booking",
        "Refresh the page several times to check that it loads every time",
        "Open the page on a phone to check that the layout still looks right",
        "Share the link with a friend to see whether it opens for them too",
      ],
      correctIndex: 0,
      explanation:
        "If changing the number shows another customer's booking, the app does not check whose record it is. It is one of the most common flaws in quickly built apps.",
    },
    {
      question: "Why set a hard spending limit on the AI service your chatbot uses?",
      options: [
        "A leaked key or a flood of questions could run up a large bill",
        "The AI gives better answers when it knows a budget is in place",
        "Spending limits are required before a chatbot can go online",
        "Limits make the chatbot reply faster to every customer question",
      ],
      correctIndex: 0,
      explanation:
        "Every question costs money. A limit, plus a cap on questions per person, stops a stranger or a fault turning into a large bill before anyone notices.",
    },
    {
      question: "Your agency says 'it's all secure, the AI handles that'. What is the best response?",
      options: [
        "Ask for specific evidence, such as a test or a setting, for each door",
        "Accept it, since agencies are responsible for any problems anyway",
        "Ask the chatbot itself whether the app has any security problems",
        "Delay the launch indefinitely until you can learn to code yourself",
      ],
      correctIndex: 0,
      explanation:
        "Reassurance is not evidence. Good suppliers can show a test where one customer cannot see another's data, the spending limits set, and the date of the last restore.",
    },
    {
      question: "A staff member who helped set up the app leaves the business. What should happen the same day?",
      options: [
        "Remove their access to the app and every connected account",
        "Change the app's colours so they no longer recognise it online",
        "Ask them to promise in writing never to log in again",
        "Nothing, because former staff rarely try to log in again",
      ],
      correctIndex: 0,
      explanation:
        "Old access is an open door. Removing it promptly, and keeping the access list short, is one of the simplest and most effective controls an owner has.",
    },
  ],
};

export const SMB_DOORS_QUIZ: SeedQuestion[] = [
  {
    question: "Customer photos uploaded to your app open for anyone who has the link. What should you ask your developer to change?",
    options: [
      "Make the storage private, with links that only work briefly for the owner",
      "Give the photos longer file names so that the links are harder to guess",
      "Ask customers to upload smaller photos so that they take less space",
      "Add a note telling customers not to share their links with anyone",
    ],
    correctIndex: 0,
    explanation:
      "Links travel through emails and browser history. Private storage with short-lived links, created only after checking who is asking, keeps customers' files theirs.",
  },
  {
    question: "Your developer says backups run every night. What one question tells you whether you are really protected?",
    options: [
      "When did you last restore one, and how long did it take?",
      "Which company makes the software that takes the backups?",
      "How many backups have been taken since the app launched?",
      "Can the backups be emailed to me every morning as a file?",
    ],
    correctIndex: 0,
    explanation:
      "A backup that has never been restored might not work. A real restore, with a time, tells you what you would get back after a mistake or an attack.",
  },
];
