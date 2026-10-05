import { NextRequest, NextResponse } from "next/server";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { leadByToken } from "@/lib/scanner/lead";
import { startReportCheckout } from "@/lib/scanner/checkout";

// Opens Stripe checkout for this scan's full report.

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const locale = await getLocale();
  const t = translatorFor(locale);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`scanner-checkout:${ip}`, 10, 3_600_000))) {
    return NextResponse.json({ error: t("tools.api.tooManyAttempts") }, { status: 429 });
  }
  const lead = await leadByToken((await params).token);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (lead.unlockedAt) return NextResponse.json({ error: t("tools.sr.err.alreadyUnlocked") }, { status: 409 });
  const checkout = await startReportCheckout(lead, locale, req.headers.get("cookie"));
  if (!checkout.ok) return NextResponse.json({ error: t(checkout.error) }, { status: 502 });
  return NextResponse.json({ url: checkout.url });
}
