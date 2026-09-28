import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireToolkit } from "@/lib/toolkit/guard-request";
import { runsUsed } from "@/lib/toolkit/access";
import { deepReview, ModelDeclinedError } from "@/lib/toolkit/ai";
import { scanText, dedupe } from "@/lib/toolkit/guard/scan";
import { MAX_TEXT } from "@/lib/toolkit/config";
import { VERTICAL_LABELS, type Vertical } from "@/lib/toolkit/guard/rules";

// Compliance Guard on any text. The rule check is instant and unmetered; a
// deep check adds the model's review and counts as one run.

export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const gate = await requireToolkit();
  if (gate.error) return gate.error;
  const { student, plan } = gate.access;

  if (!(await checkRateLimit(`toolkit-check:${student.id}`, 60, 60_000))) {
    return NextResponse.json({ error: "Slow down a little. Try again in a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text : "";
  if (!text.trim()) return NextResponse.json({ error: "Paste the text to check" }, { status: 400 });
  if (text.length > MAX_TEXT) return NextResponse.json({ error: `Checks are limited to ${MAX_TEXT.toLocaleString()} characters` }, { status: 400 });
  const vertical = (typeof body.vertical === "string" && body.vertical in VERTICAL_LABELS ? body.vertical : "general") as Vertical;
  const deep = body.deep === true;

  let findings = scanText(text, vertical);
  let usage = { inputTokens: 0, outputTokens: 0 };
  let runsLeft: number | null = null;

  if (deep) {
    const used = await runsUsed(student.id);
    if (used >= plan!.monthlyRuns) {
      return NextResponse.json({ error: `You've used all ${plan!.monthlyRuns} deep checks for this month. The instant check still works.` }, { status: 429 });
    }
    const profile = await prisma.toolkitProfile.findUnique({ where: { studentId: student.id } });
    try {
      const review = await deepReview(text, vertical, profile);
      findings = dedupe([...findings, ...review.findings]);
      usage = review.usage;
    } catch (err) {
      if (err instanceof ModelDeclinedError) {
        return NextResponse.json({ error: "The AI declined to review this text." }, { status: 422 });
      }
      console.error("[toolkit/check]", err instanceof Error ? err.message : err);
      return NextResponse.json({ error: "The deep check failed. The instant check results are below.", findings }, { status: 502 });
    }
    runsLeft = Math.max(0, plan!.monthlyRuns - used - 1);
  }

  await prisma.toolkitRun.create({
    data: {
      studentId: student.id,
      kind: deep ? "deep-check" : "check",
      title: `${deep ? "Deep check" : "Check"} · ${VERTICAL_LABELS[vertical]}`,
      input: text,
      output: "",
      findings: JSON.parse(JSON.stringify(findings)),
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    },
  });

  return NextResponse.json({ findings, runsLeft });
}
