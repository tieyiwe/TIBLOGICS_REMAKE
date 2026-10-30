// All the arithmetic behind the AI Product Cost Calculator, as pure functions
// of the inputs. Nothing here touches the DOM, the network or the clock, so
// the same numbers come out on the server, in the browser and in tests.

import { BATCH_MULTIPLIER, CHEAPEST_MODEL, priceFor, type ModelId, type ResolvedPrice } from "./pricing";
import type {
  AiBreakdown,
  BuildFeature,
  CostCategory,
  CostLines,
  Inputs,
  Scope,
} from "./types";
import { BUILD_FEATURES, COST_CATEGORIES } from "./types";

const M = 1_000_000;

function pct(n: number): number {
  return Math.min(Math.max(n, 0), 100) / 100;
}

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// AI inference
// ---------------------------------------------------------------------------

interface Slice {
  inputTokens: number;
  outputTokens: number;
  uncachedInputCost: number;
  cacheReadCost: number;
  cacheWriteCost: number;
  outputCost: number;
  total: number;
}

/** Cost of one slice of traffic on one model. Batch discount applies to every token. */
function sliceCost(
  inputTokens: number,
  outputTokens: number,
  price: ResolvedPrice,
  cacheableShare: number,
  cacheWriteShare: number,
  batchShare: number,
): Slice {
  const cacheable = inputTokens * cacheableShare;
  const writes = cacheable * cacheWriteShare;
  const reads = cacheable - writes;
  const uncached = inputTokens - cacheable;
  const batchFactor = 1 - batchShare * (1 - BATCH_MULTIPLIER);
  const uncachedInputCost = ((uncached * price.input) / M) * batchFactor;
  const cacheReadCost = ((reads * price.cacheRead) / M) * batchFactor;
  const cacheWriteCost = ((writes * price.cacheWrite) / M) * batchFactor;
  const outputCost = ((outputTokens * price.output) / M) * batchFactor;
  return {
    inputTokens,
    outputTokens,
    uncachedInputCost,
    cacheReadCost,
    cacheWriteCost,
    outputCost,
    total: uncachedInputCost + cacheReadCost + cacheWriteCost + outputCost,
  };
}

export function customModel(i: Inputs) {
  return { name: i.customName, input: i.customInput, output: i.customOutput, cacheRead: i.customCacheRead };
}

export interface AiResult extends AiBreakdown {
  primary: number;
  routed: number;
  primaryPrice: ResolvedPrice;
  routedPrice: ResolvedPrice;
  perInteraction: number;
}

/** Monthly AI inference cost for `users` active users. */
export function aiCost(i: Inputs, users: number = i.users): AiResult {
  const interactions = Math.max(0, users) * Math.max(0, i.interactionsPerUser);
  const overhead = 1 + Math.max(0, i.overheadPct) / 100;
  const inTok = interactions * Math.max(0, i.inputTokens) * overhead;
  const outTok = interactions * Math.max(0, i.outputTokens) * overhead;
  const custom = customModel(i);
  const primaryPrice = priceFor(i.model, custom);
  const routedPrice = priceFor(i.routeModel, custom);
  const routeShare = i.routeModel === i.model ? 0 : pct(i.routePct);
  const c = pct(i.cacheablePct);
  const w = pct(i.cacheWritePct);
  const b = pct(i.batchPct);

  const p = sliceCost(inTok * (1 - routeShare), outTok * (1 - routeShare), primaryPrice, c, w, b);
  const r = sliceCost(inTok * routeShare, outTok * routeShare, routedPrice, c, w, b);
  const total = p.total + r.total;
  return {
    interactions,
    inputTokens: inTok,
    outputTokens: outTok,
    uncachedInputCost: p.uncachedInputCost + r.uncachedInputCost,
    cacheReadCost: p.cacheReadCost + r.cacheReadCost,
    cacheWriteCost: p.cacheWriteCost + r.cacheWriteCost,
    outputCost: p.outputCost + r.outputCost,
    total,
    listTotal: (inTok * primaryPrice.input + outTok * primaryPrice.output) / M,
    primary: p.total,
    routed: r.total,
    primaryPrice,
    routedPrice,
    perInteraction: interactions > 0 ? total / interactions : 0,
  };
}

// ---------------------------------------------------------------------------
// Monthly running costs and revenue
// ---------------------------------------------------------------------------

