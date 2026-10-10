// The format for prompts written directly for Toolkit Live (the original five
// toolkits come from the PDFs via library.json).
//
// How every prompt here is built, because this is what gets strong results:
//   1. A role with the right expertise ("Act as a ...").
//   2. The facts only the user knows, as [BRACKETED FIELDS] they fill in.
//   3. One clear deliverable and who it is for.
//   4. What good looks like: what to include, tone, length, format.
//   5. A guardrail: never invent facts; missing details stay as placeholders.
// Plain punctuation only: no em dashes, curly quotes or ellipsis characters.

export interface PromptDraft {
  /** Category, as shown in the library. */
  c: string;
  /** Title. */
  t: string;
  /** "Use this when": the situation it is for. */
  u: string;
  /** The prompt. */
  p: string;
  /** Pro tip. */
  tip: string;
}

export interface IndustryPack {
  id: string;
  label: string;
  prompts: PromptDraft[];
}
