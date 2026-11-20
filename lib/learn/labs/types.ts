// Lab domain types.
//
// Three lab kinds share one attempt model. Each has a different evaluator,
// but all return the same shape so the UI and points path stay uniform.

export const LAB_TYPES = ["prompt", "critique", "build", "workbench", "code"] as const;
export type LabType = (typeof LAB_TYPES)[number];

export const LAB_TYPE_META: Record<
  LabType,
  { label: string; icon: string; blurb: string }
> = {
  prompt: {
    label: "Prompt lab",
    icon: "⌨️",
    blurb: "Write a prompt, run it against a real model, and get coached on the prompt itself.",
  },
  critique: {
    label: "Critique lab",
    icon: "🔍",
    blurb: "An AI answer with problems planted in it. Find them.",
  },
  build: {
    label: "Build lab",
    icon: "🧱",
    blurb: "Do the task for real, then show your work.",
  },
  workbench: {
    label: "Workbench lab",
    icon: "🧩",
    blurb: "Do the work right here, step by step, and get it graded against the criteria.",
  },
  code: {
    label: "Code Studio",
    icon: "💻",
    blurb: "Build a working app in the browser with an AI pair programmer, a live preview and automated checks.",
  },
};

/** A single scored criterion. Always shown to the learner before they start. */
export interface LabObjective {
  id: string;
  label: string;
  /** Relative weight within the lab. Weights are normalised, so they need not sum to 100. */
  weight: number;
  /** Guidance for the AI evaluator on what counts as meeting this. */
  guidance?: string;
}

// ── Type-specific config ────────────────────────────────────────────────────

export interface PromptLabConfig {
  kind: "prompt";
  /** System prompt for the sandbox model the learner's prompt is run against. */
  sandboxSystem?: string;
  /** Shown in the editor before the learner types anything. */
  starterPrompt?: string;
  /** Max sandbox runs per attempt. Keeps model cost bounded. */
  maxRuns?: number;
  /** Optional fixed context injected before the learner's prompt. */
  contextMd?: string;
}

/** One planted problem the learner is meant to catch. */
export interface CritiqueFlaw {
  id: string;
  /** Exact text from the supplied answer that is wrong. */
  quote: string;
  /** Why it's wrong — revealed after submission. */
  explanation: string;
  category: "fabrication" | "bias" | "overconfidence" | "privacy" | "logic" | "omission";
}

export interface CritiqueLabConfig {
  kind: "critique";
  /** The AI answer under review, with flaws planted in it. */
  answerMd: string;
  flaws: CritiqueFlaw[];
  /** Selectable statements — a mix of genuine flaws and correct statements. */
  candidates: Array<{ id: string; text: string; isFlaw: boolean; flawId?: string }>;
}

export interface BuildLabConfig {
  kind: "build";
  steps: Array<{ id: string; label: string; detail?: string }>;
  /** Whether an artefact link is required to submit. */
  requireArtifact?: boolean;
  artifactLabel?: string;
}

/**
 * Work done on the page, in structured fields, and graded against the lab's
 * objectives.
 *
 * Build labs are self-attested — a checklist and a link to work done in
 * another tool — so they cannot show that someone can actually do the thing.
 * A workbench lab can: the learner maps the system, writes the plan or designs
 * the evaluation here, and it is marked against each objective's guidance.
 */
export interface WorkbenchLabConfig {
  kind: "workbench";
  fields: Array<{
    id: string;
    label: string;
    /** What to write in this field. */
    prompt: string;
    placeholder?: string;
    /** Below this, the field reads as not attempted. Default 30. */
    minWords?: number;
  }>;
}

/**
 * Code Studio: a single-file web app (HTML with inline CSS and JavaScript)
 * built in the browser. The learner has an editor, a live preview in a
 * sandboxed iframe, an AI pair programmer, and automated checks.
 *
 * Checks run in the learner's browser against the preview. Each `code` is the
 * BODY of an async function called with `(doc, win)`: the preview's document
 * and window. It returns true to pass, or false or a string (the reason) to
 * fail; a thrown error also fails. Checks may simulate input, e.g.
 *   const a = doc.querySelector("#amount"); a.value = "50";
 *   a.dispatchEvent(new win.Event("input", { bubbles: true }));
 *   await new Promise(r => setTimeout(r, 50));
 *   return doc.querySelector("#total").textContent.includes("57.50");
 *
 * Grading combines the checks (reported by the browser) with an assessor
 * reading the final code, the learner's notes and how they worked with the AI.
 */
