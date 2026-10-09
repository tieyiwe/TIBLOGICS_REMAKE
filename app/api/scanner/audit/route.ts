import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { scanErrorText } from "@/lib/scanner/i18n";
import { runPublicScan } from "@/lib/scanner/lead";
import { isScannerStaff } from "@/lib/scanner/staff";
import { buildView } from "@/lib/scanner/view";
import { startReportCheckout } from "@/lib/scanner/checkout";
import { freeScans, reportPrice, siteKey } from "@/lib/scanner/config";
import { formatMoney } from "@/lib/blueprint/config";
import { scanErrorCode, writeScanLog, type ScanOutcome } from "@/lib/analytics/scan-log";

// The website scanner (the /tools/scanner page and the home page quick scan).
//
//   POST { url }                     scan; answers the free view and the report token
//   POST { url, rescanToken }        the re-scan included with a paid report
//   POST { url, purchase: true }     over the free limit: scan and go straight to checkout
//
// Measured, scored and saved here in one request (lib/scanner/lead.ts). Over
// the free limit (2 scans of a site per 30 days) it answers 402 with the
// options. Nothing is fabricated and no host is special-cased.

export const maxDuration = 60;

const Body = z.object({
  url: z.string().trim().min(1).max(500),
  rescanToken: z.string().max(80).nullish(),
  purchase: z.boolean().optional(),
  /** The page the scan was started from (home quick scan, /tools/scanner, a report). */
  from: z.string().max(300).nullish(),
});

// Rate-limited attempts are logged too, but only the first few per address an
// hour, so a flood cannot turn the log itself into the thing being flooded.
const limitedLogged = new Map<string, { n: number; until: number }>();
function logLimited(ip: string): boolean {
  const now = Date.now();
  const e = limitedLogged.get(ip);
  if (!e || e.until < now) {
    if (limitedLogged.size > 5_000) limitedLogged.clear();
    limitedLogged.set(ip, { n: 1, until: now + 3_600_000 });
    return true;
  }
  return ++e.n <= 3;
}

export async function POST(req: NextRequest) {
  const locale = await getLocale();
  const t = translatorFor(locale);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  // Every attempt goes to the scan log (lib/analytics/scan-log.ts), after the
  // response so it never slows the scan down.
  const headers = new Headers(req.headers);
  const log = (o: { url: string; outcome: ScanOutcome; domain?: string | null; errorCode?: string | null; leadId?: string | null; from?: string | null; staff?: boolean }) =>
    after(() => writeScanLog({ ...o, locale, headers }));
  if (!(await checkRateLimit(`scanner-audit:${ip}`, 20, 3_600_000))) {
    if (logLimited(ip)) log({ url: "(rate limited)", outcome: "error", errorCode: "rate_limited" });
    return NextResponse.json({ error: t("tools.api.rateLimit") }, { status: 429 });
  }
  const raw = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    const typed = raw && typeof raw === "object" && typeof (raw as { url?: unknown }).url === "string" ? (raw as { url: string }).url : "";
    log({ url: typed, outcome: "invalid", errorCode: "bad_request" });
    return NextResponse.json({ error: t("tools.api.urlRequired") }, { status: 400 });
  }
  const { url, rescanToken, purchase, from } = parsed.data;
  if (purchase && !reportPrice()) {
    log({ url, outcome: "error", domain: siteKey(url), errorCode: "not_on_sale", from });
    return NextResponse.json({ error: t("tools.sr.err.notOnSale") }, { status: 503 });
  }

  const staff = await isScannerStaff();
  const result = await runPublicScan({ url, locale, staff, rescanToken, purchase }).catch((err) => {
    log({ url, outcome: "error", domain: siteKey(url), errorCode: "exception", from, staff });
    throw err;
  });
  if (result.kind === "ok") {
    const l = result.lead;
    const held = !!(l.extra as { held?: boolean } | null)?.held;
    log({ url: l.url, outcome: l.parentId ? "rescan" : held ? "held" : "ok", domain: l.domain, leadId: l.id, from, staff });
  } else if (result.kind === "limit") {
    log({ url, outcome: "limit", domain: result.domain, errorCode: "free_limit", from, staff });
  } else {
    const code = scanErrorCode(result.error);
    log({ url, outcome: code.invalid ? "invalid" : "error", domain: siteKey(url), errorCode: code.code, from, staff });
  }

  if (result.kind === "limit") {
    const price = reportPrice();
    return NextResponse.json(
      {
        error: t("tools.sr.limit.title", { n: freeScans(), domain: result.domain }),
        code: "limit",
        domain: result.domain,
        resetAt: result.resetAt,
        price: price ? formatMoney(price, locale) : null,
      },
      { status: 402 },
    );
  }
  if (result.kind === "error") {
    const error =
      result.error === "invalid" ? t("tools.api.urlRequired")
      : result.error === "rescan-other-site" ? t("tools.sr.err.rescanOther")
      : scanErrorText(t, result.error);
    return NextResponse.json({ error }, { status: result.status });
  }

  const lead = result.lead;
  // A paid report's re-scan is unlocked from the start: finish it now.
  if (lead.parentId && lead.unlockedAt) {
    void import("@/lib/scanner/report").then((m) => m.finishReport(lead.id)).catch((err) => console.error("[scanner] rescan report", err));
  }
  if (purchase && !lead.parentId && !lead.unlockedAt && !staff) {
    const checkout = await startReportCheckout(lead, locale, req.headers.get("cookie"));
    if (!checkout.ok) return NextResponse.json({ error: t(checkout.error) }, { status: 502 });
    return NextResponse.json({ token: lead.token, checkoutUrl: checkout.url });
  }

  const view = await buildView(lead, t, locale, { staff });
  // The home page quick scan reads the scores and the top problems from the
  // top level, as before.
  return NextResponse.json({
    token: lead.token,
    view,
    url: lead.url,
    overallScore: lead.overallScore,
    seoScore: lead.seoScore,
    perfScore: lead.perfScore,
    uxScore: lead.uxScore,
    aiScore: lead.aiScore,
    findings: view.top,
  });
}
