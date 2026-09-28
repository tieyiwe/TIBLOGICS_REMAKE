import { promptsFor, LIBRARY_VERTICALS, type LibraryPrompt } from "./library";
import type { Locale } from "@/lib/i18n/config";

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
//
// In French and Swahili the search reads the translated text (where that
// category is translated) as well as the English, folds accents
// ("réservation" = "reservation"), skips each language's small words, and
// its related-word groups include French and Swahili words, so "facture
// impayée" or "malalamiko" find the right prompts even before a category's
// translation is ready.

const STOP = new Set(
  "a an and are as at be but by for from how i in is it me my of on or our so that the this to we with you your what when do can need want write help".split(" "),
);
const STOP_BY_LOCALE: Record<Exclude<Locale, "en">, Set<string>> = {
  fr: new Set(
    "le la les un une des du de et en au aux pour par sur avec dans est sont ce cet cette ces mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs qui que quoi comment je tu il elle on nous vous ils elles se ne pas plus ou y faire ecrire aide aider besoin veux voudrais".split(" "),
  ),
  sw: new Set(
    "na ya wa za la kwa katika ni kwenye kama au lakini hii hizi huyu hiyo ile yangu yako yake yetu yenu yao wangu wako wake wetu wenu wao changu chako cha vya ili pia sana tu je nini jinsi gani andika kuandika msaada nisaidie nataka ninahitaji".split(" "),
  ),
};

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

/**
 * The same groups in French and Swahili (without accents: text is folded
 * before matching). Group n here extends group n above.
 */
const RELATED_ML: string[][] = [
  ["relance", "relancer", "rappel", "rappeler", "suivi", "fuatilia", "ufuatiliaji", "kumbusha", "ukumbusho"],
  ["courriel", "mail", "lettre", "reponse", "repondre", "barua", "ujumbe", "jibu", "kujibu"],
  ["texto", "meseji"],
  ["reseaux", "sociaux", "publication", "legende", "mitandao", "kijamii", "chapisho"],
  ["clientele", "acheteur", "acheteuse", "mteja", "wateja", "mnunuzi", "wanunuzi", "mgeni", "wageni"],
  ["prospection", "demande", "mtarajiwa", "watarajiwa"],
  ["prix", "tarif", "tarifs", "cout", "devis", "estimation", "frais", "bei", "gharama", "makadirio", "nukuu"],
  ["facture", "facturation", "paiement", "impaye", "impayee", "retard", "ankara", "malipo", "deni", "kuchelewa", "bili"],
  ["plainte", "reclamation", "mecontent", "colere", "negatif", "difficile", "malalamiko", "lalamiko", "hasira", "mgumu", "wagumu"],
  ["avis", "temoignage", "commentaire", "maoni", "ushuhuda"],
  ["merci", "remerciement", "remercier", "asante", "shukrani", "kushukuru"],
  ["donateur", "dons", "collecte", "soutien", "mfadhili", "wafadhili", "mchango", "michango", "uchangishaji"],
  ["subvention", "bailleur", "fondation", "ruzuku", "pendekezo"],
  ["benevole", "benevoles", "benevolat", "mjitolea", "kujitolea", "wajitolea"],
  ["annonce", "bien", "propriete", "maison", "logement", "tangazo", "nyumba", "mali", "makazi"],
  ["vendeur", "vendeuse", "muuzaji", "wauzaji"],
  ["visite", "onyesho", "ziara"],
  ["recrutement", "recruter", "embauche", "emploi", "poste", "candidat", "entretien", "ajira", "kuajiri", "kazi", "mwombaji", "waombaji", "mahojiano"],
  ["personnel", "equipe", "salarie", "employe", "integration", "formation", "wafanyakazi", "mfanyakazi", "timu", "mafunzo"],
  ["plat", "plats", "cuisine", "recette", "menyu", "chakula", "vyakula", "mapishi"],
  ["reservation", "uhifadhi", "nafasi", "meza"],
  ["rapport", "bilan", "resume", "ripoti", "muhtasari", "taarifa"],
  ["campagne", "infolettre", "jarida", "kampeni"],
  ["publicite", "pub", "slogan", "titre", "matangazo"],
  ["reunion", "rendez-vous", "appel", "mkutano", "mikutano", "simu", "ajenda"],
  ["impot", "impots", "fiscal", "fiscalite", "declaration", "taxe", "kodi"],
  ["planification", "strategie", "mpango", "mipango", "mkakati"],
  ["contrat", "accord", "conditions", "mkataba", "makubaliano", "masharti"],
  ["excuse", "excuses", "desole", "erreur", "samahani", "radhi", "kosa"],
  ["evenement", "soiree", "fete", "tukio", "matukio", "sherehe"],
];

/** Crude but effective English stemming: enough to join "invoicing" and "invoice". */
function stemEn(w: string): string {
  if (w.length <= 4) return w;
  for (const suf of ["ational", "ization", "ations", "ation", "ments", "ment", "ings", "ing", "ers", "ies", "ied", "ed", "es", "er", "ly", "s"]) {
    if (w.endsWith(suf) && w.length - suf.length >= 3) {
      const base = w.slice(0, -suf.length);
      return suf === "ies" || suf === "ied" ? base + "y" : base;
    }
  }
  return w;
}

