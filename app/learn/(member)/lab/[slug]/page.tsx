import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import LabRunner, { type LabView } from "@/components/learn/LabRunner";
import { parseConfig, parseObjectives, type LabType } from "@/lib/learn/labs/types";

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

  const config = parseConfig(lab.labType, lab.config);

  // Build the client view WITHOUT answer keys — planted-flaw explanations and
  // which candidates are flaws never leave the server until after submission.
  const view: LabView = {
    id: lab.id,
    slug: lab.slug,
    title: lab.title,
    labType: lab.labType as LabType,
    briefMd: lab.briefMd,
    scenarioMd: lab.scenarioMd,
    objectives: parseObjectives(lab.objectives),
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
    ...(config.kind === "build"
      ? {
          steps: config.steps,
          requireArtifact: config.requireArtifact,
          artifactLabel: config.artifactLabel,
        }
      : {}),
  };

  return (
    <LabRunner
      lab={view}
      trackSlug={lab.track.slug}
      accentColor={lab.track.accentColor}
      priorAttempt={
        attempt
          ? {
              status: attempt.status,
              score: attempt.score,
              passed: attempt.passed,
              feedbackMd: attempt.feedbackMd,
              breakdown: Array.isArray(attempt.breakdown)
                ? (attempt.breakdown as unknown as BreakdownRow[])
                : null,
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
