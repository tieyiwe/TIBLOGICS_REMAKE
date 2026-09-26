// Lab evaluators. One per lab type, all returning LabEvaluation.
//
// Critique and build labs are scored deterministically — no model call, so
// they work with ANTHROPIC_API_KEY unset and cost nothing to grade.
// Prompt labs use a model to coach, and degrade to a deterministic heuristic
// if the key is missing or the call fails, rather than blocking the learner.
import { streamChat } from "@/lib/claude";
import {
  weightedScore,
  type CritiqueLabConfig,
  type BuildLabConfig,
  type LabEvaluation,
  type LabObjective,
  type ObjectiveResult,
  type PromptLabConfig,
} from "./types";

// ── Critique ────────────────────────────────────────────────────────────────
/**
 * Scored on both catching the planted flaws AND not flagging correct
 * statements. Precision matters as much as recall — a learner who flags
 * everything hasn't demonstrated judgement.
 */
export function evaluateCritique(
  config: CritiqueLabConfig,
  selectedIds: string[],
  objectives: LabObjective[],
  passScore: number,
): LabEvaluation {
  const selected = new Set(selectedIds);
  const flawCandidates = config.candidates.filter((c) => c.isFlaw);
  const cleanCandidates = config.candidates.filter((c) => !c.isFlaw);

  const caught = flawCandidates.filter((c) => selected.has(c.id));
  const missed = flawCandidates.filter((c) => !selected.has(c.id));
  const falsePositives = cleanCandidates.filter((c) => selected.has(c.id));

  const recall = flawCandidates.length === 0 ? 1 : caught.length / flawCandidates.length;
  // Penalise over-flagging proportionally to how many clean statements exist
  const precisionPenalty =
    cleanCandidates.length === 0 ? 0 : falsePositives.length / cleanCandidates.length;
  const raw = Math.max(0, recall - precisionPenalty * 0.5);
  const score = Math.round(raw * 100);

  const breakdown: ObjectiveResult[] = [
    {
      objectiveId: objectives[0]?.id ?? "recall",
      label: objectives[0]?.label ?? "Identified the problems",
      met: recall >= 0.7,
      score: Math.round(recall * 100),
      comment: `You caught ${caught.length} of ${flawCandidates.length} planted problems.`,
    },
    {
      objectiveId: objectives[1]?.id ?? "precision",
      label: objectives[1]?.label ?? "Didn't over-flag",
      met: falsePositives.length === 0,
      score: Math.round((1 - precisionPenalty) * 100),
      comment:
        falsePositives.length === 0
          ? "You didn't flag anything that was actually fine — good judgement."
          : `You flagged ${falsePositives.length} statement${falsePositives.length === 1 ? "" : "s"} that were actually accurate.`,
    },
  ];

  const lines: string[] = [];

  if (caught.length > 0) {
    lines.push("## What you caught\n");
    for (const c of caught) {
      const flaw = config.flaws.find((f) => f.id === c.flawId);
      lines.push(`- **${c.text}**  \n  ${flaw?.explanation ?? "Correctly identified."}`);
    }
    lines.push("");
  }

  if (missed.length > 0) {
    lines.push("## What you missed\n");
    for (const c of missed) {
      const flaw = config.flaws.find((f) => f.id === c.flawId);
      lines.push(
        `- **${c.text}**  \n  ${flaw?.explanation ?? "This was a planted problem."}` +
          (flaw ? `  \n  *Category: ${flaw.category}*` : ""),
      );
    }
    lines.push("");
  }

  if (falsePositives.length > 0) {
    lines.push("## Flagged but actually fine\n");
    for (const c of falsePositives) {
      lines.push(`- **${c.text}**  \n  This statement was accurate as written.`);
    }
    lines.push("");
    lines.push(
      "Over-flagging is its own failure mode. Treating everything as suspect is no more useful than trusting everything — the skill is telling them apart.",
    );
  }

  return { score, passed: score >= passScore, feedbackMd: lines.join("\n"), breakdown };
}

// ── Build ───────────────────────────────────────────────────────────────────
/**
 * Self-attested. We can't verify someone genuinely did a task in another
 * tool, and pretending otherwise would be dishonest — so this checks
 * completeness rather than correctness, and says so in the feedback.
 */
export function evaluateBuild(
  config: BuildLabConfig,
  checked: string[],
  artifactUrl: string | null,
  reflection: string | null,
  objectives: LabObjective[],
  passScore: number,
): LabEvaluation {
  const done = new Set(checked);
  const total = config.steps.length;
  const completed = config.steps.filter((s) => done.has(s.id)).length;
  const stepScore = total === 0 ? 100 : Math.round((completed / total) * 100);

  const hasArtifact = !!artifactUrl?.trim();
  const reflectionWords = (reflection ?? "").trim().split(/\s+/).filter(Boolean).length;
  const reflectionScore = reflectionWords >= 60 ? 100 : Math.round((reflectionWords / 60) * 100);

  const breakdown: ObjectiveResult[] = [
    {
      objectiveId: objectives[0]?.id ?? "steps",
      label: objectives[0]?.label ?? "Completed every step",
      met: completed === total,
      score: stepScore,
      comment: `${completed} of ${total} steps marked complete.`,
    },
    {
      objectiveId: objectives[1]?.id ?? "artifact",
      label: objectives[1]?.label ?? "Submitted your work",
      met: hasArtifact || !config.requireArtifact,
      score: hasArtifact || !config.requireArtifact ? 100 : 0,
      comment: hasArtifact ? "Artefact link provided." : "No link to your work provided.",
    },
    {
      objectiveId: objectives[2]?.id ?? "reflection",
      label: objectives[2]?.label ?? "Explained what happened",
      met: reflectionWords >= 60,
      score: reflectionScore,
      comment:
        reflectionWords >= 60
          ? "You described what you actually did."
          : `Your reflection is ${reflectionWords} words. Aim for at least 60 — the writing is where the learning consolidates.`,
    },
  ];

  const score = weightedScore(breakdown, objectives);

  return {
    score,
    passed: score >= passScore && (hasArtifact || !config.requireArtifact),
    feedbackMd:
      score >= passScore
        ? "Logged. This lab is self-attested — we're recording that you did the work, not marking its quality. If you cut corners, the only person affected is you.\n\nIf you'd like a person to look at what you produced, bring it to your capstone."
        : "Some parts are still outstanding. Check the breakdown above — nothing here is a judgement on quality, only on completeness.",
    breakdown,
  };
}

