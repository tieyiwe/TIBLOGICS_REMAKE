// Turning untrusted data (a shared link, localStorage, the AI assistant's
// JSON) into valid inputs: unknown keys dropped, numbers clamped to sane
// ranges, enums checked, anything missing taken from the base.

import { DEFAULT_INPUTS, cloneInputs } from "./defaults";
import { isModelId } from "./pricing";
import type { BuildFeature, Inputs, PricingMode, RunFeature, Scope } from "./types";
import { BUILD_FEATURES, RUN_FEATURES } from "./types";

type NumKey = {
  [K in keyof Inputs]: Inputs[K] extends number ? K : never;
}[keyof Inputs];

/** [min, max] for every numeric input. */
export const LIMITS: Record<NumKey, [number, number]> = {
  users: [0, 100_000_000],
  interactionsPerUser: [0, 100_000],
  inputTokens: [0, 2_000_000],
  outputTokens: [0, 200_000],
  cacheablePct: [0, 100],
  cacheWritePct: [0, 100],
  customInput: [0, 1000],
  customOutput: [0, 1000],
  customCacheRead: [0, 1000],
  routePct: [0, 100],
  batchPct: [0, 100],
  overheadPct: [0, 500],
  embedDocTokensM: [0, 100_000],
  embedQueryTokens: [0, 100_000],
  embedPrice: [0, 1000],
  voiceMinutesPerUser: [0, 100_000],
  sttPerMin: [0, 100],
  ttsPerMin: [0, 100],
  imagesPerUser: [0, 100_000],
  imagePrice: [0, 100],
  messagesPerUser: [0, 1_000_000],
  messagePrice: [0, 100],
  storageGbPerUser: [0, 100_000],
  storagePerGb: [0, 100],
  hosting: [0, 10_000_000],
  database: [0, 10_000_000],
  vectorDb: [0, 10_000_000],
  monitoring: [0, 10_000_000],
  auth: [0, 10_000_000],
  emailsPerUser: [0, 100_000],
  emailPer1000: [0, 1000],
  paymentPct: [0, 50],
  supportHours: [0, 100_000],
  supportRate: [0, 10_000],
  maintenanceHours: [0, 100_000],
  maintenanceRate: [0, 10_000],
  hourlyRate: [0, 10_000],
  designPct: [0, 200],
  qaPct: [0, 200],
  securityHours: [0, 10_000],
  complianceCost: [0, 100_000_000],
  contingencyPct: [0, 200],
  price: [0, 10_000_000],
  usersPerAccount: [1, 10_000_000],
  payingPct: [0, 100],
  targetMarginPct: [0, 95],
  heavyUserMultiplier: [1, 1000],
};

const NUM_KEYS = Object.keys(LIMITS) as NumKey[];
const SCOPES: Scope[] = ["prototype", "mvp", "production"];
const MODES: PricingMode[] = ["per_user", "per_account", "usage"];

export function clamp(n: number, [min, max]: [number, number]): number {
  return Math.min(Math.max(n, min), max);
}

function num(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function obj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Valid inputs from anything, filling gaps from `base`. */
export function sanitizeInputs(raw: unknown, base: Inputs = DEFAULT_INPUTS): Inputs {
  const out = cloneInputs(base);
  const r = obj(raw);
  if (!r) return out;

  for (const k of NUM_KEYS) {
    const n = num(r[k]);
    if (n !== null) out[k] = clamp(n, LIMITS[k]);
  }
  if (isModelId(r.model)) out.model = r.model;
  if (isModelId(r.routeModel)) out.routeModel = r.routeModel;
  if (typeof r.customName === "string") out.customName = r.customName.slice(0, 60);
  if (typeof r.scope === "string" && (SCOPES as string[]).includes(r.scope)) out.scope = r.scope as Scope;
  if (typeof r.pricingMode === "string" && (MODES as string[]).includes(r.pricingMode)) out.pricingMode = r.pricingMode as PricingMode;
  if (typeof r.securityReview === "boolean") out.securityReview = r.securityReview;

  const f = obj(r.features);
  if (f) for (const k of RUN_FEATURES) if (typeof f[k] === "boolean") out.features[k as RunFeature] = f[k] as boolean;
  const b = obj(r.buildFeatures);
  if (b) for (const k of BUILD_FEATURES) if (typeof b[k] === "boolean") out.buildFeatures[k as BuildFeature] = b[k] as boolean;

  for (const key of ["scenarioUsers", "scenarioFixed"] as const) {
    const arr = r[key];
    if (Array.isArray(arr)) {
      for (let n = 0; n < 3; n++) {
        const v = num(arr[n]);
        if (v !== null) out[key][n] = clamp(v, [0, 10_000]);
      }
    }
  }
  return out;
}

/** Only the fields that differ from `base`, for compact share links. */
export function diffInputs(i: Inputs, base: Inputs = DEFAULT_INPUTS): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(i) as (keyof Inputs)[]) {
    const a = i[k];
    const b = base[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) out[k] = a;
  }
  return out;
}
