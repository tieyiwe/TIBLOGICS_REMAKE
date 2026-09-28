#!/usr/bin/env node
// Validates Learning Box content files before they are seeded.
//
//   node --experimental-strip-types scripts/validate-learn-content.mts <file.ts> [...]
//
// Exits non-zero on any error. Inspects every export by shape, so it works on
// a module file, a labs file, an exam file or a whole track.
//
// Why it is strict about questions: the AI Foundations banks were written with
// the right answer second (always-B scored 98% on the final exam) and as the
// longest option (95% of the time). Shuffling fixed the first at serve time.
// Only the content can fix the second, so this refuses banks that give the
// answer away by length.

import { pathToFileURL } from "url";
import path from "path";
import { register } from "node:module";

// Content files import each other without extensions ("../balance",
// "./track-3"), as TypeScript and Next.js expect. Node's own resolver does not
// add ".ts", so a whole track could not be loaded here. This hook retries an
// unresolved relative import with ".ts" and "/index.ts".
register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(spec, ctx, next) {
        try { return await next(spec, ctx); }
        catch (e) {
          if (!spec.startsWith(".") && !spec.startsWith("/")) throw e;
          for (const s of [spec + ".ts", spec + "/index.ts"]) {
            try { return await next(s, ctx); } catch {}
          }
          throw e;
        }
      }`),
);

type Q = { question: string; options: string[]; correctIndex: number; explanation: string; difficulty?: number; moduleNumber?: number };

// LEGACY=1 checks only the question banks. Used for AI Foundations, whose
// short lessons are a deliberate quick-read style; its questions still have to
// meet the same bar as everything else.
const LEGACY = process.env.LEGACY === "1";

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const EM_DASH = /—/g;
const BANNED_OPTION = /\b(all|none) of (the above|these)\b|\bboth [a-d]\b.*\band [a-d]\b|^[a-d] and [a-d]$/i;
// Statements that need a source if they are presented as fact.
const NEEDS_SOURCE = /\b(according to|a (recent )?(study|survey|report|poll) (by|from|found)|research (shows|found)|studies show|\d+(\.\d+)?\s?% of (companies|businesses|people|workers|users|employees|organi[sz]ations))/i;

function checkQuestions(qs: Q[], where: string, opts: { min: number; exam?: boolean; modules?: number }) {
  if (!Array.isArray(qs)) return err(`${where}: not an array`);
  if (qs.length < opts.min) err(`${where}: ${qs.length} questions, need at least ${opts.min}`);
  let longest = 0, shortest = 0, correctLen = 0, otherLen = 0;
  const seen = new Set<string>();
  qs.forEach((q, i) => {
    const at = `${where} Q${i + 1}`;
    if (!q.question || q.question.length < 15) err(`${at}: question too short`);
    if (seen.has(q.question)) err(`${at}: duplicate question`);
    seen.add(q.question);
    if (!Array.isArray(q.options) || q.options.length !== 4) return err(`${at}: must have exactly 4 options`);
    if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== 4) err(`${at}: duplicate options`);
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) err(`${at}: correctIndex out of range`);
    if (!q.explanation || q.explanation.length < 60) err(`${at}: explanation missing or under 60 characters`);
    q.options.forEach((o) => { if (BANNED_OPTION.test(o)) err(`${at}: position-dependent option "${o}" breaks when options are shuffled`); });
    if (EM_DASH.test(q.question + q.options.join(" "))) warn(`${at}: em dash in question or options`);
    const L = q.options.map((o) => o.length);
    const max = Math.max(...L), min = Math.min(...L);
    if (L[q.correctIndex] === max && L.filter((x) => x === max).length === 1) longest++;
    if (L[q.correctIndex] === min && L.filter((x) => x === min).length === 1) shortest++;
    correctLen += L[q.correctIndex];
    otherLen += (L.reduce((a, b) => a + b, 0) - L[q.correctIndex]) / 3;
    if (opts.exam) {
      if (!q.moduleNumber || q.moduleNumber < 1 || (opts.modules && q.moduleNumber > opts.modules)) err(`${at}: exam question needs moduleNumber 1..${opts.modules ?? "N"}`);
      if (!q.difficulty || q.difficulty < 1 || q.difficulty > 3) err(`${at}: exam question needs difficulty 1, 2 or 3`);
    }
  });
  const n = qs.length || 1;
  const longRate = longest / n;
  // With 4 options, an unbiased bank has the answer uniquely longest ~25% of the time.
  if (longRate > 0.4) err(`${where}: correct answer is the uniquely longest option in ${Math.round(longRate * 100)}% of questions (max 40%). Rewrite distractors to similar length.`);
  if (shortest / n > 0.4) err(`${where}: correct answer is the uniquely shortest option in ${Math.round((shortest / n) * 100)}% of questions (max 40%).`);
  const ratio = correctLen / Math.max(1, otherLen);
  if (ratio > 1.25 || ratio < 0.8) err(`${where}: correct answers average ${Math.round(ratio * 100)}% the length of distractors (keep within 80-125%).`);
  return { longRate };
}

function checkLesson(l: any, where: string) {
  if (LEGACY) return checkQuestions(l.microCheck ?? [], `${where} micro-check`, { min: 3 });
  if (!l.title) err(`${where}: no title`);
  if (!l.objective) err(`${where}: no objective`);
  if (!(l.durationMinutes >= 10 && l.durationMinutes <= 45)) err(`${where}: durationMinutes should be 10-45`);
  const w = words(l.bodyMd ?? "");
  if (w < 400) err(`${where}: body is ${w} words (min 400)`);
  if (w > 1400) warn(`${where}: body is ${w} words (over 1400; consider splitting)`);
  const h2 = (l.bodyMd.match(/^## /gm) ?? []).length;
  if (h2 < 3) err(`${where}: needs at least 3 "## " sections`);
  if (!/^##\s+(Try (it|this)|Your turn|Practice|Do this|Apply it)/im.test(l.bodyMd)) err(`${where}: must end with a practical "## Try it now" (or "Your turn") section`);
  const em = (l.bodyMd.match(EM_DASH) ?? []).length;
  if (em > 3) warn(`${where}: ${em} em dashes in the body (keep to 3 or fewer)`);
  const src = l.bodyMd.match(NEEDS_SOURCE);
  if (src) warn(`${where}: "${src[0]}" reads as a sourced claim. Remove it, or make sure it is true and name the source.`);
  checkQuestions(l.microCheck ?? [], `${where} micro-check`, { min: 4 });
}

function checkModules(mods: any[], where: string) {
  mods.forEach((m, mi) => {
    const at = `${where} M${mi + 1} "${m.title}"`;
    if (!m.summary) err(`${at}: no summary`);
    if (!LEGACY && (!Array.isArray(m.lessons) || m.lessons.length < 3 || m.lessons.length > 5)) err(`${at}: needs 3-5 lessons`);
    (m.lessons ?? []).forEach((l: any, li: number) => checkLesson(l, `${at} L${li + 1} "${l.title}"`));
    checkQuestions(m.quiz ?? [], `${at} quiz`, { min: 10 });
  });
}

function checkLabs(labs: any[], where: string) {
  const slugs = new Set<string>();
  labs.forEach((lab, i) => {
    const at = `${where} lab ${i + 1} "${lab.slug}"`;
    if (!lab.slug || !/^[a-z0-9-]+$/.test(lab.slug)) err(`${at}: slug must be kebab-case`);
    if (slugs.has(lab.slug)) err(`${at}: duplicate slug`);
    slugs.add(lab.slug);
    if (!["prompt", "critique", "build", "workbench"].includes(lab.labType)) err(`${at}: unknown labType`);
    if (lab.config?.kind !== lab.labType) err(`${at}: config.kind must equal labType`);
    if (!lab.moduleNumber) err(`${at}: needs moduleNumber`);
    if (!Array.isArray(lab.objectives) || lab.objectives.length < 2) err(`${at}: needs at least 2 objectives`);
    if (words(lab.briefMd ?? "") < 40) err(`${at}: brief too short`);
    const c = lab.config ?? {};
    if (lab.labType === "critique") {
      if (!Array.isArray(c.flaws) || c.flaws.length < 4) err(`${at}: needs at least 4 planted flaws`);
      const flawIds = new Set((c.flaws ?? []).map((f: any) => f.id));
      const flawCands = (c.candidates ?? []).filter((x: any) => x.isFlaw);
      const clean = (c.candidates ?? []).filter((x: any) => !x.isFlaw);
      if (flawCands.length !== (c.flaws ?? []).length) err(`${at}: every flaw needs exactly one candidate`);
      flawCands.forEach((x: any) => { if (!flawIds.has(x.flawId)) err(`${at}: candidate ${x.id} points at unknown flaw`); });
      if (clean.length < 3) err(`${at}: needs at least 3 correct statements as candidates, or flagging everything wins`);
      const norm = (s: string) => s.replace(/[*_`]/g, "").replace(/\s+/g, " ").toLowerCase();
      (c.flaws ?? []).forEach((f: any) => {
        const parts = String(f.quote).split(/…|\.\.\./).map((p) => p.trim()).filter(Boolean);
        if (!parts.every((p) => norm(c.answerMd ?? "").includes(norm(p)))) err(`${at}: flaw "${f.id}" quote not found in answerMd`);
      });
    }
    if (lab.labType === "workbench") {
      if (!Array.isArray(c.fields) || c.fields.length < 3 || c.fields.length > 6) err(`${at}: workbench needs 3-6 fields`);
      (c.fields ?? []).forEach((f: any) => { if (!f.id || !f.label || !f.prompt) err(`${at}: field needs id, label and prompt`); });
      (lab.objectives ?? []).forEach((o: any) => { if (!o.guidance || o.guidance.length < 40) err(`${at}: objective "${o.id}" needs grading guidance (40+ chars) for the evaluator`); });
    }
    if (lab.labType === "prompt") {
      if (!c.sandboxSystem) err(`${at}: prompt lab needs sandboxSystem`);
      if (!c.maxRuns) warn(`${at}: prompt lab has no maxRuns (defaults to 8)`);
    }
  });
}

