import { z } from "zod";
import { LOCALES } from "@/lib/i18n/config";

// What the customer tells us, validated once for the form and the API.

export const FREQUENCIES = { day: 21.7, week: 4.33, month: 1 } as const;

const text = (max: number, label: string) => z.string().trim().max(max, `${label} is too long`);

export const ProcessSchema = z.object({
  name: text(120, "Process name").min(3, "Name each process"),
  steps: text(2000, "Steps").min(20, "Describe the steps in a sentence or two"),
  timesPer: z.coerce.number().min(0.25, "How often does it happen?").max(1000),
  per: z.enum(["day", "week", "month"]),
  minutesEach: z.coerce.number().min(1, "Roughly how long does it take?").max(2400),
  people: z.coerce.number().int().min(1).max(500),
  tools: text(500, "Tools").default(""),
  pain: text(1000, "What goes wrong").default(""),
});

export const IntakeSchema = z.object({
  name: text(100, "Name").min(1, "Your name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  company: text(120, "Company").min(1, "Company name is required"),
  industry: text(120, "Industry").min(2, "What industry are you in?"),
  teamSize: z.enum(["1", "2-5", "6-20", "21-50", "51+"]),
  tools: text(800, "Software you use").min(2, "List the software you already use"),
  goals: text(1000, "Goals").min(5, "What would you like to get out of this?"),
  budget: z.enum(["not-sure", "under-1k", "1k-5k", "5k-15k", "15k-plus"]),
  processes: z.array(ProcessSchema).min(1, "Describe at least one process").max(3, "Up to three processes"),
  /** The language the customer bought in; the blueprint is written in it. Absent on older intakes (English). */
  locale: z.enum(LOCALES).optional(),
});

/**
 * Translation keys for the messages above, so the API can answer in the
 * visitor's language (lib/i18n/messages/tools.ts, "tools.bp.v.*").
 */
export const ISSUE_KEYS: Record<string, string> = {
  "Name each process": "nameEach",
  "Describe the steps in a sentence or two": "steps",
  "How often does it happen?": "howOften",
  "Roughly how long does it take?": "howLong",
  "Your name is required": "name",
  "Enter a valid email": "email",
  "Company name is required": "company",
  "What industry are you in?": "industry",
  "List the software you already use": "tools",
  "What would you like to get out of this?": "goals",
  "Describe at least one process": "atLeastOne",
  "Up to three processes": "upToThree",
};

/** The labels used in "<label> is too long", keyed for translation ("tools.bp.field.*"). */
export const FIELD_KEYS: Record<string, string> = {
  "Process name": "processName",
  Steps: "steps",
  Tools: "tools",
  "What goes wrong": "pain",
  Name: "name",
  Company: "company",
  Industry: "industry",
  "Software you use": "software",
  Goals: "goals",
};

export type Intake = z.infer<typeof IntakeSchema>;
export type ProcessIntake = z.infer<typeof ProcessSchema>;

/** Hours a month the process takes today, from the customer's own numbers. */
export function currentHours(p: Pick<ProcessIntake, "timesPer" | "per" | "minutesEach">): number {
  return Math.round(((p.timesPer * FREQUENCIES[p.per] * p.minutesEach) / 60) * 10) / 10;
}

export const BUDGET_LABELS: Record<Intake["budget"], string> = {
  "not-sure": "Not sure yet",
  "under-1k": "Under $1,000",
  "1k-5k": "$1,000 to $5,000",
  "5k-15k": "$5,000 to $15,000",
  "15k-plus": "Over $15,000",
};
