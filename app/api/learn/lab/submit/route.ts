import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { labUnlocked } from "@/lib/learn/progress";
import { denyTrack, requireEntitledStudent } from "@/lib/learn/session";
import { trackOfLab } from "@/lib/learn/track-of";
import { checkRateLimit } from "@/lib/require-admin";
import { withinDailyAiBudget } from "@/lib/learn/ai-budget";
import { awardPoints, getTotalPoints } from "@/lib/learn/points";
import { checkLevelUp } from "@/lib/learn/milestones";
import type { LabEvaluation } from "@/lib/learn/labs/types";
import { evaluateBuild, evaluateCritique, evaluatePrompt, evaluateWorkbench } from "@/lib/learn/labs/evaluate";
import { evaluateCode, MAX_CODE } from "@/lib/learn/labs/code";
import { getLocale, getT, translatorFor } from "@/lib/i18n/server";
import { localizeLab } from "@/lib/i18n/sources/labs";
import { gameDelta, gameSnapshot } from "@/lib/learn/badges";
import { awardSkillBadgesSafe } from "@/lib/learn/skill-badges/engine";
import { deleteDrafts } from "@/lib/learn/drafts/server";

export const maxDuration = 120;

const Body = z.object({
  labId: z.string().min(1),
  // prompt labs
  prompt: z.string().max(8000).optional(),
  // critique labs
  selections: z.array(z.string()).max(50).optional(),
  // build labs
  checked: z.array(z.string()).max(50).optional(),
  artifactUrl: z.string().max(500).nullable().optional(),
  reflection: z.string().max(10000).nullable().optional(),
  // workbench labs: fieldId -> the learner's work
  answers: z.record(z.string().max(60), z.string().max(6000)).optional(),
  // code labs
  code: z.string().max(MAX_CODE).optional(),
  checkResults: z.array(z.object({ id: z.string().max(80), pass: z.boolean(), message: z.string().max(400).optional() })).max(30).optional(),
  commits: z.array(z.object({ message: z.string().max(200), at: z.string().max(40) })).max(60).optional(),
});

