// The written part of a full scanner report (lib/scanner/report.ts), as
// stored in ScannerLead.report and sent to the buyer's browser. Everything is
// re-checked on read: it came from a model.

export interface WrittenPriority {
  check: string;
  title: string;
  why: string;
  steps: string[];
  effort: "low" | "medium" | "high";
  /** Something the owner can do themselves, rather than needing a developer. */
  diy: boolean;
}

export interface WrittenIdea {
  key: string;
  title: string;
  what: string;
  outcome: string;
}

export interface WrittenReport {
  summary: string;
  quickWin: string;
  priorities: WrittenPriority[];
  ideas: WrittenIdea[];
  locale: string;
  writtenAt: string;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

export function readReport(v: unknown): WrittenReport | null {
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  const priorities = (Array.isArray(r.priorities) ? r.priorities : [])
    .map((p) => {
      const o = (p ?? {}) as Record<string, unknown>;
      const effort = o.effort === "low" || o.effort === "high" ? o.effort : "medium";
      return {
        check: str(o.check, 60),
        title: str(o.title, 160),
        why: str(o.why, 600),
        steps: (Array.isArray(o.steps) ? o.steps : []).map((s) => str(s, 400)).filter(Boolean).slice(0, 6),
        effort,
        diy: o.diy === true,
      } as WrittenPriority;
    })
    .filter((p) => p.title && p.steps.length)
    .slice(0, 12);
  const ideas = (Array.isArray(r.ideas) ? r.ideas : [])
    .map((p) => {
      const o = (p ?? {}) as Record<string, unknown>;
      return { key: str(o.key, 40), title: str(o.title, 120), what: str(o.what, 600), outcome: str(o.outcome, 300) };
    })
    .filter((i) => i.title && i.what)
    .slice(0, 6);
  const summary = str(r.summary, 1500);
  if (!summary && !priorities.length) return null;
  return { summary, quickWin: str(r.quickWin, 600), priorities, ideas, locale: str(r.locale, 5) || "en", writtenAt: str(r.writtenAt, 40) };
}