export interface Monthly {
  users: number;
  interactions: number;
  ai: AiResult;
  lines: CostLines;
  categories: Record<CostCategory, number>;
  revenue: number;
  /** Costs that scale with users, excluding payment fees. */
  variable: number;
  /** Costs that do not scale with users (hosting, support, maintenance...). */
  fixed: number;
  total: number;
  /** Everything except maintenance engineering: the basis for gross margin. */
  costToServe: number;
  grossMarginPct: number | null;
  profit: number;
  payingUnits: number;
}

/** Revenue for a given number of active users under the current pricing mode. */
export function revenueFor(i: Inputs, users: number, price: number = i.price): number {
  const paying = pct(i.payingPct);
  if (i.pricingMode === "per_account") {
    const accounts = users / Math.max(1, i.usersPerAccount);
    return accounts * paying * price;
  }
  if (i.pricingMode === "usage") {
    return ((users * i.interactionsPerUser) / 1000) * paying * price;
  }
  return users * paying * price;
}

/** How many billable units (users, accounts or thousands of interactions) pay. */
export function payingUnits(i: Inputs, users: number): number {
  const paying = pct(i.payingPct);
  if (i.pricingMode === "per_account") return (users / Math.max(1, i.usersPerAccount)) * paying;
  if (i.pricingMode === "usage") return ((users * i.interactionsPerUser) / 1000) * paying;
  return users * paying;
}

export function categorize(l: CostLines): Record<CostCategory, number> {
  return {
    ai: l.aiPrimary + l.aiRouted + l.embeddings,
    usage: l.voice + l.images + l.messaging + l.storage + l.email,
    infra: l.hosting + l.database + l.vectorDb + l.monitoring + l.auth,
    people: l.support + l.maintenance,
    fees: l.paymentFees,
  };
}

export function monthly(i: Inputs, userMult = 1, fixedMult = 1): Monthly {
  const users = Math.max(0, i.users * userMult);
  const ai = aiCost(i, users);
  const f = i.features;
  const lines: CostLines = {
    aiPrimary: ai.primary,
    aiRouted: ai.routed,
    embeddings: f.rag
      ? ((i.embedDocTokensM * M * userMult + ai.interactions * i.embedQueryTokens) / M) * i.embedPrice
      : 0,
    voice: f.voice ? users * i.voiceMinutesPerUser * (i.sttPerMin + i.ttsPerMin) : 0,
    images: f.images ? users * i.imagesPerUser * i.imagePrice : 0,
    messaging: f.messaging ? users * i.messagesPerUser * i.messagePrice : 0,
    storage: f.files ? users * i.storageGbPerUser * i.storagePerGb : 0,
    email: ((users * i.emailsPerUser) / 1000) * i.emailPer1000,
    paymentFees: 0,
    hosting: i.hosting * fixedMult,
    database: i.database * fixedMult,
    vectorDb: f.rag ? i.vectorDb * fixedMult : 0,
    monitoring: i.monitoring * fixedMult,
    auth: i.auth * fixedMult,
    support: i.supportHours * i.supportRate * fixedMult,
    maintenance: i.maintenanceHours * i.maintenanceRate * fixedMult,
  };
  for (const k of Object.keys(lines) as (keyof CostLines)[]) lines[k] = safe(lines[k]);
  const revenue = safe(revenueFor(i, users));
  lines.paymentFees = revenue * pct(i.paymentPct);

  const variable =
    lines.aiPrimary + lines.aiRouted + lines.embeddings + lines.voice + lines.images + lines.messaging + lines.storage + lines.email;
  const fixed =
    lines.hosting + lines.database + lines.vectorDb + lines.monitoring + lines.auth + lines.support + lines.maintenance;
  const total = variable + fixed + lines.paymentFees;
  const costToServe = total - lines.maintenance;
  return {
    users,
    interactions: ai.interactions,
    ai,
    lines,
    categories: categorize(lines),
    revenue,
    variable,
    fixed,
    total,
    costToServe,
    grossMarginPct: revenue > 0 ? ((revenue - costToServe) / revenue) * 100 : null,
    profit: revenue - total,
    payingUnits: payingUnits(i, users),
  };
}

// ---------------------------------------------------------------------------
// Build (one-time) cost
// ---------------------------------------------------------------------------

