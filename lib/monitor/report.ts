import type { Finding } from "@/lib/scanner/audit";

// Turns stored scans into what a subscriber actually wants to know:
//   - how they compare with each competitor, per area
//   - which checks a competitor passes that they fail (the gaps worth fixing)
//   - what changed since the last run
// Pure functions over scan rows, so the dashboard and the email agree.

export type Area = "overall" | "seo" | "perf" | "ux" | "ai";
export const AREAS: Area[] = ["overall", "ai", "seo", "perf", "ux"];
export const AREA_LABELS: Record<Area, string> = {
  overall: "Overall",
  ai: "AI readiness",
  seo: "Search",
  perf: "Speed",
  ux: "Usability",
};

export interface ScanRow {
  url: string;
  isOwn: boolean;
  ok: boolean;
  error: string | null;
  overallScore: number | null;
  seoScore: number | null;
  perfScore: number | null;
  uxScore: number | null;
  aiScore: number | null;
  findings: unknown;
  createdAt: Date;
}

export interface SiteSummary {
  url: string;
  host: string;
  isOwn: boolean;
  ok: boolean;
  error: string | null;
  scores: Record<Area, number> | null;
  findings: Finding[];
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function asFindings(v: unknown): Finding[] {
  return Array.isArray(v) ? (v as Finding[]).filter((f) => f && typeof f.check === "string") : [];
}

/** One run's scans, own site first. */
export function summarise(scans: ScanRow[]): SiteSummary[] {
  return [...scans]
    .sort((a, b) => Number(b.isOwn) - Number(a.isOwn))
    .map((s) => ({
      url: s.url,
      host: hostOf(s.url),
      isOwn: s.isOwn,
      ok: s.ok,
      error: s.error,
      scores:
        s.ok && s.overallScore != null
          ? {
              overall: s.overallScore,
              seo: s.seoScore ?? 0,
              perf: s.perfScore ?? 0,
              ux: s.uxScore ?? 0,
              ai: s.aiScore ?? 0,
            }
          : null,
      findings: asFindings(s.findings),
    }));
}

export interface Gap {
  check: string;
  area: Finding["area"];
  /** What is wrong on the subscriber's site. */
  yours: string;
  /** Competitors that pass this check. */
  aheadHosts: string[];
  severity: "bad" | "warning";
  /** The subscriber's finding, for re-rendering `yours` in another language. */
  finding?: Finding;
}

/**
 * Checks the subscriber fails that at least one competitor passes.
 *
 * This is the part of the report that is worth paying for: "fix your title"
 * is generic advice, "two of your three competitors publish structured data
 * and you do not" is a reason to act this week.
 */
export function competitorGaps(sites: SiteSummary[]): Gap[] {
  const own = sites.find((s) => s.isOwn && s.ok);
  if (!own) return [];
  const rivals = sites.filter((s) => !s.isOwn && s.ok);
  const gaps: Gap[] = [];
  for (const f of own.findings) {
    if (f.type === "good") continue;
    const ahead = rivals.filter((r) => r.findings.some((rf) => rf.check === f.check && rf.type === "good"));
    if (ahead.length === 0) continue;
    gaps.push({ check: f.check, area: f.area, yours: f.text, aheadHosts: ahead.map((r) => r.host), severity: f.type, finding: f });
  }
  // Most competitors ahead first, then real defects before warnings.
  return gaps.sort(
    (a, b) => b.aheadHosts.length - a.aheadHosts.length || (a.severity === "bad" ? -1 : 1) - (b.severity === "bad" ? -1 : 1),
  );
}

/** Where the subscriber ranks on overall score among the sites that scanned. */
export function rankOf(sites: SiteSummary[]): { rank: number; of: number } | null {
  const scored = sites.filter((s) => s.scores);
  const own = scored.find((s) => s.isOwn);
  if (!own) return null;
  const rank = 1 + scored.filter((s) => !s.isOwn && s.scores!.overall > own.scores!.overall).length;
  return { rank, of: scored.length };
}

export type Change =
  | { kind: "score"; host: string; isOwn: boolean; area: Area; from: number; to: number }
  | { kind: "fixed"; check: string; text: string; finding?: Finding }
  | { kind: "regressed"; check: string; text: string; finding?: Finding };

/** Score moves smaller than this are noise (a slower server response on the day). */
const OWN_THRESHOLD = 3;
const RIVAL_THRESHOLD = 5;

export function changesBetween(prev: SiteSummary[], curr: SiteSummary[]): Change[] {
  const changes: Change[] = [];
  for (const c of curr) {
    const p = prev.find((x) => x.url === c.url);
    if (!p?.scores || !c.scores) continue;
    const areas: Area[] = c.isOwn ? AREAS : ["overall"];
    for (const area of areas) {
      const from = p.scores[area];
      const to = c.scores[area];
      if (Math.abs(to - from) >= (c.isOwn ? OWN_THRESHOLD : RIVAL_THRESHOLD)) {
        changes.push({ kind: "score", host: c.host, isOwn: c.isOwn, area, from, to });
      }
    }
    if (c.isOwn) {
      for (const f of c.findings) {
        const before = p.findings.find((x) => x.check === f.check);
        if (!before) continue;
        if (before.type !== "good" && f.type === "good") changes.push({ kind: "fixed", check: f.check, text: f.text, finding: f });
        if (before.type === "good" && f.type !== "good") changes.push({ kind: "regressed", check: f.check, text: f.text, finding: f });
      }
    }
  }
  return changes;
}

export function describeChange(c: Change): string {
  if (c.kind === "fixed") return `Fixed: ${c.text}`;
  if (c.kind === "regressed") return `New problem: ${c.text}`;
  const who = c.isOwn ? "Your" : `${c.host}'s`;
  const dir = c.to > c.from ? "rose" : "fell";
  // Lower-cased for mid-sentence use, except "AI", which stays an acronym.
  const label = AREA_LABELS[c.area].replace(/^(?!AI)\w/, (ch) => ch.toLowerCase());
  return `${who} ${label} score ${dir} from ${c.from} to ${c.to}`;
}
