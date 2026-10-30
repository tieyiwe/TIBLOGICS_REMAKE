import { createHash } from "crypto";
import { isYouthSlug } from "@/lib/learn/youth";
import prisma from "@/lib/prisma";
import { runClaude } from "@/lib/claude";
import { ensureVideoTables } from "./db";
import { extractJson } from "./script";

// Which lessons get a generated narrated video.
//
// Deterministic rules first (cheap, explainable): module introductions,
// recaps, and lessons whose title names a concept, process, system, Studio
// or lab walkthrough say yes;
// very short lessons, checklists and reference pages say no. Whatever the
// rules cannot decide goes to a short Haiku classification, cached per lesson
// content hash so it is asked once per version of the lesson. Staff can
// force a lesson in or out on /admin_pro/learn/videos (override), which
// always wins.

export interface PlanLesson {
  id: string;
  title: string;
  objective: string | null;
  bodyMd: string;
  sortOrder: number;
  /** Lessons in the module (to spot the last one). */
  moduleSize: number;
}

export type Override = "include" | "exclude" | null;

export function contentHash(l: { title: string; objective: string | null; bodyMd: string }): string {
  return createHash("sha256").update(l.title).update("\0").update(l.objective ?? "").update("\0").update(l.bodyMd).digest("hex").slice(0, 24);
}

export function wordCount(md: string): number {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9À-ÿ]/.test(w)).length;
}

/** Estimated narration length in characters before a script exists (2 to 5 minutes). */
export function estimateChars(md: string): number {
  const words = Math.min(700, Math.max(320, Math.round(wordCount(md) * 0.6)));
  return Math.round(words * 6.1);
}

const REFERENCE = /\b(checklist|cheat ?sheet|glossary|quick reference|reference card|resources|further reading|reading list|appendix|faq|templates? pack|worksheet|bibliography)\b/i;
const RECAP = /\b(recap|summary|wrap[- ]up|review|key takeaways|putting it (all )?together|capstone|what you learned)\b/i;
const CONCEPT =
  /\b(what (is|are)|how (to|does|do|it works)|why|introduc\w*|overview|understand\w*|walkthrough|step[- ]by[- ]step|workflow|process|pipeline|system|architecture|agents?|studio|lab|build\w*|anatomy|inside|explained|basics|fundamentals|framework|lifecycle|loop|models?)\b/i;

/** The rules' verdict, or decision null when the rules cannot tell. */
export function ruleDecision(l: PlanLesson): { decision: boolean | null; reason: string } {
  const words = wordCount(l.bodyMd);
  const lines = l.bodyMd.split("\n").filter((x) => x.trim());
  const listShare = lines.length ? lines.filter((x) => /^\s*([-*+]|\d+[.)]|\[[ x]\])\s/.test(x)).length / lines.length : 0;

  if (words < 180) return { decision: false, reason: `Short lesson (${words} words): reading is quicker.` };
  if (REFERENCE.test(l.title) && !CONCEPT.test(l.title)) return { decision: false, reason: "Reference or checklist lesson: better read and kept." };
  if (listShare > 0.6 && words < 500) return { decision: false, reason: "Mostly a list: better read than watched." };
  if (l.sortOrder === 0) return { decision: true, reason: "Module introduction." };
  if (l.sortOrder === l.moduleSize - 1 && RECAP.test(l.title)) return { decision: true, reason: "Module recap." };
  if (CONCEPT.test(l.title)) return { decision: true, reason: "Explains a concept, process or system." };
  // Everything else (most lessons have a "Try it now" task, so that alone
  // does not decide) is left to the AI check.
  return { decision: null, reason: "" };
}

const SELECT_SYSTEM = `You decide whether a short narrated slide video (2 to 5 minutes, AI voice, slides with bullets and diagrams) would genuinely help adult learners with ONE online lesson, on top of the written text.
Say yes for: explanations of concepts, how something works, processes, workflows and systems, tool walkthroughs, lessons with a practical task the learner should understand before trying, and introductions or recaps.
Say no for: short reference material, checklists, glossaries, lists of links, admin or logistics, and lessons that are mostly a template to copy.
Return ONLY JSON: {"video": true|false, "reason": "one short sentence"}`;

export async function classifyWithAi(l: PlanLesson): Promise<{ decision: boolean; reason: string } | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const body = l.bodyMd.length > 3500 ? `${l.bodyMd.slice(0, 3500)}\n[continues]` : l.bodyMd;
  try {
    const { text } = await runClaude("video-select", {
      system: SELECT_SYSTEM,
      messages: [{ role: "user", content: `Lesson title: ${l.title}\n${l.objective ? `Objective: ${l.objective}\n` : ""}Words: ${wordCount(l.bodyMd)}\n<lesson>\n${body}\n</lesson>` }],
      meta: { ref: `lesson:${l.id}` },
    });
    const v = extractJson(text) as { video?: unknown; reason?: unknown } | null;
    if (!v || typeof v.video !== "boolean") return null;
    return { decision: v.video, reason: typeof v.reason === "string" ? v.reason.slice(0, 200) : "" };
  } catch (err) {
    console.error("[video/select] classify", l.id, err instanceof Error ? err.message : err);
    return null;
  }
}

