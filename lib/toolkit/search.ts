import { promptsFor, LIBRARY_VERTICALS, type LibraryPrompt } from "./library";

// Keyword search over the prompt library.
//
// People search the way they think about the job ("chase late invoice",
// "angry customer", "insta post"), not the way a prompt happens to be
// titled. So a search looks through the title, category, "use this when",
// the prompt itself and the pro tip, and it also finds prompts that are close
// to what was typed:
//   - other forms of a word      invoice / invoices / invoicing
//   - related words              chase → follow up, reminder
//   - small typos                recieve → receive, lisitng → listing
// Exact matches rank above close ones, and each result says which kind it is.

const STOP = new Set(
  "a an and are as at be but by for from how i in is it me my of on or our so that the this to we with you your what when do can need want write help".split(" "),
);

/** Groups of words people use interchangeably for the same task. */
const RELATED: string[][] = [
  ["follow", "followup", "chase", "remind", "reminder", "nudge", "check-in", "checkin"],
  ["email", "message", "letter", "note", "reply", "respond", "response"],
  ["text", "sms", "whatsapp"],
  ["social", "post", "instagram", "insta", "facebook", "linkedin", "tiktok", "caption", "reel"],
  ["customer", "client", "guest", "buyer", "patron"],
  ["lead", "prospect", "inquiry", "enquiry"],
  ["price", "pricing", "cost", "fee", "rate", "quote", "estimate"],
  ["invoice", "bill", "billing", "payment", "overdue", "late"],
  ["complaint", "angry", "upset", "unhappy", "negative", "difficult", "frustrated"],
  ["review", "testimonial", "rating", "feedback"],
  ["thank", "thanks", "gratitude", "appreciation"],
  ["donor", "donation", "supporter", "giving", "gift", "fundraising"],
  ["grant", "funder", "foundation", "proposal"],
  ["volunteer", "volunteers"],
  ["listing", "property", "home", "house"],
  ["seller", "vendor"],
  ["open", "showing", "tour", "viewing"],
  ["hire", "hiring", "recruit", "recruiting", "job", "candidate", "interview"],
  ["staff", "team", "employee", "onboarding", "training"],
  ["menu", "dish", "food", "recipe"],
  ["reservation", "booking", "table", "noshow", "no-show"],
  ["report", "reporting", "summary", "update", "recap"],
  ["newsletter", "campaign", "blast"],
  ["ad", "ads", "advert", "advertising", "headline", "copy"],
  ["meeting", "call", "agenda"],
  ["tax", "taxes", "irs", "filing"],
  ["plan", "planning", "strategy", "roadmap"],
  ["contract", "agreement", "terms", "proposal"],
  ["apology", "apologize", "apologise", "sorry", "mistake"],
  ["event", "gala", "fundraiser", "party"],
];

/** Crude but effective English stemming: enough to join "invoicing" and "invoice". */
function stem(w: string): string {
  if (w.length <= 4) return w;
  for (const suf of ["ational", "ization", "ations", "ation", "ments", "ment", "ings", "ing", "ers", "ies", "ied", "ed", "es", "er", "ly", "s"]) {
    if (w.endsWith(suf) && w.length - suf.length >= 3) {
      const base = w.slice(0, -suf.length);
      return suf === "ies" || suf === "ied" ? base + "y" : base;
    }
  }
  return w;
}

