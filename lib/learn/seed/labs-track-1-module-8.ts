import type { SeedLab } from "./types";

// The Basic level's systems-thinking lab. A workbench lab: the learner maps a
// real system from their own life on the page, and it is assessed against the
// guidance below. It is the bridge into the Intermediate level, which opens by
// having learners map their whole workflow the same way.

export const TRACK_1_MODULE_8_LABS: SeedLab[] = [
  {
    slug: "ai-foundations-lab-8-map-a-system",
    title: "Map a system you use AI in",
    labType: "workbench",
    moduleNumber: 8,
    estimatedMinutes: 25,
    points: 60,
    passScore: 70,
    briefMd: `Pick one real, everyday task where you use an AI tool, or would like to. Replying to customer messages, planning meals for the family, writing reports for your manager: anything real works, as long as it is yours.

Then look at it as a **system** rather than a single task. Who and what is involved, how the parts connect, where the loops are, and where the real slow point is.

You will be assessed on how clearly you see the whole picture, not on how impressive the task sounds. A small, honest map beats a grand vague one.`,
    scenarioMd: `Work through the five parts in order. Be concrete: name actual steps, people and tools, and describe what actually happens, not what should happen in theory.`,
    objectives: [
      {
        id: "parts",
        label: "Identifies the real parts and connections",
        weight: 2,
        guidance:
          "Full credit when the learner names the people, tools, information and steps involved AND says how they connect (who hands what to whom). Part credit for a bare list with no connections. Low credit if the AI tool is the only part mentioned.",
      },
      {
        id: "loop",
        label: "Spots a genuine feedback loop",
        weight: 2,
        guidance:
          "Full credit for a loop that actually circles back (A affects B, which comes back to affect A) and is correctly called reinforcing (snowballing) or balancing (self-correcting). Part credit for a one-way cause and effect described as a loop. None for no loop.",
      },
      {
        id: "bottleneck",
        label: "Finds the real bottleneck",
        weight: 2,
        guidance:
          "Full credit when the learner names the single slowest or most constrained step and gives a reason it is the bottleneck. Extra credit is implied when they notice that AI speeding up a different step would only move the queue. Low credit for 'everything is slow'.",
      },
      {
        id: "knockon",
        label: "Thinks through a knock-on effect",
        weight: 2,
        guidance:
          "Full credit for a specific second-order effect of using AI in this system (for example, faster drafts creating more checking work, or a mistake flowing downstream to someone else), including who it affects. Part credit for a generic 'AI can make mistakes'.",
      },
      {
        id: "action",
        label: "Proposes a sensible next step",
        weight: 1,
        guidance:
          "Full credit for one concrete, small change that targets the bottleneck or the loop, plus how they would know whether it worked. Part credit for a change with no way of checking it.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "task",
          label: "The task and its purpose",
          prompt: "What is the task, and what is it really for? What does 'done well' look like to the person who receives the result?",
          placeholder: "e.g. Answering customer emails for my shop. The real purpose is keeping customers happy enough to order again...",
          minWords: 30,
        },
        {
          id: "parts",
          label: "Parts and connections",
          prompt: "List the people, tools, information and steps involved, and say how they connect: who hands what to whom, in what order.",
          minWords: 50,
        },
        {
          id: "loop",
          label: "One feedback loop",
          prompt: "Describe one loop in this system where an effect comes back around. Is it reinforcing (snowballing) or balancing (self-correcting)? How do you know?",
          minWords: 40,
        },
        {
          id: "bottleneck",
          label: "The bottleneck, and a knock-on effect",
          prompt: "Which single step is the slowest or most stuck, and why? If AI sped up some other step, what would happen to the queue? Name one knock-on effect of using AI here and who it would affect.",
          minWords: 60,
        },
        {
          id: "action",
          label: "Your next step",
          prompt: "What is one small change you could make this week, and how would you know whether it helped?",
          minWords: 30,
        },
      ],
    },
  },
];
