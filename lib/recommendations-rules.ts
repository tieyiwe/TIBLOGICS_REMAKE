// SmartRecommendations without a model call.
//
// The strip used to ask Claude on every page view. Its input is a tiny,
// structured context (pages visited, tools used, current page, industry hint)
// and its output is three picks from a fixed catalogue, so a score table does
// the same job instantly, consistently and in every language, for free.
// Copy lives in lib/i18n/messages/pages/aitimes.ts under pages.recs.*.
//
// Pure and client-safe: runs inside components/public/SmartRecommendations.tsx
// and in /api/recommendations (kept for any other caller).

export interface RecContext {
  pagesVisited?: string[];
  toolsUsed?: string[];
  currentPage?: string;
  industryHint?: string;
  searchQuery?: string;
  referrer?: string;
}

export interface Recommendation {
  type: "service" | "tool" | "session";
  name: string;
  tagline: string;
  href: string;
  priority: number;
}

export interface RecommendationPayload {
  headline: string;
  reason: string;
  recommendations: Recommendation[];
}

type Translate = (key: string) => string;

interface Item {
  id: string;
  type: Recommendation["type"];
  href: string;
  /** i18n keys for the name and tagline. */
  name: string;
  tagline: string;
  base: number;
}

const R = "pages.recs.rule";
const F = "pages.recs.fallback";

const CATALOGUE: Item[] = [
  { id: "scanner", type: "tool", href: "/tools/scanner", name: `${F}.scanner`, tagline: `${F}.scannerTagline`, base: 2 },
  { id: "advisor", type: "tool", href: "/tools/advisor", name: `${F}.advisor`, tagline: `${F}.advisorTagline`, base: 1.5 },
  { id: "calculator", type: "tool", href: "/tools/calculator", name: `${R}.calculator`, tagline: `${R}.calculatorTagline`, base: 0.5 },
  { id: "discovery", type: "session", href: "/book", name: `${F}.discovery`, tagline: `${F}.discoveryTagline`, base: 1.8 },
  { id: "audit", type: "session", href: "/book", name: `${R}.audit`, tagline: `${R}.auditTagline`, base: 0.6 },
  { id: "strategy", type: "session", href: "/book", name: `${R}.strategy`, tagline: `${R}.strategyTagline`, base: 0.4 },
  { id: "costSession", type: "session", href: "/book", name: `${R}.costSession`, tagline: `${R}.costSessionTagline`, base: 0.2 },
  { id: "aiImpl", type: "service", href: "/services", name: `${R}.aiImpl`, tagline: `${R}.aiImplTagline`, base: 0.7 },
  { id: "automation", type: "service", href: "/services", name: `${R}.automation`, tagline: `${R}.automationTagline`, base: 0.5 },
  { id: "training", type: "service", href: "/services", name: `${R}.training`, tagline: `${R}.trainingTagline`, base: 0.3 },
  { id: "careflow", type: "service", href: "/products", name: `${R}.careflow`, tagline: `${R}.careflowTagline`, base: 0 },
  { id: "instory", type: "service", href: "/products", name: `${R}.instory`, tagline: `${R}.instoryTagline`, base: 0 },
];

type Theme = "scanner" | "cost" | "advisor" | "health" | "education" | "reading" | "default";

const HEALTH = /health|clinic|care|medical|hospital|wellness|social work|sant[eé]|afya/i;
const EDUCATION = /school|educat|teach|k-?12|academy|[ée]cole|enseign|shule|elimu/i;
const COST = /cost|price|pricing|budget|tarif|prix|co[uû]t|bei|gharama/i;

/** Three recommendations for this visitor, highest score first. */
export function recommend(ctx: RecContext, t: Translate): RecommendationPayload {
  const pages = (ctx.pagesVisited ?? []).map(String);
  const tools = (ctx.toolsUsed ?? []).map(String);
  const current = String(ctx.currentPage ?? "");
  const hint = `${ctx.industryHint ?? ""} ${ctx.searchQuery ?? ""}`;
  const seen = (p: string) => current === p || pages.includes(p);

  const score: Record<string, number> = Object.fromEntries(CATALOGUE.map((i) => [i.id, i.base]));
  const add = (id: string, n: number) => (score[id] += n);
  const themes: Theme[] = [];

  if (tools.includes("scanner") || seen("/tools/scanner")) {
    add("audit", 3);
    add("aiImpl", 1);
    themes.push("scanner");
  }
  if (tools.includes("calculator") || seen("/tools/calculator") || COST.test(hint)) {
    add("costSession", 3);
    add("calculator", 1.5);
    themes.push("cost");
  }
  if (tools.includes("advisor") || seen("/tools/advisor")) {
    add("strategy", 2);
    add("discovery", 1);
    themes.push("advisor");
  }
  if (HEALTH.test(hint)) {
    add("careflow", 4);
    themes.push("health");
  }
  if (EDUCATION.test(hint)) {
    add("instory", 4);
    add("training", 1.5);
    themes.push("education");
  }
  if (seen("/ai-times")) {
    add("training", 1);
    add("scanner", 0.5);
    themes.push("reading");
  }
  if (seen("/services")) add("discovery", 1);
  // A tool already used is not offered again.
  for (const tool of tools) if (tool in score) score[tool] -= 3;

  // Never recommend the page the visitor is on.
  const candidates = CATALOGUE.filter((i) => i.href !== current).sort((a, b) => score[b.id] - score[a.id]);
  const picked: Item[] = [];
  for (const item of candidates) {
    if (picked.length === 3) break;
    // A mix: at most two of the same kind.
    if (picked.filter((p) => p.type === item.type).length >= 2) continue;
    picked.push(item);
  }

  // The most specific signal sets the headline.
  const order: Theme[] = ["health", "education", "scanner", "cost", "advisor", "reading"];
  const theme = order.find((th) => themes.includes(th)) ?? "default";
  const headline = theme === "default" ? t(`${F}.headline`) : t(`${R}.headline.${theme}`);
  const reason = theme === "default" ? t(`${F}.reason`) : t(`${R}.reason.${theme}`);

  return {
    headline,
    reason,
    recommendations: picked.map((i, n) => ({ type: i.type, name: t(i.name), tagline: t(i.tagline), href: i.href, priority: n + 1 })),
  };
}
