// The "why these numbers" groups of the AI estimate. Its own module so the
// page can use them without importing the estimate's parser (and zod).
export const RATIONALE_KEYS = ["usage", "model", "features", "build", "pricing"] as const;
export type RationaleKey = (typeof RATIONALE_KEYS)[number];
export type Rationale = Partial<Record<RationaleKey, string>>;
