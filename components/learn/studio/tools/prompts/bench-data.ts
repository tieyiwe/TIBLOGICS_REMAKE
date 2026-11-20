// Test Bench: prompt variants x test cases, with pre-computed pass/fail per
// check. Outputs and descriptions live in lib/i18n/messages/studio-test-bench.ts.

export const CHECKS = ["sections", "length", "injection", "source", "uncertainty", "format"] as const;
export type Check = (typeof CHECKS)[number];

export const CASES = ["normal", "empty", "long", "language", "injection", "ambiguous"] as const;
export type Case = (typeof CASES)[number];

export const CASE_EMOJI: Record<Case, string> = {
  normal: "✅",
  empty: "🕳️",
  long: "📜",
  language: "🌍",
  injection: "🦠",
  ambiguous: "❓",
};

/** "1" pass, "0" fail, "-" not applicable, one char per check in CHECKS order. */
type Row = string;

export interface BenchTask {
  id: string;
  variants: string[];
  results: Record<string, Record<Case, Row>>;
}

export const TASKS: BenchTask[] = [
  {
    // Support ticket triage for a small online shop.
    id: "ticket",
    variants: ["v1", "v2", "v3"],
    results: {
      v1: { normal: "01-0-0", empty: "01--10", long: "00-0-0", language: "01-000", injection: "0100-0", ambiguous: "01-000" },
      v2: { normal: "11-1-1", empty: "11--01", long: "11-1-1", language: "11-001", injection: "1100-0", ambiguous: "11-001" },
      v3: { normal: "11-1-1", empty: "11--11", long: "10-1-1", language: "11-111", injection: "1111-1", ambiguous: "11-111" },
    },
  },
  {
    // Staff leave-policy assistant for a health clinic.
    id: "policy",
    variants: ["v1", "v2", "v3"],
    results: {
      v1: { normal: "01-0-1", empty: "-1--1-", long: "00-0-0", language: "01-001", injection: "0100-1", ambiguous: "01-001" },
      v2: { normal: "11-1-1", empty: "-1--1-", long: "11-1-1", language: "11-111", injection: "1111-1", ambiguous: "11-001" },
      v3: { normal: "11-1-1", empty: "-1--1-", long: "11-1-1", language: "11-111", injection: "1111-1", ambiguous: "11-111" },
    },
  },
];

export const CHALLENGE_TASK: Record<string, string> = {
  "pick-best": "ticket",
  "catch-planted": "policy",
  "expose-weak": "ticket",
};

/**
 * "Catch the planted failure": V2 of the policy task guesses on the ambiguous
 * question and cites a section that does not exist. Only the checks in
 * failingChecks() for this cell can expose it.
 */
export const PLANTED: { variant: string; case: Case } = { variant: "v2", case: "ambiguous" };
/** Most checks the learner may pick in that challenge (so "tick everything" is not an option). */
export const PLANTED_MAX_CHECKS = 3;

export type Cell = "pass" | "fail" | "na";

/** Result of one check on one cell. */
export function checkResult(task: BenchTask, variant: string, c: Case, check: Check): Cell {
  const row = task.results[variant]?.[c];
  if (!row) return "na";
  const ch = row[CHECKS.indexOf(check)];
  return ch === "1" ? "pass" : ch === "0" ? "fail" : "na";
}

/** A cell passes when every selected, applicable check passes. */
export function cellResult(task: BenchTask, variant: string, c: Case, checks: Check[]): Cell {
  const rs = checks.map((k) => checkResult(task, variant, c, k)).filter((r) => r !== "na");
  if (rs.length === 0) return "na";
  return rs.every((r) => r === "pass") ? "pass" : "fail";
}

/** The checks that fail on one cell: the ones that would catch its problem. */
export function failingChecks(task: BenchTask, variant: string, c: Case): Check[] {
  return CHECKS.filter((k) => checkResult(task, variant, c, k) === "fail");
}

/** Passed and applicable check counts for a variant over the chosen cases and checks. */
export function passRate(task: BenchTask, variant: string, cases: Case[], checks: Check[]): { pass: number; total: number } {
  let pass = 0;
  let total = 0;
  for (const c of cases)
    for (const k of checks) {
      const r = checkResult(task, variant, c, k);
      if (r === "na") continue;
      total++;
      if (r === "pass") pass++;
    }
  return { pass, total };
}

// "Your own variant": pass/fail is simulated from what the prompt asks for.
// Keyword lists cover English, French and Swahili.
const FEATURES: Record<Check, RegExp> = {
  sections: /(label|heading|section|lines?\b|parts?\b|summary|answer|rubrique|partie|intitul|lignes?|r[ée]ponse|sehemu|mistari|mstari|vichwa|muhtasari|jibu)/i,
  length: /(\d+\s*(words?|mots|maneno)|(under|fewer than|at most|moins de|au plus|chini ya|isiyozidi)\s*\d+)/i,
  injection: /(ignore|never follow|do not follow|as data|cannot approve|n'ob[ée]is|ne suivez|comme des donn[ée]es|ne pouvez pas approuver|usifuate|maagizo|kama data|huwezi kuidhinisha)/i,
  source: /(quote|cite|source|section number|order number|citez|citer|num[ée]ro|nukuu|taja|chanzo|namba ya)/i,
  uncertainty: /(unclear|unsure|not sure|uncertain|say so|ask the customer|ask hr|pas clair|incertain|dites-le|haiko wazi|huna uhakika|sema hivyo)/i,
  format: /(low|medium|high|one of|exactly|one-line|one line|first line|faible|moyen|[ée]lev[ée]|une ligne|wastani|mstari mmoja)/i,
};

export function simulateCustom(task: BenchTask, prompt: string): Record<Case, Row> {
  const has = CHECKS.map((k) => FEATURES[k].test(prompt));
  const out = {} as Record<Case, Row>;
  for (const c of CASES) {
    // Same applicability as the task's first variant.
    const base = task.results[task.variants[0]][c];
    out[c] = CHECKS.map((_, i) => (base[i] === "-" ? "-" : has[i] ? "1" : "0")).join("");
  }
  return out;
}

export const CUSTOM = "custom";
