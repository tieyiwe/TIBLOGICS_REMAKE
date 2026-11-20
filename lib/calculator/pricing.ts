// Model prices for the AI Product Cost Calculator, in US dollars per million
// tokens. Prices change: update PRICES_AS_OF with every edit here, and the UI
// shows it next to the table.
//
//   Anthropic  first-party API list prices (anthropic.com/pricing): input,
//              output, cache reads, 5-minute cache writes at 1.25x input,
//              Batch API at half price, fast mode where offered.
//   OpenAI     GPT-6.2 launch prices (November 17, 2026).
//   Google     Gemini 4 launch prices (November 10 to 18, 2026). Gemini 4
//              Carbon is listed at the price it moves to on December 1, 2026
//              ($4 / $20; $2 / $10 before), since an estimate is for the
//              months ahead.
//
// For OpenAI and Google only input and output prices are entered: their
// cached-input and batch discounts were not in the launch announcements we
// checked, so the calculator applies none (cacheRead and batch null). That
// makes their estimates slightly high, never low, and the UI says so. A
// visitor with a negotiated or discounted price uses the Custom model row.

export const PRICES_AS_OF = "2026-11-20";
export const PRICING_URL = "https://www.anthropic.com/pricing";

/** 5-minute prompt cache writes cost this multiple of the input price. */
export const CACHE_WRITE_MULTIPLIER = 1.25;
/** Default cache read price as a multiple of input, for models without their own figure. */
export const CACHE_READ_MULTIPLIER = 0.1;
/** The Message Batches API charges this share of the normal price (50% off). */
export const BATCH_MULTIPLIER = 0.5;

export type Provider = "anthropic" | "openai" | "google";
export const PROVIDERS: Provider[] = ["anthropic", "openai", "google"];

export type CatalogModelId =
  | "claude-fable-5-2"
  | "claude-opus-5-5"
  | "claude-sonnet-5-5"
  | "claude-haiku-5-5"
  | "gpt-6-2-astra"
  | "gpt-6-2-sol"
  | "gemini-4-carbon"
  | "gemini-4-neon"
  | "gemini-4-hydrogen"
  // Earlier Claude models, still served. Kept so older shared links and
  // saved estimates open with the model they were made with.
  | "claude-fable-5-1"
  | "claude-opus-5"
  | "claude-sonnet-5"
  | "claude-haiku-4-5";

/** Kept for older imports: every catalog id. */
export type ClaudeModelId = CatalogModelId;
export type ModelId = CatalogModelId | "custom";

export interface ModelPrice {
  id: CatalogModelId;
  name: string;
  provider: Provider;
  /** $ per million input tokens. */
  input: number;
  /** $ per million output tokens (thinking tokens are billed as output). */
  output: number;
  /** $ per million cached input tokens read; null when no caching discount is known. */
  cacheRead: number | null;
  /** True when the 50%-off batch API price applies. */
  batch: boolean;
  /** Fast mode (faster output at a premium), where offered. */
  fast?: { input: number; output: number };
  /** A higher price for prompts longer than `above` tokens. */
  longContext?: { above: number; input: number; output: number };
  /** Which tier the UI describes it as (a message key suffix). */
  tier: "frontier" | "reasoning" | "balanced" | "fast";
  /** An earlier model, listed under "older models". */
  legacy?: boolean;
  /** A message key for a short note shown with the model (calculator.model.note.<key>). */
  note?: "carbonDec1" | "haikuLong" | "noCache";
  /** Where the price comes from. */
  source: string;
}

const ANTHROPIC = "https://www.anthropic.com/pricing";
const OPENAI = "https://www.androidauthority.com/openai-gpt-6-2-astra-sol-3736420/";
const GOOGLE_CARBON = "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-carbon-now-available/";
const GOOGLE_HYDROGEN = "https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/";
const GOOGLE_NEON = "https://9to5google.com/2026/11/18/gemini-4-neon-announcement/";

