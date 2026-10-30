import { DEFAULT_INPUTS, cloneInputs, noBuildFeatures, noRunFeatures } from "./defaults";
import type { BuildFeature, Inputs, RunFeature } from "./types";

// One-click starting points. Names and descriptions live in the "calculator"
// dictionary under calculator.preset.<id>.name / .desc. Every number is a
// starting assumption for the visitor to edit, not a benchmark.

export type PresetId =
  | "supportBot"
  | "whatsapp"
  | "docQa"
  | "writingSaas"
  | "voiceReceptionist"
  | "tutor"
  | "opsAgent"
  | "imageApp"
  | "meetingNotes"
  | "productCopy";

type Overlay = Partial<Omit<Inputs, "features" | "buildFeatures">> & {
  features?: RunFeature[];
  build?: BuildFeature[];
};

export const PRESETS: Record<PresetId, Overlay> = {
  supportBot: {
    users: 2000, interactionsPerUser: 6, inputTokens: 3500, outputTokens: 350, cacheablePct: 60,
    model: "claude-sonnet-5", features: ["rag"], embedDocTokensM: 2,
    build: ["accounts", "chatUi", "rag", "integrations", "admin"], scope: "mvp",
    pricingMode: "per_account", usersPerAccount: 200, price: 99,
  },
  whatsapp: {
    users: 10000, interactionsPerUser: 6, inputTokens: 1500, outputTokens: 200, cacheablePct: 60,
    model: "claude-haiku-4-5", features: ["messaging"], messagesPerUser: 12,
    build: ["accounts", "messaging", "integrations", "admin", "multilingual", "payments"], scope: "mvp",
    pricingMode: "per_account", usersPerAccount: 50, price: 25,
  },
  docQa: {
    users: 300, interactionsPerUser: 40, inputTokens: 6000, outputTokens: 500, cacheablePct: 30,
    model: "claude-sonnet-5", features: ["rag", "files"], embedDocTokensM: 20, storageGbPerUser: 2,
    build: ["accounts", "chatUi", "rag", "files", "integrations", "admin"], scope: "mvp",
    pricingMode: "per_account", usersPerAccount: 25, price: 400,
  },
  writingSaas: {
    users: 2000, interactionsPerUser: 60, inputTokens: 1500, outputTokens: 1200, cacheablePct: 40,
    model: "claude-sonnet-5", routePct: 30,
    build: ["accounts", "chatUi", "payments", "admin"], scope: "mvp",
    pricingMode: "per_user", price: 19,
  },
  voiceReceptionist: {
    users: 3000, interactionsPerUser: 2, inputTokens: 12000, outputTokens: 1200, cacheablePct: 70,
    model: "claude-haiku-4-5", features: ["voice"], voiceMinutesPerUser: 8,
    build: ["accounts", "voice", "integrations", "admin"], scope: "mvp",
    pricingMode: "per_account", usersPerAccount: 100, price: 149,
  },
  tutor: {
    users: 1000, interactionsPerUser: 80, inputTokens: 2500, outputTokens: 600, cacheablePct: 60,
    model: "claude-sonnet-5", routePct: 40,
    build: ["accounts", "chatUi", "payments", "admin", "multilingual"], scope: "mvp",
    pricingMode: "per_user", price: 8,
  },
  opsAgent: {
    users: 50, interactionsPerUser: 100, inputTokens: 20000, outputTokens: 2000, cacheablePct: 70,
    model: "claude-opus-5", overheadPct: 25, batchPct: 20,
    build: ["accounts", "agentTools", "integrations", "admin"], scope: "mvp",
    pricingMode: "per_account", usersPerAccount: 50, price: 1500,
  },
  imageApp: {
    users: 3000, interactionsPerUser: 30, inputTokens: 400, outputTokens: 300, cacheablePct: 40,
    model: "claude-haiku-4-5", features: ["images", "files"], imagesPerUser: 30, storageGbPerUser: 1,
    build: ["accounts", "images", "files", "payments", "admin"], scope: "mvp",
    pricingMode: "per_user", price: 12,
  },
  meetingNotes: {
    users: 500, interactionsPerUser: 20, inputTokens: 15000, outputTokens: 1500, cacheablePct: 10,
    model: "claude-sonnet-5", batchPct: 60, features: ["voice", "files"], voiceMinutesPerUser: 600, ttsPerMin: 0,
    storageGbPerUser: 1,
    build: ["accounts", "voice", "files", "integrations", "payments"], scope: "mvp",
    pricingMode: "per_user", price: 15,
  },
  productCopy: {
    users: 200, interactionsPerUser: 300, inputTokens: 800, outputTokens: 400, cacheablePct: 60,
    model: "claude-haiku-4-5", batchPct: 70,
    build: ["accounts", "integrations", "payments", "multilingual"], scope: "mvp",
    pricingMode: "per_user", price: 29,
  },
};

export const PRESET_IDS = Object.keys(PRESETS) as PresetId[];

export function isPresetId(v: unknown): v is PresetId {
  return typeof v === "string" && v in PRESETS;
}

/** Full inputs for a preset: defaults, then the preset's overlay. */
export function presetInputs(id: PresetId): Inputs {
  const { features, build, ...rest } = PRESETS[id];
  const base = cloneInputs(DEFAULT_INPUTS);
  const out: Inputs = { ...base, ...rest };
  out.features = { ...noRunFeatures };
  for (const f of features ?? []) out.features[f] = true;
  out.buildFeatures = { ...noBuildFeatures };
  for (const b of build ?? []) out.buildFeatures[b] = true;
  return out;
}
