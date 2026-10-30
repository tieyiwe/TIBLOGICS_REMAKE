// Website scanner: free scans, the paid full report and its limits.
//
//   SCANNER_REPORT_PRICE_CENTS   price of the full report (default 2900 = $29;
//                                "0" takes it off sale: only a booked call unlocks)
//   SCANNER_FREE_SCANS           free scans of one site per 30 days (default 2)
//   SCANNER_CALL_UNLOCKS_PER_DAY reports unlocked by booking a call, per day
//                                across the site (default 20; each one costs a
//                                model call)
//   GOOGLE_PAGESPEED_API_KEY     optional: Google PageSpeed (mobile) in the full report

export const SCANNER_PRODUCT = "scanner-report";
export const LIMIT_WINDOW_DAYS = 30;
export const RESCAN_DAYS = 30;
export const MAX_COMPETITORS = 3;

export function reportPrice(): number | null {
  const raw = process.env.SCANNER_REPORT_PRICE_CENTS;
  if (raw === undefined || raw === "") return 2900;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 100 ? n : null;
}

export function freeScans(): number {
  const n = Number(process.env.SCANNER_FREE_SCANS);
  return Number.isInteger(n) && n >= 1 ? n : 2;
}

export function callUnlocksPerDay(): number {
  const n = Number(process.env.SCANNER_CALL_UNLOCKS_PER_DAY);
  return Number.isInteger(n) && n >= 0 ? n : 20;
}

/**
 * The site's key for the free-scan limit: the lower-case host without "www."
 * or a trailing dot. Paths, ports, schemes and query strings are ignored, so
 * example.com/a and https://www.example.com/b are the same site.
 */
export function siteKey(raw: string): string | null {
  let v = raw.trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try {
    const host = new URL(v).hostname.toLowerCase().replace(/\.+$/, "").replace(/^www\./, "");
    return host && host.length <= 253 ? host : null;
  } catch {
    return null;
  }
}