// ── Prompt ──────────────────────────────────────────────────────────────────

const COACH_SYSTEM = `You are a prompting coach for TIBLOGICS, a practical AI education company. You are grading a learner's PROMPT — not the model's output, and not the learner.

You will be given: the lab brief, the scoring objectives, the learner's prompt, and the response their prompt produced.

Grade the PROMPT against each objective. For every objective return a score from 0-100 and one specific sentence of comment that quotes or references the learner's actual wording. Generic praise is useless; so is generic criticism.

Rules:
- Judge the prompt, not the output quality. A good prompt that hit a model limitation still scores well.
- Partial credit is expected. Reserve 0 for objectives genuinely not attempted.
- Be direct about what is missing, and concrete about what would fix it.
- Never suggest the learner is bad at this. Point at the prompt, not the person.
- If the prompt is strong, say so plainly rather than inventing criticism.

Then write short overall feedback in markdown: what worked, the single highest-value change they could make, and why it would matter.

Respond with ONLY valid JSON, no code fence:
{"objectives":[{"objectiveId":"...","score":0-100,"comment":"..."}],"feedbackMd":"..."}`;

export async function evaluatePrompt(
  brief: string,
  config: PromptLabConfig,
  learnerPrompt: string,
  sandboxResponse: string,
  objectives: LabObjective[],
  passScore: number,
): Promise<LabEvaluation> {
  // No key, no prompt, or a failed call — fall back rather than block.
  if (!process.env.ANTHROPIC_API_KEY || !learnerPrompt.trim()) {
    return heuristicPromptEval(learnerPrompt, objectives, passScore);
  }

  const objectiveList = objectives
    .map((o) => `- id "${o.id}": ${o.label}${o.guidance ? ` — ${o.guidance}` : ""}`)
    .join("\n");

  const userMsg = `LAB BRIEF:
${brief}

${config.contextMd ? `CONTEXT THE LEARNER WAS GIVEN:\n${config.contextMd}\n` : ""}
OBJECTIVES TO GRADE AGAINST:
${objectiveList}

THE LEARNER'S PROMPT:
"""
${learnerPrompt}
"""

THE RESPONSE IT PRODUCED:
"""
${sandboxResponse.slice(0, 4000)}
"""

Grade the prompt now. JSON only.`;

  try {
    const raw = await streamChat([{ role: "user", content: userMsg }], COACH_SYSTEM, 1600);
    const parsed = extractJson(raw);
    if (!parsed) return heuristicPromptEval(learnerPrompt, objectives, passScore);

    const results: ObjectiveResult[] = objectives.map((o) => {
      const match = parsed.objectives?.find((x) => x.objectiveId === o.id);
      const score = clamp(Number(match?.score ?? 0));
      return {
        objectiveId: o.id,
        label: o.label,
        score,
        met: score >= 70,
        comment: String(match?.comment ?? "Not assessed."),
      };
    });

    const score = weightedScore(results, objectives);
    return {
      score,
      passed: score >= passScore,
      feedbackMd: String(parsed.feedbackMd ?? ""),
      breakdown: results,
    };
  } catch (err) {
    console.error("[labs] prompt evaluation failed, using heuristic", err);
    return heuristicPromptEval(learnerPrompt, objectives, passScore);
  }
}

/**
 * Deterministic fallback. Deliberately generous and clearly labelled: a
 * learner should never be penalised because our API key was missing.
 */
function heuristicPromptEval(
  prompt: string,
  objectives: LabObjective[],
  passScore: number,
): LabEvaluation {
  const text = prompt.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const base = words >= 60 ? 85 : words >= 25 ? 72 : words >= 10 ? 55 : 25;

  const results: ObjectiveResult[] = objectives.map((o) => ({
    objectiveId: o.id,
    label: o.label,
    score: base,
    met: base >= 70,
    comment: "Scored on length and effort only — detailed coaching was unavailable.",
  }));

  return {
    score: base,
    passed: base >= passScore,
    feedbackMd:
      "> **Coaching unavailable.** Detailed feedback couldn't be generated for this attempt, so this was scored on effort alone. Your work is saved — rerun the lab later for a proper critique.",
    breakdown: results,
  };
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

interface CoachJson {
  objectives?: Array<{ objectiveId?: string; score?: number; comment?: string }>;
  feedbackMd?: string;
}

/** Models sometimes wrap JSON in prose or a fence despite instructions. */
function extractJson(raw: string): CoachJson | null {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned) as CoachJson;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as CoachJson;
    } catch {
      return null;
    }
  }
}
