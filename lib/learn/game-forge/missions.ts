// Game Forge challenges: which template each one uses and its three missions
// (stars count in order, as in the other youth tools). Pure: the tool passes
// the game on screen and what happened in the preview since it last changed.
import { countChanges } from "./patch";
import { checkLevels } from "./reach";
import { parseConfig, type GameConfig, type TemplateId } from "./schema";
import { starterConfig } from "./templates";

export const CHALLENGES = ["clicker-remix", "quiz-maker", "platformer-levels", "npc-friend"] as const;
export type ChallengeId = (typeof CHALLENGES)[number];

export const CHALLENGE_TEMPLATE: Record<ChallengeId, TemplateId> = {
  "clicker-remix": "clicker",
  "quiz-maker": "quiz",
  "platformer-levels": "platformer",
  "npc-friend": "adventure",
};

/** What the preview reported (reset whenever the game changes). */
export interface PlayLog {
  clicks: number;
  bought: boolean;
  won: boolean;
  quiz: { score: number; total: number; answered: number } | null;
  /** Platformer: indexes of levels finished. */
  levels: number[];
  allCoins: boolean;
  quest: boolean;
  questAllItems: boolean;
}

export const EMPTY_LOG: PlayLog = { clicks: 0, bought: false, won: false, quiz: null, levels: [], allCoins: false, quest: false, questAllItems: false };

export interface MissionState {
  id: string;
  done: boolean;
}

/** The missions for a challenge, in star order. Labels: studio.game-forge.ch.<id>.m<n>. */
export function missions(ch: ChallengeId, c: GameConfig, log: PlayLog): MissionState[] {
  const valid = parseConfig(c).ok;
  if (ch === "clicker-remix" && c.template === "clicker") {
    const changed = countChanges(c, starterConfig("clicker")) >= 3;
    return [
      { id: "m1", done: valid && changed && log.clicks >= 10 },
      { id: "m2", done: valid && changed && log.bought },
      { id: "m3", done: valid && changed && log.won },
    ];
  }
  if (ch === "quiz-maker" && c.template === "quiz") {
    const starter = starterConfig("quiz");
    const starterQs = new Set(starter.template === "quiz" ? starter.questions.map((q) => q.q.trim().toLowerCase()) : []);
    const own = c.questions.filter((q) => !starterQs.has(q.q.trim().toLowerCase()) && !/write it here/i.test(q.q));
    const made = valid && own.length >= 5 && c.questions.length >= 5 && c.topic.trim().toLowerCase() !== (starter as { topic: string }).topic.toLowerCase();
    const played = made && !!log.quiz && log.quiz.total === c.questions.length && log.quiz.answered === log.quiz.total;
    return [
      { id: "m1", done: made },
      { id: "m2", done: played },
      { id: "m3", done: played && log.quiz!.score === log.quiz!.total },
    ];
  }
  if (ch === "platformer-levels" && c.template === "platformer") {
    const reach = checkLevels(c);
    const starterRows = JSON.stringify((starterConfig("platformer") as Extract<GameConfig, { template: "platformer" }>).levels[0].rows);
    const built = valid && c.levels.length >= 2 && reach.every((r) => r.ok) && c.levels.some((l) => JSON.stringify(l.rows) !== starterRows);
    const beaten = built && c.levels.every((_, i) => log.levels.includes(i));
    const danger = c.levels.every((l) => l.rows.some((r) => /[LE]/.test(r)));
    return [
      { id: "m1", done: beaten },
      { id: "m2", done: beaten && danger },
      { id: "m3", done: beaten && log.allCoins },
    ];
  }
  if (ch === "npc-friend" && c.template === "adventure") {
    const giver = c.quest ? c.npcs[c.quest.giver] : undefined;
    const friend = valid && !!giver && !!giver.ai && giver.personality.trim().length > 0;
    return [
      { id: "m1", done: friend && log.quest },
      { id: "m2", done: friend && log.quest && c.npcs.filter((n) => n.greeting.trim()).length >= 2 },
      { id: "m3", done: friend && log.quest && log.questAllItems && c.items.length >= 2 },
    ];
  }
  return [];
}
