// Client-safe constants for the Growth lead workspace (no server imports).

export const STAGES = [
  { key: "new", label: "New", color: "#7A8FA6" },
  { key: "enriched", label: "Enriched", color: "#2251A3" },
  { key: "contacted", label: "Contacted", color: "#1D76BA" },
  { key: "replied", label: "Replied", color: "#7c3aed" },
  { key: "interested", label: "Interested", color: "#0F6E56" },
  { key: "hot", label: "Hot", color: "#F47C20" },
  { key: "converted", label: "Customer", color: "#16a34a" },
  { key: "lost", label: "Not interested", color: "#9CA3AF" },
] as const;
export type Stage = (typeof STAGES)[number]["key"];
export const STAGE_KEYS = STAGES.map((s) => s.key) as string[];

/** A lead in one of these stages never receives another automated email. */
export const STOP_STAGES = new Set(["replied", "interested", "hot", "converted", "lost"]);

export const CONSENT_BASES = [
  { key: "unset", label: "Not set (blocks sending)" },
  { key: "implied_published", label: "Implied: business address conspicuously published, message relevant to their role (CASL s.10(9)(b))" },
  { key: "implied_relationship", label: "Implied: existing business relationship / enquiry in last 2 years (CASL s.10(10))" },
  { key: "express", label: "Express consent (they opted in)" },
  { key: "us_only_canspam", label: "US recipient, CAN-SPAM opt-out basis" },
  { key: "none", label: "No basis: do not email" },
] as const;
export const SENDABLE_CONSENT = new Set(["implied_published", "implied_relationship", "express", "us_only_canspam"]);

