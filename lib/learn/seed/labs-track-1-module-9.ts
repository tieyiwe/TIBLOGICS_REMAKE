import type { SeedLab } from "./types";

// The Basic level's AI fluency lab. A workbench lab: the learner takes one real
// recurring task and works through the 4Ds of the AI Fluency Framework on it
// (Delegation, Description, Discernment, Diligence). It is assessed against the
// guidance below.

export const TRACK_1_MODULE_9_LABS: SeedLab[] = [
  {
    slug: "ai-foundations-lab-9-4d-fluency-plan",
    title: "Your 4D fluency plan for a real task",
    labType: "workbench",
    moduleNumber: 9,
    estimatedMinutes: 30,
    points: 60,
    passScore: 70,
    briefMd: `Pick one real task that you do again and again: a weekly update, replies to a certain kind of email, a monthly newsletter, a meal plan, lesson notes. It must be yours and it must repeat, so that the plan you write here is one you will actually use.

Then work through the **4Ds** of AI fluency on it: **Delegation** (what to hand to AI, what to keep, and in which mode), **Description** (the prompt you will use), **Discernment** (how you will check what comes back) and **Diligence** (your commitments on disclosure, checking and data).

You are assessed on how specific and honest your plan is, not on how ambitious it sounds. A plan for a small task that you will really follow beats a grand one you won't.`,
    scenarioMd: `Work through the four parts in order. Name real steps, real readers and real checks. Leave out any private or confidential details: describe them ("a client's account number") rather than pasting them.`,
    objectives: [
      {
        id: "delegation",
        label: "Makes a sound delegation decision",
        weight: 2,
        guidance:
          "Full credit when the learner splits the task into parts, marks each as keep, hand over or work together, keeps at least the judgement and the key facts, and names a mode (automation, augmentation or agency) with a reason tied to the cost of mistakes. Part credit for a single all-or-nothing decision with a reason. Low credit if everything is handed over with no thought about risk.",
      },
      {
        id: "description",
        label: "Writes a clear, reusable description",
        weight: 2,
        guidance:
          "Full credit for a prompt the learner could reuse that covers the product (output, reader, format, length or tone), the process (for example, use only the facts supplied, mark gaps in brackets) and the AI's behaviour (for example, ask questions first, be direct). Part credit if it covers the product well but not process or behaviour. Low credit for a one-line vague request.",
      },
      {
        id: "discernment",
        label: "Plans a real check of output and process",
        weight: 2,
        guidance:
          "Full credit when the learner names the specific facts or parts they will verify, the source they will check against, at least one thing about the AI's process or behaviour to watch (assumptions, agreeing too easily, invented details), and when they would use, fix or start again. Part credit for a generic 'I will read it through'.",
      },
      {
        id: "diligence",
        label: "Sets concrete diligence commitments",
        weight: 2,
        guidance:
          "Full credit for three concrete commitments covering disclosure (who is told about AI use and how, with wording), checking (what is always checked before the work leaves their hands) and data (what they will not paste, or how they will remove it), consistent with any policy that applies. Part credit if one of the three is missing or vague.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "delegation",
          label: "Delegation: the task, the split and the mode",
          prompt:
            "What is the recurring task, who receives the result, and what happens if it is wrong? Break it into its main parts and mark each one keep, hand over or work together. Which mode will you use for the parts you hand over (automation, augmentation or agency), and why?",
          placeholder:
            "e.g. My weekly update to the volunteer team. Parts: deciding what matters (keep), turning my notes into paragraphs (hand over, automation), ...",
          minWords: 60,
        },
        {
          id: "description",
          label: "Description: the prompt you will use",
          prompt:
            "Write the actual prompt you will reuse for this task, with [BRACKETS] for the parts that change each time. Make sure it describes the product, the process and how you want the AI to behave.",
          minWords: 50,
        },
        {
          id: "discernment",
          label: "Discernment: how you will check it",
          prompt:
            "Which facts, figures or parts will you always check, and against what source? What will you watch for in how the AI got there (assumptions, invented details, agreeing too easily)? When would you use the result, fix it, or start again?",
          minWords: 50,
        },
        {
          id: "diligence",
          label: "Diligence: your commitments",
          prompt:
            "Write three commitments for this task: disclosure (who you will tell about AI use, and the wording you will use), checking (what never leaves your hands unchecked) and data (what you will not paste into the tool, or how you will remove it). Mention any policy that applies.",
          minWords: 50,
        },
      ],
    },
  },
];
