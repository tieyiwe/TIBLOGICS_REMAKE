import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireToolkit } from "@/lib/toolkit/guard-request";
import { runsUsed } from "@/lib/toolkit/access";
import { getPrompt } from "@/lib/toolkit/library";
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

  if (!(await checkRateLimit(`toolkit-run:${student.id}`, 20, 60_000))) {
    return NextResponse.json({ error: "Slow down a little. Try again in a minute." }, { status: 429 });
  }
  const used = await runsUsed(student.id);
  if (used >= plan!.monthlyRuns) {
    return NextResponse.json({ error: `You've used all ${plan!.monthlyRuns} runs for this month. They reset on the 1st.` }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const prompt = typeof body?.promptId === "string" ? getPrompt(body.promptId) : null;
  if (!prompt) return NextResponse.json({ error: "Choose a prompt" }, { status: 400 });

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
    result = await generate(prompt, fields, extra, profile);
  } catch (err) {
    if (err instanceof ModelDeclinedError) {
      return NextResponse.json({ error: "The AI declined this one. Try rewording your notes." }, { status: 422 });
    }
    console.error("[toolkit/generate]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
  }

  // The rules check follows the prompt's industry, not the profile's, so a
  // realtor prompt is screened for Fair Housing whatever the profile says.
  const findings = scanText(result.text, prompt.vertical as Vertical);

  const run = await prisma.toolkitRun.create({
    data: {
      studentId: student.id,
      kind: "generate",
      promptId: prompt.id,
      title: prompt.title,
      input: JSON.stringify({ fields, extra }),
      output: result.text,
      findings: JSON.parse(JSON.stringify(findings)),
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
    },
  });

  return NextResponse.json({ id: run.id, output: result.text, findings, runsLeft: Math.max(0, plan!.monthlyRuns - used - 1) });
}
