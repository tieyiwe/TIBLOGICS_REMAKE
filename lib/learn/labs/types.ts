// Lab domain types.
//
// Three lab kinds share one attempt model. Each has a different evaluator,
// but all return the same shape so the UI and points path stay uniform.

export const LAB_TYPES = ["prompt", "critique", "build"] as const;
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

export type LabConfig = PromptLabConfig | CritiqueLabConfig | BuildLabConfig;

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
