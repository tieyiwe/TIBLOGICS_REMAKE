// AI Graveyard Report (AGR Score™): the deterministic calculator behind the
// AGR MCP tool (app/mcp/route.ts). Ported unchanged from the owner's
// AGR-MCP-Service v1.0.0 (server.js), which takes the formula from the AGR
// skill's dashboard (SKILL.md, "AGR Free v3.2"): same categories, bands,
// strength weights, restart penalty, tiers and metrics. Facts in, scores
// out: nothing here reads history, calls out or stores anything.
import { z } from "zod";

const CATS = {
  shipped: { label: "Shipped", band: [90, 100] },
  alive: { label: "Alive", band: [60, 80] },
  stalled: { label: "Stalled", band: [20, 40] },
  buried: { label: "Buried", band: [0, 10] },
} as const;
type CatKey = keyof typeof CATS;

const TIERS = [
  { name: "Shipper", min: 80, max: 100 },
  { name: "Steady Builder", min: 60, max: 79 },
  { name: "Sparks and Embers", min: 40, max: 59 },
  { name: "Graveyard Keeper", min: 20, max: 39 },
  { name: "Cemetery Owner", min: 0, max: 19 },
];
export const STATUSES = ["shipped", "alive", "stalled", "buried", "closed"] as const;
export const TYPES = ["app", "content", "business", "learning", "client", "other"] as const;
type Status = (typeof STATUSES)[number];

const DAY = 86_400_000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const dateMs = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
const days = (a: string, b: string) => Math.max(0, Math.round((dateMs(b) - dateMs(a)) / DAY));
const clampInt = (v: unknown, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number(v) || 0)));
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const r1 = (x: number) => Math.round(x * 10) / 10;

export interface AgrProject {
  name: string;
  started: string;
  last: string;
  exchanges: number;
  activeDays: number;
  outcome: number;
  chats: number;
  stakes: boolean;
  type?: (typeof TYPES)[number];
  userStatus?: Status;
}

export function evaluateAgr(projects: AgrProject[], asOf: string) {
  const rows = projects.map((p, idx) => {
    const ex = clampInt(p.exchanges, 0, 100000);
    const ad = clampInt(p.activeDays, 1, 100000);
    const oc = clampInt(p.outcome, 0, 3);
    const ch = clampInt(p.chats, 1, 1000);
    const idleRaw = days(p.last, asOf);
    const confirmed: Status | null = p.userStatus && (STATUSES as readonly string[]).includes(p.userStatus) ? p.userStatus : null;
    let category: Status | null = confirmed;
    if (!category) {
      if (oc >= 3) category = "shipped";
      else if (idleRaw <= 30 && (ex >= 4 || ad >= 2 || idleRaw < 14)) category = "alive";
      else if (ex <= 3 && ad < 2) category = "buried";
      else category = "stalled";
    }
    const cat = category in CATS ? CATS[category as CatKey] : undefined;
    const idle = confirmed === "alive" ? 0 : idleRaw;
    let score: number | null = null;
    if (cat) {
      const ev = (confirmed === "shipped" ? 3 : oc) / 3;
      const strength = 0.4 * Math.min(1, ex / 20) + 0.2 * Math.min(1, (ad - 1) / 3) + 0.2 * Math.max(0, 1 - idle / 90) + 0.2 * ev;
      score = cat.band[0] + Math.round((cat.band[1] - cat.band[0]) * strength);
    }
    return {
      index: idx,
      name: String(p.name),
      type: p.type && (TYPES as readonly string[]).includes(p.type) ? p.type : null,
      started: p.started,
      last: p.last,
      stakes: !!p.stakes,
      exchanges: ex,
      activeDays: ad,
      outcome: oc,
      chats: ch,
      idleDays: idleRaw,
      category,
      score,
      userStatusConfirmed: !!confirmed,
    };
  });
  const scored = rows.filter((r) => r.category !== "closed");
  const n = scored.length;
  const sum = scored.reduce((s, r) => s + (r.score ?? 0), 0);
  const mean = n ? sum / n : 0;
  const restarted = scored.filter((r) => r.chats >= 2).length;
  const restartPenalty = Math.min(10, restarted * 2);
  const agrScore = n ? Math.max(0, Math.round(mean - restartPenalty)) : 0;
  const tier = TIERS.find((t) => agrScore >= t.min && agrScore <= t.max)?.name ?? "Cemetery Owner";
  const counts = { shipped: 0, alive: 0, stalled: 0, buried: 0 };
  for (const r of scored) if (r.category && r.category in counts) counts[r.category as CatKey]++;
  const active = counts.shipped + counts.alive + counts.stalled;
  const deep = scored.filter((r) => r.exchanges > 3).length;
  const dormant = scored.filter((r) => r.category === "stalled" || r.category === "buried");
  const avgDormancy = dormant.length ? Math.round(dormant.reduce((s, r) => s + r.idleDays, 0) / dormant.length) : null;
  return {
    methodologyVersion: "AGR Free v3.2",
    asOf,
    projectCount: n,
    closedCount: rows.length - n,
    projectScoreSum: sum,
    projectScoreMean: r1(mean),
    restartedProjects: restarted,
    restartPenalty,
    agrScore,
    tier,
    categoryCounts: counts,
    metrics: {
      depthRatePercent: pct(deep, n),
      followThroughRatePercent: pct(counts.shipped, active),
      restartRatePercent: pct(restarted, n),
      averageDormancyDays: avgDormancy,
    },
    projects: rows,
  };
}

export const projectSchema = z
  .object({
    name: z.string().min(1).max(120),
    started: z.string().regex(DATE),
    last: z.string().regex(DATE),
    exchanges: z.number().int().nonnegative(),
    activeDays: z.number().int().min(1),
    outcome: z.number().int().min(0).max(3),
    chats: z.number().int().min(1),
    stakes: z.boolean(),
    type: z.enum(TYPES).optional(),
    userStatus: z.enum(STATUSES).optional(),
  })
  .superRefine((p, ctx) => {
    if (dateMs(p.started) > dateMs(p.last)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "started must be on or before last" });
  });

export const agrInputSchema = {
  asOf: z.string().regex(DATE).describe("Report date in YYYY-MM-DD. Use the AGR report generatedOn date."),
  projects: z.array(projectSchema).max(500).describe("Supported AGR project facts only. Never invent missing facts."),
};
