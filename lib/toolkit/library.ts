import data from "./library.json";
import type { Vertical } from "./guard/rules";

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

const library = data as { verticals: LibraryVertical[]; prompts: LibraryPrompt[] };

export const LIBRARY_VERTICALS = library.verticals;
export const LIBRARY_SIZE = library.prompts.length;

export function getPrompt(id: string): LibraryPrompt | null {
  return library.prompts.find((p) => p.id === id) ?? null;
}

export function promptsFor(vertical: string): LibraryPrompt[] {
  return library.prompts.filter((p) => p.vertical === vertical);
}

/** Titles only, for public pages. */
export function sampleTitles(vertical: string, n: number): string[] {
  return promptsFor(vertical).slice(0, n).map((p) => p.title);
}
