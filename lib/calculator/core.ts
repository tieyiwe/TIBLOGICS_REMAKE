// The free part of the AI Product Cost Calculator: the monthly AI and running
// costs, the model comparison and the likely range. Pure functions of the
// inputs, so the same numbers come out in the browser, on the server and in
// tests. This is what the page computes as you type.
//
// The business plan (build budget, pricing and break-even, scenarios, savings
// recommendations) is in engine.ts, which only the server imports: it is the
// paid part, sent to the page by /api/tools/calculator/full for a paid pass.

import {
  BATCH_MULTIPLIER,
  CURRENT_MODELS,
  modelById,
  priceFor,
  type CatalogModelId,
  type ModelId,
  type Provider,
  type ResolvedPrice,
} from "./pricing";
import type { AiBreakdown, CostCategory, CostLines, Inputs } from "./types";

export const M = 1_000_000;
/** Tokens a person types in one turn, for conversation history. */
export const USER_TURN_TOKENS = 100;

export function pct(n: number): number {
  return Math.min(Math.max(n, 0), 100) / 100;
}

export function safe(n: number): number {
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

/** Cost of one slice of traffic on one model. The batch discount applies to every token, where offered. */
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
  const batchFactor = price.batch ? 1 - batchShare * (1 - BATCH_MULTIPLIER) : 1;
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

/** Earlier turns resent with each call: on average half the conversation so far. */
export function historyTokens(i: Inputs): number {
  const turns = Math.max(1, i.historyTurns);
  return ((turns - 1) / 2) * (USER_TURN_TOKENS + Math.max(0, i.outputTokens));
}

/** The prompt one model call sends: the fixed input plus the conversation so far. */
export function promptTokens(i: Inputs): number {
  return Math.max(0, i.inputTokens) + historyTokens(i);
}

export interface AiResult extends AiBreakdown {
  calls: number;
  primary: number;
  routed: number;
  primaryPrice: ResolvedPrice;
  routedPrice: ResolvedPrice;
  perInteraction: number;
}

/** Monthly AI inference cost for `users` active users. */
export function aiCost(i: Inputs, users: number = i.users): AiResult {
  const interactions = Math.max(0, users) * Math.max(0, i.interactionsPerUser);
  const calls = interactions * Math.max(1, i.callsPerInteraction);
  const overhead = 1 + Math.max(0, i.overheadPct) / 100;
  const prompt = promptTokens(i);
  const thinking = Math.max(0, i.thinkingTokens);
  const inTok = calls * prompt * overhead;
  const outTok = calls * (Math.max(0, i.outputTokens) + thinking) * overhead;
  const custom = customModel(i);
  const opts = { fast: i.fastMode, promptTokens: prompt };
  const primaryPrice = priceFor(i.model, custom, opts);
  const routedPrice = priceFor(i.routeModel, custom, opts);
  const routeShare = i.routeModel === i.model ? 0 : pct(i.routePct);
  const c = pct(i.cacheablePct);
  const w = pct(i.cacheWritePct);
  const b = pct(i.batchPct);

  const p = sliceCost(inTok * (1 - routeShare), outTok * (1 - routeShare), primaryPrice, c, w, b);
  const r = sliceCost(inTok * routeShare, outTok * routeShare, routedPrice, c, w, b);
  const total = p.total + r.total;
  const outputCost = p.outputCost + r.outputCost;
  const outPerCall = Math.max(0, i.outputTokens) + thinking;
  const thinkingShare = outPerCall > 0 ? thinking / outPerCall : 0;
  return {
    interactions,
    calls,
    inputTokens: inTok,
    outputTokens: outTok,
    thinkingTokens: outTok * thinkingShare,
    uncachedInputCost: p.uncachedInputCost + r.uncachedInputCost,
    cacheReadCost: p.cacheReadCost + r.cacheReadCost,
    cacheWriteCost: p.cacheWriteCost + r.cacheWriteCost,
    outputCost,
    thinkingCost: outputCost * thinkingShare,
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
// The likely range
// ---------------------------------------------------------------------------

/**
 * Token counts are the least certain inputs: real prompts, answers and
 * reasoning vary a lot from request to request. The range re-runs the
 * estimate with lighter traffic (three quarters of the tokens, half the
 * thinking) and heavier traffic (one and a half times the tokens, twice the
 * thinking, ten more points of retries). Everything else stays as entered.
 */
export const RANGE = { lowTokens: 0.75, lowThinking: 0.5, highTokens: 1.5, highThinking: 2, highOverhead: 10 };

export interface Range {
  aiLow: number;
  aiHigh: number;
  totalLow: number;
  totalHigh: number;
}

export function likelyRange(i: Inputs, m: Monthly = monthly(i)): Range {
  const low = monthly({
    ...i,
    inputTokens: i.inputTokens * RANGE.lowTokens,
    outputTokens: i.outputTokens * RANGE.lowTokens,
    thinkingTokens: i.thinkingTokens * RANGE.lowThinking,
  });
  const high = monthly({
    ...i,
    inputTokens: i.inputTokens * RANGE.highTokens,
    outputTokens: i.outputTokens * RANGE.highTokens,
    thinkingTokens: i.thinkingTokens * RANGE.highThinking,
    overheadPct: i.overheadPct + RANGE.highOverhead,
  });
  const ai = (x: Monthly) => x.lines.aiPrimary + x.lines.aiRouted;
  // Payment fees follow revenue, which the token counts do not change.
  return { aiLow: ai(low), aiHigh: ai(high), totalLow: Math.min(low.total, m.total), totalHigh: Math.max(high.total, m.total) };
}

// ---------------------------------------------------------------------------
// The same workload on every model
// ---------------------------------------------------------------------------

export interface ModelCost {
  id: CatalogModelId;
  name: string;
  provider: Provider;
  monthly: number;
  perInteraction: number;
  current: boolean;
}

/** Monthly AI cost of the current workload on each current model (and the selected one). */
export function compareModels(i: Inputs): ModelCost[] {
  const ids = new Set<CatalogModelId>(CURRENT_MODELS.map((m) => m.id));
  if (i.model !== "custom") ids.add(i.model);
  const out: ModelCost[] = [];
  for (const id of ids) {
    const m = modelById(id)!;
    // Routing a share of traffic to the model being compared is no routing.
    const a = aiCost({ ...i, model: id, routePct: i.routeModel === id ? 0 : i.routePct });
    out.push({ id, name: m.name, provider: m.provider, monthly: a.total, perInteraction: a.perInteraction, current: id === i.model });
  }
  return out.sort((a, b) => a.monthly - b.monthly);
}

// ---------------------------------------------------------------------------
// Notes on the inputs (free): things that change how a price applies
// ---------------------------------------------------------------------------

export type NoteId = "customModelEmpty" | "fastUnavailable" | "longPrice" | "noCacheDiscount" | "noBatchDiscount" | "carbonDec1";

export function inputNotes(i: Inputs, ai: AiResult = aiCost(i)): NoteId[] {
  const out: NoteId[] = [];
  const usesCustom = i.model === "custom" || (i.routePct > 0 && i.routeModel === "custom");
  if (usesCustom && i.customInput <= 0 && i.customOutput <= 0) out.push("customModelEmpty");
  const primary = i.model === "custom" ? undefined : modelById(i.model);
  if (i.fastMode && !ai.primaryPrice.fast) out.push("fastUnavailable");
  if (ai.primaryPrice.long || (i.routePct > 0 && ai.routedPrice.long)) out.push("longPrice");
  if (i.cacheablePct > 0 && primary && primary.cacheRead === null) out.push("noCacheDiscount");
  if (i.batchPct > 0 && !ai.primaryPrice.batch) out.push("noBatchDiscount");
  if (i.model === "gemini-4-carbon") out.push("carbonDec1");
  return out;
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

/** What the page computes as you type. */
export interface FreeResults {
  m: Monthly;
  range: Range;
  comparison: ModelCost[];
  notes: NoteId[];
}

export function computeFree(i: Inputs): FreeResults {
  const m = monthly(i);
  return { m, range: likelyRange(i, m), comparison: compareModels(i), notes: inputNotes(i, m.ai) };
}
