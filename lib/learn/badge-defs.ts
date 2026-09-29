// Gamification definitions shared by server and client: badge metadata, rank
// emblems and the small pure helpers (module stars, quiz stars, combos).
// Client-safe: no database access and no dictionary, so it adds almost
// nothing to a bundle. Every visible string is a "game." dictionary key.

export type BadgeTier = "bronze" | "silver" | "gold";

export interface BadgeDef {
  id: string;
  icon: string;
  tier?: BadgeTier;
  /** How many of the thing unlock it (for the progress bar). */
  target: number;
  /** Progress reads as a percentage ("30% of 50%"). */
  unit?: "percent";
}

// Order is the display order on the shelf.
export const BADGES: BadgeDef[] = [
  { id: "first_steps", icon: "👣", target: 1 },
  { id: "streak_3", icon: "🔥", tier: "bronze", target: 3 },
  { id: "streak_7", icon: "🔥", tier: "silver", target: 7 },
  { id: "streak_30", icon: "🔥", tier: "gold", target: 30 },
  { id: "perfect_score", icon: "💯", target: 1 },
  { id: "quiz_master", icon: "🧠", target: 5 },
  { id: "prompt_crafter", icon: "⌨️", target: 1 },
  { id: "bug_hunter", icon: "🔍", target: 1 },
  { id: "code_shipper", icon: "🚀", target: 1 },
  { id: "systems_thinker", icon: "🧩", target: 1 },
  { id: "module_champion", icon: "⭐", target: 3 },
  { id: "halfway", icon: "⛰️", target: 50, unit: "percent" },
  { id: "track_finisher", icon: "🎓", target: 1 },
  { id: "distinction", icon: "🏅", target: 1 },
  { id: "track_explorer", icon: "🧭", target: 3 },
  { id: "polymath", icon: "🌍", target: 2 },
  { id: "studio_builder", icon: "🧪", target: 5 },
  { id: "studio_master", icon: "🏗️", target: 10 },
];

export const BADGE_BY_ID = new Map(BADGES.map((b) => [b.id, b]));

export const badgeNameKey = (id: string) => `game.badge.${id}.name`;
export const badgeDescKey = (id: string) => `game.badge.${id}.desc`;
export const badgeHowKey = (id: string) => `game.badge.${id}.how`;

/** Emblem per rank index from levelFor(). */
export const RANK_ICONS = ["🧭", "🛠️", "⚙️", "🏛️", "👑"];
export const rankIcon = (index: number) => RANK_ICONS[Math.max(0, Math.min(RANK_ICONS.length - 1, index))];

export const TIER_COLORS: Record<BadgeTier, string> = {
  bronze: "#B87333",
  silver: "#8A99A8",
  gold: "#D4A017",
};

/**
 * Three stars per module: every lesson done, the module quiz passed, a module
 * lab passed. A module with no quiz (or no lab) gives that star with the
 * lessons, so every module can reach three.
 */
export function moduleStars(m: {
  lessonsTotal: number;
  lessonsDone: number;
  hasQuiz: boolean;
  quizPassed: boolean;
  hasLab: boolean;
  labPassed: boolean;
}): { lessons: boolean; quiz: boolean; lab: boolean; count: number } {
  const lessons = m.lessonsTotal > 0 && m.lessonsDone >= m.lessonsTotal;
  const quiz = m.hasQuiz ? m.quizPassed : lessons;
  const lab = m.hasLab ? m.labPassed : lessons;
  return { lessons, quiz, lab, count: Number(lessons) + Number(quiz) + Number(lab) };
}

/** 3 = perfect, 2 = passed, 1 = had a go. */
export function quizStars(score: number, passScore: number): 1 | 2 | 3 {
  if (score >= 100) return 3;
  if (score >= passScore) return 2;
  return 1;
}

/** Longest run of consecutive correct answers, in the order shown. */
export function bestCombo(graded: Array<{ isCorrect: boolean }>): number {
  let best = 0;
  let run = 0;
  for (const g of graded) {
    run = g.isCorrect ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

/** What a points-awarding API adds to its response. */
export interface GameDelta {
  newBadges: string[];
  levelUp: { index: number } | null;
}
