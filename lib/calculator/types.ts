import type { ModelId } from "./pricing";

export type Scope = "prototype" | "mvp" | "production";
export type PricingMode = "per_user" | "per_account" | "usage";

/** Features that change running costs (each gates its own cost lines). */
export type RunFeature = "rag" | "voice" | "images" | "messaging" | "files";
export const RUN_FEATURES: RunFeature[] = ["rag", "voice", "images", "messaging", "files"];

/** Things to build, each mapped to estimated engineering hours. */
export type BuildFeature =
  | "accounts"
  | "chatUi"
  | "rag"
  | "voice"
  | "images"
  | "messaging"
  | "files"
  | "agentTools"
  | "integrations"
  | "payments"
  | "admin"
  | "multilingual"
  | "mobileApp";

export const BUILD_FEATURES: BuildFeature[] = [
  "accounts",
  "chatUi",
  "rag",
  "voice",
  "images",
  "messaging",
  "files",
  "agentTools",
  "integrations",
  "payments",
  "admin",
  "multilingual",
  "mobileApp",
];

export interface Inputs {
  // Usage and inference
  users: number; // monthly active users
  interactionsPerUser: number; // per user per month
  inputTokens: number; // per interaction, including system prompt and retrieved context
  outputTokens: number; // per interaction
  cacheablePct: number; // share of input tokens that is a stable, cacheable prefix
  cacheWritePct: number; // share of cacheable tokens written (cache misses) rather than read
  model: ModelId;
  customName: string;
  customInput: number; // $ / M tokens
  customOutput: number;
  customCacheRead: number;
  routePct: number; // share of interactions sent to the cheaper model
  routeModel: ModelId;
  batchPct: number; // share of interactions run through the Batch API
  overheadPct: number; // retries, tool calls, failed attempts

  // Features that affect running costs
  features: Record<RunFeature, boolean>;
  embedDocTokensM: number; // millions of document tokens embedded per month
  embedQueryTokens: number; // tokens embedded per interaction (the user's question)
  embedPrice: number; // $ / M embedding tokens (user's provider)
  voiceMinutesPerUser: number;
  sttPerMin: number;
  ttsPerMin: number;
  imagesPerUser: number;
  imagePrice: number;
  messagesPerUser: number;
  messagePrice: number;
  storageGbPerUser: number;
  storagePerGb: number;

  // Other monthly running costs
  hosting: number;
  database: number;
  vectorDb: number; // only counted when rag is on
  monitoring: number;
  auth: number;
  emailsPerUser: number;
  emailPer1000: number;
  paymentPct: number; // % of revenue
  supportHours: number;
  supportRate: number;
  maintenanceHours: number;
  maintenanceRate: number;

  // Build (one-time)
  scope: Scope;
  buildFeatures: Record<BuildFeature, boolean>;
  hourlyRate: number;
  designPct: number; // % of engineering hours
  qaPct: number; // % of engineering hours
  securityReview: boolean;
  securityHours: number;
  complianceCost: number; // $ one-time, external legal / compliance review
  contingencyPct: number;

  // Pricing and unit economics
  pricingMode: PricingMode;
  price: number; // per user / per account / per 1,000 interactions depending on mode
  usersPerAccount: number;
  payingPct: number; // share of active users (or accounts) that pay
  targetMarginPct: number;
  heavyUserMultiplier: number; // cost of a 95th percentile user vs the average

  // Scenarios
  scenarioUsers: [number, number, number]; // multipliers of `users`
  scenarioFixed: [number, number, number]; // multipliers of fixed monthly costs
}

/** Monthly cost lines. Grouped into categories for the charts. */
export interface CostLines {
  aiPrimary: number;
  aiRouted: number;
  embeddings: number;
  voice: number;
  images: number;
  messaging: number;
  storage: number;
  email: number;
  paymentFees: number;
  hosting: number;
  database: number;
  vectorDb: number;
  monitoring: number;
  auth: number;
  support: number;
  maintenance: number;
}

export type CostCategory = "ai" | "usage" | "infra" | "people" | "fees";
export const COST_CATEGORIES: CostCategory[] = ["ai", "usage", "infra", "people", "fees"];

export interface AiBreakdown {
  interactions: number;
  inputTokens: number; // total, after overhead
  outputTokens: number;
  uncachedInputCost: number;
  cacheReadCost: number;
  cacheWriteCost: number;
  outputCost: number;
  total: number;
  /** What the same traffic would cost with no caching, routing or batching. */
  listTotal: number;
}
