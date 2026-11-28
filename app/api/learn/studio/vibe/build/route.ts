import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEntitledStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { withinDailyAiBudget } from "@/lib/learn/ai-budget";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { ClaudeRefusal, isAiBudgetError } from "@/lib/claude";
import { youthAiFor } from "@/lib/learn/youth-ai";
import { ageBand, getYouthProfile } from "@/lib/learn/youth-account";
import { cleanFreeText } from "@/lib/learn/youth-text";
import { runBuild, VIBE_CHALLENGES } from "@/lib/learn/vibe/ai";
import { VIBE_MAX_CODE, VIBE_MAX_REQUEST } from "@/lib/learn/vibe/safety";
import { aiLeftToday, denyVibeAi } from "@/lib/learn/vibe/server";

// Vibe Code Studio (AI-Empowered Youth): the young person describes what they
// want and the AI returns the whole app, which they review before applying.
// The learner's own session only (no student id in the body); their words go
// through the same filter as messages adults send to a child (no links,
// contact details or rude words); the output is vetted (no network, nothing
// loaded from elsewhere, no personal-data fields) before it is shown.
// Bounded by an hourly limit, the minors' daily AI cap and max_tokens.
// Neither the request nor the code is ever logged.
export const maxDuration = 90;

const Body = z.object({
  challenge: z.enum(VIBE_CHALLENGES),
  code: z.string().max(VIBE_MAX_CODE),
  request: z.string().trim().min(3).max(VIBE_MAX_REQUEST),
});

const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const { error, student, access } = await requireEntitledStudent();
  if (error) return error;
  const locale = await getLocale();
  const t = translatorFor(locale);
  if (!(await checkRateLimit(`vibe-build:${student.id}`, 20, 3_600_000))) {
    return NextResponse.json({ error: t("studio.vibe-code-studio.api.slowDown"), code: "rate" }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    const key = field === "code" ? "tooBig" : field === "request" ? "describeMore" : "invalid";
    return NextResponse.json({ error: t(`studio.vibe-code-studio.api.${key}`) }, { status: 400 });
  }
  const denied = await denyVibeAi(student.id, access, t);
  if (denied) return denied;
  // Personal data, links and rude words never reach the model.
  const request = cleanFreeText(parsed.data.request, VIBE_MAX_REQUEST, 3);
  if (!request) {
    return NextResponse.json({ error: t("studio.vibe-code-studio.api.private"), code: "private" }, { status: 422 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: t("studio.vibe-code-studio.api.off"), code: "off" }, { status: 503 });
  }
  if (!(await withinDailyAiBudget(student.id))) {
    return NextResponse.json({ error: t("common.aiDailyLimit"), code: "daily", aiLeft: 0 }, { status: 429 });
  }

  try {
    const [profile, youth] = await Promise.all([getYouthProfile(student.id), youthAiFor(student.id)]);
    const out = await runBuild({
      code: parsed.data.code,
      request,
      band: ageBand(profile),
      locale,
      challenge: parsed.data.challenge,
      youth,
      studentId: student.id,
    });
    return NextResponse.json({ ok: true, ...out, aiLeft: await aiLeftToday(student.id) }, { headers: noStore });
  } catch (err) {
    // The message only: never the request or the code.
    console.error("[POST /api/learn/studio/vibe/build]", err instanceof Error ? err.message : "error");
    if (err instanceof ClaudeRefusal) {
      return NextResponse.json({ error: t("studio.vibe-code-studio.api.refused"), code: "refused" }, { status: 422 });
    }
    if (isAiBudgetError(err)) return NextResponse.json({ error: t("studio.vibe-code-studio.api.off"), code: "ai_budget" }, { status: 503 });
    return NextResponse.json({ error: t("studio.vibe-code-studio.api.failed") }, { status: 502 });
  }
}