function checkExam(fe: any, where: string, modules?: number) {
  if (!(fe.timeLimitMinutes > 0)) err(`${where}: timeLimitMinutes required`);
  if (!fe.instructionsMd) err(`${where}: instructionsMd required`);
  const qs = fe.questions ?? [];
  if (qs.length < (fe.questionsServed ?? 0) + 5) err(`${where}: bank of ${qs.length} must exceed questionsServed (${fe.questionsServed}) by at least 5 so attempts differ`);
  checkQuestions(qs, `${where} bank`, { min: fe.questionsServed ?? 1, exam: true, modules });
  if (modules) for (let m = 1; m <= modules; m++) {
    const n = qs.filter((q: Q) => q.moduleNumber === m).length;
    if (n < 5) err(`${where}: module ${m} has ${n} exam questions (min 5)`);
  }
}

function checkCapstone(c: any, where: string) {
  const sum = (c.rubric ?? []).reduce((n: number, r: any) => n + (r.weight ?? 0), 0);
  if (sum !== 100) err(`${where}: rubric weights sum to ${sum}, must be 100`);
  if ((c.rubric ?? []).length < 4) err(`${where}: rubric needs at least 4 criteria`);
  if (words(c.briefMd ?? "") < 200) err(`${where}: brief should be at least 200 words`);
}

