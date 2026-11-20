import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { recommend } from "@/lib/recommendations-rules";
import { getLocale, translatorFor } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const locale = await getLocale();
  const t = translatorFor(locale);
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await checkRateLimit(`recommendations:${ip}`, 30, 3_600_000))) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { context } = await req.json();
    if (!context) {
      return NextResponse.json({ error: "Context required" }, { status: 400 });
    }

    // Rule-based since the cost review: no model call (see lib/recommendations-rules.ts).
    // SmartRecommendations now runs the same rules in the browser.
    const recommendations = recommend(typeof context === "object" ? context : {}, t);
    return NextResponse.json(recommendations);
  } catch (err) {
    console.error("Recommendation engine error:", err);
    // Return sensible fallback recommendations
    return NextResponse.json({
      headline: t("pages.recs.fallback.headline"),
      reason: t("pages.recs.fallback.reason"),
      recommendations: [
        { type: "tool", name: t("pages.recs.fallback.scanner"), tagline: t("pages.recs.fallback.scannerTagline"), href: "/tools/scanner", priority: 1 },
        { type: "tool", name: t("pages.recs.fallback.advisor"), tagline: t("pages.recs.fallback.advisorTagline"), href: "/tools/advisor", priority: 2 },
        { type: "session", name: t("pages.recs.fallback.discovery"), tagline: t("pages.recs.fallback.discoveryTagline"), href: "/book", priority: 3 },
      ],
    });
  }
}
