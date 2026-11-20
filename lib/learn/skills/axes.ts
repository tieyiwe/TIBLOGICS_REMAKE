// Skills radar: the six skill axes and how each track (and some modules)
// feeds them. Client-safe (no database imports): the radar chart and the
// share button import the axis list from here.
//
// A learner's result on a quiz, lab or micro-check counts toward the axes of
// the module it belongs to. Each module splits its weight across one or more
// axes: the track default below, or a module override (keyed by the module's
// sortOrder, 0-based, which is its stable identity in the seed). Weights are
// normalised, so { prompting: 2, safety: 1 } means two thirds and one third.
//
// Add a new track here when it goes live; an unknown track falls back to
// FALLBACK so its results are not lost.

export const SKILL_AXES = ["prompting", "data", "safety", "governance", "building", "business"] as const;
export type SkillAxis = (typeof SKILL_AXES)[number];

export type AxisWeights = Partial<Record<SkillAxis, number>>;

interface TrackMap {
  default: AxisWeights;
  modules?: Record<number, AxisWeights>;
}

export const TRACK_AXES: Record<string, TrackMap> = {
  // Level 1 · AI Foundations for Everyone
  "ai-foundations": {
    default: { prompting: 0.5, business: 0.3, safety: 0.2 },
    modules: {
      0: { data: 0.6, prompting: 0.4 }, // What AI Actually Is
      1: { prompting: 1 }, // Talking to AI Tools
      2: { prompting: 0.4, data: 0.4, safety: 0.2 }, // Judging What Comes Back
      3: { business: 0.6, prompting: 0.4 }, // AI for Everyday Work
      4: { safety: 0.8, governance: 0.2 }, // Your Data and Your Privacy
      5: { prompting: 0.7, safety: 0.3 }, // Images, Audio and Video
      6: { business: 0.6, prompting: 0.4 }, // Building an AI Habit
      7: { data: 0.5, building: 0.5 }, // Seeing the Whole System
      8: { prompting: 0.7, safety: 0.3 }, // AI Fluency
    },
  },
  // Level 2 · AI Practitioner
  "ai-practitioner": {
    default: { business: 0.4, prompting: 0.3, data: 0.3 },
    modules: {
      0: { business: 1 }, // Seeing Your Work as a System
      1: { prompting: 1 }, // Prompts That Hold Up
      2: { data: 0.7, prompting: 0.3 }, // Working With Your Own Material
      3: { data: 0.6, prompting: 0.4 }, // Checking Quality at Scale
      4: { building: 0.6, business: 0.4 }, // Automating Repetitive Work
      5: { safety: 0.5, governance: 0.5 }, // Using AI Responsibly at Work
    },
  },
  // Level 3 · AI Systems Expert
  "ai-systems-expert": {
    default: { building: 0.4, governance: 0.2, safety: 0.2, business: 0.2 },
    modules: {
      0: { building: 0.6, business: 0.4 },
      1: { building: 1 }, // Agents and Tool Use
      2: { data: 0.6, building: 0.4 }, // Evaluation and Monitoring
      3: { safety: 1 }, // Security and Failure Modes
      4: { governance: 1 }, // Governance, Risk and Regulation
      5: { business: 1 }, // Leading AI Adoption
    },
  },
  "vibe-coding-engineer": {
    default: { building: 0.8, safety: 0.2 },
    modules: {
      1: { building: 0.6, prompting: 0.4 }, // Specs Before Prompts
      3: { building: 0.7, data: 0.3 }, // Testing and Verification
      4: { safety: 0.6, building: 0.4 }, // Security, Data and Quality
      6: { safety: 0.7, building: 0.3 }, // Ship Safe
    },
  },
  "ai-apps-agents": {
    default: { building: 1 },
    modules: {
      2: { building: 0.6, data: 0.4 }, // Retrieval-Augmented Generation
      4: { safety: 0.6, building: 0.4 }, // Evaluation, Safety and Security
    },
  },
  "practical-prompt-engineering": {
    default: { prompting: 1 },
    modules: {
      2: { prompting: 0.7, safety: 0.3 }, // Making AI Tell You What You Can't See
      3: { prompting: 0.6, data: 0.4 }, // Testing Prompts Like an Engineer
    },
  },
  "ai-ml-fundamentals": {
    default: { data: 1 },
    modules: {
      3: { data: 0.5, prompting: 0.5 }, // Generative AI and Foundation Models
      4: { building: 0.5, data: 0.5 }, // Applying Foundation Models
      5: { governance: 0.6, safety: 0.4 }, // Responsible, Secure and Governed AI
    },
  },
  "ai-governance": {
    default: { governance: 1 },
    modules: {
      2: { governance: 0.6, safety: 0.4 }, // Assessing AI Risk
      3: { governance: 0.6, safety: 0.4 }, // Controls and Operations
      4: { governance: 0.6, business: 0.4 }, // Buying and Building Responsibly
    },
  },
  "ai-for-parents": {
    default: { safety: 0.5, prompting: 0.3, business: 0.2 },
    modules: {
      0: { safety: 0.4, data: 0.3, prompting: 0.3 },
      1: { prompting: 0.7, safety: 0.3 },
      2: { prompting: 1 }, // In-Story approach
      3: { safety: 1 }, // Keeping Children Safe with AI
      4: { safety: 0.6, prompting: 0.4 }, // Raising Critical Thinkers
      5: { governance: 0.5, safety: 0.5 }, // Your Family AI Plan
    },
  },
  "ai-forward-professional": {
    default: { business: 0.6, prompting: 0.4 },
    modules: {
      1: { prompting: 0.7, building: 0.3 }, // The Key AI Tools to Learn
      2: { business: 0.5, prompting: 0.5 }, // Productivity Workflows
      4: { business: 0.7, governance: 0.3 }, // Bringing Your Workplace Along
    },
  },
  "ai-small-business": {
    default: { business: 0.8, prompting: 0.2 },
    modules: {
      1: { business: 0.5, prompting: 0.5 }, // Marketing That Sounds Like You
      3: { business: 0.5, building: 0.5 }, // Admin and Operations on Autopilot
      4: { business: 0.6, data: 0.4 }, // Money: Pricing, Numbers and Decisions
    },
  },
  // Retired outlines (draft): no lessons today, mapped in case one is revived.
  "ai-for-business": { default: { business: 1 } },
  "ai-automation": { default: { building: 1 } },
  "ai-strategy-leadership": { default: { business: 0.6, governance: 0.4 } },
};

