// System Mapper (AI-Empowered Youth): a small stock-and-flow model.
//
//   Stock (box): a pile that builds up or drains: students in a line, coins.
//   Flow (pill): how much moves or changes each step: serving, rewards.
//
// Each step, every flow is worked out from what feeds into it:
//   flow = start value + sum(sign x strength x source), capped by its
//   capacity (plus 2 per helper), never below 0.
// Then every stock changes by sum(sign x strength x source) of its arrows.
// An arrow with a delay reads its source from 3 steps earlier.
// Loops (cycles of arrows) are reinforcing (R) with an even number of "-"
// arrows and balancing (B) with an odd number. Pure functions, no React.

import { findLoops as findCycles, type Loop } from "../loops/model";

export type NodeKind = "stock" | "flow";
export type Pol = 1 | -1;

export interface SNode {
  id: string;
  /** Parts-bin key (label from the dictionary). */
  key?: string;
  /** Typed by the learner (Free play). */
  label?: string;
  kind: NodeKind;
  x: number;
  y: number;
  /** Stock: starting amount. Flow: value each step before arrows. */
  init: number;
  /** Flow: the most it can be per step (a bottleneck when small). */
  cap?: number;
  /** Lunch queue: helpers added to this flow (each adds HELPER to the cap). */
  helpers?: number;
  /** Flow: its start value only applies before this step (e.g. arrivals stop). */
  until?: number;
  /** Part of the challenge: can't be deleted. */
  fixed?: boolean;
}

export interface SLink {
  id: string;
  from: string;
  to: string;
  pol: Pol;
  /** Strength: how much of the source passes along the arrow. */
  w: number;
  delay: boolean;
  fixed?: boolean;
}

export interface SysState {
  v: 1;
  nodes: SNode[];
  links: SLink[];
  /** Learner's R/B label per loop signature. */
  labels: Record<string, "R" | "B">;
  /** The simulation was played to the end since the last change. */
  ran: boolean;
  /** Lunch queue: the flow picked as the bottleneck. */
  pick: string | null;
  /** Answer to the challenge question. */
  q: string | null;
}

export const W = 640;
export const H = 420;
export const STEPS = 20;
export const HELPER = 2;
export const DELAY = 3;
export const STRENGTHS = [0.05, 0.1, 0.25, 0.5, 1];
export const MAX_NODES = 12;
export const MAX_LINKS = 24;
export const MAX_VALUE = 9999;

export const capOf = (n: SNode) => (n.cap === undefined ? undefined : n.cap + (n.helpers ?? 0) * HELPER);

/** Values of every node for steps 0..steps (series[i] belongs to nodes[i]). */
export function simulate(nodes: SNode[], links: SLink[], steps = STEPS): number[][] {
  const idx = new Map(nodes.map((n, i) => [n.id, i]));
  const into = nodes.map((n) => links.filter((l) => l.to === n.id && idx.has(l.from) && l.from !== l.to));
  const hist: number[][] = [];
  let stocks = nodes.map((n) => (n.kind === "stock" ? n.init : 0));
  const flowsAt = (t: number, cur: number[]) => {
    const vals = cur.slice();
    // Two passes so a flow that feeds another flow is counted in the same step.
    for (let pass = 0; pass < 2; pass++) {
      nodes.forEach((n, i) => {
        if (n.kind !== "flow") return;
        let v = n.until === undefined || t < n.until ? n.init : 0;
        for (const l of into[i]) {
          const j = idx.get(l.from)!;
          const src = l.delay ? (hist[Math.max(0, t - DELAY)]?.[j] ?? vals[j]) : vals[j];
          v += l.pol * l.w * src;
        }
        const cap = capOf(n);
        if (cap !== undefined) v = Math.min(v, cap);
        vals[i] = Math.max(0, Math.min(MAX_VALUE, v));
      });
    }
    return vals;
  };
  for (let t = 0; t <= steps; t++) {
    const row = flowsAt(t, stocks);
    hist.push(row);
    if (t === steps) break;
    const next = row.slice();
    nodes.forEach((n, i) => {
      if (n.kind !== "stock") return;
      let s = row[i];
      for (const l of into[i]) {
        const j = idx.get(l.from)!;
        const src = l.delay ? (hist[Math.max(0, t - DELAY)]?.[j] ?? row[j]) : row[j];
        s += l.pol * l.w * src;
      }
      next[i] = Math.max(0, Math.min(MAX_VALUE, s));
    });
    stocks = next;
  }
  return nodes.map((_, i) => hist.map((row) => Math.round(row[i] * 10) / 10));
}

/** Every loop (cycle of arrows), named R1, B1... (shared with Loop Mapper). */
export function loopsOf(nodes: SNode[], links: SLink[]): Loop[] {
  return findCycles(nodes, links);
}

/** A loop that goes through all these node ids (any order), if there is one. */
export function loopThrough(loops: Loop[], ids: string[]): Loop | undefined {
  return loops.find((lp) => ids.every((id) => lp.nodes.includes(id)) && lp.nodes.length === ids.length);
}

// ── Parts bin ─────────────────────────────────────────────────────────────
export interface Part {
  kind: NodeKind;
  init: number;
  cap?: number;
}

