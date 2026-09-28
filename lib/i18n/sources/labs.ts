// Content translation for Learning Box assessments: labs, question banks
// (micro-checks, module quizzes, final exams), final exam instructions and
// capstone briefs. See ./README.md.
//
// Safety rules for questions:
// - Options are translated in the order they are STORED and put back at the
//   same index, so `correctIndex` keeps pointing at the same answer. The
//   per-learner shuffle (presentQuestion) runs after translation, on indexes.
// - Grading always compares indexes, never text.
// - Nothing here strips or exposes answer keys: callers keep doing that.
//
// Keys: `lab:<slug>`, `quiz:<quizId>:<chunk>`, `micro:<checkId>:<chunk>`,
// `exam:<examId>` (instructions), `exam:<examId>:q<chunk>`, `capstone:<id>`.
// Track, module and exam titles belong to `track:<slug>` in ./learn.ts.
import prisma from "@/lib/prisma";
import type { Locale } from "../config";
import { localized, localizedList, translated, type Fields } from "../content";
import { parseConfig, parseObjectives, type LabConfig, type LabObjective } from "@/lib/learn/labs/types";

// ── Labs ────────────────────────────────────────────────────────────────────

export interface LabSource {
  slug: string;
  title: string;
  labType: string;
  briefMd: string;
  scenarioMd: string | null;
  objectives: unknown;
  config: unknown;
}

export const labKey = (slug: string) => `lab:${slug}`;

/**
 * Every learner-facing text in a lab, as one translation unit, so a critique
 * lab's answer, its candidate statements and the flaw explanations are
 * translated together and stay consistent. Code Studio starter code and
 * check code are never included; objective guidance and the sandbox system
 * prompt are instructions for the model, not the learner, and stay English.
 */
export function labFields(lab: LabSource): Fields {
  const f: Fields = { title: lab.title, briefMd: lab.briefMd };
  const put = (k: string, v: string | null | undefined) => {
    if (v && v.trim()) f[k] = v;
  };
  put("scenarioMd", lab.scenarioMd);
  for (const o of parseObjectives(lab.objectives)) put(`objective.${o.id}`, o.label);
  const c = parseConfig(lab.labType, lab.config);
  switch (c.kind) {
    case "prompt":
      put("contextMd", c.contextMd);
      put("starterPrompt", c.starterPrompt);
      break;
    case "critique":
      put("answerMd", c.answerMd);
      for (const x of c.candidates) put(`candidate.${x.id}`, x.text);
      for (const x of c.flaws) {
        put(`flaw.${x.id}.quote`, x.quote);
        put(`flaw.${x.id}.explanation`, x.explanation);
      }
      break;
    case "build":
      for (const s of c.steps) {
        put(`step.${s.id}.label`, s.label);
        put(`step.${s.id}.detail`, s.detail);
      }
      put("artifactLabel", c.artifactLabel);
      break;
    case "workbench":
    case "code":
      for (const x of c.fields ?? []) {
        put(`field.${x.id}.label`, x.label);
        put(`field.${x.id}.prompt`, x.prompt);
        put(`field.${x.id}.placeholder`, x.placeholder);
      }
      if (c.kind === "code") {
        for (const x of c.checks) {
          put(`check.${x.id}.label`, x.label);
          put(`check.${x.id}.hint`, x.hint);
        }
      }
      break;
  }
  return f;
}

export interface LocalizedLab {
  title: string;
  briefMd: string;
  scenarioMd: string | null;
  objectives: LabObjective[];
  /** Same shape, ids, flags and code as the stored config; only texts change. */
  config: LabConfig;
}

/** Put translated texts back into a lab. Ids, answer flags and code are untouched. */
export function applyLabFields(lab: LabSource, t: Fields): LocalizedLab {
  const pick = (k: string, v: string): string => t[k] ?? v;
  const opt = (k: string, v: string | undefined): string | undefined => (v ? t[k] ?? v : v);
  const objectives = parseObjectives(lab.objectives).map((o) => ({ ...o, label: pick(`objective.${o.id}`, o.label) }));
  const c = parseConfig(lab.labType, lab.config);
  let config: LabConfig;
  switch (c.kind) {
    case "prompt":
      config = { ...c, contextMd: opt("contextMd", c.contextMd), starterPrompt: opt("starterPrompt", c.starterPrompt) };
      break;
    case "critique":
      config = {
        ...c,
        answerMd: pick("answerMd", c.answerMd),
        candidates: c.candidates.map((x) => ({ ...x, text: pick(`candidate.${x.id}`, x.text) })),
        flaws: c.flaws.map((x) => ({
          ...x,
          quote: pick(`flaw.${x.id}.quote`, x.quote),
          explanation: pick(`flaw.${x.id}.explanation`, x.explanation),
        })),
      };
      break;
    case "build":
      config = {
        ...c,
        steps: c.steps.map((s) => ({ ...s, label: pick(`step.${s.id}.label`, s.label), detail: opt(`step.${s.id}.detail`, s.detail) })),
        artifactLabel: opt("artifactLabel", c.artifactLabel),
      };
      break;
    case "workbench":
    case "code": {
      const fields = (c.fields ?? []).map((x) => ({
        ...x,
        label: pick(`field.${x.id}.label`, x.label),
        prompt: pick(`field.${x.id}.prompt`, x.prompt),
        placeholder: opt(`field.${x.id}.placeholder`, x.placeholder),
      }));
      config =
        c.kind === "code"
          ? {
              ...c,
              fields,
              checks: c.checks.map((x) => ({ ...x, label: pick(`check.${x.id}.label`, x.label), hint: opt(`check.${x.id}.hint`, x.hint) })),
            }
          : { ...c, fields };
      break;
    }
  }
  return {
    title: pick("title", lab.title),
    briefMd: pick("briefMd", lab.briefMd),
    scenarioMd: lab.scenarioMd ? pick("scenarioMd", lab.scenarioMd) : lab.scenarioMd,
    objectives,
    config,
  };
}