export const MODELS: ModelPrice[] = [
  // Anthropic
  { id: "claude-fable-5-2", name: "Claude Fable 5.2", provider: "anthropic", input: 8, output: 40, cacheRead: 0.2, batch: true, fast: { input: 16, output: 80 }, tier: "frontier", source: ANTHROPIC },
  { id: "claude-opus-5-5", name: "Claude Opus 5.5", provider: "anthropic", input: 4, output: 20, cacheRead: 0.2, batch: true, fast: { input: 8, output: 40 }, tier: "reasoning", source: ANTHROPIC },
  { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5", provider: "anthropic", input: 2, output: 10, cacheRead: 0.1, batch: true, tier: "balanced", source: ANTHROPIC },
  // Haiku 5.5: $0.10 / $0.50 for prompts up to 100K tokens, $0.50 / $2.50 beyond.
  { id: "claude-haiku-5-5", name: "Claude Haiku 5.5", provider: "anthropic", input: 0.1, output: 0.5, cacheRead: 0.01, batch: true, longContext: { above: 100_000, input: 0.5, output: 2.5 }, tier: "fast", note: "haikuLong", source: ANTHROPIC },
  // OpenAI
  { id: "gpt-6-2-astra", name: "GPT-6.2 Astra", provider: "openai", input: 8, output: 40, cacheRead: null, batch: false, tier: "frontier", note: "noCache", source: OPENAI },
  { id: "gpt-6-2-sol", name: "GPT-6.2 Sol", provider: "openai", input: 2, output: 10, cacheRead: null, batch: false, tier: "balanced", note: "noCache", source: OPENAI },
  // Google
  { id: "gemini-4-carbon", name: "Gemini 4 Carbon", provider: "google", input: 4, output: 20, cacheRead: null, batch: false, tier: "reasoning", note: "carbonDec1", source: GOOGLE_CARBON },
  { id: "gemini-4-neon", name: "Gemini 4 Neon", provider: "google", input: 3, output: 15, cacheRead: null, batch: false, tier: "balanced", note: "noCache", source: GOOGLE_NEON },
  { id: "gemini-4-hydrogen", name: "Gemini 4 Hydrogen", provider: "google", input: 1.5, output: 7.5, cacheRead: null, batch: false, tier: "fast", note: "noCache", source: GOOGLE_HYDROGEN },
  // Earlier Claude models
  { id: "claude-fable-5-1", name: "Claude Fable 5.1", provider: "anthropic", input: 10, output: 50, cacheRead: 0.25, batch: true, tier: "frontier", legacy: true, source: ANTHROPIC },
  { id: "claude-opus-5", name: "Claude Opus 5", provider: "anthropic", input: 5, output: 25, cacheRead: 0.5, batch: true, tier: "reasoning", legacy: true, source: ANTHROPIC },
  { id: "claude-sonnet-5", name: "Claude Sonnet 5", provider: "anthropic", input: 2, output: 10, cacheRead: 0.2, batch: true, tier: "balanced", legacy: true, source: ANTHROPIC },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "anthropic", input: 1, output: 5, cacheRead: 0.1, batch: true, tier: "fast", legacy: true, source: ANTHROPIC },
];

/** Older imports read this name; it is the whole catalog now. */
export const CLAUDE_MODELS = MODELS;
export const CURRENT_MODELS = MODELS.filter((m) => !m.legacy);
export const LEGACY_MODELS = MODELS.filter((m) => m.legacy);

export const MODEL_IDS: ModelId[] = [...MODELS.map((m) => m.id), "custom"];

export function isModelId(v: unknown): v is ModelId {
  return typeof v === "string" && (MODEL_IDS as string[]).includes(v);
}

export function modelById(id: ModelId): ModelPrice | undefined {
  return MODELS.find((m) => m.id === id);
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
  provider: Provider | "custom";
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  /** Whether the batch discount applies. */
  batch: boolean;
  custom: boolean;
  /** True when fast-mode prices were used. */
  fast: boolean;
  /** True when the long-prompt price was used. */
  long: boolean;
}

export interface PriceOptions {
  /** Use fast-mode prices where the model offers them. */
  fast?: boolean;
  /** Prompt length per model call, for long-context pricing. */
  promptTokens?: number;
}

export function priceFor(id: ModelId, custom: CustomModel, opts: PriceOptions = {}): ResolvedPrice {
  if (id === "custom") {
    const cacheRead = custom.cacheRead > 0 ? custom.cacheRead : custom.input;
    return {
      name: custom.name || "Custom model",
      provider: "custom",
      input: custom.input,
      output: custom.output,
      cacheRead,
      // With no caching figure entered, cached input simply costs the input price.
      cacheWrite: custom.cacheRead > 0 ? custom.input * CACHE_WRITE_MULTIPLIER : custom.input,
      batch: false,
      custom: true,
      fast: false,
      long: false,
    };
  }
  const m = modelById(id) ?? modelById("claude-sonnet-5-5")!;
  const long = !!m.longContext && (opts.promptTokens ?? 0) > m.longContext.above;
  const fast = !!opts.fast && !!m.fast;
  let input = m.input;
  let output = m.output;
  if (long) ({ input, output } = m.longContext!);
  if (fast) ({ input, output } = m.fast!);
  // Cache reads keep their ratio to the input price when the price tier
  // changes (long prompts, fast mode); no caching discount stays none.
  const cacheRead = m.cacheRead === null ? input : m.cacheRead * (input / m.input);
  return {
    name: m.name,
    provider: m.provider,
    input,
    output,
    cacheRead,
    cacheWrite: m.cacheRead === null ? input : input * CACHE_WRITE_MULTIPLIER,
    batch: m.batch,
    custom: false,
    fast,
    long,
  };
}

/** The cheapest current model, used for routing suggestions. */
export const CHEAPEST_MODEL: CatalogModelId = "claude-haiku-5-5";
/** The everyday model suggested in place of a frontier one. */
export const BALANCED_MODEL: CatalogModelId = "claude-sonnet-5-5";
