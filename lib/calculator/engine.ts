// The business plan behind the AI Product Cost Calculator: the build budget,
// unit economics and pricing, scenarios, warnings and savings
// recommendations. Pure functions of the inputs, like core.ts.
//
// This is the paid part. Only the server imports it (the estimate route, the
// full-plan route and tests); the page gets these numbers from
// /api/tools/calculator/full with a paid pass, so they are not in the page's
// code. Keep it out of client components.

import { BALANCED_MODEL, CHEAPEST_MODEL, modelById, type ModelId } from "./pricing";
import { monthly, revenueFor, pct, nicePrice, computeFree, type Monthly, type FreeResults } from "./core";
import type { BuildFeature, CostCategory, Inputs, Scope } from "./types";
import { BUILD_FEATURES, COST_CATEGORIES } from "./types";
import { CORE_HOURS, FEATURE_HOURS, SCOPE_FACTOR, BUILD_LOW_FACTOR, BUILD_HIGH_FACTOR } from "./build-model";

export * from "./core";
export { CORE_HOURS, FEATURE_HOURS, SCOPE_FACTOR, BUILD_LOW_FACTOR, BUILD_HIGH_FACTOR };

// ---------------------------------------------------------------------------
// Build (one-time) cost
// ---------------------------------------------------------------------------

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
  const primaryHasBatch = m.ai.primaryPrice.batch;
  if (i.cacheablePct < 60 && primaryHasCache) consider("cache", { ...i, cacheablePct: 60 }, { pct: 60 });

  if (i.model !== CHEAPEST_MODEL && i.routePct < 50 && m.ai.primaryPrice.input > 1) {
    consider("route", { ...i, routePct: 50, routeModel: CHEAPEST_MODEL }, { pct: 50, model: modelById(CHEAPEST_MODEL)!.name });
  }

  if (i.batchPct < 25 && primaryHasBatch) consider("batch", { ...i, batchPct: 25 }, { pct: 25 });

  const expensive: ModelId[] = ["claude-fable-5-2", "claude-fable-5-1", "claude-opus-5", "claude-opus-5-5", "gpt-6-2-astra", "gemini-4-carbon"];
  if (expensive.includes(i.model)) consider("model", { ...i, model: BALANCED_MODEL, fastMode: false }, { model: modelById(BALANCED_MODEL)!.name });

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

/** The paid part, as /api/tools/calculator/full sends it. */
export interface FullResults {
  build: BuildEstimate;
  unit: UnitEconomics;
  scenarios: Scenario[];
  warnings: Warning[];
  recommendations: Recommendation[];
}

export type Results = FreeResults & FullResults;

export function computeFull(i: Inputs, m: Monthly = monthly(i)): FullResults {
  const build = buildEstimate(i);
  const unit = unitEconomics(i, m, build);
  return { build, unit, scenarios: scenarios(i), warnings: warnings(i, m, unit), recommendations: recommendations(i, m, unit) };
}

export function computeAll(i: Inputs): Results {
  const free = computeFree(i);
  return { ...free, ...computeFull(i, free.m) };
}