/** A lab in the learner's language, or English with `pending` while it is translated. */
export async function localizeLab(lab: LabSource, locale: Locale): Promise<LocalizedLab & { pending: boolean }> {
  const { value, pending } = await localized(labKey(lab.slug), locale, labFields(lab));
  return { ...applyLabFields(lab, value), pending };
}

/** Lab titles for lists (track page), keyed by slug. Uses the same unit as the lab page. */
export async function localizeLabTitles(labs: LabSource[], locale: Locale): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    labs.map(async (lab) => {
      const { value } = await localized(labKey(lab.slug), locale, labFields(lab));
      out[lab.slug] = value.title ?? lab.title;
    }),
  );
  return out;
}

// ── Question banks ──────────────────────────────────────────────────────────

export type QuestionKind = "micro" | "quiz" | "exam";

export interface QuestionSource {
  id: string;
  question: string;
  options: unknown;
  explanation: string;
}

/** Questions per translation unit. Keeps each model call small and reliable. */
const CHUNK = 10;

const bankKey = (kind: QuestionKind, ownerId: string, chunk: number) =>
  kind === "exam" ? `exam:${ownerId}:q${chunk}` : `${kind}:${ownerId}:${chunk}`;

/** A bank split into stable chunks (by question id), each translated as one unit. */
export function questionChunks<Q extends QuestionSource>(bank: Q[]): Q[][] {
  const sorted = [...bank].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const out: Q[][] = [];
  for (let i = 0; i < sorted.length; i += CHUNK) out.push(sorted.slice(i, i + CHUNK));
  return out;
}

const optionList = (raw: unknown): string[] => (Array.isArray(raw) ? raw.map((o) => String(o)) : []);

/** Question text, each option by its stored index (o0, o1, ...) and the explanation. */
export function questionFields(q: QuestionSource): Fields {
  const f: Fields = { question: q.question, explanation: q.explanation };
  optionList(q.options).forEach((o, i) => { f[`o${i}`] = o; });
  return f;
}

/**
 * The bank in the learner's language. Only chunks holding a question in
 * `needed` (all when omitted) are looked up. Every returned question keeps its
 * id, correctIndex and every other field; options keep their count and order.
 */
export async function localizeQuestions<Q extends QuestionSource>(
  kind: QuestionKind,
  ownerId: string,
  bank: Q[],
  locale: Locale,
  needed?: Iterable<string>,
): Promise<{ questions: Q[]; pending: boolean }> {
  if (locale === "en" || bank.length === 0) return { questions: bank, pending: false };
  const want = needed ? new Set(needed) : null;
  const byId = new Map<string, Q>();
  let pending = false;
  await Promise.all(
    questionChunks(bank).map(async (chunk, i) => {
      if (want && !chunk.some((q) => want.has(q.id))) return;
      const res = await localizedList(bankKey(kind, ownerId, i), locale, chunk.map(questionFields));
      if (res.pending) pending = true;
      chunk.forEach((q, j) => {
        const t = res.value[j] ?? {};
        const opts = optionList(q.options);
        byId.set(q.id, {
          ...q,
          question: t.question || q.question,
          explanation: t.explanation || q.explanation,
          // Same length and order as stored: index i is always option i.
          options: opts.map((o, k) => t[`o${k}`] || o),
        });
      });
    }),
  );
  return { questions: bank.map((q) => byId.get(q.id) ?? q), pending };
}

// ── Final exam and capstone ─────────────────────────────────────────────────

export const examKey = (examId: string) => `exam:${examId}`;

/**
 * The exam's instructions. Its title is translated with the track
 * (`track:<slug>` in ./learn.ts, as examTitle), so it is not repeated here.
 */
export function examFields(exam: { instructionsMd: string }): Fields {
  return exam.instructionsMd?.trim() ? { instructionsMd: exam.instructionsMd } : {};
}