function words(text: string): string[] {
  return text.toLowerCase().replace(/[’']/g, "").split(/[^a-z0-9-]+/).flatMap((w) => (w.includes("-") ? [w, ...w.split("-")] : [w])).filter(Boolean);
}

/**
 * Edit distance counting a swap of two neighbouring letters as one mistake
 * ("lisitng" is one slip from "listing", not two).
 */
function distance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

const RELATED_BY_STEM = new Map<string, Set<string>>();
for (const group of RELATED) {
  const stems = new Set(group.flatMap((g) => words(g)).map(stem));
  for (const s of stems) {
    const set = RELATED_BY_STEM.get(s) ?? new Set<string>();
    stems.forEach((x) => x !== s && set.add(x));
    RELATED_BY_STEM.set(s, set);
  }
}

interface Doc {
  prompt: LibraryPrompt;
  label: string;
  /** stem → weight of the best field it appears in */
  stems: Map<string, number>;
  haystack: string;
}

const FIELD_WEIGHTS: Array<[keyof LibraryPrompt, number]> = [
  ["title", 6], ["category", 3], ["useWhen", 3], ["proTip", 1], ["prompt", 1.5],
];

const DOCS: Doc[] = LIBRARY_VERTICALS.flatMap((v) =>
  promptsFor(v.id).map((p) => {
    const stems = new Map<string, number>();
    for (const [field, weight] of FIELD_WEIGHTS) {
      for (const w of words(String(p[field]))) {
        if (STOP.has(w)) continue;
        const s = stem(w);
        stems.set(s, Math.max(stems.get(s) ?? 0, weight));
      }
    }
    return {
      prompt: p,
      label: v.label,
      stems,
      haystack: `${p.title} ${p.category} ${p.useWhen} ${p.prompt} ${p.proTip}`.toLowerCase(),
    };
  }),
);

/** Every stem in the library. */
const VOCAB = new Set(DOCS.flatMap((d) => [...d.stems.keys()]));

/** Every word as written, with how often it appears: typos are matched against these. */
const WORD_FREQ = new Map<string, number>();
for (const d of DOCS) {
  for (const w of words(d.haystack)) if (w.length >= 3 && !STOP.has(w)) WORD_FREQ.set(w, (WORD_FREQ.get(w) ?? 0) + 1);
}
const WORDS = [...WORD_FREQ.keys()];

/** Library words within typo range of `w`, closest and most common first. */
function nearWords(w: string): string[] {
  if (WORD_FREQ.has(w)) return [];
  const max = w.length >= 8 ? 2 : w.length >= 4 ? 1 : 0;
  if (!max) return [];
  return WORDS.filter((x) => x[0] === w[0] && Math.abs(x.length - w.length) <= max)
    .map((x) => ({ x, d: distance(x, w) }))
    .filter((c) => c.d <= max)
    .sort((a, b) => a.d - b.d || (WORD_FREQ.get(b.x) ?? 0) - (WORD_FREQ.get(a.x) ?? 0))
    .map((c) => c.x);
}

export interface SearchHit {
  id: string;
  vertical: string;
  verticalLabel: string;
  category: string;
  title: string;
  useWhen: string;
  /** exact: every word found as typed (or another form of it). close: found through related words or typo tolerance. */
  match: "exact" | "close";
  /** A short piece of the prompt around the first match, for context. */
  snippet: string;
  /** Words that matched, to highlight. */
  matched: string[];
}

export interface SearchResult {
  hits: SearchHit[];
  /** Query words that matched nothing, even loosely. */
  unmatched: string[];
  /** Spelling suggestion when the query found little. */
  didYouMean: string | null;
}

function snippet(p: LibraryPrompt, terms: string[]): string {
  const text = p.prompt;
  const lower = text.toLowerCase();
  let at = -1;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at < 0) return text.slice(0, 140) + (text.length > 140 ? "…" : "");
  const start = Math.max(0, at - 50);
  return (start > 0 ? "…" : "") + text.slice(start, start + 150).trim() + (start + 150 < text.length ? "…" : "");
}

export function searchPrompts(query: string, opts: { vertical?: string; limit?: number } = {}): SearchResult {
  const raw = words(query).filter((w) => !STOP.has(w) && w.length > 1);
  if (raw.length === 0) return { hits: [], unmatched: [], didYouMean: null };
  const phrase = query.trim().toLowerCase();

  // For each query word: its stem, related stems, and near-spellings from the library.
  const terms = raw.map((w) => {
    const s = stem(w);
    const related = RELATED_BY_STEM.get(s) ?? new Set<string>();
    const near = VOCAB.has(s) ? [] : nearWords(w);
    return { word: w, stem: s, related, typos: new Set(near.map(stem)), near };
  });

  const docs = opts.vertical ? DOCS.filter((d) => d.prompt.vertical === opts.vertical) : DOCS;
  const scored: Array<{ d: Doc; score: number; exact: boolean; direct: number; matched: string[] }> = [];

  for (const d of docs) {
    let score = 0;
    let allExact = true;
    let found = 0;
    let directHits = 0;
    const matched: string[] = [];
    for (const t of terms) {
      const direct = d.stems.get(t.stem) ?? 0;
      if (direct) {
        score += direct * 3 + 8;
        found++;
        directHits++;
        matched.push(t.word);
        continue;
      }
      let best = 0;
      let via = "";
      // A typo fix is what they meant, so it counts almost like a direct hit;
      // a related word is a suggestion, so it counts for less.
      for (const ty of t.typos) {
        const w = (d.stems.get(ty) ?? 0) * 2.5;
        if (w > best) { best = w; via = ty; }
      }
      for (const r of t.related) {
        const w = Math.min(d.stems.get(r) ?? 0, 3);
        if (w > best) { best = w; via = r; }
      }
      if (best) {
        score += best;
        found++;
        matched.push(via);
      }
      allExact = false;
    }
    if (found === 0) continue;
    // Most of the words have to be there, so "follow up invoice" does not
    // return every prompt that mentions an invoice.
    if (terms.length > 1 && found < Math.ceil(terms.length * 0.6)) continue;
    if (found < terms.length) score *= found / terms.length;
    if (phrase.length > 3 && d.haystack.includes(phrase)) score += 10;
    if (d.prompt.title.toLowerCase().includes(phrase)) score += 15;
    scored.push({ d, score, exact: allExact && found === terms.length, direct: directHits, matched });
  }

  scored.sort((a, b) => Number(b.exact) - Number(a.exact) || b.direct - a.direct || b.score - a.score);

  const hits = scored.slice(0, opts.limit ?? 60).map(({ d, exact, matched }) => ({
    id: d.prompt.id,
    vertical: d.prompt.vertical,
    verticalLabel: d.label,
    category: d.prompt.category,
    title: d.prompt.title,
    useWhen: d.prompt.useWhen,
    match: exact ? ("exact" as const) : ("close" as const),
    snippet: snippet(d.prompt, matched),
    matched,
  }));

  const unmatched = terms
    .filter((t) => !scored.some((x) => x.d.stems.has(t.stem) || [...t.related, ...t.typos].some((r) => x.d.stems.has(r))))
    .map((t) => t.word);

  // Offer a spelling correction when a word is not in the library as typed.
  let didYouMean: string | null = null;
  const fixed = terms.map((t) => t.near[0] ?? t.word);
  if (fixed.join(" ") !== terms.map((t) => t.word).join(" ")) didYouMean = fixed.join(" ");

  return { hits, unmatched, didYouMean };
}
