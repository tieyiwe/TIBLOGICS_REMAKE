import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { scanErrorText } from "@/lib/scanner/i18n";
import { runPublicScan } from "@/lib/scanner/lead";
import { isScannerStaff } from "@/lib/scanner/staff";
import { buildView } from "@/lib/scanner/view";
import { startReportCheckout } from "@/lib/scanner/checkout";
import { freeScans, reportPrice } from "@/lib/scanner/config";
import { formatMoney } from "@/lib/blueprint/config";

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
});

export async function POST(req: NextRequest) {
  const locale = await getLocale();
  const t = translatorFor(locale);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`scanner-audit:${ip}`, 20, 3_600_000))) {
    return NextResponse.json({ error: t("tools.api.rateLimit") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: t("tools.api.urlRequired") }, { status: 400 });
  }
  const { url, rescanToken, purchase } = parsed.data;
  if (purchase && !reportPrice()) return NextResponse.json({ error: t("tools.sr.err.notOnSale") }, { status: 503 });

  const staff = await isScannerStaff();
  const result = await runPublicScan({ url, locale, staff, rescanToken, purchase });

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
  // A paid report's re-scan is unlocked from the start: write it now.
  if (lead.parentId && lead.unlockedAt) {
    void import("@/lib/scanner/report").then((m) => m.writeReport(lead.id)).catch((err) => console.error("[scanner] rescan report", err));
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
