// Typed shapes for seed content. Content files are plain data — the runner
// in ./index.ts is the only thing that touches the database.

export interface SeedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  /** Final-exam questions only: 1=recall 2=application 3=analysis */
  difficulty?: number;
  /** Final-exam questions only: 1-based module number this maps to */
  moduleNumber?: number;
}

export interface SeedResource {
  title: string;
  url: string;
  resourceType: "tool" | "article" | "video" | "dataset" | "template" | "account_signup";
  isFree?: boolean;
  isRequired?: boolean;
  notes?: string;
}

export interface SeedLesson {
  title: string;
  objective?: string;
  durationMinutes: number;
  contentType?: "video" | "article" | "mixed";
  videoUrl?: string;
  bodyMd: string;
  isPreview?: boolean;
  resources?: SeedResource[];
  /** Bank for the after-lesson quick check. 3 are served. */
  microCheck?: SeedQuestion[];
}

export interface SeedModule {
  title: string;
  summary?: string;
  lessons: SeedLesson[];
  /** Bank for the module quiz. 8 are served, 80% to pass. */
  quiz?: SeedQuestion[];
}

export interface SeedCapstone {
  briefMd: string;
  passThreshold?: number;
  rubric: Array<{ criterion: string; weight: number; description?: string }>;
}

export interface SeedFinalExam {
  title: string;
  timeLimitMinutes: number;
  questionsServed: number;
  passScore?: number;
  distinctionScore?: number;
  maxAttempts?: number;
  cooldownHours?: number;
  instructionsMd: string;
  questions: SeedQuestion[];
}

export interface SeedLab {
  slug: string;
  title: string;
  labType: "prompt" | "critique" | "build";
  /** 1-based module this lab belongs to. */
  moduleNumber?: number;
  briefMd: string;
  scenarioMd?: string;
  objectives: Array<{ id: string; label: string; weight: number; guidance?: string }>;
  /** Type-specific config — see lib/learn/labs/types.ts */
  config: Record<string, unknown> & { kind: "prompt" | "critique" | "build" };
  passScore?: number;
  points?: number;
  estimatedMinutes?: number;
  isPublished?: boolean;
}

export interface SeedTrack {
  slug: string;
  title: string;
  tagline?: string;
  description: string;
  level: "starter" | "beginner" | "intermediate" | "advanced";
  levelEnd?: "starter" | "beginner" | "intermediate" | "advanced";
  status: "draft" | "coming_soon" | "live";
  sortOrder: number;
  accentColor: string;
  certificateName: string;
  audience?: string;
  outcomes: string[];
  /** Derived from lesson durations when omitted. */
  estimatedHours?: number;
  estimatedWeeksAt3Hrs?: number;
  modules: SeedModule[];
  finalExam?: SeedFinalExam;
  capstone?: SeedCapstone;
  labs?: SeedLab[];
}

/** Sum of every lesson duration in the track, in minutes. */
export function trackMinutes(track: SeedTrack): number {
  return track.modules.reduce(
    (n, m) => n + m.lessons.reduce((x, l) => x + l.durationMinutes, 0),
    0,
  );
}

export function moduleMinutes(mod: SeedModule): number {
  return mod.lessons.reduce((n, l) => n + l.durationMinutes, 0);
}

/**
 * Duration consistency check (Part B rule 8). A track's advertised hours must
 * match the sum of its lessons, or the catalog is lying to people.
 */
export function assertDurationConsistency(track: SeedTrack, toleranceMinutes = 30): void {
  if (track.estimatedHours == null) return;

  const actual = trackMinutes(track);

  // A track with no lessons yet (coming_soon) advertises a *planned* duration.
  // There is nothing to be inconsistent with, so the rule only binds once
  // lessons exist — at which point the advertised figure becomes a claim.
  if (actual === 0) return;

  const advertised = Math.round(track.estimatedHours * 60);
  const drift = Math.abs(actual - advertised);
  if (drift > toleranceMinutes) {
    throw new Error(
      `[seed] Track "${track.slug}" advertises ${track.estimatedHours}h (${advertised} min) ` +
        `but its lessons total ${actual} min — a drift of ${drift} min. ` +
        `Fix estimatedHours or the lesson durations.`,
    );
  }
}
