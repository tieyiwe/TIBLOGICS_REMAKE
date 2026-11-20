// The review text rules, for the public form and for reviews staff add.
// Built on the platform's free-text filter (lib/learn/youth-text.ts): plain
// text, no links, no contact details (email, phone, @handles), no bad words.
// A review that breaks a rule is refused with the field to fix, never edited.
import { z } from "zod";
import { cleanFreeText } from "@/lib/learn/youth-text";
import { COMPANY_MAX, NAME_MAX, QUOTE_MAX, QUOTE_MIN, REVIEW_SOURCES, ROLE_MAX, STAFF_NOTE_MAX } from "./types";

export type ReviewField = "name" | "role" | "company" | "quote" | "rating" | "staffNote";
export type FieldProblem = { field: ReviewField; code: "required" | "short" | "long" | "filtered" };

export interface CleanReviewText {
  name: string;
  role: string;
  company: string | null;
  quote: string;
}

const squash = (s: string) => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/** Cleans the four public fields, or names the first one to fix. */
export function cleanReviewText(raw: { name: string; role: string; company?: string | null; quote: string }): { ok: true; data: CleanReviewText } | ({ ok: false } & FieldProblem) {
  const one = (field: ReviewField, value: string, min: number, max: number): string | FieldProblem => {
    const v = squash(value);
    if (!v) return { field, code: "required" };
    if (v.length < min) return { field, code: "short" };
    if (v.length > max) return { field, code: "long" };
    const ok = cleanFreeText(v, max, min);
    return ok ?? { field, code: "filtered" };
  };
  const name = one("name", raw.name, 2, NAME_MAX);
  if (typeof name !== "string") return { ok: false, ...name };
  const role = one("role", raw.role, 2, ROLE_MAX);
  if (typeof role !== "string") return { ok: false, ...role };
  let company: string | null = null;
  if (raw.company && squash(raw.company)) {
    const c = one("company", raw.company, 1, COMPANY_MAX);
    if (typeof c !== "string") return { ok: false, ...c };
    company = c;
  }
  const quote = one("quote", raw.quote, QUOTE_MIN, QUOTE_MAX);
  if (typeof quote !== "string") return { ok: false, ...quote };
  return { ok: true, data: { name, role, company, quote } };
}

/** The public form's body (POST /api/reviews). Lengths are checked again by cleanReviewText. */
export const PublicReviewBody = z.object({
  token: z.string().min(20).max(1200),
  name: z.string().max(NAME_MAX * 2),
  role: z.string().max(ROLE_MAX * 2),
  company: z.string().max(COMPANY_MAX * 2).optional().nullable(),
  quote: z.string().max(QUOTE_MAX * 2),
  rating: z.number().int().min(1).max(5),
  consent: z.boolean(),
  locale: z.enum(["en", "fr", "sw"]).optional(),
  /** Honeypot: a hidden field people never fill in. */
  website: z.string().max(200).optional().nullable(),
  /** When the form was rendered (ms): a submit within 3 s is a bot. */
  ts: z.number().int().optional().nullable(),
});

/** A review received elsewhere (email, LinkedIn), added by staff (POST /api/admin/reviews). */
export const StaffReviewBody = z.object({
  name: z.string().max(NAME_MAX * 2),
  role: z.string().max(ROLE_MAX * 2),
  company: z.string().max(COMPANY_MAX * 2).optional().nullable(),
  quote: z.string().max(QUOTE_MAX * 2),
  rating: z.number().int().min(1).max(5),
  source: z.enum(REVIEW_SOURCES),
  locale: z.enum(["en", "fr", "sw"]),
  email: z.string().trim().toLowerCase().email().max(254),
  /** Staff confirm the reviewer agreed to publication. Required. */
  consent: z.literal(true),
  staffNote: z.string().trim().min(5).max(STAFF_NOTE_MAX),
});

/** Staff invite (POST /api/admin/reviews/invite). send=false only returns the link to copy. */
export const InviteBody = z.object({
  name: z.string().trim().min(2).max(NAME_MAX),
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.enum(REVIEW_SOURCES),
  locale: z.enum(["en", "fr", "sw"]),
  send: z.boolean(),
});

export const ActionBody = z.object({ action: z.enum(["approve", "hide", "feature", "unfeature"]) });
