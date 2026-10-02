// Verified skill badges: the catalog. Finer grained than certificates, and
// each one is issued as a signed Open Badges 3.0 credential
// (lib/learn/skill-badges/credential.ts). Client-safe: plain data, no
// database. Visible strings are "badges." dictionary keys; the English names
// here are the canonical names written into credentials (like certificate
// names, credentials stay in English).
//
// Four families:
//   module    one per module that has a quiz and a lab: quiz passed + a lab
//             in that module passed. Generated from the database.
//   studio    one per Learning Studio tool: every challenge completed.
//   capstone  one per track with a capstone: passed with a reviewer score of
//             CAPSTONE_DISTINCTION_SCORE or more.
//   skill     cross-track skills (below): specific labs and module quizzes
//             from more than one track.
//
// Keys are stable: "module:<trackSlug>:<moduleSortOrder>",
// "studio:<toolId>", "capstone:<trackSlug>", "skill:<slug>". Module ids are
// not used because a reseed may recreate modules; slugs and order survive.

export type SkillBadgeFamily = "module" | "studio" | "capstone" | "skill";

export type BadgeGlyph =
  | "prompt"
  | "rag"
  | "governance"
  | "systems"
  | "evaluation"
  | "security"
  | "automation"
  | "module"
  | "studio"
  | "capstone";

/** Reviewer score (0 to 100) a passed capstone needs for the distinction badge. */
export const CAPSTONE_DISTINCTION_SCORE = 90;

/** A module quiz reference: "<trackSlug>:<moduleSortOrder>". */
export type QuizRef = `${string}:${number}`;

export interface SkillRequirement {
  /** Stable within the badge; names the "badges.req.<id>" label. */
  id: "core" | "applied" | "quiz";
  /** How many of the listed items must be passed. */
  need: number;
  /** Lab slugs (any track). Labs not in the database simply never count. */
  labs?: string[];
  /** Module quizzes. */
  quizzes?: QuizRef[];
}

export interface SkillBadgeDef {
  slug: string;
  glyph: BadgeGlyph;
  /** Canonical English name, written into the credential. */
  name: string;
  /** Canonical English description, written into the credential. */
  description: string;
  requirements: SkillRequirement[];
  /** The passed items must come from at least this many different tracks. */
  minTracks: number;
}

