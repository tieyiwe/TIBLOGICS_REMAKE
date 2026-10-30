// Learner support ("Need help?"): values shared by the learner widget, the
// API routes and the admin pages. Client safe (no server imports).

export const SUPPORT_TOPICS = ["lesson", "technical", "billing", "certificate", "team", "feedback", "other"] as const;
export type SupportTopic = (typeof SUPPORT_TOPICS)[number];

/** Admin labels (English, staff only). Learner labels live in support.topic.* */
export const TOPIC_LABEL: Record<SupportTopic, string> = {
  lesson: "Lesson or lab question",
  technical: "Technical problem",
  billing: "Billing or access",
  certificate: "Certificate",
  team: "Team plan",
  feedback: "Feedback or idea",
  other: "Other",
};

export const SUPPORT_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];

/** open: waiting for the team · answered: the team replied last · closed. */
export const SUPPORT_STATUSES = ["open", "answered", "closed"] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export const SUPPORT_MSG_MIN = 10;
export const SUPPORT_MSG_MAX = 4000;
export const SUPPORT_LINK_MAX = 500;
export const SUPPORT_NAME_MAX = 120;

/** Context the server attaches to a ticket (built server-side, never trusted from the browser except the path). */
export interface SupportContext {
  path?: string | null;
  pageTitle?: string | null;
  lesson?: string | null;
  track?: string | null;
  device?: string | null;
  plan?: string | null;
  locale?: string | null;
}

export const CONTEXT_LABEL: Record<keyof SupportContext, string> = {
  path: "Page",
  pageTitle: "Page title",
  lesson: "Lesson / lab",
  track: "Track",
  device: "Browser / device",
  plan: "Plan",
  locale: "Language",
};

export function isTopic(v: unknown): v is SupportTopic {
  return typeof v === "string" && (SUPPORT_TOPICS as readonly string[]).includes(v);
}
