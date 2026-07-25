// Shared domain types for TIBLOGICS Learn.
// Status-like DB columns are String; these unions are the source of truth.

export const TRACK_LEVELS = ["starter", "beginner", "intermediate", "advanced"] as const;
export type TrackLevel = (typeof TRACK_LEVELS)[number];

export const TRACK_STATUSES = ["draft", "coming_soon", "live"] as const;
export type TrackStatus = (typeof TRACK_STATUSES)[number];

export const CONTENT_TYPES = ["video", "article", "mixed"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const SUB_STATUSES = ["trialing", "active", "past_due", "canceled"] as const;
export type SubStatus = (typeof SUB_STATUSES)[number];

export const CAPSTONE_STATUSES = ["submitted", "in_review", "revisions_requested", "passed", "failed"] as const;
export type CapstoneStatus = (typeof CAPSTONE_STATUSES)[number];

export const RESOURCE_TYPES = ["tool", "article", "video", "dataset", "template", "account_signup"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const EXAM_SESSION_STATUSES = ["in_progress", "submitted", "expired"] as const;
export type ExamSessionStatus = (typeof EXAM_SESSION_STATUSES)[number];

export const POINT_SOURCES = [
  "lesson_complete",
  "micro_check_pass",
  "quiz_pass",
  "quiz_perfect",
  "final_exam_pass",
  "final_exam_distinction",
  "capstone_pass",
  "streak_bonus",
  "track_complete",
] as const;
export type PointSource = (typeof POINT_SOURCES)[number];

// ── Level badge presentation ────────────────────────────────────────────────
export const LEVEL_META: Record<TrackLevel, { label: string; emoji: string; color: string; bg: string; meaning: string }> = {
  starter:      { label: "Starter",      emoji: "🟢", color: "#22A387", bg: "rgba(34,163,135,.12)",  meaning: "Zero assumed knowledge" },
  beginner:     { label: "Beginner",     emoji: "🔵", color: "#3B82F6", bg: "rgba(59,130,246,.12)",  meaning: "Comfortable with everyday tech" },
  intermediate: { label: "Intermediate", emoji: "🟡", color: "#F9A738", bg: "rgba(249,167,56,.12)",  meaning: "Some professional/technical grounding" },
  advanced:     { label: "Advanced",     emoji: "🔴", color: "#EF4444", bg: "rgba(239,68,68,.12)",   meaning: "Builds real systems" },
};

export function levelLabel(level: string, levelEnd?: string | null): string {
  const a = LEVEL_META[level as TrackLevel]?.label ?? level;
  if (!levelEnd) return a;
  const b = LEVEL_META[levelEnd as TrackLevel]?.label ?? levelEnd;
  return `${a} → ${b}`;
}

// ── Duration formatting (shown at lesson, module and track level) ───────────
export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr${h === 1 ? "" : "s"}` : `${h} hr ${m} min`;
}

export function formatHours(hours: number): string {
  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)} hrs`;
}

export function pacingHint(hours: number, weeks?: number | null, perWeek = 3): string {
  const w = weeks ?? Math.max(1, Math.round(hours / perWeek));
  return `≈ ${formatHours(hours)} · ${w} week${w === 1 ? "" : "s"} at ${perWeek} hrs/week`;
}
