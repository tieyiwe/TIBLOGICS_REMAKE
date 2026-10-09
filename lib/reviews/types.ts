// Reviews and testimonials: shared types and limits. Client-safe (no imports).

export const REVIEW_SOURCES = ["consultation", "project", "arfa", "store", "other"] as const;
export type ReviewSource = (typeof REVIEW_SOURCES)[number];

export const REVIEW_STATUSES = ["pending", "approved", "hidden"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const QUOTE_MIN = 20;
export const QUOTE_MAX = 600;
export const NAME_MAX = 80;
export const ROLE_MAX = 80;
export const COMPANY_MAX = 100;
export const STAFF_NOTE_MAX = 300;

export const SOURCE_LABELS: Record<ReviewSource, string> = {
  consultation: "Consultation",
  project: "Project",
  arfa: "ARFA learner",
  store: "Store",
  other: "Other",
};

/** A review as the public sees it: never the email or staff fields. */
export interface PublicReview {
  id: string;
  firstName: string;
  role: string;
  company: string | null;
  quote: string;
  rating: number;
  source: ReviewSource;
  locale: string;
  approvedAt: string;
}

/** A review as staff see it in /admin_pro/reviews. */
export interface AdminReview {
  id: string;
  name: string;
  role: string;
  company: string | null;
  quote: string;
  rating: number;
  source: ReviewSource;
  locale: string;
  email: string;
  consentPublish: boolean;
  status: ReviewStatus;
  featured: boolean;
  addedByStaff: boolean;
  staffNote: string | null;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
}

/** The first name only: the consent covers the first name, not the full name. */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

/** An error for the server log, with any email address masked: logs never carry reviewers' emails. */
export function logSafe(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/[^\s<>()"',;:]+@[^\s<>()"',;:]+/g, "[email]").slice(0, 500);
}
