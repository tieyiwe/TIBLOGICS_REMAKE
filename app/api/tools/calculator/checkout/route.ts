import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { startPlanCheckout, crossSite } from "@/lib/calculator/plan";

// POST { email? } -> { url }: Stripe checkout for the calculator's Full Plan.
// The price comes from server configuration, never the request.

const Body = z.object({ email: z.string().trim().max(254).email().optional().or(z.literal("")) });

export async function POST(req: NextRequest) {
  if (crossSite(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const locale = await getLocale();
  const t = translatorFor(locale);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`calc-checkout:${ip}`, 10, 3_600_000))) {
    return NextResponse.json({ error: t("tools.api.tooManyAttempts") }, { status: 429 });
  }
  const body = Body.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: t("calculator.plan.errEmail") }, { status: 400 });
  const r = await startPlanCheckout({ email: body.data.email || null, locale });
  if (!r.ok) {
    const key = r.error === "notOnSale" ? "calculator.plan.errNotOnSale" : r.error === "paymentsOff" ? "tools.api.paymentsOff" : "tools.api.checkoutFailed";
    return NextResponse.json({ error: t(key) }, { status: r.error === "failed" ? 502 : 503 });
  }
  return NextResponse.json({ url: r.url });
}
