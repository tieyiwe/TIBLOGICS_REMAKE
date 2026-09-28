import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import LabRunner, { type LabView } from "@/components/learn/LabRunner";
import { type LabType } from "@/lib/learn/labs/types";
import { evaluateBuild, evaluateCritique } from "@/lib/learn/labs/evaluate";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { localizeLab } from "@/lib/i18n/sources/labs";

export const dynamic = "force-dynamic";

interface BreakdownRow {
  objectiveId: string;
  label: string;
  met: boolean;
  score: number;
  comment: string;
}

export default async function LabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  const lab = await prisma.lab
    .findUnique({
      where: { slug },
      include: { track: { select: { slug: true, accentColor: true } } },
    })
    .catch(() => null);

  if (!lab || !lab.isPublished) notFound();

  const attempt = await prisma.labAttempt
    .findFirst({
      where: { studentId: student.id, labId: lab.id },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => null);

  // Texts in the learner's language (English plus `pending` until translated).
  // Ids, answer flags and check code are exactly the stored ones.
  const locale = await getLocale();
  const t = translatorFor(locale);
  const shown = await localizeLab(lab, locale);
  const config = shown.config;

  // Build the client view WITHOUT answer keys — planted-flaw explanations and
  // which candidates are flaws never leave the server until after submission.
  const view: LabView = {
    id: lab.id,
    slug: lab.slug,
    title: shown.title,
    labType: lab.labType as LabType,
    briefMd: shown.briefMd,
    scenarioMd: shown.scenarioMd,
    // Grader guidance is for the model, not the learner.
    objectives: shown.objectives.map((o) => ({ id: o.id, label: o.label, weight: o.weight })),
    passScore: lab.passScore,
    points: lab.points,
    estimatedMinutes: lab.estimatedMinutes,
    ...(config.kind === "prompt"
      ? {
          starterPrompt: config.starterPrompt,
          maxRuns: config.maxRuns,
          contextMd: config.contextMd,
        }
      : {}),
    ...(config.kind === "critique"
      ? {
          answerMd: config.answerMd,
          // isFlaw and flawId are stripped
          candidates: config.candidates.map((c) => ({ id: c.id, text: c.text })),
        }
      : {}),
    ...(config.kind === "workbench" ? { fields: config.fields } : {}),
    ...(config.kind === "code"
      ? { starterCode: config.starterCode, checks: config.checks, fields: config.fields ?? [], maxRuns: config.maxRuns }
      : {}),
    ...(config.kind === "build"
      ? {
          steps: config.steps,
          requireArtifact: config.requireArtifact,
          artifactLabel: config.artifactLabel,
        }
      : {}),
  };

  // Critique and build labs are scored without a model, so a submitted
  // attempt's feedback is rebuilt in the current language. The stored score
  // and pass stand as they are.
  let feedbackMd = attempt?.feedbackMd ?? null;
  let breakdown: BreakdownRow[] | null =
    attempt && Array.isArray(attempt.breakdown) ? (attempt.breakdown as unknown as BreakdownRow[]) : null;
  if (attempt?.status === "submitted" && attempt.score != null) {
    const sub = (attempt.submission ?? {}) as Record<string, unknown>;
    const again =
      config.kind === "critique" && Array.isArray(sub.selections)
        ? evaluateCritique(config, sub.selections as string[], shown.objectives, lab.passScore, t)
        : config.kind === "build" && Array.isArray(sub.checked)
          ? evaluateBuild(
              config,
              sub.checked as string[],
              (sub.artifactUrl as string | null) ?? null,
              (sub.reflection as string | null) ?? null,
              shown.objectives,
              lab.passScore,
              t,
            )
          : null;
    if (again) {
      feedbackMd = again.feedbackMd;
      breakdown = again.breakdown;
    }
  }

  return (
    <LabRunner
      pending={shown.pending}
      lab={view}
      trackSlug={lab.track.slug}
      accentColor={lab.track.accentColor}
      priorAttempt={
        attempt
          ? {
              status: attempt.status,
              score: attempt.score,
              passed: attempt.passed,
              feedbackMd,
              breakdown,
              submission: (attempt.submission ?? {}) as Record<string, unknown>,
              transcript: Array.isArray(attempt.transcript)
                ? (attempt.transcript as Array<{ prompt: string; response: string }>)
                : [],
              runCount: attempt.runCount,
            }
          : null
      }
    />
  );
}
