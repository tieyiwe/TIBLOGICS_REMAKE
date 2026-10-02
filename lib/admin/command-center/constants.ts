// Shared vocabulary for the Command Center and Finance. Safe to import from
// client and server code (no Node APIs).

export const TASK_STATUSES = [
  { value: "todo", label: "To do", tone: "neutral" },
  { value: "in_progress", label: "In progress", tone: "info" },
  { value: "review", label: "In review", tone: "orange" },
  { value: "done", label: "Done", tone: "success" },
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number]["value"];
export const TASK_STATUS_VALUES = TASK_STATUSES.map((s) => s.value) as [TaskStatus, ...TaskStatus[]];

export const TASK_PRIORITIES = [
  { value: "urgent", label: "Urgent", tone: "danger", rank: 4 },
  { value: "high", label: "High", tone: "orange", rank: 3 },
  { value: "medium", label: "Medium", tone: "warn", rank: 2 },
  { value: "low", label: "Low", tone: "info", rank: 1 },
  { value: "none", label: "No priority", tone: "neutral", rank: 0 },
] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number]["value"];
export const TASK_PRIORITY_VALUES = TASK_PRIORITIES.map((p) => p.value) as [TaskPriority, ...TaskPriority[]];

export const PROJECT_CATEGORIES = [
  { value: "CLIENT", label: "Client" },
  { value: "SAAS", label: "SaaS" },
  { value: "EDUCATION", label: "Education" },
  { value: "INTERNAL", label: "Internal" },
] as const;
export const PROJECT_CATEGORY_VALUES = ["CLIENT", "SAAS", "EDUCATION", "INTERNAL"] as const;

export const PROJECT_STATUSES = [
  { value: "CONCEPT", label: "Concept", tone: "neutral" },
  { value: "ACTIVE", label: "Active", tone: "info" },
  { value: "PAUSED", label: "Paused", tone: "warn" },
  { value: "COMPLETED", label: "Completed", tone: "success" },
  { value: "ARCHIVED", label: "Archived", tone: "neutral" },
] as const;
export const PROJECT_STATUS_VALUES = ["CONCEPT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"] as const;

export const PROJECT_PRIORITIES = [
  { value: "CRITICAL", label: "Critical", tone: "danger" },
  { value: "HIGH", label: "High", tone: "orange" },
  { value: "MEDIUM", label: "Medium", tone: "warn" },
  { value: "LOW", label: "Low", tone: "info" },
] as const;
export const PROJECT_PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const HEALTH = [
  { value: "on_track", label: "On track", tone: "success" },
  { value: "at_risk", label: "At risk", tone: "warn" },
  { value: "off_track", label: "Off track", tone: "danger" },
] as const;
export type Health = (typeof HEALTH)[number]["value"];
export const HEALTH_VALUES = ["on_track", "at_risk", "off_track"] as const;

export const NOTE_KINDS = [
  { value: "note", label: "Note" },
  { value: "meeting", label: "Meeting notes" },
  { value: "spec", label: "Spec" },
  { value: "decision", label: "Decision" },
] as const;
export const NOTE_KIND_VALUES = ["note", "meeting", "spec", "decision"] as const;

export const MEETING_TEMPLATE = `## Attendees
-

## Agenda
-

## Notes


## Decisions
-

## Action items
- [ ]
`;

/** Appended to a note checklist line once it has been turned into a task. */
export const TASK_MARK = "(task created)";

export const PROJECT_COLORS = ["#2251A3", "#F47C20", "#0F766E", "#7C3AED", "#B91C1C", "#1B3A6B", "#B45309", "#15803D"];

/** Days without a status update before a project is flagged. */
export const STALE_UPDATE_DAYS = 14;

// ── Finance ────────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  { value: "hosting", label: "Hosting" },
  { value: "ai_apis", label: "AI APIs" },
  { value: "software", label: "Software" },
  { value: "marketing", label: "Marketing" },
  { value: "contractors", label: "Contractors" },
  { value: "travel", label: "Travel" },
  { value: "fees", label: "Fees" },
  { value: "taxes", label: "Taxes" },
  { value: "other", label: "Other" },
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];
export const EXPENSE_CATEGORY_VALUES = EXPENSE_CATEGORIES.map((c) => c.value) as [ExpenseCategory, ...ExpenseCategory[]];
export const categoryLabel = (v: string) => EXPENSE_CATEGORIES.find((c) => c.value === v)?.label ?? v;

export const CURRENCIES = ["USD", "CAD", "EUR", "XOF"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Starting exchange rates (USD per 1 unit) offered in forms; editable in Finance settings and per entry. */
export const DEFAULT_FX: Record<Currency, number> = { USD: 1, CAD: 0.73, EUR: 1.08, XOF: 0.00165 };

export const INCOME_STATUSES = [
  { value: "invoiced", label: "Invoiced", tone: "info" },
  { value: "paid", label: "Paid", tone: "success" },
  { value: "overdue", label: "Overdue", tone: "danger" },
] as const;
export const INCOME_STATUS_VALUES = ["invoiced", "paid", "overdue"] as const;

export const PAYMENT_METHODS = ["Card", "Bank transfer", "PayPal", "Stripe", "Cash", "Other"] as const;

export const TAX_LABELS = ["HST", "GST", "PST", "QST", "TVA", "VAT", "Sales tax"] as const;

export const PLATFORM_SOURCES = [
  { value: "learn_subs", label: "ARFA subscriptions", estimate: true },
  { value: "team_seats", label: "ARFA team seats", estimate: true },
  { value: "tracks", label: "ARFA track purchases", estimate: false },
  { value: "toolkit", label: "Toolkit Live", estimate: true },
  { value: "store", label: "Store orders", estimate: false },
  { value: "blueprints", label: "Automation Blueprints", estimate: false },
  { value: "events", label: "Events & training", estimate: false },
  { value: "bookings", label: "Paid bookings", estimate: false },
] as const;
export type PlatformSource = (typeof PLATFORM_SOURCES)[number]["value"];
export const sourceLabel = (v: string) =>
  v === "manual" ? "Client invoices" : PLATFORM_SOURCES.find((s) => s.value === v)?.label ?? v;
