// Loop Mapper challenges. Text: "studio.loop-mapper.ch.<id>.*" and
// variable names "studio.loop-mapper.v.<key>".

import type { Link, Req } from "./model";

export interface LoopChallenge {
  id: string;
  difficulty: 1 | 2 | 3;
  /** Word bank: variables the learner can place (some are distractors). */
  bank: string[];
  /** Variables (and links) already on the map at the start. */
  start: { vars: string[]; links?: Omit<Link, "id">[] };
  /** Three tiers of requirements: star 1, 2, 3. */
  tiers: [Req[], Req[], Req[]];
}

const L = (from: string, to: string, pol: 1 | -1 = 1, delay?: true): Req => ({ t: "link", from, to, pol, ...(delay ? { delay } : {}) });

export const LOOP_CHALLENGES: LoopChallenge[] = [
  {
    id: "reviews-loop",
    difficulty: 1,
    bank: ["customers", "reviews", "price"],
    start: { vars: ["customers", "reviews"] },
    tiers: [
      [L("customers", "reviews"), L("reviews", "customers")],
      [{ t: "loop", nodes: ["customers", "reviews"], kind: "R" }],
      [{ t: "simulated" }],
    ],
  },
  {
    id: "capacity-limit",
    difficulty: 2,
    bank: ["customers", "reviews", "wait", "staff_morale"],
    start: {
      vars: ["customers", "reviews"],
      links: [
        { from: "customers", to: "reviews", pol: 1, delay: false },
        { from: "reviews", to: "customers", pol: 1, delay: false },
      ],
    },
    tiers: [
      [L("customers", "reviews"), L("reviews", "customers"), L("customers", "wait"), L("wait", "reviews", -1)],
      [
        { t: "loop", nodes: ["customers", "reviews"], kind: "R" },
        { t: "loop", nodes: ["customers", "wait", "reviews"], kind: "B" },
      ],
      [L("reviews", "customers", 1, true)],
    ],
  },
  {
    id: "review-bottleneck",
    difficulty: 2,
    bank: ["ai_drafts", "queue", "rushed", "errors", "rework", "wip_limit", "prompt_quality"],
    start: { vars: ["ai_drafts", "queue"] },
    tiers: [
      [L("ai_drafts", "queue"), L("queue", "rushed"), L("rushed", "errors"), L("errors", "rework"), L("rework", "queue")],
      [{ t: "loop", nodes: ["queue", "rushed", "errors", "rework"], kind: "R" }],
      [L("queue", "wip_limit"), L("wip_limit", "ai_drafts", -1), { t: "anyLoop", through: "wip_limit", kind: "B" }],
    ],
  },
  {
    id: "tech-debt",
    difficulty: 2,
    bank: ["pressure", "shortcuts", "debt", "bugs", "firefighting", "coffee"],
    start: { vars: ["pressure"] },
    tiers: [
      [L("pressure", "shortcuts"), L("shortcuts", "debt"), L("debt", "bugs"), L("bugs", "firefighting"), L("firefighting", "pressure")],
      [{ t: "loop", nodes: ["pressure", "shortcuts", "debt", "bugs", "firefighting"], kind: "R" }],
      [L("debt", "bugs", 1, true)],
    ],
  },
  {
    id: "screen-time",
    difficulty: 2,
    bank: ["screen", "tired", "grumpy", "conflict", "limits", "outdoor"],
    start: { vars: ["screen"] },
    tiers: [
      [L("screen", "tired"), L("tired", "grumpy"), L("grumpy", "conflict"), L("conflict", "screen")],
      [{ t: "loop", nodes: ["screen", "tired", "grumpy", "conflict"], kind: "R" }],
      [L("screen", "limits"), L("limits", "screen", -1), { t: "anyLoop", through: "limits", kind: "B" }],
    ],
  },
  {
    id: "goodhart",
    difficulty: 3,
    bank: ["usage_reward", "busywork", "logged_usage", "outcomes", "training"],
    start: { vars: ["usage_reward", "logged_usage"] },
    tiers: [
      [L("usage_reward", "busywork"), L("busywork", "logged_usage"), L("logged_usage", "usage_reward"), L("busywork", "outcomes", -1)],
      [{ t: "loop", nodes: ["usage_reward", "busywork", "logged_usage"], kind: "R" }],
      [L("outcomes", "usage_reward"), { t: "anyLoop", through: "outcomes", kind: "B" }],
    ],
  },
  {
    id: "ai-adoption",
    difficulty: 3,
    bank: ["usage", "saved", "trust", "unchecked", "mistakes", "review", "hype"],
    start: { vars: ["usage", "trust"] },
    tiers: [
      [L("usage", "saved"), L("saved", "trust"), L("trust", "usage"), L("usage", "unchecked"), L("unchecked", "mistakes"), L("mistakes", "trust", -1)],
      [
        { t: "loop", nodes: ["usage", "saved", "trust"], kind: "R" },
        { t: "loop", nodes: ["usage", "unchecked", "mistakes", "trust"], kind: "B" },
      ],
      [L("unchecked", "mistakes", 1, true), L("review", "unchecked", -1)],
    ],
  },
];

export const LOOP_CHALLENGE_BY_ID = new Map(LOOP_CHALLENGES.map((c) => [c.id, c]));
