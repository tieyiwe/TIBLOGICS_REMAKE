// Model prices for the AI Product Cost Calculator.
//
// Anthropic first-party API list prices in US dollars per million tokens, as
// published on https://www.anthropic.com/pricing. Prices change: update
// PRICES_AS_OF with every edit here, and the UI shows it next to the table.
//
// Other providers are deliberately absent. We cannot verify their prices, so
// the calculator offers a "Custom model" row where visitors type in their own
// figures instead.

export const PRICES_AS_OF = "2026-06-30";
export const PRICING_URL = "https://www.anthropic.com/pricing";

/** 5-minute prompt cache writes cost this multiple of the input price. */
export const CACHE_WRITE_MULTIPLIER = 1.25;
/** Default cache read price as a multiple of input, for models without their own figure. */
export const CACHE_READ_MULTIPLIER = 0.1;
/** The Message Batches API charges this share of the normal price (50% off). */
export const BATCH_MULTIPLIER = 0.5;

export type ClaudeModelId =
  | "claude-fable-5-1"
  | "claude-opus-5-5"
  | "claude-opus-5"
  | "claude-sonnet-5"
  | "claude-haiku-4-5";

export type ModelId = ClaudeModelId | "custom";

export interface ModelPrice {
  id: ClaudeModelId;
  name: string;
  /** $ per million input tokens. */
  input: number;
  /** $ per million output tokens. */
  output: number;
  /** $ per million cached input tokens read. */
  cacheRead: number;
  /** Which tier the UI describes it as (a message key suffix). */
  tier: "frontier" | "reasoning" | "balanced" | "fast";
}

export const CLAUDE_MODELS: ModelPrice[] = [
  { id: "claude-opus-5", name: "Claude Opus 5", input: 5, output: 25, cacheRead: 0.5, tier: "reasoning" },
  // Cache reads on Opus 5.5 and Fable 5.1 are priced below the usual 0.1x.
  { id: "claude-opus-5-5", name: "Claude Opus 5.5", input: 4, output: 20, cacheRead: 0.2, tier: "reasoning" },
  { id: "claude-sonnet-5", name: "Claude Sonnet 5", input: 2, output: 10, cacheRead: 0.2, tier: "balanced" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", input: 1, output: 5, cacheRead: 0.1, tier: "fast" },
  { id: "claude-fable-5-1", name: "Claude Fable 5.1", input: 10, output: 50, cacheRead: 0.25, tier: "frontier" },
];

export const MODEL_IDS: ModelId[] = [...CLAUDE_MODELS.map((m) => m.id), "custom"];

export function isModelId(v: unknown): v is ModelId {
  return typeof v === "string" && (MODEL_IDS as string[]).includes(v);
}

export interface CustomModel {
  name: string;
  input: number;
  output: number;
  /** $ per million cached input tokens; 0 means the provider has no caching discount entered. */
  cacheRead: number;
}

export interface ResolvedPrice {
  name: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  custom: boolean;
}

export function priceFor(id: ModelId, custom: CustomModel): ResolvedPrice {
  if (id === "custom") {
    const cacheRead = custom.cacheRead > 0 ? custom.cacheRead : custom.input;
    return {
      name: custom.name || "Custom model",
      input: custom.input,
      output: custom.output,
      cacheRead,
      // With no caching figure entered, cached input simply costs the input price.
      cacheWrite: custom.cacheRead > 0 ? custom.input * CACHE_WRITE_MULTIPLIER : custom.input,
      custom: true,
    };
  }
  const m = CLAUDE_MODELS.find((x) => x.id === id) ?? CLAUDE_MODELS[2];
  return {
    name: m.name,
    input: m.input,
    output: m.output,
    cacheRead: m.cacheRead,
    cacheWrite: m.input * CACHE_WRITE_MULTIPLIER,
    custom: false,
  };
}

/** The cheapest Claude model, used for routing suggestions. */
export const CHEAPEST_MODEL: ClaudeModelId = "claude-haiku-4-5";