/** The same idea for French: "factures", "facture" and "facturation" share a stem. */
function stemFr(w: string): string {
  if (w.length <= 4) return w;
  for (const suf of ["issements", "issement", "ements", "ement", "ations", "ation", "atrices", "atrice", "ateurs", "ateur", "ances", "ance", "ences", "ence", "euses", "euse", "eurs", "eur", "ives", "ive", "ifs", "if", "ees", "ee", "ers", "er", "es", "e", "s", "x"]) {
    if (w.endsWith(suf) && w.length - suf.length >= 3) return w.slice(0, -suf.length);
  }
  return w;
}

/** Stems a word can match under, in a search made in `locale`. Swahili words are matched as written. */
function stemsOf(w: string, locale: Locale): string[] {
  const en = stemEn(w);
  if (locale === "fr") {
    const fr = stemFr(w);
    return fr === en ? [en] : [en, fr];
  }
  if (locale === "sw") return w === en ? [en] : [en, w];
  return [en];
}

/** Lower case without accents: "Réservation" -> "reservation". Same length for accented letters. */
function fold(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC");
}

function words(text: string): string[] {
  return fold(text)
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    // French elision: "l'annonce" is "annonce", "d'un" is "un".
    .replace(/(^|[^a-z])(?:qu|[ldjmnstc])['’]/g, "$1 ")
    .replace(/[’']/g, "")
    .split(/[^a-z0-9-]+/)
    .flatMap((w) => (w.includes("-") ? [w, ...w.split("-")] : [w]))
    .filter(Boolean);
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

function relatedMap(groups: string[][], stemsFor: (w: string) => string[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const group of groups) {
    const stems = new Set(group.flatMap((g) => words(g)).flatMap(stemsFor));
    for (const s of stems) {
      const set = map.get(s) ?? new Set<string>();
      stems.forEach((x) => x !== s && set.add(x));
      map.set(s, set);
    }
  }
  return map;
}

/** English search: the original groups and stemmer. */
const RELATED_EN = relatedMap(RELATED, (w) => [stemEn(w)]);
/** French and Swahili search: each group joined with its French and Swahili words. */
const RELATED_MULTI = relatedMap(
  RELATED.map((g, i) => [...g, ...(RELATED_ML[i] ?? [])]),
  (w) => [...new Set([stemEn(w), stemFr(w), w])],
);

interface Doc {
  prompt: LibraryPrompt;
  /** The prompt in the search language, when its category is translated. */
  local: LibraryPrompt | null;
  label: string;
  /** stem → weight of the best field it appears in */
  stems: Map<string, number>;
  haystack: string;
  titles: string;
}

interface Index {
  locale: Locale;
  docs: Doc[];
  stop: Set<string>;
  related: Map<string, Set<string>>;
  /** Every stem in the library. */
  vocab: Set<string>;
  /** Every word as written, with how often it appears: typos are matched against these. */
  wordFreq: Map<string, number>;
  words: string[];
}

const FIELD_WEIGHTS: Array<[keyof LibraryPrompt, number]> = [
  ["title", 6], ["category", 3], ["useWhen", 3], ["proTip", 1], ["prompt", 1.5],
];

function buildIndex(locale: Locale, local?: Map<string, LibraryPrompt>, categoryLabel?: (category: string) => string): Index {
  const stop = locale === "en" ? STOP : new Set([...STOP, ...STOP_BY_LOCALE[locale]]);
  const docs: Doc[] = LIBRARY_VERTICALS.flatMap((v) =>
    promptsFor(v.id).map((p) => {
      const lp = local?.get(p.id) ?? null;
      const cat = locale !== "en" && categoryLabel ? categoryLabel(p.category) : "";
      const stems = new Map<string, number>();
      const add = (text: string, weight: number) => {
        for (const w of words(text)) {
          if (stop.has(w)) continue;
          for (const s of stemsOf(w, locale)) stems.set(s, Math.max(stems.get(s) ?? 0, weight));
        }
      };
      for (const [field, weight] of FIELD_WEIGHTS) {
        add(String(p[field]), weight);
        if (lp && field !== "category") add(String(lp[field]), weight);
      }
      if (cat) add(cat, 3);
      const localText = lp ? `${lp.title} ${cat} ${lp.useWhen} ${lp.prompt} ${lp.proTip}` : cat;
      return {
        prompt: p,
        local: lp,
        label: v.label,
        stems,
        haystack: fold(`${p.title} ${p.category} ${p.useWhen} ${p.prompt} ${p.proTip} ${localText}`),
        titles: fold(lp ? `${p.title} ${lp.title}` : p.title),
      };
    }),
  );
  const wordFreq = new Map<string, number>();
  for (const d of docs) {
    for (const w of words(d.haystack)) if (w.length >= 3 && !stop.has(w)) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);
  }
  return {
    locale,
    docs,
    stop,
    related: locale === "en" ? RELATED_EN : RELATED_MULTI,
    vocab: new Set(docs.flatMap((d) => [...d.stems.keys()])),
    wordFreq,
    words: [...wordFreq.keys()],
  };
}

let enIndex: Index | null = null;
const localeIndex = new Map<Locale, { size: number; index: Index }>();

/** The index for a search language, rebuilt when more of the library has been translated. */
function indexFor(locale: Locale, local?: Map<string, LibraryPrompt>, categoryLabel?: (category: string) => string): Index {
  if (locale === "en") return (enIndex ??= buildIndex("en"));
  const size = local?.size ?? 0;
  const hit = localeIndex.get(locale);
  if (hit && hit.size === size) return hit.index;
  const index = buildIndex(locale, local, categoryLabel);
  localeIndex.set(locale, { size, index });
  return index;
}

/** Library words within typo range of `w`, closest and most common first. */
function nearWords(ix: Index, w: string): string[] {
  if (ix.wordFreq.has(w)) return [];
  const max = w.length >= 8 ? 2 : w.length >= 4 ? 1 : 0;
  if (!max) return [];
  return ix.words.filter((x) => x[0] === w[0] && Math.abs(x.length - w.length) <= max)
    .map((x) => ({ x, d: distance(x, w) }))
    .filter((c) => c.d <= max)
    .sort((a, b) => a.d - b.d || (ix.wordFreq.get(b.x) ?? 0) - (ix.wordFreq.get(a.x) ?? 0))
    .map((c) => c.x);
}

export interface SearchHit {
  id: string;
  vertical: string;
  verticalLabel: string;
  /** The English category name, which is also its id in the index. */
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

function snippet(text: string, terms: string[]): string {
  const lower = fold(text);
  let at = -1;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at < 0) return text.slice(0, 140) + (text.length > 140 ? "…" : "");
  const start = Math.max(0, at - 50);
  return (start > 0 ? "…" : "") + text.slice(start, start + 150).trim() + (start + 150 < text.length ? "…" : "");
}

export interface SearchOptions {
  vertical?: string;
  limit?: number;
  /** Search language. Default English. */
  locale?: Locale;
  /** Translated prompts by id (only those whose category is translated). */
  translations?: Map<string, LibraryPrompt>;
  /** Category name in the search language. */
  categoryLabel?: (category: string) => string;
}

export function searchPrompts(query: string, opts: SearchOptions = {}): SearchResult {
  const locale = opts.locale ?? "en";
  const ix = indexFor(locale, opts.translations, opts.categoryLabel);
  const raw = words(query).filter((w) => !ix.stop.has(w) && w.length > 1);
  if (raw.length === 0) return { hits: [], unmatched: [], didYouMean: null };
  const phrase = fold(query.trim());

  // For each query word: its stems, related stems, and near-spellings from the library.
  const terms = raw.map((w) => {
    const stems = stemsOf(w, locale);
    const related = new Set(stems.flatMap((s) => [...(ix.related.get(s) ?? [])]).filter((r) => !stems.includes(r)));
    // A French or Swahili word we know (it is in a related-word group) is not
    // a typo just because the English library does not contain it.
    const known = stems.some((s) => ix.vocab.has(s)) || (locale !== "en" && related.size > 0);
    const near = known ? [] : nearWords(ix, w);
    return { word: w, stems, related, typos: new Set(near.flatMap((n) => stemsOf(n, locale))), near };
  });

  const docs = opts.vertical ? ix.docs.filter((d) => d.prompt.vertical === opts.vertical) : ix.docs;
  const scored: Array<{ d: Doc; score: number; exact: boolean; direct: number; matched: string[] }> = [];

  for (const d of docs) {
    let score = 0;
    let allExact = true;
    let found = 0;
    let directHits = 0;
    const matched: string[] = [];
    for (const t of terms) {
      const direct = Math.max(0, ...t.stems.map((s) => d.stems.get(s) ?? 0));
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
    if (d.titles.includes(phrase)) score += 15;
    scored.push({ d, score, exact: allExact && found === terms.length, direct: directHits, matched });
  }

  scored.sort((a, b) => Number(b.exact) - Number(a.exact) || b.direct - a.direct || b.score - a.score);

  const hits = scored.slice(0, opts.limit ?? 60).map(({ d, exact, matched }) => {
    const shown = d.local ?? d.prompt;
    return {
      id: d.prompt.id,
      vertical: d.prompt.vertical,
      verticalLabel: d.label,
      category: d.prompt.category,
      title: shown.title,
      useWhen: shown.useWhen,
      match: exact ? ("exact" as const) : ("close" as const),
      snippet: snippet(shown.prompt, matched),
      matched,
    };
  });

  const unmatched = terms
    .filter((t) => !scored.some((x) => t.stems.some((s) => x.d.stems.has(s)) || [...t.related, ...t.typos].some((r) => x.d.stems.has(r))))
    .map((t) => t.word);

  // Offer a spelling correction when a word is not in the library as typed.
  let didYouMean: string | null = null;
  const fixed = terms.map((t) => t.near[0] ?? t.word);
  if (fixed.join(" ") !== terms.map((t) => t.word).join(" ")) didYouMean = fixed.join(" ");

  return { hits, unmatched, didYouMean };
}
