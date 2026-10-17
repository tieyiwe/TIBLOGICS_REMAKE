import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { withinDailyAiBudget } from "@/lib/learn/ai-budget";
import { ClaudeRefusal, isAiBudgetError } from "@/lib/claude";
import { getLocale } from "@/lib/i18n/server";
import { forgeGuard } from "@/lib/learn/game-forge/guard";
import { ForgeAiError, aiChange, aiCharacter } from "@/lib/learn/game-forge/ai";
import { parseConfig } from "@/lib/learn/game-forge/schema";
import { gameTextProblem, tidyGameText } from "@/lib/learn/game-forge/filter";

// Game Forge "Talk to change it" and "AI character". The game is sent with
// the request (nothing is saved here): the answer is a validated new config
// for the kid to preview, then Apply (a PUT on the project) or Undo.
// Limits: per learner per hour and per day, the shared daily AI allowance
// (lower for minors), the platform AI budget, capped output tokens.
// Neither the request text nor the model's answer is logged.
export const maxDuration = 60;

const Body = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("change"), config: z.unknown(), request: z.string().min(1).max(300) }).strict(),
  z.object({ mode: z.literal("character"), config: z.unknown(), npc: z.number().int().min(0).max(3), idea: z.string().min(1).max(200) }).strict(),
]);

export async function POST(req: NextRequest) {
  const { error, studentId, t } = await forgeGuard(req, { write: true });
  if (error) return error;
  if (!(await checkRateLimit(`gf-ai-h:${studentId}`, 40, 3_600_000)) || !(await checkRateLimit(`gf-ai-d:${studentId}`, 120, 86_400_000))) {
    return NextResponse.json({ error: t("studio.game-forge.api.slowDown"), code: "rate" }, { status: 429 });
  }
  const body = Body.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  const cfg = parseConfig(body.data.config);
  if (!cfg.ok) return NextResponse.json({ error: t("studio.game-forge.api.invalid"), issues: cfg.issues }, { status: 422 });

  const text = tidyGameText(body.data.mode === "change" ? body.data.request : body.data.idea, 300);
  if (!text) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  // Unkind words, links or contact details never reach the model.
  if (gameTextProblem(text)) return NextResponse.json({ error: t("studio.game-forge.api.unkind"), code: "filtered" }, { status: 422 });
  if (body.data.mode === "character") {
    const c = cfg.config;
    if (c.template !== "adventure" || !c.npcs[body.data.npc]) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: t("studio.game-forge.api.aiOff"), code: "ai_off" }, { status: 503 });
  if (!(await withinDailyAiBudget(studentId))) return NextResponse.json({ error: t("common.aiDailyLimit"), code: "daily" }, { status: 429 });

  try {
    const locale = await getLocale();
    if (body.data.mode === "change") {
      const r = await aiChange({ studentId, locale, config: cfg.config, request: text });
      return NextResponse.json({ config: r.config, say: r.say, changed: r.changed });
    }
    const c = cfg.config;
    if (c.template !== "adventure") return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
    const r = await aiCharacter({ studentId, locale, config: c, npc: body.data.npc, idea: text });
    return NextResponse.json({ config: r.config, say: r.say, changed: true });
  } catch (err) {
    if (err instanceof ForgeAiError || err instanceof ClaudeRefusal) {
      return NextResponse.json({ error: t("studio.game-forge.api.aiMuddle"), code: "ai_invalid" }, { status: 422 });
    }
    if (isAiBudgetError(err)) return NextResponse.json({ error: t("studio.game-forge.api.aiOff"), code: "ai_off" }, { status: 503 });
    // The error only: never the request or the reply.
    console.error("[game-forge] ai", err instanceof Error ? err.name : "error");
    return NextResponse.json({ error: t("studio.game-forge.api.aiError"), code: "ai_error" }, { status: 502 });
  }
}
