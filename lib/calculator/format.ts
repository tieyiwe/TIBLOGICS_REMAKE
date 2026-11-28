// Locale-aware number and money formatting. All amounts are US dollars
// because the provider prices are published in dollars.

export interface Formatters {
  /** Whole dollars for big amounts, cents for small ones, more for tiny ones. */
  money: (n: number) => string;
  /** Always whole dollars. */
  money0: (n: number) => string;
  /** Always at least cents, up to 4 decimals for sub-cent values. */
  moneyPrecise: (n: number) => string;
  num: (n: number, maxFractionDigits?: number) => string;
  compact: (n: number) => string;
  pct: (n: number) => string;
  month: (isoDate: string) => string;
}

export function makeFormatters(locale: string): Formatters {
  const cache = new Map<string, Intl.NumberFormat>();
  const nf = (opts: Intl.NumberFormatOptions) => {
    const key = JSON.stringify(opts);
    let f = cache.get(key);
    if (!f) {
      f = new Intl.NumberFormat(locale, opts);
      cache.set(key, f);
    }
    return f;
  };
  const usd = (min: number, max: number) =>
    nf({ style: "currency", currency: "USD", minimumFractionDigits: min, maximumFractionDigits: max });

  const fix = (n: number) => (Number.isFinite(n) ? n : 0);

  return {
    money: (n) => {
      n = fix(n);
      const a = Math.abs(n);
      if (a === 0) return usd(0, 0).format(0);
      if (a < 0.01) return usd(2, 4).format(n);
      // Whole amounts (a $19 price, a $50 rate) read better without cents.
      if (a < 100 && Math.abs(n * 100 - Math.round(n) * 100) >= 0.5) return usd(2, 2).format(n);
      return usd(0, 0).format(n);
    },
    money0: (n) => usd(0, 0).format(fix(n)),
    moneyPrecise: (n) => {
      n = fix(n);
      const a = Math.abs(n);
      if (a > 0 && a < 0.01) return usd(2, 5).format(n);
      if (a < 1) return usd(2, 4).format(n);
      return usd(2, 2).format(n);
    },
    num: (n, max = 0) => nf({ maximumFractionDigits: max }).format(fix(n)),
    compact: (n) => nf({ notation: "compact", maximumFractionDigits: 1 }).format(fix(n)),
    pct: (n) => nf({ style: "percent", maximumFractionDigits: 0 }).format(fix(n) / 100),
    month: (iso) => {
      try {
        return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
      } catch {
        return iso;
      }
    },
  };
}
