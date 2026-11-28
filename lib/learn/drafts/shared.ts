// Shared by the drafts API, the server helpers and the browser hook: which
// keys exist, how big a draft may be, and what counts as "empty".

/** Largest draft accepted, in bytes of JSON. */
export const DRAFT_MAX_BYTES = 200 * 1024;
/** Drafts kept per learner; the oldest are pruned past this. */
export const DRAFTS_PER_LEARNER = 300;

const ID = "[A-Za-z0-9_-]{1,64}";

/**
 * lab:<labId>                       workbench answers or a prompt lab's prompt
 * code:<labId>                      Code Studio code, versions, AI conversation
 * studio:<toolId>:<challengeId>     a Learning Studio design in progress
 * capstone:<capstoneId>             capstone link and notes before submitting
 * pos:<lessonId>                    where the learner was in a lesson
 */
export const DRAFT_KEY_RE = new RegExp(
  `^(?:(?:lab|code|capstone|pos):${ID}|studio:[a-z0-9-]{1,40}:${ID})$`,
);

export type DraftKind = "lab" | "code" | "studio" | "capstone" | "pos";

export function isDraftKey(key: unknown): key is string {
  return typeof key === "string" && DRAFT_KEY_RE.test(key);
}

export function draftKind(key: string): DraftKind {
  return key.slice(0, key.indexOf(":")) as DraftKind;
}

/**
 * True when a value holds nothing the learner wrote: blank strings, empty
 * lists and objects made only of those. Numbers and booleans are settings,
 * not content, so they do not make a draft non-empty.
 */
export function isEmptyDraft(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (typeof v === "number" || typeof v === "boolean") return true;
  if (Array.isArray(v)) return v.every(isEmptyDraft);
  if (typeof v === "object") return Object.values(v as Record<string, unknown>).every(isEmptyDraft);
  return true;
}

export function draftBytes(v: unknown): number {
  return new TextEncoder().encode(JSON.stringify(v ?? null)).length;
}
