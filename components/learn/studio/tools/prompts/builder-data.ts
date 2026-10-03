// Prompt Builder: block types, scenarios and the transparent strength meter.
// All scoring is deterministic and explained in the UI; no model is called.

export const BLOCK_TYPES = ["role", "task", "context", "audience", "constraints", "examples", "format", "checks", "systems"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_EMOJI: Record<BlockType, string> = {
  role: "🎭",
  task: "🎯",
  context: "📚",
  audience: "👥",
  constraints: "📏",
  examples: "🧩",
  format: "🗂️",
  checks: "🔍",
  systems: "🕸️",
};

export interface Scenario {
  id: string;
  required: BlockType[];
  /** Strength needed for 1, 2 and 3 stars. */
  target: [number, number, number];
}

export const SCENARIOS: Scenario[] = [
  { id: "client-email", required: ["task", "context", "audience", "format"], target: [60, 70, 80] },
  { id: "policy-summary", required: ["task", "audience", "constraints", "format"], target: [60, 72, 82] },
  { id: "pilot-plan", required: ["role", "task", "context", "constraints", "checks"], target: [70, 80, 90] },
  { id: "spreadsheet", required: ["task", "context", "format", "checks"], target: [70, 80, 90] },
  { id: "four-day-week", required: ["role", "task", "context", "constraints", "checks", "systems"], target: [80, 90, 97] },
];

export interface Block {
  key: string;
  type: BlockType;
  text: string;
}

export const DIMENSIONS = ["specificity", "context", "format", "verification", "systems"] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export interface Criterion {
  id: string;
  dim: Dimension;
  points: number;
  earned: number;
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const PLACEHOLDER = /\[[^\]]*\]/g;

// Keyword lists cover English, French and Swahili so the meter works in every
// language the Studio is shown in.
const STRUCTURE = /(bullet|table|list|heading|section|paragraph|subject line|json|column|step|numbered|puces?|tableau|liste|titre|rubrique|paragraphe|objet|colonne|[ée]tapes?|num[ée]rot|vitone|jedwali|orodha|kichwa|sehemu|aya|safu|hatua)/i;
const MEASURABLE = /\d|\b(under|at most|no more than|maximum|exactly|moins de|au plus|au maximum|exactement|chini ya|isiyozidi|zisizozidi|hasa)\b/i;
const VERIFY = /(assum|uncertain|unsure|confiden|confian|certain|source|verify|check|hypoth[eè]s|incertain|v[ée]rifi|sources?|dhana|uhakika|chanzo|thibitisha|kagua)/i;
const SYSTEMS = /(loop|second-order|downstream|stakeholder|affect|trade-off|knock-on|boucle|second ordre|en aval|parties prenantes|concern[ée]|touch[ée]|cascade|compromis|mzunguko|mizunguko|athari za pili|wanaoathirika|wadau|athari za baadaye)/i;

export function placeholders(text: string): number {
  return (text.match(PLACEHOLDER) ?? []).length;
}

export function assemble(blocks: Block[]): string {
  return blocks.map((b) => b.text.trim()).filter(Boolean).join("\n\n");
}

/** Score a prompt: five dimensions of 20 points each, every point explained. */
export function score(blocks: Block[]): { total: number; byDim: Record<Dimension, number>; criteria: Criterion[] } {
  const get = (t: BlockType) => blocks.find((b) => b.type === t)?.text.trim() ?? "";
  const filled = (t: BlockType) => {
    const s = get(t);
    return s.length > 0 && placeholders(s) === 0;
  };
  const all = assemble(blocks);
  const holes = placeholders(all);
  const c = (id: string, dim: Dimension, points: number, earned: number | boolean): Criterion => ({
    id,
    dim,
    points,
    earned: typeof earned === "boolean" ? (earned ? points : 0) : Math.max(0, Math.min(points, earned)),
  });
  const criteria: Criterion[] = [
    c("taskFilled", "specificity", 6, filled("task")),
    c("taskDetail", "specificity", 3, words(get("task")) >= 10),
    c("measurable", "specificity", 5, MEASURABLE.test(all)),
    c("noPlaceholders", "specificity", 6, all.length > 0 ? 6 - 2 * holes : 0),
    c("contextFilled", "context", 8, filled("context")),
    c("contextDetail", "context", 4, words(get("context")) >= 20),
    c("audienceFilled", "context", 5, filled("audience")),
    c("roleFilled", "context", 3, filled("role")),
    c("formatFilled", "format", 10, filled("format")),
    c("formatShape", "format", 5, STRUCTURE.test(get("format")) || /\d/.test(get("format"))),
    c("constraintsFilled", "format", 5, filled("constraints")),
    c("checksFilled", "verification", 10, filled("checks")),
    c("checksKeywords", "verification", 5, VERIFY.test(get("checks"))),
    c("examplesFilled", "verification", 5, filled("examples")),
    c("systemsFilled", "systems", 12, filled("systems")),
    c("systemsKeywords", "systems", 8, SYSTEMS.test(get("systems"))),
  ];
  const byDim = Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Record<Dimension, number>;
  for (const x of criteria) byDim[x.dim] += x.earned;
  const total = criteria.reduce((n, x) => n + x.earned, 0);
  return { total, byDim, criteria };
}

export function starsFor(sc: Scenario, total: number, missing: number): 0 | 1 | 2 | 3 {
  if (missing > 0 || total < sc.target[0]) return 0;
  if (total >= sc.target[2]) return 3;
  if (total >= sc.target[1]) return 2;
  return 1;
}
