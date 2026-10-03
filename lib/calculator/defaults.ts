import type { BuildFeature, Inputs, RunFeature } from "./types";

// Starting values. Every running-cost figure here is a rough, small-scale
// placeholder for the visitor to replace with real quotes, and the UI says so.
// None of them is a claim about any vendor's price.

const noRunFeatures: Record<RunFeature, boolean> = { rag: false, voice: false, images: false, messaging: false, files: false };

const noBuildFeatures: Record<BuildFeature, boolean> = {
  accounts: false,
  chatUi: false,
  rag: false,
  voice: false,
  images: false,
  messaging: false,
  files: false,
  agentTools: false,
  integrations: false,
  payments: false,
  admin: false,
  multilingual: false,
  mobileApp: false,
};

export const DEFAULT_INPUTS: Inputs = {
  users: 1000,
  interactionsPerUser: 30,
  inputTokens: 2000,
  outputTokens: 400,
  cacheablePct: 50,
  cacheWritePct: 10,
  model: "claude-sonnet-5",
  customName: "",
  customInput: 0,
  customOutput: 0,
  customCacheRead: 0,
  routePct: 0,
  routeModel: "claude-haiku-4-5",
  batchPct: 0,
  overheadPct: 10,

  features: { ...noRunFeatures },
  embedDocTokensM: 5,
  embedQueryTokens: 50,
  embedPrice: 0.1,
  voiceMinutesPerUser: 10,
  sttPerMin: 0.01,
  ttsPerMin: 0.03,
  imagesPerUser: 10,
  imagePrice: 0.04,
  messagesPerUser: 30,
  messagePrice: 0.01,
  storageGbPerUser: 0.5,
  storagePerGb: 0.03,

  hosting: 50,
  database: 25,
  vectorDb: 50,
  monitoring: 20,
  auth: 25,
  emailsPerUser: 4,
  emailPer1000: 1,
  paymentPct: 3,
  supportHours: 10,
  supportRate: 25,
  maintenanceHours: 10,
  maintenanceRate: 50,

  scope: "mvp",
  buildFeatures: { ...noBuildFeatures, accounts: true, chatUi: true, admin: true },
  hourlyRate: 50,
  designPct: 15,
  qaPct: 20,
  securityReview: true,
  securityHours: 16,
  complianceCost: 0,
  contingencyPct: 20,

  pricingMode: "per_user",
  price: 15,
  usersPerAccount: 10,
  payingPct: 100,
  targetMarginPct: 70,
  heavyUserMultiplier: 5,

  scenarioUsers: [1, 10, 50],
  scenarioFixed: [1, 2, 4],
};

export function cloneInputs(i: Inputs): Inputs {
  return {
    ...i,
    features: { ...i.features },
    buildFeatures: { ...i.buildFeatures },
    scenarioUsers: [...i.scenarioUsers] as Inputs["scenarioUsers"],
    scenarioFixed: [...i.scenarioFixed] as Inputs["scenarioFixed"],
  };
}

export { noBuildFeatures, noRunFeatures };
