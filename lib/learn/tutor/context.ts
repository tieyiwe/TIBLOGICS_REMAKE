import prisma from "@/lib/prisma";
import { translatorFor } from "@/lib/i18n/server";
import { STUDIO_BY_ID } from "@/lib/learn/studio/catalog";

// What Tutor knows about the page the learner is on. Always loaded on the
// server from the page's id, never taken from the browser, so a learner
// cannot feed Tutor a "lesson" of their own making. Texts are the English
// sources; Tutor replies in the learner's language anyway.

export const TUTOR_KINDS = ["lesson", "lab", "studio", "review", "exam"] as const;
export type TutorKind = (typeof TUTOR_KINDS)[number];

export interface TutorPage {
  kind: Exclude<TutorKind, "exam">;
  /** Thread key: lesson:<id> | lab:<id> | studio:<tool> | review */
  contextKey: string;
  lessonId: string | null;
  trackId: string | null;
  /** Free-preview lesson: open to any member. */
  isPreview: boolean;
  /** Prompt block describing the page (English). */
  describe: string;
  /** The lesson's "Try it now" task, when there is one. */
  tryItNow: string | null;
}

const BODY_MAX = 7000;

function clip(s: string | null | undefined, max: number): string {
  const v = (s ?? "").trim();
  return v.length > max ? `${v.slice(0, max)}\n[...]` : v;
}

/** Level-2 "## Try it now" section of a lesson body, outside code fences. */
export function tryItNowSection(md: string): string | null {
  const lines = md.split("\n");
  let fenced = false;
  let start = -1;
  let end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) fenced = !fenced;
    else if (!fenced && /^##\s/.test(line)) {
      if (start >= 0) {
        end = i;
        break;
      }
      if (/^##\s+try it now\s*$/i.test(line)) start = i + 1;
    }
  }
  if (start < 0) return null;
  return lines.slice(start, end).join("\n").trim() || null;
}

async function trackProgress(studentId: string, trackId: string) {
  const [total, done] = await Promise.all([
    prisma.lesson.count({ where: { module: { trackId } } }),
    prisma.lessonProgress.count({ where: { studentId, lesson: { module: { trackId } } } }),
  ]);
  return { total, done };
}

async function lessonPage(studentId: string, id: string): Promise<TutorPage | null> {
  const l = await prisma.lesson
    .findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        objective: true,
        bodyMd: true,
        isPreview: true,
        sortOrder: true,
        microCheck: { select: { id: true } },
        module: {
          select: {
            title: true,
            sortOrder: true,
            trackId: true,
            track: { select: { title: true, level: true } },
            _count: { select: { lessons: true } },
          },
        },
      },
    })
    .catch(() => null);
  if (!l) return null;
  const [p, done] = await Promise.all([
    trackProgress(studentId, l.module.trackId),
    prisma.lessonProgress.findFirst({ where: { studentId, lessonId: l.id }, select: { lessonId: true } }),
  ]);
  const describe = [
    `Page type: LESSON (reading and practice; not graded).${l.microCheck ? " The lesson ends with a short graded quick check." : ""}`,
    `Track: "${l.module.track.title}"${l.module.track.level ? ` (level: ${l.module.track.level})` : ""}.`,
    `Module: "${l.module.title}".`,
    `Lesson: "${l.title}".${done ? " The learner has already completed this lesson." : ""}`,
    l.objective ? `Lesson objective: ${l.objective}` : "",
    `Learner progress in this track: ${p.done} of ${p.total} lessons completed.`,
    `<lesson_body>\n${clip(l.bodyMd, BODY_MAX)}\n</lesson_body>`,
  ]
    .filter(Boolean)
    .join("\n");
  return {
    kind: "lesson",
    contextKey: `lesson:${l.id}`,
    lessonId: l.id,
    trackId: l.module.trackId,
    isPreview: l.isPreview,
    describe,
    tryItNow: tryItNowSection(l.bodyMd ?? ""),
  };
}

async function labPage(studentId: string, id: string): Promise<TutorPage | null> {
  const lab = await prisma.lab
    .findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        labType: true,
        briefMd: true,
        scenarioMd: true,
        objectives: true,
        isPublished: true,
        lessonId: true,
        trackId: true,
        track: { select: { title: true } },
      },
    })
    .catch(() => null);
  if (!lab || !lab.isPublished) return null;
  const p = await trackProgress(studentId, lab.trackId);
  // Only the labels the learner already sees: never grader guidance or the
  // lab's answer configuration (planted flaws and the like).
  const objectives = Array.isArray(lab.objectives)
    ? (lab.objectives as Array<{ label?: unknown }>).map((o) => (typeof o?.label === "string" ? `- ${o.label}` : "")).filter(Boolean)
    : [];
  const describe = [
    `Page type: LAB (GRADED hands-on assignment, type "${lab.labType}"). Coach the reasoning; never produce the submission, the answers or the flaws to find.`,
    `Track: "${lab.track.title}". Lab: "${lab.title}".`,
    `Learner progress in this track: ${p.done} of ${p.total} lessons completed.`,
    `<lab_brief>\n${clip(lab.briefMd, 3500)}\n</lab_brief>`,
    lab.scenarioMd ? `<lab_scenario>\n${clip(lab.scenarioMd, 2500)}\n</lab_scenario>` : "",
    objectives.length ? `Criteria the lab is scored against:\n${objectives.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return {
    kind: "lab",
    contextKey: `lab:${lab.id}`,
    lessonId: lab.lessonId,
    trackId: lab.trackId,
    isPreview: false,
    describe,
    tryItNow: null,
  };
}

function studioPage(tool: string): TutorPage | null {
  const meta = STUDIO_BY_ID.get(tool);
  if (!meta || !meta.ready) return null;
  const en = translatorFor("en");
  return {
    kind: "studio",
    contextKey: `studio:${meta.id}`,
    lessonId: null,
    trackId: null,
    isPreview: false,
    describe: [
      `Page type: LEARNING STUDIO (interactive practice tool; challenges are scored for practice).`,
      `Tool: "${en(`studio.${meta.id}.name`)}". What it does: ${en(`studio.${meta.id}.desc`)}`,
    ].join("\n"),
    tryItNow: null,
  };
}

const REVIEW_PAGE: TutorPage = {
  kind: "review",
  contextKey: "review",
  lessonId: null,
  trackId: null,
  isPreview: false,
  describe:
    "Page type: DAILY REVIEW (spaced retrieval practice on questions from lessons and quizzes the learner has done). " +
    "Retrieval only works if the learner recalls the answer themselves: never state the answer to a review question; help them recall it with cues and the underlying idea.",
  tryItNow: null,
};

export async function loadTutorPage(studentId: string, kind: TutorKind, ref: string | null): Promise<TutorPage | null> {
  if (kind === "lesson" && ref) return lessonPage(studentId, ref);
  if (kind === "lab" && ref) return labPage(studentId, ref);
  if (kind === "studio" && ref) return studioPage(ref);
  if (kind === "review") return REVIEW_PAGE;
  return null;
}

/**
 * True while the learner has a final exam running: Tutor stays silent
 * everywhere until it is submitted or its time is up.
 */
export async function examInProgress(studentId: string): Promise<boolean> {
  const s = await prisma.finalExamSession
    .findFirst({ where: { studentId, status: "in_progress", expiresAt: { gt: new Date() } }, select: { id: true } })
    .catch(() => null);
  return !!s;
}