/** Engineering hours for the core product at each scope (estimates). */
export const CORE_HOURS: Record<Scope, number> = { prototype: 40, mvp: 120, production: 240 };
/** Feature hours are multiplied by this at each scope. */
export const SCOPE_FACTOR: Record<Scope, number> = { prototype: 0.5, mvp: 1, production: 1.6 };
/** Engineering hours per feature at MVP scope (estimates). */
export const FEATURE_HOURS: Record<BuildFeature, number> = {
  accounts: 16,
  chatUi: 24,
  rag: 40,
  voice: 56,
  images: 24,
  messaging: 32,
  files: 16,
  agentTools: 48,
  integrations: 32,
  payments: 24,
  admin: 32,
  multilingual: 16,
  mobileApp: 120,
};
export const BUILD_LOW_FACTOR = 0.8;
export const BUILD_HIGH_FACTOR = 1.5;

export interface BuildEstimate {
  coreHours: number;
  features: { id: BuildFeature; hours: number; cost: number }[];
  engineeringHours: number;
  designHours: number;
  qaHours: number;
  securityHours: number;
  totalHours: number;
  labour: number;
  compliance: number;
  subtotal: number;
  contingency: number;
  low: number;
  likely: number;
  high: number;
}

export function buildEstimate(i: Inputs): BuildEstimate {
  const factor = SCOPE_FACTOR[i.scope] ?? 1;
  const rate = Math.max(0, i.hourlyRate);
  const features = BUILD_FEATURES.filter((f) => i.buildFeatures[f]).map((id) => {
    const hours = Math.round(FEATURE_HOURS[id] * factor);
    return { id, hours, cost: hours * rate };
  });
  const coreHours = CORE_HOURS[i.scope] ?? CORE_HOURS.mvp;
  const engineeringHours = coreHours + features.reduce((s, f) => s + f.hours, 0);
  const designHours = Math.round(engineeringHours * pct(i.designPct));
  const qaHours = Math.round(engineeringHours * pct(i.qaPct));
  const securityHours = i.securityReview ? Math.max(0, i.securityHours) : 0;
  const totalHours = engineeringHours + designHours + qaHours + securityHours;
  const labour = totalHours * rate;
  const compliance = Math.max(0, i.complianceCost);
  const subtotal = labour + compliance;
  const contingency = subtotal * (Math.max(0, i.contingencyPct) / 100);
  const likely = subtotal + contingency;
  return {
    coreHours,
    features,
    engineeringHours,
    designHours,
    qaHours,
    securityHours,
    totalHours,
    labour,
    compliance,
    subtotal,
    contingency,
    low: subtotal * BUILD_LOW_FACTOR,
    likely,
    high: likely * BUILD_HIGH_FACTOR,
  };
}

// ---------------------------------------------------------------------------
// Unit economics and pricing
// ---------------------------------------------------------------------------

export interface UnitEconomics {
  revenuePerUser: number;
  variablePerUser: number; // incl. payment fees
  costPerUser: number; // all running costs / active users
  contributionPerUser: number;
  breakEvenUsers: number | null;
  breakEvenAccounts: number | null;
  monthsToRecoverBuild: number | null;
  /** Price per billing unit (user, account or 1,000 interactions) at 0% margin after all running costs. */
  breakEvenPrice: number | null;
  /** Price per billing unit that hits the target gross margin. */
  targetPrice: number | null;
  /** Upper end of the suggested range: target margin + 10 points. */
  comfortablePrice: number | null;
  heavyUserCost: number; // monthly cost of one 95th percentile billing unit
  heavyUserRevenue: number; // what that unit pays per month
  heavyUserLoss: number; // > 0 when a heavy unit costs more than it pays
}

/** Price per billing unit that makes gross margin equal `marginPct` at the current volume. */
export function priceForMargin(i: Inputs, m: Monthly, marginPct: number, includeMaintenance = false): number | null {
  const fee = pct(i.paymentPct);
  const denom = 1 - marginPct / 100 - fee;
  if (denom <= 0 || m.payingUnits <= 0) return null;
  const costs = m.variable + m.fixed - (includeMaintenance ? 0 : m.lines.maintenance);
  return costs / denom / m.payingUnits;
}

