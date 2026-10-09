// Game Forge (AI-Empowered Youth Studio tool): the game config, validated.
//
// A game is a JSON config for one of four templates, rendered by the canvas
// engine in ./engine.ts. Everything a change can produce (the AI's patches,
// quick changes, the kid's own edits, a version restored) goes through
// `parseConfig`: strict objects (no unknown keys), bounded numbers, short
// strings, and the text filter on every string. Client-safe (no server
// imports), so the editor shows the same errors the server returns.
import { z } from "zod";
import { gameTextProblem } from "./filter";

export const TEMPLATES = ["clicker", "quiz", "platformer", "adventure"] as const;
export type TemplateId = (typeof TEMPLATES)[number];

/** Largest config the server stores (bytes of JSON). */
export const MAX_CONFIG_BYTES = 24_000;

// Platformer levels are grids of single characters, always this many rows.
export const LEVEL_H = 10;
export const LEVEL_W_MIN = 12;
export const LEVEL_W_MAX = 48;
export const MAX_LEVELS = 5;
/**  .  empty   #  ground   C  coin   E  enemy   L  lava   P  start   G  goal */
export const PLAT_TILES = [".", "#", "C", "E", "L", "P", "G"] as const;

// Adventure maps: terrain only. People and things have x/y positions.
export const MAP_H_MIN = 6;
export const MAP_H_MAX = 14;
export const MAP_W_MIN = 8;
export const MAP_W_MAX = 24;
/**  .  floor   #  wall   T  tree   ~  water   P  start */
export const MAP_TILES = [".", "#", "T", "~", "P"] as const;
export const MAX_NPCS = 4;
export const MAX_ITEMS = 6;

// ── Text ────────────────────────────────────────────────────────────────────

const txt = (max: number, min = 0) =>
  z
    .string()
    .min(min)
    .max(max)
    .superRefine((s, ctx) => {
      const p = gameTextProblem(s);
      if (p) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `text:${p}` });
    });

/** An emoji or a couple of characters drawn as the art. */
const emo = txt(16, 1);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const int = (min: number, max: number) => z.number().int().min(min).max(max);

const Theme = z.object({ bg: hex, panel: hex, text: hex, accent: hex }).strict();

const base = {
  title: txt(40, 1),
  theme: Theme,
  winText: txt(140),
};

// ── Templates ──────────────────────────────────────────────────────────────

const Clicker = z
  .object({
    template: z.literal("clicker"),
    ...base,
    clickEmoji: emo,
    currencyName: txt(20, 1),
    currencyEmoji: emo,
    perClick: int(1, 1000),
    goal: int(10, 1_000_000),
    items: z
      .array(z.object({ name: txt(24, 1), emoji: emo, cost: int(1, 1_000_000), perSecond: int(0, 10_000) }).strict())
      .min(1)
      .max(8),
    upgrades: z.array(z.object({ name: txt(24, 1), emoji: emo, cost: int(1, 1_000_000), clickBonus: int(1, 1000) }).strict()).max(8),
  })
  .strict();

const Question = z
  .object({ q: txt(140, 1), answers: z.array(txt(60, 1)).min(2).max(4), correct: int(0, 3) })
  .strict();

const Quiz = z
  .object({
    template: z.literal("quiz"),
    ...base,
    topic: txt(40, 1),
    timer: int(5, 60),
    lives: int(1, 5),
    questions: z.array(Question).min(1).max(20),
  })
  .strict();

