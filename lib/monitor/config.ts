// Readiness Monitor: what is sold, and how often it scans.
//
// The price is deliberately not in code. Until MONITOR_PRICE_CENTS is set the
// product is not on sale: the page takes waitlist sign-ups and checkout
// refuses, so nothing can be sold at a placeholder price.
//
//   MONITOR_PRICE_CENTS      monthly price in cents, e.g. 9900 for $99
//   STRIPE_MONITOR_PRICE_ID  optional pre-created Stripe Price; when absent the
//                            checkout sends the amount inline

export const MONITOR_PRODUCT = "readiness-monitor";

/** How many competitor sites one subscription can track. */
export const MAX_COMPETITORS = 3;

/** Days between scheduled rescans. */
export const SCAN_INTERVAL_DAYS = 7;

/** A subscriber can trigger an extra rescan this often. */
export const MANUAL_RUN_COOLDOWN_HOURS = 24;

/** A run that started this long ago and never finished is treated as dead. */
export const STALE_RUN_MINUTES = 15;

export interface MonitorPricing {
  amount: number;
  currency: "USD";
  interval: "month";
  priceId?: string;
}

export function monitorPricing(): MonitorPricing | null {
  const cents = Number(process.env.MONITOR_PRICE_CENTS);
  if (!Number.isInteger(cents) || cents < 100) return null;
  return {
    amount: cents,
    currency: "USD",
    interval: "month",
    priceId: process.env.STRIPE_MONITOR_PRICE_ID || undefined,
  };
}

export function formatMonitorPrice(p: MonitorPricing): string {
  const v = p.amount / 100;
  return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}`;
}