export async function POST(req: NextRequest) {
  const { error, student, access } = await requireEntitledStudent();
  if (error) return error;
  const locale = await getLocale();
  const t = translatorFor(locale);

  if (!(await checkRateLimit(`lab-submit:${student.id}`, 30, 3_600_000))) {
    return NextResponse.json({ error: t("labs.api.submitRate") }, { status: 429 });
  }
  if (!(await withinDailyAiBudget(student.id))) {
    return NextResponse.json({ error: (await getT())("common.aiDailyLimit") }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: t("labs.api.invalid") }, { status: 400 });
  }
  const { labId, prompt, selections, checked, artifactUrl, reflection, answers, code, checkResults, commits } = parsed.data;
  const labTrack = await trackOfLab(labId);
  if (!labTrack) return NextResponse.json({ error: t("labs.api.labNotFound") }, { status: 404 });
  const denied = await denyTrack(access, labTrack);
  if (denied) return denied;
  // A module's lab opens once the module's lessons are done.
  if (!(await labUnlocked(student.id, labId))) {
    return NextResponse.json({ error: (await getT())("labs.api.finishLessonsFirst"), locked: true }, { status: 403 });
  }

  try {
    const lab = await prisma.lab.findUnique({ where: { id: labId } });
    if (!lab || !lab.isPublished) {
      return NextResponse.json({ error: t("labs.api.labNotFound") }, { status: 404 });
    }

    // Graded against the lab as the learner saw it: same ids, answer flags and
    // check code as the stored config (only texts differ), so the score cannot
    // depend on the language. Feedback, labels and the revealed flaw
    // explanations come out in the learner's language.
    const shown = await localizeLab(lab, locale);
    const objectives = shown.objectives;
    const config = shown.config;

    const attempt = await prisma.labAttempt.findFirst({
      where: { studentId: student.id, labId, status: "in_progress" },
      orderBy: { createdAt: "desc" },
    });

    let evaluation: LabEvaluation;
    let submission: Record<string, unknown>;

    // The same work sent again (same answers, same language) gets the grade it
    // already had: the AI grader is not called a second time for it.
    // Key order is not kept by the database (jsonb), so compare canonically.
    const canon = (v: unknown): unknown =>
      Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon((v as Record<string, unknown>)[k])])) : v;
    const sameAs = (a: unknown, b: unknown) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
    const lastGraded = async (sub: Record<string, unknown>): Promise<LabEvaluation | null> => {
      const prev = await prisma.labAttempt
        .findFirst({
          where: { studentId: student.id, labId, status: "submitted", score: { not: null } },
          orderBy: { createdAt: "desc" },
          select: { submission: true, score: true, passed: true, feedbackMd: true, breakdown: true },
        })
        .catch(() => null);
      if (!prev || prev.score == null || !prev.feedbackMd || !sameAs(prev.submission, sub)) return null;
      return { score: prev.score, passed: !!prev.passed, feedbackMd: prev.feedbackMd, breakdown: prev.breakdown } as unknown as LabEvaluation;
    };

    if (config.kind === "critique") {
      const picked = selections ?? [];
      submission = { selections: picked };
      evaluation = evaluateCritique(config, picked, objectives, lab.passScore, t);
    } else if (config.kind === "build") {
      const steps = checked ?? [];
      submission = { checked: steps, artifactUrl: artifactUrl ?? null, reflection: reflection ?? null };
      if (config.requireArtifact && !artifactUrl?.trim()) {
        return NextResponse.json({ error: t("labs.api.needLink") }, { status: 400 });
      }
      evaluation = evaluateBuild(
        config,
        steps,
        artifactUrl ?? null,
        reflection ?? null,
        objectives,
        lab.passScore,
        t,
      );
    } else if (config.kind === "code") {
      if (!code?.trim()) return NextResponse.json({ error: t("labs.api.noCode") }, { status: 400 });
      const work: Record<string, string> = {};
      for (const f of config.fields ?? []) work[f.id] = (answers?.[f.id] ?? "").trim();
      const missing = (config.fields ?? []).filter((f) => !work[f.id]);
      if (missing.length) {
        return NextResponse.json({ error: t("labs.api.missingWritten", { list: missing.map((f) => f.label).join(", ") }) }, { status: 400 });
      }
      const transcript = Array.isArray(attempt?.transcript) ? (attempt!.transcript as Array<{ prompt?: string }>) : [];
      submission = { code, checkResults: checkResults ?? [], commits: commits ?? [], answers: work, requests: transcript.length, lang: locale };
      evaluation = (await lastGraded(submission)) ?? await evaluateCode({
        brief: lab.briefMd,
        config,
        code,
        checks: checkResults ?? [],
        commits: commits ?? [],
        requests: transcript.map((t) => String(t.prompt ?? "")),
        answers: work,
        objectives,
        passScore: lab.passScore,
        locale,
      });
    } else if (config.kind === "workbench") {
      // Only the lab's own fields are kept, so a crafted request cannot smuggle
      // extra text into what the grader reads.
      const work: Record<string, string> = {};
      for (const f of config.fields) work[f.id] = (answers?.[f.id] ?? "").trim();
      const empty = config.fields.filter((f) => !work[f.id]);
      if (empty.length > 0) {
        return NextResponse.json(
          { error: t("labs.api.missingParts", { list: empty.map((f) => f.label).join(", ") }) },
          { status: 400 },
        );
      }
      submission = { answers: work, lang: locale };
      evaluation = (await lastGraded(submission)) ?? await evaluateWorkbench(lab.briefMd, lab.scenarioMd, config, work, objectives, lab.passScore, locale);
    } else {
      // Prompt lab — grade the latest prompt against the response it produced
      const text = (prompt ?? (attempt?.submission as { prompt?: string } | null)?.prompt ?? "").trim();
      if (!text) {
        return NextResponse.json({ error: t("labs.api.needPrompt") }, { status: 400 });
      }
      const transcript = Array.isArray(attempt?.transcript)
        ? (attempt.transcript as Array<{ prompt: string; response: string }>)
        : [];
      // Prefer the response for this exact prompt; otherwise the most recent run
      const matching = [...transcript].reverse().find((t) => t.prompt.trim() === text);
      const lastResponse = matching?.response ?? transcript[transcript.length - 1]?.response ?? "";

      submission = { prompt: text };
      evaluation = await evaluatePrompt(
        lab.briefMd,
        config,
        text,
        lastResponse,
        objectives,
        lab.passScore,
        locale,
      );
    }

    const data = {
      status: "submitted",
      submission: submission as unknown as Prisma.InputJsonValue,
      score: evaluation.score,
      passed: evaluation.passed,
      feedbackMd: evaluation.feedbackMd,
      breakdown: evaluation.breakdown as unknown as Prisma.InputJsonValue,
    };

    // Badges read passed attempts, so the "before" badge set must be taken
    // before this attempt is saved. Only a first pass can change it.
    const firstPass =
      evaluation.passed &&
      !(await prisma.pointsLedger
        .findFirst({ where: { studentId: student.id, source: "lab_pass", refId: lab.id }, select: { id: true } })
        .catch(() => null));
    const before = firstPass ? await gameSnapshot(student.id) : null;

    const saved = attempt
      ? await prisma.labAttempt.update({ where: { id: attempt.id }, data })
      : await prisma.labAttempt.create({
          data: { studentId: student.id, labId, ...data },
        });

    // The work is submitted: its autosaved drafts are no longer needed.
    await deleteDrafts(student.id, [`lab:${lab.id}`, `code:${lab.id}`]).catch((err) =>
      console.error("[lab/submit] clear drafts", err),
    );

    // Points on first pass only — the ledger keeps this idempotent, so a
    // retake for practice never double-awards.
    let pointsAwarded = 0;
    let game = gameDelta(null, null);
    if (evaluation.passed) {
      const totalBefore = await getTotalPoints(student.id);
      pointsAwarded = await awardPoints(student.id, "lab_pass", lab.id, lab.points);
      if (pointsAwarded > 0) {
        checkLevelUp(student.id, totalBefore, totalBefore + pointsAwarded);
        game = gameDelta(before, await gameSnapshot(student.id));
      }
      // Verified skill badges (module mastery, cross-track skills). Idempotent.
      await awardSkillBadgesSafe(student.id);
    }

    return NextResponse.json({
      ok: true,
      attemptId: saved.id,
      score: evaluation.score,
      passed: evaluation.passed,
      passScore: lab.passScore,
      feedbackMd: evaluation.feedbackMd,
      breakdown: evaluation.breakdown,
      pointsAwarded,
      newBadges: game.newBadges,
      levelUp: game.levelUp,
      // Critique labs reveal the full answer key after submission
      flaws: config.kind === "critique" ? config.flaws : undefined,
    });
  } catch (err) {
    console.error("[POST /api/learn/lab/submit]", err);
    return NextResponse.json({ error: t("labs.api.scoreFailed") }, { status: 500 });
  }
}
