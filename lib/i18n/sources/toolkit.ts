import { localizedList, translated, type Fields } from "../content";
import type { Locale } from "../config";
import { LIBRARY_VERTICALS, promptsFor, fieldsOf, getPrompt, type LibraryPrompt } from "@/lib/toolkit/library";
import { plainText } from "@/lib/toolkit/text";
import { slug } from "@/lib/toolkit/labels";

// Toolkit Live prompt library: title, "use this when", the prompt and the pro
// tip, translated one category at a time (key `prompts:<vertical>:<category>`,
// one cached unit and one model call per category).
//
// Category and industry names are interface text (lib/i18n/messages/toolkit.ts).
// Prompt ids never change, so copy, history and generation work in every
// language. A translated prompt's input fields are read from its translated
// text, so the inputs always match the [PLACEHOLDERS] the user sees.

export interface PromptChunk {
  key: string;
  vertical: string;
  category: string;
  prompts: LibraryPrompt[];
}

let chunkList: PromptChunk[] | null = null;
let chunkById: Map<string, PromptChunk> | null = null;

/** Every category of every industry, in library order. */
export function promptChunks(): PromptChunk[] {
  if (chunkList) return chunkList;
  const out: PromptChunk[] = [];
  for (const v of LIBRARY_VERTICALS) {
    const byCat = new Map<string, LibraryPrompt[]>();
    for (const p of promptsFor(v.id)) byCat.set(p.category, [...(byCat.get(p.category) ?? []), p]);
    for (const [category, prompts] of byCat) out.push({ key: `prompts:${v.id}:${slug(category)}`, vertical: v.id, category, prompts });
  }
  chunkById = new Map(out.flatMap((c) => c.prompts.map((p) => [p.id, c] as const)));
  chunkList = out;
  return out;
}

/** The fields sent for translation. The page and warm() both use this, so the hash matches. */
export function promptRows(prompts: LibraryPrompt[]): Fields[] {
  return prompts.map((p) => ({ title: p.title, useWhen: p.useWhen, prompt: p.prompt, tip: p.proTip }));
}

/** Same flattening as localizedList, for warm(). */
function flatten(rows: Fields[]): Fields {
  const flat: Fields = {};
  rows.forEach((r, i) => Object.entries(r).forEach(([k, v]) => { flat[`${i}.${k}`] = v; }));
  return flat;
}

function apply(p: LibraryPrompt, r: Fields | undefined): LibraryPrompt {
  if (!r) return p;
  const prompt = plainText(r.prompt || p.prompt);
  return {
    ...p,
    title: plainText(r.title || p.title),
    useWhen: plainText(r.useWhen || p.useWhen),
    prompt,
    proTip: plainText(r.tip || p.proTip),
    fields: fieldsOf(prompt),
  };
}

// A finished translation never changes for this build (its cache key is a
// hash of the English), so it is kept in memory; a missing one is asked for
// again at most every 15 seconds. This keeps search, which runs as the user
// types, from reading 108 rows per keystroke.
const ready = new Map<string, LibraryPrompt[]>();
const retryAfter = new Map<string, number>();

async function chunkIn(chunk: PromptChunk, locale: Locale): Promise<{ prompts: LibraryPrompt[]; pending: boolean }> {
  if (locale === "en") return { prompts: chunk.prompts, pending: false };
  const id = `${locale}\0${chunk.key}`;
  const hit = ready.get(id);
  if (hit) return { prompts: hit, pending: false };
  if ((retryAfter.get(id) ?? 0) > Date.now()) return { prompts: chunk.prompts, pending: true };
  const { value, pending } = await localizedList(chunk.key, locale, promptRows(chunk.prompts));
  if (pending) {
    retryAfter.set(id, Date.now() + 15_000);
    return { prompts: chunk.prompts, pending: true };
  }
  const out = chunk.prompts.map((p, i) => apply(p, value[i]));
  ready.set(id, out);
  retryAfter.delete(id);
  return { prompts: out, pending: false };
}

export interface LocalizedLibrary {
  /** Every prompt, translated where its category is ready, English otherwise. */
  prompts: LibraryPrompt[];
  byId: Map<string, LibraryPrompt>;
  /** Ids whose text is in the visitor's language. */
  translatedIds: Set<string>;
  /** True while at least one category is still being translated. */
  pending: boolean;
}

/** The whole library in `locale`. Categories not translated yet stay English and are queued. */
export async function localizedLibrary(locale: Locale): Promise<LocalizedLibrary> {
  const chunks = promptChunks();
  const results = await Promise.all(chunks.map((c) => chunkIn(c, locale)));
  const prompts: LibraryPrompt[] = [];
  const translatedIds = new Set<string>();
  let pending = false;
  results.forEach((r) => {
    prompts.push(...r.prompts);
    if (r.pending) pending = true;
    else if (locale !== "en") r.prompts.forEach((p) => translatedIds.add(p.id));
  });
  return { prompts, byId: new Map(prompts.map((p) => [p.id, p])), translatedIds, pending };
}

/** One prompt in `locale`, or English with pending: true while its category is translated. */
export async function localizedPrompt(id: string, locale: Locale): Promise<{ prompt: LibraryPrompt; pending: boolean } | null> {
  const english = getPrompt(id);
  if (!english) return null;
  promptChunks();
  const chunk = chunkById!.get(id);
  if (!chunk || locale === "en") return { prompt: english, pending: false };
  const { prompts, pending } = await chunkIn(chunk, locale);
  return { prompt: prompts.find((p) => p.id === id) ?? english, pending };
}

/** Pre-translate the library: one model call per category not yet cached. */
export async function warm(locale: Locale, budget: { left: number }): Promise<number> {
  if (locale === "en") return 0;
  let done = 0;
  for (const chunk of promptChunks()) {
    if (budget.left <= 0) break;
    const flat = flatten(promptRows(chunk.prompts));
    // "queue" answers from the cache; on a miss it starts the job, which the
    // "wait" call below then joins instead of starting a second one.
    if (await translated(chunk.key, locale, flat, "queue")) continue;
    budget.left--;
    if (await translated(chunk.key, locale, flat, "wait")) done++;
  }
  return done;
}
