import { z } from "zod";
import { runClaude } from "@/lib/claude";
import { translated } from "@/lib/i18n/content";
import { extractJson } from "./script";
import { ICONS } from "./icons";

// The scene script for a generated narrated lesson video: 5 to 10 scenes,
// each with what the AI voice says and what the slide shows (a title plus
// bullets, a step flow, a comparison, or a prompt/code card). Drafted in
// English from the lesson only (Sonnet, thinking off), then translated to
// French through the content translation cache.

export const SCENE_LAYOUTS = ["title", "bullets", "steps", "compare", "code", "recap", "cycle", "hub", "timeline", "illustration", "number"] as const;

/** Scripts written before the illustrated layouts are rewritten once (pipeline ensureScript). */
export const SCRIPT_VERSION = 2;

/** Icons the script may use (lib/learn/video/icons.ts). */
export const ICON_KEYS = Object.keys(ICONS);
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
  /** "cycle", "hub", "timeline": 3-6 short labels (the loop's stages, the parts around the hub, the stages in time). */
  nodes: string[];
  /** "hub": the concept in the middle. */
  center: string;
  /**
   * Icons (keys of ICONS): "illustration" shows 1-3 large ones as a small
   * scene; on other layouts, one per item (bullet, step or node), optional.
   */
  icons: string[];
  /** "number": a figure the lesson itself gives, and what it measures. */
  figure: { value: string; label: string } | null;
}

export interface SceneScript {
  /** SCRIPT_VERSION it was written for (missing: 1, before the illustrated layouts). */
  v?: number;
  title: string;
  /** The track and module titles in this language (French scripts). */
  track?: string;
  module?: string;
  scenes: Scene[];
}

const str = (max: number) => z.string().trim().max(max);
/** Short labels: cut to length instead of rejecting the whole script (French runs longer). */
const cut = (max: number) => z.string().transform((s) => s.trim().slice(0, max));
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
    .object({ leftTitle: cut(60), rightTitle: cut(60), left: list(4, 90), right: list(4, 90) })
    .nullish()
    .transform((v) => v ?? null),
  code: z
    .object({ label: cut(60).default(""), kind: z.enum(["prompt", "code"]).catch("prompt"), text: z.string().max(1500) })
    .nullish()
    .transform((v) => v ?? null),
  nodes: list(6, 48),
  center: cut(48).default(""),
  icons: z
    .array(z.string())
    .default([])
    .transform((a) => a.map((x) => x.trim().toLowerCase()).slice(0, 6)),
  figure: z
    .object({ value: cut(16), label: cut(90) })
    .nullish()
    .transform((v) => v ?? null),
});

const ScriptSchema = z.object({
  v: z.number().int().optional(),
  title: str(200).min(1),
  track: str(200).optional(),
  module: str(200).optional(),
  scenes: z.array(SceneSchema).min(3).max(12),
});

