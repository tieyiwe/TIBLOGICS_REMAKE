import { z } from "zod";
import { streamChat } from "@/lib/claude";
import { SECTION_KINDS, type VideoScript } from "./shared";

// Drafts a 3-5 minute lesson video script with a shot list from the lesson
// itself (admin only). The model returns JSON; it is validated here and the
// owner edits it before recording.

const str = (max: number) => z.string().trim().max(max);

export const ScriptSchema = z.object({
  title: str(200).min(2),
  targetMinutes: z.coerce.number().min(1).max(15),
  notes: str(4000).default(""),
  sections: z
    .array(
      z.object({
        kind: z.enum(SECTION_KINDS),
        heading: str(160).min(1),
        narration: str(6000).min(1),
        shots: z.array(str(500)).max(20).default([]),
        broll: z.array(str(500)).max(20).default([]),
        onScreenText: z.array(str(200)).max(20).default([]),
      }),
    )
    .min(2)
    .max(12),
});

/** Validate a script from the editor or the model. */
export function readScript(v: unknown): VideoScript | null {
  const r = ScriptSchema.safeParse(v);
  return r.success ? (r.data as VideoScript) : null;
}

export const SCRIPT_SYSTEM = `You are a video script writer for TIBLOGICS Learn, an online school that teaches working adults to use AI in their jobs. You turn one written lesson into a short explainer video script that the course owner will record themselves: talking to camera, plus a screen recording.

Rules:
- Length: 3 to 5 minutes spoken, about 450 to 700 words of narration in total at 150 words a minute.
- Structure, in this order:
  1. "hook": one section, 15 to 25 seconds. Open with the problem or payoff the learner cares about. No greetings like "Hi everyone".
  2. "point": three or four sections, one key idea each, taken from the lesson. Concrete and practical.
  3. "walkthrough": one section that walks through the lesson's "Try it now" task as a screen recording, step by step, saying what you click and type and what to look for in the result. If the lesson has no such task, walk through the most practical example in the lesson.
  4. "recap": one section, three short takeaways.
  5. "cta": one section, 10 to 20 seconds, telling the learner to do the Try it now task on the lesson page, then the quick check.
- Match the lesson exactly. Use only facts, tools, steps and examples that are in the lesson. Never invent statistics, studies, percentages, prices, quotes or product features. If the lesson gives a number, you may repeat it; otherwise do not use numbers as evidence.
- Write in UK English (organise, colour, programme where appropriate), in a warm, plain, spoken style: short sentences, "you", contractions are fine.
- Plain punctuation only: no em dashes, no en dashes as punctuation, no ellipses for effect, no emoji, no hashtags. Use commas, full stops and colons.
- Narration is exactly what the presenter says aloud. Do not put stage directions in the narration.
- "shots": what the viewer sees during the section, as short instructions to the owner (for example "Talking head, medium shot" or "Screen: open ChatGPT, paste the prompt from the lesson"). For the walkthrough, list each screen step in order.
- "broll": optional cutaways or screen captures that would help (for example "Close-up of the finished email draft"). Keep them achievable by one person with a laptop and a phone. No stock footage of people unless it is generic.
- "onScreenText": short text overlays, at most 8 words each.
- "notes": practical setup notes for recording (what to have open, sample text to prepare, accounts to be signed in to). No production jargon.

Return ONLY a JSON object, no Markdown fences, with this shape:
{"title": string, "targetMinutes": number, "notes": string, "sections": [{"kind": "hook"|"point"|"walkthrough"|"recap"|"cta", "heading": string, "narration": string, "shots": string[], "broll": string[], "onScreenText": string[]}]}`;

/** The lesson text the model sees, trimmed to a sensible size. */
export function lessonBrief(lesson: { title: string; objective: string | null; bodyMd: string; durationMinutes: number; trackTitle: string; moduleTitle: string }): string {
  const body = lesson.bodyMd.length > 24_000 ? `${lesson.bodyMd.slice(0, 24_000)}\n\n[lesson continues]` : lesson.bodyMd;
  return [
    `Track: ${lesson.trackTitle}`,
    `Module: ${lesson.moduleTitle}`,
    `Lesson title: ${lesson.title}`,
    lesson.objective ? `Learning objective: ${lesson.objective}` : null,
    `Reading time: ${lesson.durationMinutes} minutes`,
    "",
    "Lesson text (Markdown):",
    "<lesson>",
    body,
    "</lesson>",
    "",
    "Write the video script for this lesson now. JSON only.",
  ]
    .filter((l) => l !== null)
    .join("\n");
}

/** Pull the JSON object out of a model reply (tolerates fences or a preamble). */
export function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const src = fenced ? fenced[1] : text;
  const a = src.indexOf("{");
  const b = src.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try {
    return JSON.parse(src.slice(a, b + 1));
  } catch {
    return null;
  }
}

/** Replace dashes used as punctuation, in case the model slips. */
function tidy(s: string): string {
  return s.replace(/\s*[\u2014]\s*/g, ", ").replace(/\s[\u2013]\s/g, ", ").replace(/\u2026/g, ".");
}

function tidyScript(s: VideoScript): VideoScript {
  return {
    ...s,
    title: tidy(s.title),
    notes: tidy(s.notes),
    sections: s.sections.map((x) => ({
      ...x,
      heading: tidy(x.heading),
      narration: tidy(x.narration),
      shots: x.shots.map(tidy),
      broll: x.broll.map(tidy),
      onScreenText: x.onScreenText.map(tidy),
    })),
  };
}

export async function generateScript(brief: string): Promise<VideoScript> {
  const reply = await streamChat([{ role: "user", content: brief }], SCRIPT_SYSTEM, 6000);
  const parsed = readScript(extractJson(reply));
  if (!parsed) throw new Error("The draft did not come back in the expected shape.");
  return tidyScript(parsed);
}