export function unitEconomics(i: Inputs, m: Monthly = monthly(i), build: BuildEstimate = buildEstimate(i)): UnitEconomics {
  const users = m.users;
  const perUser = (n: number) => (users > 0 ? n / users : 0);
  const revenuePerUser = perUser(m.revenue);
  const variablePerUser = perUser(m.variable + m.lines.paymentFees);
  const contributionPerUser = revenuePerUser - variablePerUser;
  const breakEvenUsers = contributionPerUser > 0 ? Math.ceil(m.fixed / contributionPerUser) : null;

  // A heavy billing unit: usage-driven costs times the multiplier.
  const mult = Math.max(1, i.heavyUserMultiplier);
  const usageCostPerUser = perUser(m.variable);
  let heavyUserCost: number;
  let heavyUserRevenue: number;
  if (i.pricingMode === "per_account") {
    heavyUserCost = usageCostPerUser * Math.max(1, i.usersPerAccount) * mult;
    heavyUserRevenue = i.price;
  } else if (i.pricingMode === "usage") {
    heavyUserCost = usageCostPerUser * mult;
    heavyUserRevenue = (i.interactionsPerUser / 1000) * i.price * mult;
  } else {
    heavyUserCost = usageCostPerUser * mult;
    heavyUserRevenue = i.price;
  }
  heavyUserRevenue *= 1 - pct(i.paymentPct);

  const target = Math.min(Math.max(i.targetMarginPct, 0), 95);
  return {
    revenuePerUser,
    variablePerUser,
    costPerUser: perUser(m.total),
    contributionPerUser,
    breakEvenUsers,
    breakEvenAccounts:
      breakEvenUsers !== null && i.pricingMode === "per_account"
        ? Math.ceil(breakEvenUsers / Math.max(1, i.usersPerAccount))
        : null,
    monthsToRecoverBuild: m.profit > 0 ? build.likely / m.profit : null,
    breakEvenPrice: priceForMargin(i, m, 0, true),
    targetPrice: priceForMargin(i, m, target),
    comfortablePrice: priceForMargin(i, m, Math.min(target + 10, 95)),
    heavyUserCost,
    heavyUserRevenue,
    heavyUserLoss: heavyUserCost - heavyUserRevenue,
  };
}

/** Round a price up to something a person would put on a pricing page. */
export function nicePrice(p: number): number {
  if (!Number.isFinite(p) || p <= 0) return 0;
  if (p < 1) return Math.ceil(p * 100) / 100;
  if (p < 10) return Math.ceil(p * 2) / 2;
  if (p < 100) return Math.ceil(p);
  if (p < 1000) return Math.ceil(p / 5) * 5;
  return Math.ceil(p / 50) * 50;
}