/** Keeps every scene renderable: a layout without its content falls back to bullets. */
function normalise(s: SceneScript): SceneScript {
  const scenes = s.scenes.map((sc, i, all): Scene => {
    let layout = sc.layout;
    if (layout === "steps" && sc.steps.length < 2) layout = "bullets";
    if (layout === "compare" && (!sc.compare || !sc.compare.left.length || !sc.compare.right.length)) layout = "bullets";
    if (layout === "code" && !sc.code?.text.trim()) layout = "bullets";
    // Unknown icon names are dropped (an icon per item only when every item has one).
    const icons = sc.icons.map((k) => (ICONS[k] ? k : "")).filter(Boolean);
    if ((layout === "cycle" || layout === "timeline") && sc.nodes.length < 3) layout = sc.nodes.length >= 2 ? "steps" : "bullets";
    if (layout === "hub" && (sc.nodes.length < 3 || !sc.center.trim())) layout = "bullets";
    if (layout === "illustration" && !icons.length) layout = "bullets";
    if (layout === "number" && !sc.figure?.value.trim()) layout = "bullets";
    if (i === 0 && layout !== "title" && all.length > 3) layout = layout === "bullets" ? "title" : layout;
    const code = sc.code ? { ...sc.code, text: sc.code.text.split("\n").slice(0, 14).map((l) => l.slice(0, 90)).join("\n") } : null;
    const items = layout === "steps" ? sc.steps.length : layout === "cycle" || layout === "hub" || layout === "timeline" ? sc.nodes.length : sc.bullets.length;
    const keepIcons = layout === "illustration" ? icons.slice(0, 3) : icons.length >= items && items > 0 ? icons.slice(0, items) : [];
    return {
      ...sc,
      layout,
      title: tidy(sc.title).slice(0, 90),
      narration: speakable(sc.narration),
      bullets: sc.bullets.map(tidy),
      steps: sc.steps.map(tidy),
      code,
      nodes: sc.nodes.map(tidy),
      center: tidy(sc.center),
      icons: keepIcons,
      figure: sc.figure ? { value: tidy(sc.figure.value), label: tidy(sc.figure.label) } : null,
    };
  });
  return { ...(s.v ? { v: s.v } : {}), title: tidy(s.title), ...(s.track ? { track: tidy(s.track) } : {}), ...(s.module ? { module: tidy(s.module) } : {}), scenes };
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
- Narration sounds like a respected university professor talking to a room of adults: calm, warm, unhurried and conversational, never salesy. Write for the ear so the voice has natural rhythm and intonation: mix short and medium sentences, open a new idea with a natural spoken link ("Now,", "Here's the thing.", "In other words,", "So,"), ask an occasional real question and then answer it, and end each scene on a clear, settled sentence. Never read a list out mechanically; turn it into flowing speech ("First, ... Then, ... And finally, ...").
- Narration is plain spoken English for a text-to-speech voice: "you", contractions are fine. No Markdown, no bullet symbols, no URLs, no emoji, no abbreviations a voice would stumble on (write "for example", not "e.g."). Do not read the slide word for word: the slide summarises, the voice explains.
- Plain punctuation: no em dashes, no ellipses for effect. Use commas, full stops and colons.
- Make the video SHOW ideas, not only list them. For every scene, pick the layout that best illustrates its idea for a learner, and use at least two illustrated scenes per video (steps, compare, cycle, hub, timeline, illustration or number) whenever the lesson allows. Plain "bullets" only when nothing visual fits.
  - "steps": a process or workflow in order (2 to 5 steps).
  - "cycle": something that loops or repeats, such as a feedback loop or an improve-and-repeat routine (3 to 6 stages in "nodes").
  - "hub": a system and its parts, or one idea with what surrounds it ("center" plus 3 to 6 "nodes").
  - "timeline": stages over time, a before, during and after, or a history (3 to 6 "nodes").
  - "compare": two sides (before and after, weak and strong, human and AI).
  - "illustration": a small picture of the situation, for a story, an example or an analogy: 1 to 3 "icons" side by side (for example ["person", "laptop", "robot"]) and one short caption line in "bullets".
  - "number": one striking figure the lesson itself states (never invented) in "figure" {"value": "3 in 4", "label": "what it measures"}.
  - On bullets, steps, cycle, hub and timeline you may add "icons" with exactly one icon per item, in the same order, when icons make the points easier to grasp.
  - Icon names, use only these: ${ICON_KEYS.join(", ")}.
- Points appear on screen one at a time as the voice reaches them, so put bullets, steps and nodes in the order the narration mentions them.
- Slide text is short: "nodes" and "center" at most 4 words each; "title" at most 8 words; each bullet at most 12 words; each step label at most 5 words; compare items at most 10 words.
- For layout "title", "bullets" holds one short subtitle line (the lesson's promise).

Return ONLY a JSON object, no Markdown fences, with this shape:
{"title": string, "scenes": [{"layout": "title"|"bullets"|"steps"|"compare"|"code"|"recap"|"cycle"|"hub"|"timeline"|"illustration"|"number", "title": string, "narration": string, "bullets": string[], "steps": string[], "compare": {"leftTitle": string, "rightTitle": string, "left": string[], "right": string[]} | null, "code": {"label": string, "kind": "prompt"|"code", "text": string} | null, "nodes": string[], "center": string, "icons": string[], "figure": {"value": string, "label": string} | null}]}`;

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
    if (parsed) return { ...parsed, v: SCRIPT_VERSION };
    lastErr = "The scene script did not come back in the expected shape.";
  }
  throw new Error(lastErr);
}

export function narrationChars(s: SceneScript): number {
  return s.scenes.reduce((a, x) => a + x.narration.length, 0);
}

// ── French ──────────────────────────────────────────────────────────────────

/** Flattens the translatable text (code stays as written; prompts are translated). */
function flatten(s: SceneScript, names?: { track: string; module: string }): Record<string, string> {
  const f: Record<string, string> = { title: s.title };
  if (names) {
    f.track = names.track;
    f.module = names.module;
  }
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
    sc.nodes.forEach((b, j) => (f[`${i}.n${j}`] = b));
    if (sc.center) f[`${i}.center`] = sc.center;
    if (sc.figure?.label) f[`${i}.figure`] = sc.figure.label;
    // Words in a figure ("3 in 4") are translated; a bare number stays as it is.
    if (sc.figure?.value && /[a-z]/i.test(sc.figure.value)) f[`${i}.figv`] = sc.figure.value;
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
export async function translateScenes(lessonId: string, en: SceneScript, names?: { track: string; module: string }): Promise<SceneScript | null> {
  const fields = flatten(en, names);
  const fr = await translated(`video-scenes:${lessonId}`, "fr", fields, "wait");
  if (!fr) return null;
  // The translation layer hands back the English when it cannot read its
  // cache: never let the French voice read English. Mostly unchanged = not
  // translated (try again later).
  const wordy = Object.entries(fields).filter(([, v]) => /[a-z]{3}/i.test(v) && v.trim().length > 3);
  const same = wordy.filter(([k, v]) => typeof fr[k] !== "string" || fr[k].trim() === v.trim()).length;
  if (wordy.length && same / wordy.length > 0.5) return null;
  const g = (k: string, d: string) => (typeof fr[k] === "string" && fr[k].trim() ? fr[k] : d);
  return {
    ...(en.v ? { v: en.v } : {}),
    title: g("title", en.title),
    ...(names ? { track: g("track", names.track), module: g("module", names.module) } : {}),
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
      nodes: sc.nodes.map((b, j) => g(`${i}.n${j}`, b)),
      center: sc.center ? g(`${i}.center`, sc.center) : "",
      figure: sc.figure ? { value: g(`${i}.figv`, sc.figure.value), label: g(`${i}.figure`, sc.figure.label) } : null,
    })),
  };
}