function inspect(name: string, v: any) {
  const where = name;
  if (Array.isArray(v) && v.length && v[0]?.lessons) return checkModules(v, where);
  if (Array.isArray(v) && v.length && v[0]?.labType) return checkLabs(v, where);
  if (Array.isArray(v) && v.length && v[0]?.options) return checkQuestions(v, where, { min: 1, exam: v.every((q: any) => q.moduleNumber) });
  if (v && typeof v === "object" && Array.isArray(v.modules)) {
    checkModules(v.modules.filter((m: any) => m.lessons?.length), `${where}`);
    if (v.labs) checkLabs(v.labs, `${where}`);
    if (v.finalExam) checkExam(v.finalExam, `${where} exam`, v.modules.length);
    if (v.capstone) checkCapstone(v.capstone, `${where} capstone`);
    return;
  }
  if (v && typeof v === "object" && Array.isArray(v.questions) && v.timeLimitMinutes) return checkExam(v, where);
  if (v && typeof v === "object" && Array.isArray(v.rubric)) return checkCapstone(v, where);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node --experimental-strip-types scripts/validate-learn-content.mts <file.ts> [...]");
  process.exit(2);
}
for (const f of files) {
  const mod = await import(pathToFileURL(path.resolve(f)).href);
  for (const [k, v] of Object.entries(mod)) inspect(`${path.basename(f)}:${k}`, v);
}
for (const w of warnings) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(`\n${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
