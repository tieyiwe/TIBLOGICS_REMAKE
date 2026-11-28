import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireToolkit } from "@/lib/toolkit/guard-request";
import { runsUsed } from "@/lib/toolkit/access";
import { deepReview, ModelDeclinedError } from "@/lib/toolkit/ai";
import { scanText, dedupe } from "@/lib/toolkit/guard/scan";
import { MAX_TEXT } from "@/lib/toolkit/config";
import { VERTICAL_LABELS, type Vertical } from "@/lib/toolkit/guard/rules";
import { getLocale, translatorFor } from "@/lib/i18n/server";

// Compliance Guard on any text. The rule check is instant and unmetered; a
// deep check adds the model's review and counts as one run.
//
// The phrase rules match English wording. The deep check reads any language
// and explains its findings in the visitor's language.

export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const gate = await requireToolkit();
  if (gate.error) return gate.error;
  const { student, plan } = gate.access;
  const locale = await getLocale();
  const t = translatorFor(locale);

  if (!(await checkRateLimit(`toolkit-check:${student.id}`, 60, 60_000))) {
    return NextResponse.json({ error: t("toolkit.api.slowDown") }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text : "";
  if (!text.trim()) return NextResponse.json({ error: t("toolkit.api.pasteText") }, { status: 400 });
  if (text.length > MAX_TEXT) return NextResponse.json({ error: t("toolkit.api.tooLong", { n: MAX_TEXT.toLocaleString(locale) }) }, { status: 400 });
  const vertical = (typeof body.vertical === "string" && body.vertical in VERTICAL_LABELS ? body.vertical : "general") as Vertical;
  const deep = body.deep === true;

  let findings = scanText(text, vertical);
  let usage = { inputTokens: 0, outputTokens: 0 };
  let runsLeft: number | null = null;

  if (deep) {
    const used = await runsUsed(student.id);
    if (used >= plan!.monthlyRuns) {
      return NextResponse.json({ error: t("toolkit.api.deepLimit", { n: plan!.monthlyRuns }) }, { status: 429 });
    }
    const profile = await prisma.toolkitProfile.findUnique({ where: { studentId: student.id } });
    try {
      const review = await deepReview(text, vertical, profile, locale);
      findings = dedupe([...findings, ...review.findings]);
      usage = review.usage;
    } catch (err) {
      if (err instanceof ModelDeclinedError) {
        return NextResponse.json({ error: t("toolkit.api.declinedReview") }, { status: 422 });
      }
      console.error("[toolkit/check]", err instanceof Error ? err.message : err);
      return NextResponse.json({ error: t("toolkit.api.deepFailed"), findings }, { status: 502 });
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
