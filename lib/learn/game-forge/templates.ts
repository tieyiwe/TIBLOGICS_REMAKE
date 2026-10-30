// Game Forge: the starter game for each template, and a few ready-made parts
// (themes, the lava level) used by quick changes. Client-safe. Starter texts
// are English: the kid renames everything in their own words.
import type { AdventureConfig, ClickerConfig, GameConfig, PlatformerConfig, QuizConfig, TemplateId } from "./schema";

export const THEMES = {
  sunset: { bg: "#FFF4E6", panel: "#F47C20", text: "#2B1A0E", accent: "#E8590C" },
  ocean: { bg: "#E7F5FF", panel: "#1C7ED6", text: "#0B2545", accent: "#15AABF" },
  forest: { bg: "#EBFBEE", panel: "#2F9E44", text: "#10301A", accent: "#F59F00" },
  space: { bg: "#0B1026", panel: "#5F3DC4", text: "#F1F3FF", accent: "#FCC419" },
  candy: { bg: "#FFF0F6", panel: "#D6336C", text: "#3B0A1F", accent: "#7048E8" },
  night: { bg: "#101418", panel: "#343A40", text: "#F8F9FA", accent: "#40C057" },
} as const;
export type ThemeName = keyof typeof THEMES;

const CLICKER: ClickerConfig = {
  template: "clicker",
  title: "Snack Factory",
  theme: { ...THEMES.sunset },
  winText: "You built a snack empire!",
  clickEmoji: "🍪",
  currencyName: "snacks",
  currencyEmoji: "🍪",
  perClick: 1,
  goal: 200,
  items: [
    { name: "Helper", emoji: "🧑‍🍳", cost: 15, perSecond: 1 },
    { name: "Oven", emoji: "🔥", cost: 100, perSecond: 5 },
  ],
  upgrades: [{ name: "Golden spoon", emoji: "🥄", cost: 50, clickBonus: 1 }],
};

const QUIZ: QuizConfig = {
  template: "quiz",
  title: "My Quiz",
  theme: { ...THEMES.ocean },
  winText: "Quiz champion!",
  topic: "Animals",
  timer: 15,
  lives: 3,
  questions: [
    { q: "Which animal is the biggest?", answers: ["Blue whale", "Elephant", "Giraffe"], correct: 0 },
    { q: "How many legs does a spider have?", answers: ["6", "8", "10"], correct: 1 },
    { q: "What do bees make?", answers: ["Milk", "Honey", "Silk"], correct: 1 },
  ],
};

export const STARTER_LEVEL = {
  name: "Green Hills",
  rows: [
    "........................",
    "........................",
    "........................",
    "...............C........",
    "..............###.......",
    "..........C............G",
    ".........###.........###",
    "....C..............#####",
    ".P.......E.....C...#####",
    "######..################",
  ],
};

/** Added by the "lava level" quick change. */
export const LAVA_LEVEL = {
  name: "Lava Run",
  rows: [
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "...........C..........G.",
    "..........###........###",
    "....C..............#####",
    ".P.......E....##...#####",
    "####LLL#####LLLL###LLLLL",
  ],
};

const PLATFORMER: PlatformerConfig = {
  template: "platformer",
  title: "Hop Hero",
  theme: { ...THEMES.forest },
  winText: "You beat every level!",
  playerEmoji: "🐸",
  coinEmoji: "🪙",
  enemyEmoji: "🐌",
  goalEmoji: "🏁",
  speed: 5,
  jump: 5,
  gravity: 5,
  lives: 3,
  levels: [STARTER_LEVEL],
};

const ADVENTURE: AdventureConfig = {
  template: "adventure",
  title: "Lost Map Island",
  theme: { ...THEMES.candy },
  winText: "Quest complete. You are a true hero!",
  playerEmoji: "🧒",
  map: {
    rows: [
      "############",
      "#P.....T...#",
      "#..##......#",
      "#..##..~~..#",
      "#......~~..#",
      "#.T........#",
      "#......T...#",
      "############",
    ],
  },
  npcs: [{ name: "Pip", emoji: "🦊", x: 9, y: 2, personality: "", greeting: "Hi! I'm Pip.", lines: ["I lost my map somewhere on this island..."] }],
  items: [
    { name: "Map", emoji: "🗺️", x: 2, y: 6 },
    { name: "Gem", emoji: "💎", x: 10, y: 6 },
  ],
  quest: { giver: 0, item: 0, ask: "Can you find my map? I think it is near the trees.", thanks: "My map! Thank you so much!" },
};

const STARTERS: Record<TemplateId, GameConfig> = { clicker: CLICKER, quiz: QUIZ, platformer: PLATFORMER, adventure: ADVENTURE };

/** A fresh copy of the starter game. */
export function starterConfig(t: TemplateId): GameConfig {
  return structuredClone(STARTERS[t]);
}

export const TEMPLATE_ICON: Record<TemplateId, string> = { clicker: "🍪", quiz: "❓", platformer: "🐸", adventure: "🗺️" };
