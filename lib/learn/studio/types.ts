// Learning Studio: interactive micro-tools for active learning. They run in
// the browser with no AI calls, so they cost nothing to use. Each tool has
// challenges; completing one earns points (and badges) through
// /api/learn/studio/complete.

export interface StudioChallengeMeta {
  /** Stable id, unique within the tool. Used in the points ledger. */
  id: string;
  /** 1 easy, 2 medium, 3 hard. Shown as a difficulty pip. */
  difficulty: 1 | 2 | 3;
}

export interface StudioToolMeta {
  /** Stable id, kebab-case. Used in URLs, the ledger and lesson embeds. */
  id: string;
  icon: string;
  /** Tracks this tool supports (shown on those tracks' Studio lists). */
  tracks: string[];
  challenges: StudioChallengeMeta[];
  /** True once the tool's component is built; unfinished tools are hidden. */
  ready: boolean;
}

/** What a tool component reports when a challenge is completed. */
export interface StudioResult {
  challengeId: string;
  stars: 1 | 2 | 3;
}

/** Props every tool component receives. */
export interface StudioToolProps {
  /** Start on this challenge, or null for the free sandbox / picker. */
  challengeId: string | null;
  /** Compact layout when embedded inside a lesson. */
  embedded?: boolean;
  /** Call once per successful completion. The host saves points and celebrates. */
  onComplete: (result: StudioResult) => void;
  /** Challenges already completed / perfected (from the server). */
  progress: Record<string, { done: boolean; perfect: boolean }>;
}
