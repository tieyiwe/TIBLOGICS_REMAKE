// Payment provider interface. All Learn billing goes through this so a
// migration (Stripe → Helcim) touches one adapter, never components.

/**
 * "annual" is no longer sold. It stays here so existing annual subscribers
 * keep syncing (webhook) and count in revenue until their period ends.
 */
export type PlanId = "monthly" | "annual";

export interface PlanDefinition {
  id: PlanId;
  label: string;
  /** Amount in cents for the currently active pricing tier. */
  amount: number;
  currency: string;
  interval: "month" | "year";
  /** Standard (non-founding) amount, for strike-through display. */
  compareAtAmount?: number;
  blurb: string;
}

export interface CheckoutRequest {
  plan: PlanId;
  studentId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}

/** One-time purchase of one track: lifetime access to it. */
export interface TrackCheckoutRequest {
  studentId: string;
  email: string;
  trackId: string;
  trackTitle: string;
  /** Cents, from lib/learn/pricing.ts. Never from the client. */
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentProvider {
  readonly name: string;
  /** Plans to display and sell. */
  listPlans(): PlanDefinition[];
  /** Create a hosted checkout session; returns the URL to redirect to. */
  createCheckout(req: CheckoutRequest): Promise<{ url: string }>;
  /** Hosted one-time checkout for a single track. */
  createTrackCheckout(req: TrackCheckoutRequest): Promise<{ url: string }>;
  /** Hosted billing/self-service portal for an existing customer. */
  createBillingPortal(customerId: string, returnUrl: string): Promise<{ url: string }>;
}

// ── Pricing (Part E1) ───────────────────────────────────────────────────────
// FOUNDING_PRICING=true sells the founding rate; flipping the flag changes
// the price everywhere it appears. All tracks: $89/month. The annual plan is
// retired (kept only for existing subscribers, see PlanId). One-track prices
// are in lib/learn/pricing.ts.
export const FOUNDING_PRICING = process.env.FOUNDING_PRICING === "true";

export const PLANS: Record<PlanId, PlanDefinition> = {
  monthly: {
    id: "monthly",
    label: "Monthly",
    amount: FOUNDING_PRICING ? 4900 : 8900,
    compareAtAmount: FOUNDING_PRICING ? 8900 : undefined,
    currency: "USD",
    interval: "month",
    blurb: "Every track, all assessments, certificates. Cancel anytime.",
  },
  // Retired: not offered to new buyers. Legacy amount, for revenue reporting.
  annual: {
    id: "annual",
    label: "Annual",
    amount: FOUNDING_PRICING ? 47000 : 79000,
    compareAtAmount: FOUNDING_PRICING ? 79000 : undefined,
    currency: "USD",
    interval: "year",
    blurb: "Everything in Monthly — two months free.",
  },
};

export function formatPlanPrice(p: PlanDefinition): string {
  const v = p.amount / 100;
  return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}`;
}
