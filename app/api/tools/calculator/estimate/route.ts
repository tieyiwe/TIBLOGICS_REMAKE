import { NextResponse } from "next/server";
import { z } from "zod";
import { isAiBudgetError, streamChat } from "@/lib/claude";
import { checkRateLimit } from "@/lib/rate-limit";
import { isLocale, replyInLanguage, DEFAULT_LOCALE } from "@/lib/i18n/config";
import { translatorFor } from "@/lib/i18n/server";
import { ESTIMATE_SYSTEM_PROMPT, estimatePrompt, parseEstimate } from "@/lib/calculator/ai";
import { withSuggestedPrice } from "@/lib/calculator/engine";

// "Describe your product" assistant for the AI Product Cost Calculator.
// POST { description, locale? } -> { inputs, rationale, summary }.
// The inputs are validated and clamped before they leave the server, and the
// page treats them as editable suggestions.

export const maxDuration = 60;

const Body = z.object({
  description: z.string().trim().min(10).max(1000),
  locale: z.string().optional(),
});

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    raw = null;
  }
  const localeRaw = (raw as { locale?: unknown } | null)?.locale;
  const locale = isLocale(localeRaw) ? localeRaw : DEFAULT_LOCALE;
  const t = translatorFor(locale);

  const body = Body.safeParse(raw);
  if (!body.success) {
    return NextResponse.json({ error: t("calculator.ai.errorShort"), code: "invalid" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: t("calculator.ai.errorUnavailable"), code: "unavailable" }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`calc-estimate:${ip}`, 10, 60 * 60 * 1000))) {
    return NextResponse.json({ error: t("calculator.ai.errorRate"), code: "rate" }, { status: 429 });
  }

  const system = [ESTIMATE_SYSTEM_PROMPT, replyInLanguage(locale) && `Write the "summary" and "rationale" texts in the visitor's language. ${replyInLanguage(locale)} Keep the JSON keys and enum values in English.`]
    .filter(Boolean)
    .join("\n\n");

  try {
    const text = await streamChat([{ role: "user", content: estimatePrompt(body.data.description) }], system, 2000, "estimate");
    const estimate = parseEstimate(text);
    if (!estimate) {
      console.error("[calculator/estimate] unparseable reply", text.slice(0, 300));
      return NextResponse.json({ error: t("calculator.ai.errorParse"), code: "parse" }, { status: 502 });
    }
    return NextResponse.json({
      inputs: withSuggestedPrice(estimate.inputs),
      rationale: estimate.rationale,
      summary: estimate.summary,
    });
  } catch (err) {
    console.error("[calculator/estimate]", err instanceof Error ? err.message : err);
    if (isAiBudgetError(err)) return NextResponse.json({ error: t("calculator.ai.errorUnavailable"), code: "ai_budget" }, { status: 503 });
    return NextResponse.json({ error: t("calculator.ai.errorFailed"), code: "failed" }, { status: 502 });
  }
}