export interface CodeLabConfig {
  kind: "code";
  /** The file the editor opens with. May be a near-empty skeleton or buggy code to fix. */
  starterCode: string;
  checks: Array<{ id: string; label: string; code: string; hint?: string }>;
  /** Extra guidance for the AI pair programmer in this lab. */
  assistantNotes?: string;
  /** AI pair-programmer requests per attempt. Default 12. */
  maxRuns?: number;
  /** Written parts alongside the code: a spec, a review, a test plan. 0-3 fields. */
  fields?: WorkbenchLabConfig["fields"];
}

export type LabConfig = PromptLabConfig | CritiqueLabConfig | BuildLabConfig | WorkbenchLabConfig | CodeLabConfig;

// ── Evaluation result ───────────────────────────────────────────────────────

export interface ObjectiveResult {
  objectiveId: string;
  label: string;
  met: boolean;
  /** 0-100 for this objective. Partial credit is allowed. */
  score: number;
  comment: string;
}

export interface LabEvaluation {
  score: number;
  passed: boolean;
  feedbackMd: string;
  breakdown: ObjectiveResult[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function parseObjectives(raw: unknown): LabObjective[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((o): o is LabObjective => !!o && typeof o === "object" && "id" in o)
    .map((o) => ({
      id: String(o.id),
      label: String(o.label ?? ""),
      weight: Number(o.weight) || 1,
      guidance: o.guidance ? String(o.guidance) : undefined,
    }));
}

export function parseConfig(labType: string, raw: unknown): LabConfig {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  switch (labType) {
    case "critique":
      return {
        kind: "critique",
        answerMd: String(obj.answerMd ?? ""),
        flaws: Array.isArray(obj.flaws) ? (obj.flaws as CritiqueFlaw[]) : [],
        candidates: Array.isArray(obj.candidates)
          ? (obj.candidates as CritiqueLabConfig["candidates"])
          : [],
      };
    case "workbench":
      return {
        kind: "workbench",
        fields: Array.isArray(obj.fields)
          ? (obj.fields as WorkbenchLabConfig["fields"]).filter((f) => f && f.id && f.label)
          : [],
      };
    case "code":
      return {
        kind: "code",
        starterCode: String(obj.starterCode ?? ""),
        checks: Array.isArray(obj.checks)
          ? (obj.checks as CodeLabConfig["checks"]).filter((c) => c && c.id && c.code)
          : [],
        assistantNotes: obj.assistantNotes ? String(obj.assistantNotes) : undefined,
        maxRuns: Number(obj.maxRuns) || 12,
        fields: Array.isArray(obj.fields)
          ? (obj.fields as WorkbenchLabConfig["fields"]).filter((f) => f && f.id && f.label)
          : [],
      };
    case "build":
      return {
        kind: "build",
        steps: Array.isArray(obj.steps) ? (obj.steps as BuildLabConfig["steps"]) : [],
        requireArtifact: obj.requireArtifact !== false,
        artifactLabel: obj.artifactLabel ? String(obj.artifactLabel) : undefined,
      };
    default:
      return {
        kind: "prompt",
        sandboxSystem: obj.sandboxSystem ? String(obj.sandboxSystem) : undefined,
        starterPrompt: obj.starterPrompt ? String(obj.starterPrompt) : undefined,
        maxRuns: Number(obj.maxRuns) || 8,
        contextMd: obj.contextMd ? String(obj.contextMd) : undefined,
      };
  }
}

/** Normalise weighted objective scores into a single 0-100. */
export function weightedScore(results: ObjectiveResult[], objectives: LabObjective[]): number {
  if (results.length === 0) return 0;
  const weightOf = (id: string) => objectives.find((o) => o.id === id)?.weight ?? 1;
  const totalWeight = results.reduce((n, r) => n + weightOf(r.objectiveId), 0);
  if (totalWeight === 0) return 0;
  const sum = results.reduce((n, r) => n + r.score * weightOf(r.objectiveId), 0);
  return Math.round(sum / totalWeight);
}