export const SKILL_BADGES: SkillBadgeDef[] = [
  {
    slug: "prompt-engineering",
    glyph: "prompt",
    name: "Prompt Engineering",
    description:
      "Designs, structures and tests prompts that give reliable results, and turns them into reusable templates for real work.",
    minTracks: 2,
    requirements: [
      {
        id: "core",
        need: 2,
        labs: [
          "prompt-specialist-lab-1-weak-to-strong",
          "prompt-specialist-lab-2-map-and-chain",
          "prompt-specialist-lab-4-test-set-and-rubric",
          "prompt-specialist-lab-5-structured-output-review",
          "prompt-specialist-lab-6-mini-prompt-library",
        ],
      },
      {
        id: "applied",
        need: 1,
        labs: [
          "ai-foundations-lab-2-four-elements",
          "ai-practitioner-lab-2-reusable-prompt",
          "ai-forward-lab-3-reusable-prompt-template",
          "ai-for-parents-lab-2-socratic-tutor-prompt",
          "ai-small-business-lab-2-brand-voice-week-of-posts",
        ],
      },
      { id: "quiz", need: 1, quizzes: ["practical-prompt-engineering:0", "ai-practitioner:1", "ai-foundations:1"] },
    ],
  },
  {
    slug: "rag",
    glyph: "rag",
    name: "Retrieval-Augmented Generation (RAG)",
    description:
      "Grounds AI answers in source material, checks claims against their sources and handles retrieved content safely.",
    minTracks: 2,
    requirements: [
      {
        id: "core",
        need: 2,
        labs: [
          "ai-practitioner-lab-3-check-a-summary-against-its-source",
          "ai-forward-lab-2-check-a-research-summary",
          "ai-foundations-lab-6-source-check",
          "ml-fundamentals-lab-4-grounded-rag-prompt",
          "ai-agents-lab-4-mini-rag-with-citations",
        ],
      },
      {
        id: "applied",
        need: 1,
        labs: [
          "ai-practitioner-lab-6-summarise-untrusted-content-safely",
          "ai-systems-expert-lab-4-injection-resistant-instructions",
        ],
      },
      { id: "quiz", need: 1, quizzes: ["ai-practitioner:2", "ai-foundations:2"] },
    ],
  },
  {
    slug: "ai-governance",
    glyph: "governance",
    name: "AI Governance",
    description:
      "Assesses AI risk, protects personal data and documents decisions so AI use stays accountable and compliant.",
    minTracks: 2,
    requirements: [
      {
        id: "core",
        need: 2,
        labs: [
          "ai-systems-expert-lab-5-risk-assessment-and-documentation",
          "ai-foundations-lab-5-redaction-drill",
          "ai-practitioner-lab-6-summarise-untrusted-content-safely",
          "ai-governance-lab-1-use-case-register",
          "ai-governance-lab-3-impact-assessment",
          "ai-governance-lab-4-incident-playbook",
          "ai-governance-lab-5-critique-vendor-terms",
          "ml-fundamentals-lab-6-risk-assessment",
        ],
      },
      { id: "quiz", need: 1, quizzes: ["ai-systems-expert:4", "ai-practitioner:5", "ai-foundations:4"] },
    ],
  },
  {
    slug: "systems-thinking",
    glyph: "systems",
    name: "Systems Thinking",
    description:
      "Maps work, products and AI rollouts as systems of parts, flows and feedback loops before changing them.",
    minTracks: 2,
    requirements: [
      {
        id: "core",
        need: 2,
        labs: [
          "ai-systems-expert-lab-1-map-a-rollout-as-a-system",
          "ai-foundations-lab-8-map-a-system",
          "vibe-coding-lab-1-map-the-system",
          "ai-practitioner-lab-1-map-your-workflow",
          "ai-small-business-lab-1-map-your-business",
          "prompt-specialist-lab-2-map-and-chain",
        ],
      },
      { id: "quiz", need: 1, quizzes: ["ai-systems-expert:0", "ai-foundations:7", "ai-practitioner:0"] },
    ],
  },
  {
    slug: "ai-evaluation",
    glyph: "evaluation",
    name: "AI Evaluation and Testing",
    description:
      "Builds test sets, rubrics and quality checks that show whether an AI system actually works before and after launch.",
    minTracks: 2,
    requirements: [
      {
        id: "core",
        need: 2,
        labs: [
          "ai-practitioner-lab-4-design-a-quality-check",
          "prompt-specialist-lab-4-test-set-and-rubric",
          "ai-systems-expert-lab-3-design-an-evaluation",
          "vibe-coding-lab-4-fix-the-bug-then-prove-it",
          "ml-fundamentals-lab-3-evaluation-report",
          "ai-agents-lab-6-evaluation-plan",
        ],
      },
      {
        id: "quiz",
        need: 1,
        quizzes: ["ai-systems-expert:2", "practical-prompt-engineering:3", "ai-practitioner:3", "vibe-coding-engineer:3"],
      },
    ],
  },
  {
    slug: "ai-security",
    glyph: "security",
    name: "Secure AI Use",
    description:
      "Recognises prompt injection, unsafe output and data leaks, and designs instructions and reviews that resist them.",
    minTracks: 2,
    requirements: [
      {
        id: "core",
        need: 2,
        labs: [
          "ai-systems-expert-lab-4-injection-resistant-instructions",
          "ai-practitioner-lab-6-summarise-untrusted-content-safely",
          "vibe-coding-lab-5-security-review",
          "ai-foundations-lab-5-redaction-drill",
          "ai-for-parents-lab-4-spot-the-unsafe-chatbot-reply",
          "ai-agents-lab-7-pre-launch-design-review",
        ],
      },
      { id: "quiz", need: 1, quizzes: ["ai-systems-expert:3", "vibe-coding-engineer:4", "ai-foundations:4"] },
    ],
  },
  {
    slug: "workflow-automation",
    glyph: "automation",
    name: "Workflow Automation",
    description:
      "Finds the tasks worth automating and designs AI automations with clear triggers, checks and a human in control.",
    minTracks: 2,
    requirements: [
      {
        id: "core",
        need: 2,
        labs: [
          "ai-practitioner-lab-5-design-an-automation",
          "ai-small-business-lab-4-design-an-automation",
          "ai-forward-lab-4-task-inventory",
          "ai-systems-expert-lab-2-critique-an-agent-design",
          "ai-agents-lab-3-tool-calling-loop",
        ],
      },
      { id: "quiz", need: 1, quizzes: ["ai-practitioner:4", "ai-small-business:3", "ai-forward-professional:2"] },
    ],
  },
  {
    // The 30 Doors: the pre-launch security audit taught in Vibe Coding
    // (Module 7, Ship Safe) and Building AI Apps and Agents.
    slug: "ship-safe",
    glyph: "security",
    name: "Ship Safe",
    description:
      "Audits an AI-built app against 30 common security doors before launch, from keys and access checks to AI spending limits, prompt injection and tested backups, and fixes the gaps.",
    minTracks: 2,
    requirements: [
      {
        id: "core",
        need: 2,
        labs: [
          "vibe-coding-lab-7-security-audit",
          "vibe-coding-lab-8-your-app-security-report",
          "ai-agents-lab-8-security-audit-agent-app",
          "vibe-coding-lab-5-security-review",
          "ai-agents-lab-7-pre-launch-design-review",
          "ai-systems-expert-lab-4-injection-resistant-instructions",
        ],
      },
      { id: "quiz", need: 1, quizzes: ["vibe-coding-engineer:6", "ai-apps-agents:4", "ai-systems-expert:3"] },
    ],
  },
];

export const SKILL_BY_SLUG = new Map(SKILL_BADGES.map((b) => [b.slug, b]));

// ── Keys ────────────────────────────────────────────────────────────────────

export const moduleBadgeKey = (trackSlug: string, sortOrder: number) => `module:${trackSlug}:${sortOrder}`;
export const studioBadgeKey = (toolId: string) => `studio:${toolId}`;
export const capstoneBadgeKey = (trackSlug: string) => `capstone:${trackSlug}`;
export const skillBadgeKey = (slug: string) => `skill:${slug}`;

export function familyOf(key: string): SkillBadgeFamily | null {
  const f = key.split(":")[0];
  return f === "module" || f === "studio" || f === "capstone" || f === "skill" ? f : null;
}

export function glyphFor(key: string): BadgeGlyph {
  const fam = familyOf(key);
  if (fam === "skill") return SKILL_BY_SLUG.get(key.slice(6))?.glyph ?? "module";
  if (fam === "studio") return "studio";
  if (fam === "capstone") return "capstone";
  return "module";
}

// ── Brand ───────────────────────────────────────────────────────────────────

export const BADGE_NAVY = "#1B3A6B";
export const BADGE_ORANGE = "#F47C20";

/** Kicker shown above a badge name, per family (English, for credentials and images). */
export const FAMILY_LABEL_EN: Record<SkillBadgeFamily, string> = {
  module: "Module Mastery",
  studio: "Studio Challenge Set",
  capstone: "Capstone with Distinction",
  skill: "Cross-Track Skill",
};
