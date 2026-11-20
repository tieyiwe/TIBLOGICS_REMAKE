// Engineering hours behind the build estimate (engine.ts buildEstimate).
// Starting assumptions for a small, experienced team; every one is shown and
// editable in the page's build section.

import type { BuildFeature, Scope } from "./types";

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