export interface PlanRow {
  lessonId: string;
  contentHash: string;
  decision: boolean;
  reason: string;
  source: string;
  override: string | null;
  estChars: number;
}

/** The decision that counts: the staff override, else the plan. */
export function effectiveDecision(p: Pick<PlanRow, "decision" | "override"> | null | undefined): boolean {
  if (!p) return false;
  if (p.override === "include") return true;
  if (p.override === "exclude") return false;
  return p.decision;
}

/**
 * Plans every lesson (or one track's) whose plan is missing or out of date.
 * Rules first; undecided lessons go to Haiku while `aiBudget` lasts and the
 * deadline allows, and the rest wait for the next run (they stay unplanned).
 */
export async function planLessons(opts: { trackId?: string; lessonIds?: string[]; aiBudget?: number; deadline?: number; force?: boolean } = {}): Promise<{ planned: number; yes: number; no: number; pending: number; ai: number }> {
  await ensureVideoTables();
  const lessons = await prisma.lesson.findMany({
    where: {
      ...(opts.lessonIds ? { id: { in: opts.lessonIds } } : {}),
      ...(opts.trackId ? { module: { trackId: opts.trackId } } : {}),
    },
    select: { id: true, title: true, objective: true, bodyMd: true, sortOrder: true, module: { select: { _count: { select: { lessons: true } }, track: { select: { slug: true } } } } },
  });
  const plans = new Map((await prisma.lessonVideoPlan.findMany({ where: { lessonId: { in: lessons.map((l) => l.id) } } })).map((p) => [p.lessonId, p]));
  let planned = 0, yes = 0, no = 0, pending = 0, ai = 0;
  let budget = opts.aiBudget ?? 0;
  const undecided: Array<{ l: PlanLesson; hash: string }> = [];

  const save = async (lessonId: string, hash: string, decision: boolean, reason: string, source: string, est: number) => {
    await prisma.lessonVideoPlan.upsert({
      where: { lessonId },
      create: { lessonId, contentHash: hash, decision, reason, source, estChars: est },
      update: { contentHash: hash, decision, reason, source, estChars: est, updatedAt: new Date() },
    });
    planned++;
    if (decision) yes++;
    else no++;
  };

  for (const row of lessons) {
    const hash = contentHash(row);
    const prev = plans.get(row.id);
    // Provisional plans ("default") get another AI check, but not on every
    // cron run: at most every 6 hours (each check is a paid call). The Plan
    // button forces one.
    // A youth lesson planned "no" before the youth rule existed is planned again.
    const youthRedo = isYouthSlug(row.module.track.slug) && prev?.decision === false;
    if (!youthRedo && prev && prev.contentHash === hash && (prev.source !== "default" || (!opts.force && Date.now() - prev.updatedAt.getTime() < 6 * 3_600_000))) continue;
    const l: PlanLesson = { id: row.id, title: row.title, objective: row.objective, bodyMd: row.bodyMd, sortOrder: row.sortOrder, moduleSize: row.module._count.lessons };
    // AI-Empowered Youth: every lesson gets its video (young learners watch, then read).
    const r = isYouthSlug(row.module.track.slug) ? { decision: true, reason: "AI-Empowered Youth: every lesson has a video." } : ruleDecision(l);
    if (r.decision !== null) await save(row.id, hash, r.decision, r.reason, "rule", estimateChars(row.bodyMd));
    else undecided.push({ l, hash });
  }

  // Undecided: a few Haiku calls side by side.
  const queue = undecided.slice();
  const worker = async () => {
    for (;;) {
      const item = queue.shift();
      if (!item) return;
      if (budget <= 0 || (opts.deadline && Date.now() > opts.deadline)) {
        // No AI now: a provisional default the next run may replace.
        const words = wordCount(item.l.bodyMd);
        const prev = plans.get(item.l.id);
        if (!prev || prev.contentHash !== item.hash) {
          await save(item.l.id, item.hash, words >= 400, words >= 400 ? "Substantial lesson (provisional, AI check pending)." : "Short lesson (provisional, AI check pending).", "default", estimateChars(item.l.bodyMd));
        }
        pending++;
        continue;
      }
      budget--;
      const r = await classifyWithAi(item.l);
      if (r) {
        ai++;
        await save(item.l.id, item.hash, r.decision, r.reason || (r.decision ? "AI: a video helps here." : "AI: reading is enough."), "ai", estimateChars(item.l.bodyMd));
      } else {
        const words = wordCount(item.l.bodyMd);
        await save(item.l.id, item.hash, words >= 400, "Substantial lesson (AI check unavailable).", "default", estimateChars(item.l.bodyMd));
        pending++;
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  return { planned, yes, no, pending, ai };
}

export async function setOverride(lessonId: string, override: Override): Promise<void> {
  await ensureVideoTables();
  const existing = await prisma.lessonVideoPlan.findUnique({ where: { lessonId } });
  if (!existing) {
    const l = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { title: true, objective: true, bodyMd: true } });
    if (!l) throw new Error("Lesson not found");
    await prisma.lessonVideoPlan.create({ data: { lessonId, contentHash: contentHash(l), decision: false, reason: "Not planned yet.", source: "default", override, estChars: estimateChars(l.bodyMd) } });
    return;
  }
  await prisma.lessonVideoPlan.update({ where: { lessonId }, data: { override, updatedAt: new Date() } });
}
