import type { Category, CyberResult, Finding, Severity } from "./types";
import { SEVERITIES } from "./types";

// Score 0 to 100 from the findings, and a letter grade a business owner can
// read at a glance. Any critical finding caps the grade at D, any high at C.

const PENALTY: Record<Severity, number> = { critical: 30, high: 15, medium: 6, low: 2, info: 0 };
const EFFORT_ORDER = { minutes: 0, hours: 1, days: 2 };
const SEV_ORDER = Object.fromEntries(SEVERITIES.map((s, i) => [s, i])) as Record<Severity, number>;

export function counts(findings: Finding[]): Record<Severity, number> {
  const c = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>;
  for (const f of findings) c[f.severity]++;
  return c;
}

export function scoreOf(findings: Finding[]): number {
  return Math.max(0, 100 - findings.reduce((s, f) => s + PENALTY[f.severity], 0));
}

export function gradeOf(score: number, c: Record<Severity, number>): CyberResult["grade"] {
  let g: CyberResult["grade"] = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
  const cap = (max: CyberResult["grade"]) => {
    if ("ABCDF".indexOf(g) < "ABCDF".indexOf(max)) g = max;
  };
  if (c.critical) cap("D");
  else if (c.high) cap("C");
  return g;
}

export function categoryScores(findings: Finding[], present: Category[]): Partial<Record<Category, number>> {
  const out: Partial<Record<Category, number>> = {};
  for (const cat of present) out[cat] = scoreOf(findings.filter((f) => f.category === cat));
  return out;
}

export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || EFFORT_ORDER[a.effort] - EFFORT_ORDER[b.effort] || a.title.localeCompare(b.title));
}

/** Fix first (critical, high), next (medium), later (low; info is advice). */
export function planOf(findings: Finding[]): CyberResult["plan"] {
  const s = sortFindings(findings);
  return {
    now: s.filter((f) => f.severity === "critical" || f.severity === "high").map((f) => f.id),
    next: s.filter((f) => f.severity === "medium").map((f) => f.id),
    later: s.filter((f) => f.severity === "low" || f.severity === "info").map((f) => f.id),
  };
}
