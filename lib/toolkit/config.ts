// Toolkit Live and Compliance Guard: plans, prices and monthly allowances.
//
// Prices are not in code. A plan is on sale only when its price is set:
//   TOOLKIT_PRICE_CENTS   Toolkit Live (prompt library + Compliance Guard), monthly
//   GUARD_PRICE_CENTS     Compliance Guard on its own, monthly
//   STRIPE_TOOLKIT_PRICE_ID / STRIPE_GUARD_PRICE_ID   optional pre-created Stripe prices
//
// Allowances bound what one subscriber can spend on the model each month.
// Every generation and every deep check is one run; the instant rule check is
// free and not counted.
//   TOOLKIT_MONTHLY_RUNS  default 300
//   GUARD_MONTHLY_RUNS    default 300

export const TOOLKIT_PRODUCT = "toolkit-live";

export type ToolkitPlan = "toolkit" | "guard";

export interface PlanInfo {
  id: ToolkitPlan;
  name: string;
  blurb: string;
  amount: number | null;
  priceId?: string;
  monthlyRuns: number;
  /** Whether the prompt library and generation are included. */
  generate: boolean;
}

function cents(v: string | undefined): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n >= 100 ? n : null;
}

function runs(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function toolkitPlans(): Record<ToolkitPlan, PlanInfo> {
  return {
    toolkit: {
      id: "toolkit",
      name: "Toolkit Live",
      blurb: "Every prompt from our industry toolkits, filled in with your business details, with Compliance Guard checking every draft.",
      amount: cents(process.env.TOOLKIT_PRICE_CENTS),
      priceId: process.env.STRIPE_TOOLKIT_PRICE_ID || undefined,
      monthlyRuns: runs(process.env.TOOLKIT_MONTHLY_RUNS, 300),
      generate: true,
    },
    guard: {
      id: "guard",
      name: "Compliance Guard",
      blurb: "Paste any draft, from any tool, and see the phrases that can get your business in trouble before it goes out.",
      amount: cents(process.env.GUARD_PRICE_CENTS),
      priceId: process.env.STRIPE_GUARD_PRICE_ID || undefined,
      monthlyRuns: runs(process.env.GUARD_MONTHLY_RUNS, 300),
      generate: false,
    },
  };
}

export function formatPrice(amount: number): string {
  const v = amount / 100;
  return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}`;
}

/** Longest input accepted for a check or an extra instruction. */
export const MAX_TEXT = 12_000;
