// Automation Blueprint: a one-time paid plan, credited against a build.
//
//   BLUEPRINT_PRICE_CENTS   the price, e.g. 29900 for $299. Unset = not on sale
//                           (the page takes waitlist sign-ups, checkout refuses).
//   BLUEPRINT_CREDIT_DAYS   how long the credit against an engagement lasts (default 90)

export const BLUEPRINT_PRODUCT = "automation-blueprint";
export const MAX_ATTEMPTS = 3;
/** A generation that started this long ago and never finished is treated as dead. */
export const STALE_GENERATION_MINUTES = 15;

export function blueprintPrice(): number | null {
  const n = Number(process.env.BLUEPRINT_PRICE_CENTS);
  return Number.isInteger(n) && n >= 100 ? n : null;
}

export function creditDays(): number {
  const n = Number(process.env.BLUEPRINT_CREDIT_DAYS);
  return Number.isInteger(n) && n > 0 ? n : 90;
}

export function formatMoney(cents: number): string {
  const v = cents / 100;
  return `$${v % 1 === 0 ? v.toLocaleString("en-US") : v.toFixed(2)}`;
}
