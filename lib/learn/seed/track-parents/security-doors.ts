import type { SeedLesson, SeedQuestion } from "../types";

// AI for Parents: keeping a family safe with AI apps, a family version of the
// ideas behind the 30 Doors security checklist (keys, who can see what,
// limits, scams, recovery). Appended to the end of Module 4 ("Keeping
// Children Safe with AI"); existing titles and positions unchanged.

export const PARENTS_DOORS_LESSON: SeedLesson = {
  title: "Keeping your family safe with AI apps",
  objective: "Check the permissions, privacy and account security of the AI apps your family uses, spot AI-assisted scams, and know what a safe children's app should do.",
  durationMinutes: 22,
  contentType: "article",
  bodyMd: `## Every app is a house with doors

Earlier in this module you looked at what children should never share, deepfakes and the family safe word, companions and settings. This lesson zooms out to the apps themselves. Think of each AI app on a family device as a little house: it has doors (permissions to your camera, microphone, contacts, photos and location) and keys (your passwords and payment details). People who build apps for a living use a security checklist of thirty "doors" before launch. A family needs a handful of the same ideas.

## Permissions: which doors are open

When an app asks for access to the camera, microphone, contacts, photos or location, it is asking for a key to that room.

- **Say no by default**, and say yes only when the feature clearly needs it, ideally "only while using the app".
- **Check the permissions page** of each AI app on your children's devices every few months. Remove access an app no longer needs, and delete apps nobody uses.
- **Be wary of apps that want everything** to do something small, like a homework helper that asks for contacts and location.

## Keys and accounts

- **Use strong, different passwords** and a password manager for family accounts, and turn on two-step sign-in where it is offered.
- **Never share codes.** No real company, school or game needs your sign-in code. Teach children that anyone asking for one is a scammer, however friendly.
- **Set spending limits and purchase approval** on app stores and any paid AI app, so a child, or a scam, cannot run up charges.

## Scams that use AI

AI makes scams more convincing: messages without spelling mistakes, cloned voices, fake videos of people you know, and chatbots that keep a conversation going for weeks. Your family safe word from earlier in this module is the strongest defence against a cloned voice. Add these habits:

- **Urgency plus secrecy plus money or codes is the pattern.** "Don't tell your parents", "pay now", "send me the code" are red flags whatever the voice or face.
- **Check through a second route.** Hang up and call back on a number you already have.
- **Free prizes, game currency and "account problems"** aimed at children are a common lure. Agree that children show you any such message before clicking.

## What a safe children's AI app should do

Before a child uses an AI app, look for these signs. Most are on the app's website or in its settings:

- A clear statement that it is designed for children of that age, and an easy way for parents to see and control the account.
- It collects as little as possible, explains what it keeps and for how long, and lets you delete it.
- It does not let strangers contact your child, and it has reporting and blocking.
- It does not push purchases or encourage hours of use.
- Its AI declines unsafe topics and points children to a trusted adult.

\`\`\`try
My child is [AGE] and wants to use [APP NAME], an AI app for [WHAT IT
DOES]. Give me a short checklist of what to look for on its website and
settings before saying yes: what data it collects, parental controls,
whether strangers can contact my child, spending and purchase settings,
and how it handles unsafe topics. Tell me which answers should make me
say no. Do not assume facts about the app; tell me where to check.
\`\`\`

## Try it now

Sit down with your child for fifteen minutes.

1. Open the permissions page on their device and review every AI app together: keep, reduce or remove.
2. Check that purchase approval and spending limits are on.
3. Agree two rules out loud: never share a code, and show a parent any message that asks for secrecy, money or codes.

You are done when every AI app on the device has only the access it needs, purchases need your approval, and your child can say the two rules back to you.`,
  microCheck: [
    {
      question: "A homework helper app asks for access to your child's contacts and location. What is the best response?",
      options: [
        "Decline unless a feature clearly needs it, and check what still works",
        "Accept, because apps need every single permission to work properly at all",
        "Accept, but tell your child not to use the app in the evenings",
        "Accept now and remember to check the permissions again next year",
      ],
      correctIndex: 0,
      explanation:
        "Permissions are keys to rooms in your child's digital life. A homework helper rarely needs contacts or location; give access only when a feature clearly needs it.",
    },
    {
      question: "Your child gets a friendly message: 'I'm from the game team. Send me the code we just texted you to keep your account safe.' What is this?",
      options: [
        "A scam: no real company asks anyone to share a sign-in code",
        "A real security check, because it mentions keeping the account safe",
        "A harmless message, since codes expire within a few minutes",
        "A test from the game that rewards children who reply quickly",
      ],
      correctIndex: 0,
      explanation:
        "Sign-in codes are keys. Real companies never ask for them, so any request for a code, however friendly or official it sounds, is a scam.",
    },
    {
      question: "Which pattern is the strongest warning sign of a scam, even when the voice or face seems familiar?",
      options: [
        "Urgency plus secrecy plus a request for money or codes",
        "A message that arrives late in the evening or at night",
        "A message written with perfect spelling and grammar",
        "A request that comes from a number you have saved",
      ],
      correctIndex: 0,
      explanation:
        "AI can fake voices, faces and good writing, so those are no longer reliable signs. The pressure pattern of urgency, secrecy and money or codes still gives scams away.",
    },
    {
      question: "Which feature matters most in a children's AI app?",
      options: [
        "Parents can see and control the account, and strangers cannot make contact",
        "It has the largest possible number of characters and themes to choose between",
        "It offers in-app purchases so children can unlock extra features",
        "It encourages long sessions so children practise more each day",
      ],
      correctIndex: 0,
      explanation:
        "Parental visibility and no contact from strangers protect children directly. Purchases and design that encourages long sessions work against them.",
    },
  ],
};

export const PARENTS_DOORS_QUIZ: SeedQuestion[] = [
  {
    question: "You want to stop surprise charges from AI apps on your child's tablet. What is the most effective step?",
    options: [
      "Turn on purchase approval and spending limits in the app store settings",
      "Ask your child to promise not to buy anything at all without asking you first",
      "Remove the app store icon from the home screen so it is harder to find",
      "Check the bank statement at the end of every month for charges",
    ],
    correctIndex: 0,
    explanation:
      "Purchase approval stops charges before they happen, whether from a mistake or a scam. Promises and checking statements afterwards do not prevent anything.",
  },
  {
    question: "A grandparent receives a call in your child's cloned voice asking for money urgently. What protects them best?",
    options: [
      "The family safe word, and calling back on a number they already have",
      "Asking the caller detailed questions about the child's favourite things",
      "Sending a smaller amount first to check whether the call is genuine",
      "Staying on the line until the caller gives a bank account number",
    ],
    correctIndex: 0,
    explanation:
      "Cloned voices can sound real and details can be found online. A safe word and a call back on a known number check identity through a route the scammer does not control.",
  },
];