/** The inputs with `price` set to the (rounded) price that hits the target margin. */
export function withSuggestedPrice(i: Inputs): Inputs {
  const m = monthly(i);
  const p = priceForMargin(i, m, Math.min(Math.max(i.targetMarginPct, 0), 95));
  return p ? { ...i, price: nicePrice(p) } : i;
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export interface Scenario {
  key: "launch" | "growth" | "scale";
  userMult: number;
  fixedMult: number;
  m: Monthly;
}

export function scenarios(i: Inputs): Scenario[] {
  const keys = ["launch", "growth", "scale"] as const;
  return keys.map((key, n) => {
    const userMult = Math.max(0, i.scenarioUsers[n] ?? 1);
    const fixedMult = Math.max(0, i.scenarioFixed[n] ?? 1);
    return { key, userMult, fixedMult, m: monthly(i, userMult, fixedMult) };
  });
}

// ---------------------------------------------------------------------------
// Warnings and recommendations (deterministic rules)
// ---------------------------------------------------------------------------

export type WarningId =
  | "noRevenue"
  | "negativeMargin"
  | "thinMargin"
  | "belowTarget"
  | "heavyUser"
  | "belowBreakEven"
  | "customModelEmpty";

export interface Warning {
  id: WarningId;
  level: "danger" | "warn";
  vars: Record<string, number>;
}

export function warnings(i: Inputs, m: Monthly, u: UnitEconomics): Warning[] {
  const out: Warning[] = [];
  if ((i.model === "custom" || (i.routePct > 0 && i.routeModel === "custom")) && i.customInput <= 0 && i.customOutput <= 0) {
    out.push({ id: "customModelEmpty", level: "warn", vars: {} });
  }
  if (m.revenue <= 0) {
    out.push({ id: "noRevenue", level: "warn", vars: {} });
  } else if (m.grossMarginPct !== null) {
    const gm = m.grossMarginPct;
    if (gm < 0) out.push({ id: "negativeMargin", level: "danger", vars: { margin: gm } });
    else if (gm < 30) out.push({ id: "thinMargin", level: "danger", vars: { margin: gm } });
    else if (gm < i.targetMarginPct) out.push({ id: "belowTarget", level: "warn", vars: { margin: gm, target: i.targetMarginPct } });
  }
  if (m.revenue > 0 && u.heavyUserLoss > 0) {
    out.push({
      id: "heavyUser",
      level: "danger",
      vars: { cost: u.heavyUserCost, revenue: u.heavyUserRevenue, mult: i.heavyUserMultiplier },
    });
  }
  if (m.revenue > 0 && u.breakEvenUsers !== null && u.breakEvenUsers > m.users) {
    out.push({ id: "belowBreakEven", level: "warn", vars: { need: u.breakEvenUsers, have: m.users } });
  }
  return out;
}

export type RecommendationId =
  | "cache"
  | "route"
  | "batch"
  | "model"
  | "output"
  | "overhead"
  | "biggest"
  | "heavy"
  | "price";

export interface Recommendation {
  id: RecommendationId;
  /** Monthly dollar amount the recommendation is about (a saving, or a cost to notice). */
  amount: number;
  /** True when `amount` is a monthly saving rather than an amount to notice. */
  saving: boolean;
  vars: Record<string, string | number>;
}

function aiTotal(i: Inputs): number {
  const m = monthly(i);
  return m.lines.aiPrimary + m.lines.aiRouted;
}

export function recommendations(i: Inputs, m: Monthly = monthly(i), u: UnitEconomics = unitEconomics(i, m)): Recommendation[] {
  const out: Recommendation[] = [];
  const baseAi = m.lines.aiPrimary + m.lines.aiRouted;
  const minSaving = Math.max(1, m.total * 0.01);
  const consider = (id: RecommendationId, variant: Inputs, vars: Record<string, string | number> = {}) => {
    const saving = baseAi - aiTotal(variant);
    if (saving >= minSaving) out.push({ id, amount: saving, saving: true, vars });
  };

  const primaryHasCache = m.ai.primaryPrice.cacheRead < m.ai.primaryPrice.input;
  if (i.cacheablePct < 60 && primaryHasCache) consider("cache", { ...i, cacheablePct: 60 }, { pct: 60 });

  if (i.model !== CHEAPEST_MODEL && i.routePct < 50 && m.ai.primaryPrice.input > 1) {
    consider("route", { ...i, routePct: 50, routeModel: CHEAPEST_MODEL }, { pct: 50, model: "Claude Haiku 4.5" });
  }

  if (i.batchPct < 25) consider("batch", { ...i, batchPct: 25 }, { pct: 25 });

  const expensive: ModelId[] = ["claude-fable-5-1", "claude-opus-5", "claude-opus-5-5"];
  if (expensive.includes(i.model)) consider("model", { ...i, model: "claude-sonnet-5" }, { model: "Claude Sonnet 5" });

  if (m.ai.outputCost > 0.5 * m.ai.total && i.outputTokens > 100) {
    consider("output", { ...i, outputTokens: Math.round(i.outputTokens * 0.75) }, { pct: 25 });
  }

  if (i.overheadPct > 10) consider("overhead", { ...i, overheadPct: 5 }, { from: i.overheadPct, to: 5 });

  // The biggest cost category, when it is not AI.
  const cats = COST_CATEGORIES.map((c) => [c, m.categories[c]] as const).sort((a, b) => b[1] - a[1]);
  const [topCat, topAmount] = cats[0];
  if (topCat !== "ai" && topAmount > 0 && m.total > 0) {
    out.push({ id: "biggest", amount: topAmount, saving: false, vars: { category: topCat, share: (topAmount / m.total) * 100 } });
  }

  if (m.revenue > 0 && u.heavyUserLoss > 0) {
    out.push({ id: "heavy", amount: u.heavyUserLoss, saving: false, vars: { mult: i.heavyUserMultiplier } });
  }

  if (m.revenue > 0 && m.grossMarginPct !== null && m.grossMarginPct < i.targetMarginPct && u.targetPrice) {
    const extra = revenueFor(i, m.users, u.targetPrice) - m.revenue;
    if (extra > 0) out.push({ id: "price", amount: extra, saving: false, vars: { price: u.targetPrice, target: i.targetMarginPct } });
  }

  // Savings first, largest first; then the things to notice.
  return out.sort((a, b) => Number(b.saving) - Number(a.saving) || b.amount - a.amount);
}

// ---------------------------------------------------------------------------
// Everything at once, for the UI
// ---------------------------------------------------------------------------

export interface Results {
  m: Monthly;
  build: BuildEstimate;
  unit: UnitEconomics;
  scenarios: Scenario[];
  warnings: Warning[];
  recommendations: Recommendation[];
}

export function computeAll(i: Inputs): Results {
  const m = monthly(i);
  const build = buildEstimate(i);
  const unit = unitEconomics(i, m, build);
  return {
    m,
    build,
    unit,
    scenarios: scenarios(i),
    warnings: warnings(i, m, unit),
    recommendations: recommendations(i, m, unit),
  };
}
