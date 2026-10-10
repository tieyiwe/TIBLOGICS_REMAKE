import data from "./library.json";
import type { Vertical } from "./guard/rules";
import { plainText } from "./text";
import { EXTRA_FOR_EXISTING, NEW_INDUSTRIES } from "./prompts";
import type { PromptDraft } from "./prompts/define";

// The prompt library: every prompt from the five industry toolkits, extracted
// from the PDFs by scripts/extract-toolkit-prompts.py so the tool and the
// product stay identical.
//
// Import this from server code only. The prompts are the paid product: public
// pages get titles, and a prompt's full text reaches the browser only through
// routes that check for a subscription.

export interface LibraryPrompt {
  id: string;
  vertical: Exclude<Vertical, "general">;
  number: number;
  category: string;
  title: string;
  useWhen: string;
  prompt: string;
  proTip: string;
  fields: string[];
}

export interface LibraryVertical {
  id: Exclude<Vertical, "general">;
  label: string;
  count: number;
}

const base = data as { verticals: LibraryVertical[]; prompts: LibraryPrompt[] };

/**
 * The [BRACKETED FIELDS] a prompt asks the user to fill in, in order. Also
 * used on translated prompts (lib/i18n/sources/toolkit.ts), so the inputs
 * always match the placeholders in the text being shown.
 */
export function fieldsOf(prompt: string): string[] {
  const out: string[] = [];
  for (const m of prompt.matchAll(/\[([^\]]{2,160})\]/g)) if (!out.includes(m[1])) out.push(m[1]);
  return out;
}

function clean(p: LibraryPrompt): LibraryPrompt {
  return { ...p, title: plainText(p.title), useWhen: plainText(p.useWhen), prompt: plainText(p.prompt), proTip: plainText(p.proTip) };
}

function fromDraft(vertical: string, number: number, d: PromptDraft): LibraryPrompt {
  return clean({
    id: `${vertical}-${number}`,
    vertical: vertical as LibraryPrompt["vertical"],
    number,
    category: d.c,
    title: d.t,
    useWhen: d.u,
    prompt: d.p,
    proTip: d.tip,
    fields: fieldsOf(d.p),
  });
}

// Original toolkits first (ids unchanged, so saved history still resolves),
// then the Toolkit Live additions numbered after them, then new industries.
const prompts: LibraryPrompt[] = [];
const verticals: LibraryVertical[] = [];
for (const v of base.verticals) {
  const own = base.prompts.filter((p) => p.vertical === v.id).map(clean);
  const start = Math.max(0, ...own.map((p) => p.number));
  const extra = (EXTRA_FOR_EXISTING[v.id] ?? []).map((d, i) => fromDraft(v.id, start + i + 1, d));
  // Keep each category together: additions sit after the originals in their category.
  const cats = [...new Set([...own, ...extra].map((p) => p.category))];
  const all = cats.flatMap((c) => [...own.filter((p) => p.category === c), ...extra.filter((p) => p.category === c)]);
  prompts.push(...all);
  verticals.push({ ...v, count: all.length });
}
for (const pack of NEW_INDUSTRIES) {
  const all = pack.prompts.map((d, i) => fromDraft(pack.id, i + 1, d));
  prompts.push(...all);
  verticals.push({ id: pack.id as LibraryVertical["id"], label: pack.label, count: all.length });
}

const library = { verticals, prompts };
const byId = new Map(prompts.map((p) => [p.id, p]));

export const LIBRARY_VERTICALS = library.verticals;
export const LIBRARY_SIZE = library.prompts.length;
/** Distinct task categories across all industries. */
export const CATEGORY_COUNT = new Set(library.prompts.map((p) => `${p.vertical}:${p.category}`)).size;

export function getPrompt(id: string): LibraryPrompt | null {
  return byId.get(id) ?? null;
}

export function promptsFor(vertical: string): LibraryPrompt[] {
  return library.prompts.filter((p) => p.vertical === vertical);
}

/** Titles only, for public pages. */
export function sampleTitles(vertical: string, n: number): string[] {
  return promptsFor(vertical).slice(0, n).map((p) => p.title);
}
