// Critic Mode: scenarios with an agreeable (sycophantic) reply to dissect and
// hidden issues that critic moves uncover. Text lives in
// lib/i18n/messages/studio-critic-mode.ts.

export const MOVES = ["steelman", "premortem", "redteam", "objections", "changeMind", "skeptic", "confidence", "systems", "noPraise"] as const;
export type Move = (typeof MOVES)[number];

export const MOVE_EMOJI: Record<Move, string> = {
  steelman: "⚖️",
  premortem: "🪦",
  redteam: "🛡️",
  objections: "3️⃣",
  changeMind: "🔄",
  skeptic: "🤨",
  confidence: "📊",
  systems: "🕸️",
  noPraise: "🚫",
};

/** Moves that change tone but not depth: they do not count against stars. */
export const FREE_MOVES: Move[] = ["noPraise"];

export type Kind = "flattery" | "premise" | "noCounter" | "hedge" | "fine";

export interface CriticScenario {
  id: string;
  /** Kind of each sentence s1..s5 in the agreeable reply. */
  sentences: Kind[];
  /** Hidden issues and the moves that uncover each. */
  issues: { id: string; by: Move[] }[];
}

export const CRITIC_SCENARIOS: CriticScenario[] = [
  {
    id: "bakery",
    sentences: ["flattery", "premise", "noCounter", "hedge", "fine"],
    issues: [
      { id: "time", by: ["premortem", "systems", "skeptic"] },
      { id: "cash", by: ["premortem", "objections", "skeptic"] },
      { id: "area", by: ["changeMind", "steelman", "confidence"] },
      { id: "timeline", by: ["redteam", "premortem", "confidence"] },
      { id: "reputation", by: ["systems", "redteam"] },
    ],
  },
  {
    id: "launch",
    sentences: ["flattery", "premise", "fine", "noCounter", "hedge"],
    issues: [
      { id: "support", by: ["premortem", "redteam", "skeptic"] },
      { id: "privacy", by: ["redteam", "skeptic", "systems"] },
      { id: "metric", by: ["changeMind", "confidence", "objections"] },
      { id: "channel", by: ["objections", "premortem", "steelman"] },
      { id: "access", by: ["systems", "steelman"] },
    ],
  },
  {
    id: "clinic-policy",
    sentences: ["flattery", "premise", "fine", "noCounter", "hedge"],
    issues: [
      { id: "exclusion", by: ["systems", "steelman", "skeptic"] },
      { id: "urgent", by: ["redteam", "skeptic", "premortem"] },
      { id: "shift", by: ["systems", "premortem"] },
      { id: "legal", by: ["objections", "redteam"] },
      { id: "measure", by: ["changeMind", "confidence"] },
    ],
  },
  {
    id: "screen-ban",
    sentences: ["flattery", "premise", "noCounter", "fine", "hedge"],
    issues: [
      { id: "cause", by: ["changeMind", "confidence", "steelman"] },
      { id: "social", by: ["steelman", "systems"] },
      { id: "secrecy", by: ["premortem", "redteam"] },
      { id: "voice", by: ["objections", "steelman", "skeptic"] },
      { id: "family", by: ["systems", "skeptic"] },
    ],
  },
  {
    id: "json-file",
    sentences: ["flattery", "premise", "fine", "noCounter", "hedge"],
    issues: [
      { id: "concurrency", by: ["redteam", "skeptic", "premortem"] },
      { id: "growth", by: ["premortem", "systems"] },
      { id: "backup", by: ["objections", "redteam"] },
      { id: "privacy", by: ["redteam", "systems", "skeptic"] },
      { id: "evidence", by: ["changeMind", "confidence", "steelman"] },
    ],
  },
];

export function uncovered(sc: CriticScenario, moves: Move[]): string[] {
  return sc.issues.filter((i) => i.by.some((m) => moves.includes(m))).map((i) => i.id);
}

export function countedMoves(moves: Move[]): number {
  return moves.filter((m) => !FREE_MOVES.includes(m)).length;
}

/** 4 of 5 issues completes the challenge; all 5 in 3 moves is perfect. */
export function criticStars(found: number, total: number, used: number): 0 | 1 | 2 | 3 {
  if (found < total - 1) return 0;
  if (found === total && used <= 3) return 3;
  if (found === total && used <= 5) return 2;
  return 1;
}
