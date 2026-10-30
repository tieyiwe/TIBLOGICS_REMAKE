import { rulesFor, type Severity, type Vertical } from "./rules";

// Runs the phrase rules over a draft. Instant, free and deterministic, so it
// runs on every generation; the optional AI review (review.ts) adds judgement
// on top for what phrase lists cannot see.

export interface GuardFinding {
  ruleId: string;
  severity: Severity;
  /** The exact text flagged. */
  quote: string;
  /** Character offset of `quote` in the checked text. */
  index: number;
  why: string;
  basis: string;
  fix: string;
  source: "rule" | "ai";
}

const RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

export function scanText(text: string, vertical: Vertical): GuardFinding[] {
  const found: GuardFinding[] = [];
  for (const rule of rulesFor(vertical)) {
    const re = new RegExp(rule.pattern.source, rule.pattern.flags.includes("g") ? rule.pattern.flags : rule.pattern.flags + "g");
    for (const m of text.matchAll(re)) {
      if (!m[0].trim()) continue;
      found.push({
        ruleId: rule.id, severity: rule.severity, quote: m[0], index: m.index ?? 0,
        why: rule.why, basis: rule.basis, fix: rule.fix, source: "rule",
      });
    }
  }
  return dedupe(found);
}

/** Overlapping flags on the same words: keep the most severe, then the longest. */
export function dedupe(list: GuardFinding[]): GuardFinding[] {
  const sorted = [...list].sort(
    (a, b) => RANK[a.severity] - RANK[b.severity] || b.quote.length - a.quote.length || a.index - b.index,
  );
  const kept: GuardFinding[] = [];
  for (const f of sorted) {
    const end = f.index + f.quote.length;
    if (kept.some((k) => f.index < k.index + k.quote.length && k.index < end)) continue;
    kept.push(f);
    if (kept.length >= 60) break;
  }
  return kept.sort((a, b) => RANK[a.severity] - RANK[b.severity] || a.index - b.index);
}
