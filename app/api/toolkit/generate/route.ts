import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireToolkit } from "@/lib/toolkit/guard-request";
import { runsUsed } from "@/lib/toolkit/access";
import { getPrompt } from "@/lib/toolkit/library";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { localizedPrompt } from "@/lib/i18n/sources/toolkit";
import { generate, ModelDeclinedError, type Profile } from "@/lib/toolkit/ai";
import { scanText } from "@/lib/toolkit/guard/scan";
import { MAX_TEXT } from "@/lib/toolkit/config";
import type { Vertical } from "@/lib/toolkit/guard/rules";

// Runs a library prompt for the subscriber's business, then checks the draft
// with Compliance Guard's rules before returning it.

export const maxDuration = 120;

const EMPTY_PROFILE: Profile = { businessName: "", vertical: "general", location: "", audience: "", offer: "", voice: "", differentiators: "", compliance: "" };

export async function POST(req: NextRequest) {
  const gate = await requireToolkit({ generate: true });
  if (gate.error) return gate.error;
  const { student, plan } = gate.access;
  const locale = await getLocale();
  const t = translatorFor(locale);

  if (!(await checkRateLimit(`toolkit-run:${student.id}`, 20, 60_000))) {
    return NextResponse.json({ error: t("toolkit.api.slowDown") }, { status: 429 });
  }
  const used = await runsUsed(student.id);
  if (used >= plan!.monthlyRuns) {
    return NextResponse.json({ error: t("toolkit.api.runsLimit", { n: plan!.monthlyRuns }) }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const english = typeof body?.promptId === "string" ? getPrompt(body.promptId) : null;
  if (!english) return NextResponse.json({ error: t("toolkit.api.choosePrompt") }, { status: 400 });
  // The prompt as the user saw it: translated, unless the client says it had
  // the English version (its category was still being translated), so the
  // filled-in fields match the placeholders in the text used.
  const prompt = body.english === true ? english : ((await localizedPrompt(english.id, locale))?.prompt ?? english);

  const fields: Record<string, string> = {};
  if (body.fields && typeof body.fields === "object") {
    for (const f of prompt.fields) {
      const v = body.fields[f];
      if (typeof v === "string" && v.trim()) fields[f] = v.slice(0, 4000);
    }
  }
  const extra = typeof body.extra === "string" ? body.extra.slice(0, MAX_TEXT) : "";

  const profileRow = await prisma.toolkitProfile.findUnique({ where: { studentId: student.id } });
  const profile: Profile = profileRow ?? EMPTY_PROFILE;

  let result;
  try {
    // The draft is written in the visitor's language whichever prompt version was used.
    result = await generate(prompt, fields, extra, profile, locale);
  } catch (err) {
    if (err instanceof ModelDeclinedError) {
      return NextResponse.json({ error: t("toolkit.api.declinedGen") }, { status: 422 });
    }
    console.error("[toolkit/generate]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: t("toolkit.api.genFailed") }, { status: 502 });
  }

  // The rules check follows the prompt's industry, not the profile's, so a
  // realtor prompt is screened for Fair Housing whatever the profile says.
  const findings = scanText(result.text, prompt.vertical as Vertical);

  const run = await prisma.toolkitRun.create({
    data: {
      studentId: student.id,
      kind: "generate",
      promptId: prompt.id,
      // History titles are stored in English and shown translated (app/toolkit/page.tsx).
      title: english.title,
      input: JSON.stringify({ fields, extra }),
      output: result.text,
      findings: JSON.parse(JSON.stringify(findings)),
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
    },
  });

  return NextResponse.json({ id: run.id, output: result.text, findings, runsLeft: Math.max(0, plan!.monthlyRuns - used - 1) });
}