export async function localizeExamInstructions(
  exam: { id: string; instructionsMd: string },
  locale: Locale,
): Promise<{ instructionsMd: string; pending: boolean }> {
  const fields = examFields(exam);
  if (!fields.instructionsMd) return { instructionsMd: exam.instructionsMd, pending: false };
  const { value, pending } = await localized(examKey(exam.id), locale, fields);
  return { instructionsMd: value.instructionsMd ?? exam.instructionsMd, pending };
}

export interface RubricRow {
  criterion: string;
  weight: number;
  description?: string;
}

export const capstoneKey = (id: string) => `capstone:${id}`;

export function rubricRows(raw: unknown): RubricRow[] {
  return Array.isArray(raw) ? (raw as RubricRow[]).filter((r) => r && typeof r.criterion === "string") : [];
}

export function capstoneFields(c: { briefMd: string; rubric: unknown }): Fields {
  const f: Fields = { briefMd: c.briefMd };
  rubricRows(c.rubric).forEach((r, i) => {
    f[`rubric.${i}.criterion`] = r.criterion;
    if (r.description?.trim()) f[`rubric.${i}.description`] = r.description;
  });
  return f;
}

export async function localizeCapstone(
  c: { id: string; briefMd: string; rubric: unknown },
  locale: Locale,
): Promise<{ briefMd: string; rubric: RubricRow[]; pending: boolean }> {
  const { value, pending } = await localized(capstoneKey(c.id), locale, capstoneFields(c));
  return {
    briefMd: value.briefMd ?? c.briefMd,
    rubric: rubricRows(c.rubric).map((r, i) => ({
      ...r,
      criterion: value[`rubric.${i}.criterion`] ?? r.criterion,
      description: r.description ? value[`rubric.${i}.description`] ?? r.description : r.description,
    })),
    pending,
  };
}

// ── Pre-warm (translate cron) ───────────────────────────────────────────────

/** One unit: free when cached; otherwise one model call against the budget. */
async function warmOne(key: string, locale: Locale, fields: Fields, budget: { left: number }): Promise<number> {
  if (budget.left <= 0) return 0;
  // Queue mode answers from the cache, or starts the job and returns null;
  // wait mode then joins that same in-flight job instead of starting another.
  if (await translated(key, locale, fields, "queue")) return 0;
  budget.left--;
  return (await translated(key, locale, fields, "wait")) ? 1 : 0;
}

async function warmBank(kind: QuestionKind, ownerId: string, bank: QuestionSource[], locale: Locale, budget: { left: number }): Promise<number> {
  let n = 0;
  const chunks = questionChunks(bank);
  for (let i = 0; i < chunks.length && budget.left > 0; i++) {
    const flat: Fields = {};
    chunks[i].map(questionFields).forEach((r, j) => Object.entries(r).forEach(([k, v]) => { flat[`${j}.${k}`] = v; }));
    n += await warmOne(bankKey(kind, ownerId, i), locale, flat, budget);
  }
  return n;
}

/** Labs first, then quiz and exam banks, micro-checks, exam instructions and capstones. */
export async function warm(locale: Locale, budget: { left: number }): Promise<number> {
  if (locale === "en") return 0;
  let n = 0;
  const qSelect = { select: { id: true, question: true, options: true, explanation: true } } as const;

  const labs = await prisma.lab.findMany({
    where: { isPublished: true },
    orderBy: [{ trackId: "asc" }, { sortOrder: "asc" }],
    select: { slug: true, title: true, labType: true, briefMd: true, scenarioMd: true, objectives: true, config: true },
  });
  for (const lab of labs) {
    if (budget.left <= 0) return n;
    n += await warmOne(labKey(lab.slug), locale, labFields(lab), budget);
  }

  const quizzes = await prisma.quiz.findMany({ select: { id: true, questions: qSelect } });
  for (const q of quizzes) {
    if (budget.left <= 0) return n;
    n += await warmBank("quiz", q.id, q.questions, locale, budget);
  }

  const exams = await prisma.finalExam.findMany({ select: { id: true, instructionsMd: true, questions: qSelect } });
  for (const e of exams) {
    if (budget.left <= 0) return n;
    if (examFields(e).instructionsMd) n += await warmOne(examKey(e.id), locale, examFields(e), budget);
    n += await warmBank("exam", e.id, e.questions, locale, budget);
  }

  const checks = await prisma.microCheck.findMany({ select: { id: true, questions: qSelect } });
  for (const c of checks) {
    if (budget.left <= 0) return n;
    n += await warmBank("micro", c.id, c.questions, locale, budget);
  }

  const capstones = await prisma.capstone.findMany({ select: { id: true, briefMd: true, rubric: true } });
  for (const c of capstones) {
    if (budget.left <= 0) return n;
    n += await warmOne(capstoneKey(c.id), locale, capstoneFields(c), budget);
  }
  return n;
}
