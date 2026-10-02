import { z } from "zod";
import { runClaude } from "@/lib/claude";
import { translated } from "@/lib/i18n/content";
import { extractJson } from "./script";

// The scene script for a generated narrated lesson video: 5 to 10 scenes,
// each with what the AI voice says and what the slide shows (a title plus
// bullets, a step flow, a comparison, or a prompt/code card). Drafted in
// English from the lesson only (Sonnet, thinking off), then translated to
// French through the content translation cache.

export const SCENE_LAYOUTS = ["title", "bullets", "steps", "compare", "code", "recap"] as const;
export type SceneLayout = (typeof SCENE_LAYOUTS)[number];

export interface Scene {
  layout: SceneLayout;
  /** On-screen title. */
  title: string;
  /** Exactly what the voice says. */
  narration: string;
  /** 0-4 short points (bullets, recap, or the subtitle line for "title"). */
  bullets: string[];
  /** "steps": 2-5 short labels, in order. */
  steps: string[];
  /** "compare": two columns. */
  compare: { leftTitle: string; rightTitle: string; left: string[]; right: string[] } | null;
  /** "code": a prompt or code snippet shown on a card. */
  code: { label: string; kind: "prompt" | "code"; text: string } | null;
}

export interface SceneScript {
  title: string;
  scenes: Scene[];
}

const str = (max: number) => z.string().trim().max(max);
const list = (n: number, max: number) =>
  z
    .array(z.string())
    .default([])
    .transform((a) => a.map((x) => x.trim().slice(0, max)).filter(Boolean).slice(0, n));

const SceneSchema = z.object({
  layout: z.enum(SCENE_LAYOUTS).catch("bullets"),
  title: str(200).min(1),
  narration: str(4000).min(1),
  bullets: list(4, 140),
  steps: list(5, 60),
  compare: z
    .object({ leftTitle: str(60), rightTitle: str(60), left: list(4, 90), right: list(4, 90) })
    .nullish()
    .transform((v) => v ?? null),
  code: z
    .object({ label: str(60).default(""), kind: z.enum(["prompt", "code"]).catch("prompt"), text: z.string().max(1500) })
    .nullish()
    .transform((v) => v ?? null),
});

const ScriptSchema = z.object({
  title: str(200).min(1),
  scenes: z.array(SceneSchema).min(3).max(12),
});

/** Keeps every scene renderable: a layout without its content falls back to bullets. */
function normalise(s: SceneScript): SceneScript {
  const scenes = s.scenes.map((sc, i, all): Scene => {
    let layout = sc.layout;
    if (layout === "steps" && sc.steps.length < 2) layout = "bullets";
    if (layout === "compare" && (!sc.compare || !sc.compare.left.length || !sc.compare.right.length)) layout = "bullets";
    if (layout === "code" && !sc.code?.text.trim()) layout = "bullets";
    if (i === 0 && layout !== "title" && all.length > 3) layout = layout === "bullets" ? "title" : layout;
    const code = sc.code ? { ...sc.code, text: sc.code.text.split("\n").slice(0, 14).map((l) => l.slice(0, 90)).join("\n") } : null;
    return { ...sc, layout, title: tidy(sc.title).slice(0, 90), narration: speakable(sc.narration), bullets: sc.bullets.map(tidy), steps: sc.steps.map(tidy), code };
  });
  return { title: tidy(s.title), scenes };
}

/** Plain punctuation, like the other scripts. */
function tidy(s: string): string {
  return s.replace(/\s*—\s*/g, ", ").replace(/\s–\s/g, ", ").replace(/…/g, ".").trim();
}

