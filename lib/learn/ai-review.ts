// AI capstone pre-review (Part E4).
//
// This produces a DRAFT for the human reviewer only. It is stored in
// aiPrereviewMd, never surfaced to the learner, and never sets a score or a
// status. A person still decides — the model just does the first read.
import prisma from "@/lib/prisma";
import { streamChat } from "@/lib/claude";

interface RubricRow {
  criterion: string;
  weight: number;
  description?: string;
}

const SYSTEM = `You are assisting a human reviewer at TIBLOGICS, a practical AI education company.

You are writing an INTERNAL DRAFT pre-review of a learner's capstone submission. A human reviewer will read your draft, form their own judgement, and write the actual feedback the learner sees. Your draft is never shown to the learner.

Your job is to save the reviewer time, not to replace them. Be specific and evidence-based:
- Quote or reference concrete parts of the submission rather than speaking in generalities.
- For each rubric criterion, note what the evidence supports and what is missing.
- Flag anything you genuinely cannot assess (for example, a link you cannot open, or work that must be run to be judged). Say so plainly rather than guessing.
- Suggest an indicative score per criterion, but frame it as a suggestion for the reviewer to confirm or overturn.

Be direct about weaknesses — a reviewer who trusts a soft draft does the learner no favours. Equally, do not manufacture criticism where the work is genuinely good.

Format as markdown with a short overall summary, then a section per rubric criterion, then a list of specific questions the reviewer may want to probe.`;

export async function generateCapstonePreReview(submissionId: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const submission = await prisma.capstoneSubmission
    .findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        submissionUrl: true,
        submissionMd: true,
        capstone: {
          select: {
            briefMd: true,
            rubric: true,
            passThreshold: true,
            track: { select: { title: true, level: true } },
          },
        },
      },
    })
    .catch(() => null);

  if (!submission) return null;

  const rubric: RubricRow[] = Array.isArray(submission.capstone.rubric)
    ? (submission.capstone.rubric as unknown as RubricRow[])
    : [];

  const rubricText =
    rubric.length > 0
      ? rubric.map((r) => `- ${r.criterion} (${r.weight}%)${r.description ? `: ${r.description}` : ""}`).join("\n")
      : "(No structured rubric on file — assess against the brief.)";

  const prompt = `TRACK: ${submission.capstone.track.title} (${submission.capstone.track.level} level)
PASS THRESHOLD: ${submission.capstone.passThreshold}%

=== CAPSTONE BRIEF ===
${submission.capstone.briefMd}

=== RUBRIC ===
${rubricText}

=== LEARNER SUBMISSION ===
${submission.submissionUrl ? `Link provided: ${submission.submissionUrl}\n(You cannot open links. Note explicitly that the linked artefact needs human review.)\n` : ""}
${submission.submissionMd ? `Written submission:\n${submission.submissionMd}` : "(No written submission — the link is the whole submission.)"}

Write the internal draft pre-review now.`;

  try {
    const text = await streamChat([{ role: "user", content: prompt }], SYSTEM, 2000);

    await prisma.capstoneSubmission.update({
      where: { id: submissionId },
      data: { aiPrereviewMd: text },
    });
    return text;
  } catch (err) {
    console.error("[ai-review] generation failed", err);
    return null;
  }
}
