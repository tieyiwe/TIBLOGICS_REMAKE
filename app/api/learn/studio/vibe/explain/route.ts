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
import { hasBadWords } from "@/lib/learn/youth-text";
import { runExplain, VIBE_CHALLENGES } from "@/lib/learn/vibe/ai";
import { VIBE_MAX_CODE, VIBE_MAX_SELECTION } from "@/lib/learn/vibe/safety";
import { aiLeftToday, denyVibeAi } from "@/lib/learn/vibe/server";

// Vibe Code Studio: "Explain this code", for the selected part or the whole
// app. Shorter and simpler for Explorer (10 to 13), deeper for Builder. Same
// guards as the build route: own session, CSRF, hourly limit, the minors'
// daily AI cap, the child-safety addendum, nothing logged.
export const maxDuration = 60;

const Body = z.object({
  challenge: z.enum(VIBE_CHALLENGES),
  code: z.string().max(VIBE_MAX_CODE),
  selection: z.string().max(VIBE_MAX_SELECTION).optional(),
});

const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const { error, student, access } = await requireEntitledStudent();
  if (error) return error;
  const locale = await getLocale();
  const t = translatorFor(locale);
  if (!(await checkRateLimit(`vibe-explain:${student.id}`, 30, 3_600_000))) {
    return NextResponse.json({ error: t("studio.vibe-code-studio.api.slowDown"), code: "rate" }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return NextResponse.json({ error: t(`studio.vibe-code-studio.api.${field === "code" || field === "selection" ? "tooBig" : "invalid"}`) }, { status: 400 });
  }
  const part = (parsed.data.selection ?? "").trim();
  const code = part || parsed.data.code.trim();
  if (code.length < 2) return NextResponse.json({ error: t("studio.vibe-code-studio.api.nothing") }, { status: 400 });
  if (hasBadWords(code)) return NextResponse.json({ error: t("studio.vibe-code-studio.api.private"), code: "private" }, { status: 422 });
  const denied = await denyVibeAi(student.id, access, t);
  if (denied) return denied;
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: t("studio.vibe-code-studio.api.off"), code: "off" }, { status: 503 });
  }
  if (!(await withinDailyAiBudget(student.id))) {
    return NextResponse.json({ error: t("common.aiDailyLimit"), code: "daily", aiLeft: 0 }, { status: 429 });
  }

  try {
    const [profile, youth] = await Promise.all([getYouthProfile(student.id), youthAiFor(student.id)]);
    const text = await runExplain({
      code,
      part: !!part,
      band: ageBand(profile),
      locale,
      youth,
      studentId: student.id,
      challenge: parsed.data.challenge,
    });
    if (!text) return NextResponse.json({ error: t("studio.vibe-code-studio.api.failed") }, { status: 502 });
    return NextResponse.json({ ok: true, text, aiLeft: await aiLeftToday(student.id) }, { headers: noStore });
  } catch (err) {
    console.error("[POST /api/learn/studio/vibe/explain]", err instanceof Error ? err.message : "error");
    if (err instanceof ClaudeRefusal) {
      return NextResponse.json({ error: t("studio.vibe-code-studio.api.refused"), code: "refused" }, { status: 422 });
    }
    if (isAiBudgetError(err)) return NextResponse.json({ error: t("studio.vibe-code-studio.api.off"), code: "ai_budget" }, { status: 503 });
    return NextResponse.json({ error: t("studio.vibe-code-studio.api.failed") }, { status: 502 });
  }
}