export const PARTS: Record<string, Part> = {
  // Lunch queue
  arrive: { kind: "flow", init: 6 },
  foodLine: { kind: "stock", init: 0 },
  serve: { kind: "flow", init: 0, cap: 3 },
  tillLine: { kind: "stock", init: 0 },
  pay: { kind: "flow", init: 0, cap: 6 },
  eating: { kind: "stock", init: 0 },
  // Game economy
  coins: { kind: "stock", init: 100 },
  rewards: { kind: "flow", init: 5 },
  prices: { kind: "flow", init: 10 },
  spending: { kind: "flow", init: 0 },
  repairs: { kind: "flow", init: 0 },
  chests: { kind: "flow", init: 10 },
  // Football team
  confidence: { kind: "stock", init: 50 },
  practice: { kind: "flow", init: 2 },
  skill: { kind: "stock", init: 50 },
  wins: { kind: "flow", init: 0 },
  tiredness: { kind: "stock", init: 10 },
  rest: { kind: "flow", init: 2 },
  rivals: { kind: "stock", init: 0 },
  // Free play extras
  followers: { kind: "stock", init: 100 },
  posts: { kind: "flow", init: 2 },
  plants: { kind: "stock", init: 20 },
  water: { kind: "flow", init: 5 },
};

export const SANDBOX_BANK = ["coins", "rewards", "spending", "confidence", "practice", "skill", "wins", "tiredness", "rest", "followers", "posts", "plants", "water"];

// ── Challenges ────────────────────────────────────────────────────────────
export interface SysChallenge {
  id: string;
  /** Unit of one step: "minute", "day", "week". */
  unit: string;
  /** Can the learner add or delete parts and arrows? */
  editable: boolean;
  /** Parts they may add (keys of PARTS). */
  bank: string[];
  start: () => { nodes: SNode[]; links: SLink[] };
  /** Nodes drawn on the chart by default. */
  chart: string[];
}

const node = (key: string, x: number, y: number, extra: Partial<SNode> = {}): SNode => ({ id: key, key, x, y, fixed: true, ...PARTS[key], ...extra });
const link = (from: string, to: string, pol: Pol, w: number, extra: Partial<SLink> = {}): SLink => ({ id: `${from}>${to}`, from, to, pol, w, delay: false, fixed: true, ...extra });

export const SYS_CHALLENGES: SysChallenge[] = [
  {
    id: "lunch-queue",
    unit: "minute",
    editable: false,
    bank: [],
    chart: ["foodLine", "tillLine", "eating"],
    start: () => ({
      nodes: [
        node("arrive", 90, 80, { until: 10 }),
        node("foodLine", 290, 80),
        node("serve", 500, 80),
        node("tillLine", 500, 250),
        node("pay", 290, 250),
        node("eating", 90, 250),
      ],
      links: [
        link("arrive", "foodLine", 1, 1),
        link("foodLine", "serve", 1, 1),
        link("serve", "foodLine", -1, 1),
        link("serve", "tillLine", 1, 1),
        link("tillLine", "pay", 1, 1),
        link("pay", "tillLine", -1, 1),
        link("pay", "eating", 1, 1),
      ],
    }),
  },
  {
    id: "game-economy",
    unit: "day",
    editable: true,
    bank: ["spending", "repairs", "chests"],
    chart: ["coins", "prices"],
    start: () => ({
      nodes: [node("coins", 320, 200), node("rewards", 130, 90), node("prices", 520, 90)],
      links: [link("coins", "rewards", 1, 0.2), link("rewards", "coins", 1, 1), link("coins", "prices", 1, 0.05)],
    }),
  },
  {
    id: "feedback-loops",
    unit: "week",
    editable: true,
    bank: [],
    chart: ["confidence", "skill", "tiredness"],
    start: () => ({
      nodes: [
        node("confidence", 110, 90),
        node("practice", 320, 90),
        node("skill", 530, 90),
        node("wins", 420, 250),
        node("tiredness", 210, 250),
        node("rivals", 560, 360),
        node("rest", 90, 360),
      ],
      links: [
        link("confidence", "practice", 1, 0.1),
        link("practice", "skill", 1, 0.2),
        link("skill", "wins", 1, 0.05),
        link("practice", "tiredness", 1, 0.5),
        link("tiredness", "practice", -1, 0.1),
        link("wins", "rivals", 1, 1),
        link("rivals", "wins", -1, 0.02),
        link("rest", "tiredness", -1, 1),
      ],
    }),
  },
];

export const SYS_BY_ID = new Map(SYS_CHALLENGES.map((c) => [c.id, c]));

export function isSysState(v: unknown): v is SysState {
  const s = v as SysState;
  if (!s || typeof s !== "object" || s.v !== 1 || !Array.isArray(s.nodes) || !Array.isArray(s.links)) return false;
  if (s.nodes.length > MAX_NODES + 2 || s.links.length > MAX_LINKS + 4) return false;
  const okNode = (n: SNode) =>
    !!n &&
    typeof n.id === "string" &&
    (n.kind === "stock" || n.kind === "flow") &&
    typeof n.x === "number" &&
    typeof n.y === "number" &&
    typeof n.init === "number" &&
    (n.key === undefined || n.key in PARTS) &&
    (n.label === undefined || (typeof n.label === "string" && n.label.length <= 40));
  const okLink = (l: SLink) => !!l && typeof l.id === "string" && typeof l.from === "string" && typeof l.to === "string" && (l.pol === 1 || l.pol === -1) && typeof l.w === "number" && typeof l.delay === "boolean";
  return s.nodes.every(okNode) && s.links.every(okLink) && !!s.labels && typeof s.labels === "object" && typeof s.ran === "boolean";
}

export function freshSys(id: string): SysState {
  const ch = SYS_BY_ID.get(id);
  const start = ch ? ch.start() : { nodes: [], links: [] };
  return { v: 1, nodes: start.nodes, links: start.links, labels: {}, ran: false, pick: null, q: null };
}

/** A tidy y-axis step for a maximum value (1, 2, 5 x 10^n). */
export function niceStep(max: number, ticks = 4): number {
  const raw = Math.max(1, max) / ticks;
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}