/** Narration a voice can read: no Markdown, no URLs, no symbols read oddly. */
function speakable(s: string): string {
  return tidy(s)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*?([^*]+)\*\*?/g, "$1")
    .replace(/https?:\/\/\S+/g, "the link on the lesson page")
    .replace(/[#*_>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function readSceneScript(v: unknown): SceneScript | null {
  const r = ScriptSchema.safeParse(v);
  return r.success ? normalise(r.data as SceneScript) : null;
}

export const SCENES_SYSTEM = `You write narrated explainer videos for ARFA (AI Readiness For All), the AI Academy of TIBLOGICS, an online school that teaches working adults to use AI in their jobs. You turn ONE written lesson into a short video made of slides with an AI voice-over. Nothing is filmed: each scene is one slide plus the words the voice reads.

Rules:
- 5 to 10 scenes. Total narration 2 to 5 minutes at about 150 words a minute (300 to 750 words). Each scene is 20 to 45 seconds of speech (50 to 110 words).
- Order: scene 1 uses layout "title" and opens with why this lesson matters to the learner (no greetings like "Hi everyone", no "In this video"). Middle scenes explain the key ideas, in the lesson's order. If the lesson has a process, a workflow or a system, show it with layout "steps". If it contrasts two things (before and after, weak and strong prompt, human and AI), use "compare". If it gives a prompt, a template or code the learner will use, show it with layout "code" (copy it from the lesson, shortened if needed). The last scene uses layout "recap" with 3 or 4 takeaways and tells the learner to try the task on the lesson page.
- Use ONLY what the lesson says: its facts, tools, steps and examples. Never invent statistics, studies, percentages, prices, quotes, names or product features. If the lesson gives a number you may repeat it; otherwise do not use numbers as evidence.
- Narration is plain spoken English for a text-to-speech voice: short sentences, "you", contractions are fine. No Markdown, no bullet symbols, no URLs, no emoji, no abbreviations a voice would stumble on (write "for example", not "e.g."). Do not read the slide word for word: the slide summarises, the voice explains.
- Plain punctuation: no em dashes, no ellipses for effect. Use commas, full stops and colons.
- Slide text is short: "title" at most 8 words; each bullet at most 12 words; each step label at most 5 words; compare items at most 10 words.
- For layout "title", "bullets" holds one short subtitle line (the lesson's promise).

Return ONLY a JSON object, no Markdown fences, with this shape:
{"title": string, "scenes": [{"layout": "title"|"bullets"|"steps"|"compare"|"code"|"recap", "title": string, "narration": string, "bullets": string[], "steps": string[], "compare": {"leftTitle": string, "rightTitle": string, "left": string[], "right": string[]} | null, "code": {"label": string, "kind": "prompt"|"code", "text": string} | null}]}`;

export interface LessonForVideo {
  id: string;
  title: string;
  objective: string | null;
  bodyMd: string;
  durationMinutes: number;
  trackTitle: string;
  moduleTitle: string;
}

export function scenesBrief(l: LessonForVideo): string {
  const body = l.bodyMd.length > 20_000 ? `${l.bodyMd.slice(0, 20_000)}\n\n[lesson continues]` : l.bodyMd;
  return [
    `Track: ${l.trackTitle}`,
    `Module: ${l.moduleTitle}`,
    `Lesson title: ${l.title}`,
    l.objective ? `Learning objective: ${l.objective}` : null,
    "",
    "Lesson text (Markdown):",
    "<lesson>",
    body,
    "</lesson>",
    "",
    "Write the narrated video scenes for this lesson now. JSON only.",
  ]
    .filter((x) => x !== null)
    .join("\n");
}

export async function generateScenes(l: LessonForVideo): Promise<SceneScript> {
  let lastErr = "The scene script did not come back in the expected shape.";
  for (let attempt = 0; attempt < 2; attempt++) {
    const { text } = await runClaude("video-scenes", {
      system: SCENES_SYSTEM,
      messages: [{ role: "user", content: scenesBrief(l) }],
      meta: { ref: `lesson:${l.id}` },
    });
    const parsed = readSceneScript(extractJson(text));
    if (parsed) return parsed;
    lastErr = "The scene script did not come back in the expected shape.";
  }
  throw new Error(lastErr);
}

export function narrationChars(s: SceneScript): number {
  return s.scenes.reduce((a, x) => a + x.narration.length, 0);
}

// ── French ──────────────────────────────────────────────────────────────────

/** Flattens the translatable text (code stays as written; prompts are translated). */
function flatten(s: SceneScript): Record<string, string> {
  const f: Record<string, string> = { title: s.title };
  s.scenes.forEach((sc, i) => {
    f[`${i}.title`] = sc.title;
    f[`${i}.narration`] = sc.narration;
    sc.bullets.forEach((b, j) => (f[`${i}.b${j}`] = b));
    sc.steps.forEach((b, j) => (f[`${i}.s${j}`] = b));
    if (sc.compare) {
      f[`${i}.cl`] = sc.compare.leftTitle;
      f[`${i}.cr`] = sc.compare.rightTitle;
      sc.compare.left.forEach((b, j) => (f[`${i}.l${j}`] = b));
      sc.compare.right.forEach((b, j) => (f[`${i}.r${j}`] = b));
    }
    if (sc.code) {
      if (sc.code.label) f[`${i}.codeLabel`] = sc.code.label;
      if (sc.code.kind === "prompt") f[`${i}.code`] = sc.code.text;
    }
  });
  return f;
}

/**
 * The French scenes, through the shared translation cache (keyed by a hash
 * of the English, so a regenerated English script is re-translated and an
 * unchanged one is never paid for twice). Null when it cannot be done now.
 */
export async function translateScenes(lessonId: string, en: SceneScript): Promise<SceneScript | null> {
  const fields = flatten(en);
  const fr = await translated(`video-scenes:${lessonId}`, "fr", fields, "wait");
  if (!fr) return null;
  const g = (k: string, d: string) => (typeof fr[k] === "string" && fr[k].trim() ? fr[k] : d);
  return {
    title: g("title", en.title),
    scenes: en.scenes.map((sc, i) => ({
      ...sc,
      title: g(`${i}.title`, sc.title),
      narration: speakable(g(`${i}.narration`, sc.narration)),
      bullets: sc.bullets.map((b, j) => g(`${i}.b${j}`, b)),
      steps: sc.steps.map((b, j) => g(`${i}.s${j}`, b)),
      compare: sc.compare
        ? {
            leftTitle: g(`${i}.cl`, sc.compare.leftTitle),
            rightTitle: g(`${i}.cr`, sc.compare.rightTitle),
            left: sc.compare.left.map((b, j) => g(`${i}.l${j}`, b)),
            right: sc.compare.right.map((b, j) => g(`${i}.r${j}`, b)),
          }
        : null,
      code: sc.code
        ? { ...sc.code, label: g(`${i}.codeLabel`, sc.code.label), text: sc.code.kind === "prompt" ? g(`${i}.code`, sc.code.text) : sc.code.text }
        : null,
    })),
  };
}