const Level = z
  .object({
    name: txt(30, 1),
    rows: z.array(z.string().regex(/^[.#CELPG]+$/).min(LEVEL_W_MIN).max(LEVEL_W_MAX)).length(LEVEL_H),
  })
  .strict();

const Platformer = z
  .object({
    template: z.literal("platformer"),
    ...base,
    playerEmoji: emo,
    coinEmoji: emo,
    enemyEmoji: emo,
    goalEmoji: emo,
    speed: int(1, 10),
    jump: int(1, 10),
    gravity: int(1, 10),
    lives: int(1, 9),
    levels: z.array(Level).min(1).max(MAX_LEVELS),
  })
  .strict();

const Npc = z
  .object({
    name: txt(24, 1),
    emoji: emo,
    x: int(0, MAP_W_MAX - 1),
    y: int(0, MAP_H_MAX - 1),
    personality: txt(100),
    greeting: txt(140),
    lines: z.array(txt(140, 1)).max(6),
    /** Written by the AI character helper (lib/learn/game-forge/ai.ts). */
    ai: z.boolean().optional(),
  })
  .strict();

const Item = z.object({ name: txt(24, 1), emoji: emo, x: int(0, MAP_W_MAX - 1), y: int(0, MAP_H_MAX - 1) }).strict();

const Adventure = z
  .object({
    template: z.literal("adventure"),
    ...base,
    playerEmoji: emo,
    map: z.object({ rows: z.array(z.string().regex(/^[.#T~P]+$/).min(MAP_W_MIN).max(MAP_W_MAX)).min(MAP_H_MIN).max(MAP_H_MAX) }).strict(),
    npcs: z.array(Npc).max(MAX_NPCS),
    items: z.array(Item).max(MAX_ITEMS),
    quest: z.object({ giver: int(0, MAX_NPCS - 1), item: int(0, MAX_ITEMS - 1), ask: txt(140, 1), thanks: txt(140, 1) }).strict().nullable(),
  })
  .strict();

const count = (rows: string[], ch: string) => rows.reduce((n, r) => n + r.split(ch).length - 1, 0);

export const ConfigSchema = z.discriminatedUnion("template", [Clicker, Quiz, Platformer, Adventure]).superRefine((c, ctx) => {
  const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
  if (c.template === "quiz") {
    c.questions.forEach((q, i) => {
      if (q.correct >= q.answers.length) issue(["questions", i, "correct"], "quiz:correct");
      if (new Set(q.answers.map((a) => a.trim().toLowerCase())).size !== q.answers.length) issue(["questions", i, "answers"], "quiz:duplicate");
    });
  }
  if (c.template === "platformer") {
    c.levels.forEach((l, i) => {
      const w = l.rows[0]?.length ?? 0;
      if (l.rows.some((r) => r.length !== w)) issue(["levels", i, "rows"], "level:width");
      if (count(l.rows, "P") !== 1) issue(["levels", i, "rows"], "level:start");
      if (count(l.rows, "G") !== 1) issue(["levels", i, "rows"], "level:goal");
      if (count(l.rows, "E") > 30) issue(["levels", i, "rows"], "level:enemies");
    });
  }
  if (c.template === "adventure") {
    const rows = c.map.rows;
    const w = rows[0]?.length ?? 0;
    if (rows.some((r) => r.length !== w)) issue(["map", "rows"], "map:width");
    if (count(rows, "P") !== 1) issue(["map", "rows"], "map:start");
    const taken = new Set<string>();
    for (let y = 0; y < rows.length; y++) {
      const x = rows[y].indexOf("P");
      if (x >= 0) taken.add(`${x},${y}`);
    }
    const place = (kind: "npcs" | "items", i: number, x: number, y: number) => {
      const ch = rows[y]?.[x];
      if (ch === undefined) return issue([kind, i], "map:outside");
      if (ch === "#" || ch === "T" || ch === "~") return issue([kind, i], "map:blocked");
      const k = `${x},${y}`;
      if (taken.has(k)) return issue([kind, i], "map:overlap");
      taken.add(k);
    };
    c.npcs.forEach((n, i) => place("npcs", i, n.x, n.y));
    c.items.forEach((it, i) => place("items", i, it.x, it.y));
    if (c.quest) {
      if (c.quest.giver >= c.npcs.length) issue(["quest", "giver"], "quest:giver");
      if (c.quest.item >= c.items.length) issue(["quest", "item"], "quest:item");
    }
  }
});

export type GameConfig = z.infer<typeof ConfigSchema>;
export type ClickerConfig = Extract<GameConfig, { template: "clicker" }>;
export type QuizConfig = Extract<GameConfig, { template: "quiz" }>;
export type PlatformerConfig = Extract<GameConfig, { template: "platformer" }>;
export type AdventureConfig = Extract<GameConfig, { template: "adventure" }>;

export const configBytes = (c: unknown) => new TextEncoder().encode(JSON.stringify(c)).length;

export interface ConfigIssue {
  path: string;
  /** "text:links", "level:start", "too_big", or a zod code such as "too_small". */
  code: string;
}

/** The validated config, or the problems (first few) with it. */
export function parseConfig(input: unknown): { ok: true; config: GameConfig } | { ok: false; issues: ConfigIssue[] } {
  let bytes = 0;
  try {
    bytes = configBytes(input);
  } catch {
    return { ok: false, issues: [{ path: "", code: "invalid" }] };
  }
  if (bytes > MAX_CONFIG_BYTES) return { ok: false, issues: [{ path: "", code: "too_big" }] };
  const r = ConfigSchema.safeParse(input);
  if (r.success) return { ok: true, config: r.data };
  return {
    ok: false,
    issues: r.error.issues.slice(0, 8).map((i) => ({ path: i.path.join("."), code: i.code === "custom" ? i.message : i.code })),
  };
}

export const isTemplate = (v: unknown): v is TemplateId => typeof v === "string" && (TEMPLATES as readonly string[]).includes(v);

// ── Platformer physics (shared by the engine and the reachability check) ──

export interface Physics {
  /** Running speed, tiles per second. */
  run: number;
  /** Take-off speed, tiles per second. */
  jumpV: number;
  /** Tiles per second squared. */
  g: number;
  /** Highest point of a jump, in tiles. */
  height: number;
}

export function physics(c: { speed: number; jump: number; gravity: number }): Physics {
  const height = 1.25 + 0.35 * c.jump;
  const g = 18 + 3 * c.gravity;
  return { run: 3 + 0.6 * c.speed, jumpV: Math.sqrt(2 * g * height), g, height };
}