const FALLBACK: AxisWeights = { prompting: 0.5, business: 0.5 };

/** The normalised axis weights for one module of a track (sum 1). */
export function axisWeights(trackSlug: string, moduleSortOrder: number | null | undefined): Array<[SkillAxis, number]> {
  const map = TRACK_AXES[trackSlug];
  const raw = (map && moduleSortOrder != null ? map.modules?.[moduleSortOrder] : undefined) ?? map?.default ?? FALLBACK;
  const entries = SKILL_AXES.map((a) => [a, Math.max(0, raw[a] ?? 0)] as [SkillAxis, number]).filter(([, w]) => w > 0);
  const sum = entries.reduce((s, [, w]) => s + w, 0);
  return sum > 0 ? entries.map(([a, w]) => [a, w / sum]) : [];
}

/** Message keys: short label (on the chart) and full name (in the list). */
export const AXIS_LABEL_KEY: Record<SkillAxis, string> = {
  prompting: "learn.radar.axis.prompting",
  data: "learn.radar.axis.data",
  safety: "learn.radar.axis.safety",
  governance: "learn.radar.axis.governance",
  building: "learn.radar.axis.building",
  business: "learn.radar.axis.business",
};
export const AXIS_NAME_KEY: Record<SkillAxis, string> = {
  prompting: "learn.radar.name.prompting",
  data: "learn.radar.name.data",
  safety: "learn.radar.name.safety",
  governance: "learn.radar.name.governance",
  building: "learn.radar.name.building",
  business: "learn.radar.name.business",
};

export interface SkillScore {
  axis: SkillAxis;
  /** 0-100. */
  score: number;
  /** How many results fed this axis (any weight). */
  evidence: number;
}

export interface SkillProfile {
  axes: SkillScore[];
  /** Quizzes, labs and micro-checks counted in all. */
  results: number;
  strongest: SkillAxis | null;
  weakest: SkillAxis | null;
}
