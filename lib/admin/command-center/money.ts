// Money formatting and conversion. Safe on client and server.
//
// Amounts are integer minor units ("cents") in the entry's currency, also
// for XOF (which has no minor unit: 1000 XOF is stored as 100000), so every
// currency goes through the same arithmetic. The USD equivalent is
// round(amount x fxRate), where fxRate is USD per 1 unit of the currency.

export function toUsdCents(amountCents: number, fxRate: number): number {
  return Math.round(amountCents * fxRate);
}

export function fmtUsd(cents: number, opts: { compact?: boolean; sign?: boolean } = {}): string {
  const v = cents / 100;
  const s = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: opts.compact && Math.abs(v) >= 10_000 ? "compact" : "standard",
    minimumFractionDigits: opts.compact ? 0 : 2,
    maximumFractionDigits: opts.compact ? (Math.abs(v) >= 10_000 ? 1 : 0) : 2,
  }).format(v);
  return opts.sign && cents > 0 ? `+${s}` : s;
}

export function fmtMoney(cents: number, currency: string): string {
  const digits = currency === "XOF" ? 0 : 2;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(digits)} ${currency}`;
  }
}

/** "1,234.56" / "$1234" / "1234,5" to minor units; null when unreadable. */
export function parseAmount(input: string | number): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? Math.round(input * 100) : null;
  let s = input.trim().replace(/[$€\s]|USD|CAD|EUR|XOF|CFA/gi, "");
  if (!s) return null;
  // A single comma followed by 1-2 digits is a decimal comma.
  if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(",", ".");
  s = s.replace(/,/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

export function pct(part: number, whole: number): number | null {
  if (!whole) return null;
  return (part / whole) * 100;
}

/** % change from prev to cur, null when prev is 0. */
export function delta(cur: number, prev: number): number | null {
  if (!prev) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

/** "2026-10" for a date (UTC). */
export function monthKey(d: Date): string {
  return d.toISOString().slice(0, 7);
}

export function monthStartUtc(key: string): Date {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

export function addMonthKey(key: string, n: number): string {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(Date.UTC(y, m - 1 + n, 1)));
}

export function monthLabel(key: string, short = false): string {
  return monthStartUtc(key).toLocaleDateString("en-US", { month: short ? "short" : "long", year: short ? "2-digit" : "numeric", timeZone: "UTC" });
}

export function isMonthKey(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}
