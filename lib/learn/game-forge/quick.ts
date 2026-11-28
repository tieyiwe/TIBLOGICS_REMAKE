// Game Forge: one-tap changes ("Jump higher", "Add a lava level"). They work
// without the AI (and when it is busy or off), and go through the same
// preview, Apply or Undo as an AI change. Labels: studio.game-forge.quick.<id>.
import type { Op } from "./patch";
import type { AdventureConfig, ClickerConfig, GameConfig, PlatformerConfig, QuizConfig, TemplateId } from "./schema";
import { LAVA_LEVEL, THEMES, type ThemeName } from "./templates";

export interface QuickChange {
  id: string;
  icon: string;
  ops: (c: GameConfig) => Op[];
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const THEME_ORDER = Object.keys(THEMES) as ThemeName[];

const nextTheme: QuickChange = {
  id: "theme",
  icon: "🎨",
  ops: (c) => {
    const i = THEME_ORDER.findIndex((k) => THEMES[k].bg.toLowerCase() === c.theme.bg.toLowerCase());
    return [{ op: "set", path: "theme", value: { ...THEMES[THEME_ORDER[(i + 1) % THEME_ORDER.length]] } }];
  },
};

/** A free floor tile on an adventure map, away from the start, people and things. */
function freeTile(c: AdventureConfig, seed: number): { x: number; y: number } | null {
  const taken = new Set([...c.npcs, ...c.items].map((p) => `${p.x},${p.y}`));
  const spots: Array<{ x: number; y: number }> = [];
  c.map.rows.forEach((r, y) => [...r].forEach((ch, x) => ch === "." && !taken.has(`${x},${y}`) && spots.push({ x, y })));
  return spots.length ? spots[(seed * 7919) % spots.length] : null;
}

const QUICK: Record<TemplateId, QuickChange[]> = {
  clicker: [
    { id: "biggerClicks", icon: "💪", ops: (c) => [{ op: "set", path: "perClick", value: clamp((c as ClickerConfig).perClick * 2, 1, 1000) }] },
    {
      id: "cheaper",
      icon: "🏷️",
      ops: (c) => (c as ClickerConfig).items.map((it, i) => ({ op: "set" as const, path: `items/${i}/cost`, value: Math.max(1, Math.round(it.cost / 2)) })),
    },
    {
      id: "newItem",
      icon: "🤖",
      ops: (c) => ((c as ClickerConfig).items.length >= 8 ? [] : [{ op: "add", path: "items", value: { name: "Robot", emoji: "🤖", cost: 500, perSecond: 20 } }]),
    },
    { id: "lowerGoal", icon: "🎯", ops: (c) => [{ op: "set", path: "goal", value: clamp(Math.round((c as ClickerConfig).goal / 2), 10, 1_000_000) }] },
    nextTheme,
  ],
  quiz: [
    { id: "moreTime", icon: "⏱️", ops: (c) => [{ op: "set", path: "timer", value: clamp((c as QuizConfig).timer + 10, 5, 60) }] },
    { id: "moreLives", icon: "❤️", ops: (c) => [{ op: "set", path: "lives", value: clamp((c as QuizConfig).lives + 1, 1, 5) }] },
    {
      id: "addQuestion",
      icon: "➕",
      ops: (c) =>
        (c as QuizConfig).questions.length >= 20
          ? []
          : [{ op: "add", path: "questions", value: { q: `Question ${(c as QuizConfig).questions.length + 1}: write it here`, answers: ["Answer A", "Answer B", "Answer C"], correct: 0 } }],
    },
    nextTheme,
  ],
  platformer: [
    { id: "jumpHigher", icon: "🦘", ops: (c) => [{ op: "set", path: "jump", value: clamp((c as PlatformerConfig).jump + 2, 1, 10) }] },
    { id: "faster", icon: "⚡", ops: (c) => [{ op: "set", path: "speed", value: clamp((c as PlatformerConfig).speed + 2, 1, 10) }] },
    { id: "floaty", icon: "🎈", ops: (c) => [{ op: "set", path: "gravity", value: clamp((c as PlatformerConfig).gravity - 2, 1, 10) }] },
    { id: "lavaLevel", icon: "🌋", ops: (c) => ((c as PlatformerConfig).levels.length >= 5 ? [] : [{ op: "add", path: "levels", value: structuredClone(LAVA_LEVEL) }]) },
    { id: "moreLives", icon: "❤️", ops: (c) => [{ op: "set", path: "lives", value: clamp((c as PlatformerConfig).lives + 1, 1, 9) }] },
    nextTheme,
  ],
  adventure: [
    {
      id: "addNpc",
      icon: "🧙",
      ops: (c) => {
        const a = c as AdventureConfig;
        const at = freeTile(a, a.npcs.length + 3);
        return a.npcs.length >= 4 || !at ? [] : [{ op: "add", path: "npcs", value: { name: "Sage", emoji: "🧙", ...at, personality: "", greeting: "Hello, traveller!", lines: [] } }];
      },
    },
    {
      id: "addItem",
      icon: "⭐",
      ops: (c) => {
        const a = c as AdventureConfig;
        const at = freeTile(a, a.items.length + 11);
        return a.items.length >= 6 || !at ? [] : [{ op: "add", path: "items", value: { name: "Star", emoji: "⭐", ...at } }];
      },
    },
    nextTheme,
  ],
};

export function quickChanges(t: TemplateId): QuickChange[] {
  return QUICK[t];
}
