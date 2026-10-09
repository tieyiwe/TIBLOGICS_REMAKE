import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { LAB_TYPES } from "@/lib/learn/labs/types";
import { ensureLearnEditColumns } from "./columns";
import { addTombstone } from "./tombstones";
import { INDEXNOW_SECTIONS, indexNowSoon } from "@/lib/seo/indexnow";

// Every change the Learning Box editor can make, validated.
//
// Rules that hold for every operation:
//   - Whatever is changed gets `editedAt`, so re-seeding never overwrites it.
//   - Seeded content that is deleted is recorded (tombstones.ts) so re-seeding
//     does not bring it back.
//   - A delete that would erase learner records (progress, attempts,
//     certificates) is refused unless the request confirms it, and the
//     refusal says exactly what would be lost.

export class ContentError extends Error {
  constructor(message: string, public status = 400, public needsConfirm?: Record<string, number>) {
    super(message);
  }
}

const now = () => new Date();
const s = (max: number) => z.string().trim().max(max);
const id = z.string().min(1).max(64);

// ── Schemas ─────────────────────────────────────────────────────────────────

const TrackFields = z.object({
  title: s(160).min(3),
  tagline: s(240).nullable().optional(),
  description: s(8000).min(10),
  level: z.enum(["starter", "beginner", "intermediate", "advanced"]),
  levelEnd: z.enum(["starter", "beginner", "intermediate", "advanced"]).nullable().optional(),
  status: z.enum(["draft", "coming_soon", "live"]),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colour must be a hex value like #F47C4C"),
  heroImage: z.string().trim().url().max(500).nullable().optional().or(z.literal("").transform(() => null)),
  certificateName: s(160).min(3),
  audience: s(600).nullable().optional(),
  outcomes: z.array(s(300).min(1)).max(12),
  estimatedHours: z.coerce.number().min(0).max(500),
  /** One-time price in cents; null = from the level (lib/learn/pricing.ts). */
  priceCents: z.number().int().min(100, "Price must be at least $1").max(1_000_000, "Price must be at most $10,000").nullable().optional(),
});

const LessonFields = z.object({
  title: s(200).min(2),
  objective: s(500).nullable().optional(),
  contentType: z.enum(["video", "article", "mixed"]),
  videoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => !v || /^https:\/\//i.test(v), "Video links must start with https://")
    .nullable()
    .optional(),
  bodyMd: z.string().max(60000),
  durationMinutes: z.coerce.number().int().min(1).max(600),
  isPreview: z.boolean(),
});

const ResourceFields = z.object({
  title: s(200).min(2),
  url: z.string().trim().max(1000).refine((v) => /^https?:\/\//i.test(v), "Links must start with http:// or https://"),
  resourceType: z.enum(["tool", "article", "video", "dataset", "template", "account_signup"]),
  isFree: z.boolean(),
  isRequired: z.boolean(),
  notes: s(600).nullable().optional(),
});

const QuestionFields = z
  .object({
    question: s(2000).min(5),
    options: z.array(s(600).min(1)).min(2, "At least two options").max(6, "At most six options"),
    correctIndex: z.coerce.number().int().min(0),
    explanation: s(2000).min(3, "Explain the right answer; learners see it after answering"),
    difficulty: z.coerce.number().int().min(1).max(3).optional(),
    moduleId: id.nullable().optional(),
  })
  .refine((q) => q.correctIndex < q.options.length, { message: "Choose which option is correct", path: ["correctIndex"] })
  .refine((q) => new Set(q.options.map((o) => o.toLowerCase())).size === q.options.length, { message: "Two options are the same", path: ["options"] });

const Objective = z.object({ id: s(60).min(1), label: s(300).min(2), weight: z.coerce.number().min(1).max(100), guidance: s(1000).optional() });

const LabFields = z.object({
  title: s(200).min(3),
  slug: z.string().trim().regex(/^[a-z0-9-]{3,80}$/, "Slug: lowercase letters, numbers and dashes"),
  labType: z.enum(LAB_TYPES),
  moduleId: id.nullable().optional(),
  lessonId: id.nullable().optional(),
  briefMd: z.string().max(20000).min(10),
  scenarioMd: z.string().max(20000).nullable().optional(),
  objectives: z.array(Objective).min(1, "Add at least one objective to score against").max(10),
  config: z.record(z.unknown()),
  passScore: z.coerce.number().int().min(0).max(100),
  points: z.coerce.number().int().min(0).max(1000),
  estimatedMinutes: z.coerce.number().int().min(1).max(600),
  isPublished: z.boolean(),
});

/** Checks the per-type settings the lab runner relies on, so a lab cannot be published broken. */
function checkLabConfig(type: (typeof LAB_TYPES)[number], config: Record<string, unknown>) {
  const need = (cond: boolean, msg: string) => {
    if (!cond) throw new ContentError(`Lab settings: ${msg}`);
  };
  if (type === "prompt") {
    need(config.maxRuns === undefined || (Number.isInteger(config.maxRuns) && (config.maxRuns as number) > 0 && (config.maxRuns as number) <= 20), "maxRuns must be 1 to 20");
  }
  if (type === "critique") {
    need(typeof config.answerMd === "string" && (config.answerMd as string).length > 20, "answerMd (the AI answer to review) is required");
    need(Array.isArray(config.flaws) && (config.flaws as unknown[]).length > 0, "list at least one planted flaw in flaws");
    need(Array.isArray(config.candidates) && (config.candidates as unknown[]).length > 1, "candidates must list the statements learners choose from");
    for (const f of config.flaws as Array<Record<string, unknown>>) {
      need(typeof f.quote === "string" && (config.answerMd as string).includes(f.quote as string), `flaw "${String(f.id)}": its quote must appear word for word in answerMd`);
    }
  }
  if (type === "build") {
    need(Array.isArray(config.steps) && (config.steps as unknown[]).length > 0, "list the steps learners complete in steps");
  }
  if (type === "workbench") {
    const fields = config.fields as Array<Record<string, unknown>> | undefined;
    need(Array.isArray(fields) && fields.length > 0, "list the fields learners fill in");
    const ids = new Set<string>();
    for (const f of fields!) {
      need(typeof f.id === "string" && typeof f.label === "string" && typeof f.prompt === "string", "each field needs id, label and prompt");
      need(!ids.has(f.id as string), `field id "${String(f.id)}" is used twice`);
      ids.add(f.id as string);
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function trackSlugOf(trackId: string) {
  const t = await prisma.learnTrack.findUnique({ where: { id: trackId }, select: { slug: true } });
  if (!t) throw new ContentError("Track not found", 404);
  return t.slug;
}

/** Keeps a module's minutes in step with its lessons and labs after an edit. */
async function recomputeModuleMinutes(moduleId: string) {
  const [lessons, labs] = await Promise.all([
    prisma.lesson.aggregate({ where: { moduleId }, _sum: { durationMinutes: true } }),
    prisma.lab.aggregate({ where: { moduleId }, _sum: { estimatedMinutes: true } }),
  ]);
  await prisma.learnModule.update({
    where: { id: moduleId },
    data: { estimatedMinutes: (lessons._sum.durationMinutes ?? 0) + (labs._sum.estimatedMinutes ?? 0) },
  });
}

/** Swap an item with its neighbour in the given direction. */
async function move<T extends { id: string; sortOrder: number }>(
  siblings: T[],
  itemId: string,
  dir: "up" | "down",
  update: (id: string, sortOrder: number) => Prisma.PrismaPromise<unknown>,
) {
  const sorted = [...siblings].sort((a, b) => a.sortOrder - b.sortOrder);
  const i = sorted.findIndex((x) => x.id === itemId);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0) throw new ContentError("Not found", 404);
  if (j < 0 || j >= sorted.length) return;
  await prisma.$transaction([update(sorted[i].id, sorted[j].sortOrder), update(sorted[j].id, sorted[i].sortOrder)]);
}

function confirmOrThrow(confirm: boolean | undefined, counts: Record<string, number>, what: string) {
  const loses = Object.fromEntries(Object.entries(counts).filter(([, n]) => n > 0));
  if (Object.keys(loses).length && !confirm) {
    const list = Object.entries(loses).map(([k, n]) => `${n} ${k}`).join(", ");
    throw new ContentError(`Deleting this ${what} also deletes ${list}. Confirm to go ahead.`, 409, loses);
  }
}

// ── Operations ──────────────────────────────────────────────────────────────

export const Op = z.discriminatedUnion("op", [
  z.object({ op: z.literal("track.create"), title: s(160).min(3), slug: z.string().trim().regex(/^[a-z0-9-]{3,80}$/, "Slug: lowercase letters, numbers and dashes") }),
  z.object({ op: z.literal("track.update"), id, data: TrackFields }),
  z.object({ op: z.literal("track.delete"), id, confirm: z.boolean().optional() }),
  // The status switch in the admin track list: only the status changes.
  z.object({ op: z.literal("track.status"), id, status: z.enum(["draft", "coming_soon", "live"]) }),

  z.object({ op: z.literal("module.create"), trackId: id, title: s(200).min(2), summary: s(1000).nullable().optional() }),
  z.object({ op: z.literal("module.update"), id, title: s(200).min(2), summary: s(1000).nullable().optional() }),
  z.object({ op: z.literal("module.move"), id, dir: z.enum(["up", "down"]) }),
  z.object({ op: z.literal("module.delete"), id, confirm: z.boolean().optional() }),

  z.object({ op: z.literal("lesson.create"), moduleId: id, title: s(200).min(2) }),
  z.object({ op: z.literal("lesson.update"), id, data: LessonFields }),
  z.object({ op: z.literal("lesson.move"), id, dir: z.enum(["up", "down"]) }),
  z.object({ op: z.literal("lesson.delete"), id, confirm: z.boolean().optional() }),

  z.object({ op: z.literal("resource.create"), lessonId: id, data: ResourceFields }),
  z.object({ op: z.literal("resource.update"), id, data: ResourceFields }),
  z.object({ op: z.literal("resource.move"), id, dir: z.enum(["up", "down"]) }),
  z.object({ op: z.literal("resource.delete"), id }),

  z.object({ op: z.literal("bank.settings"), bank: z.enum(["micro", "quiz"]), parentId: id, passScore: z.coerce.number().int().min(0).max(100), questionsServed: z.coerce.number().int().min(1).max(50) }),
  z.object({
    op: z.literal("exam.settings"), trackId: id,
    data: z.object({
      title: s(200).min(3), timeLimitMinutes: z.coerce.number().int().min(5).max(600), questionsServed: z.coerce.number().int().min(1).max(200),
      passScore: z.coerce.number().int().min(0).max(100), distinctionScore: z.coerce.number().int().min(0).max(100),
      maxAttempts: z.coerce.number().int().min(1).max(20), cooldownHours: z.coerce.number().int().min(0).max(720), instructionsMd: z.string().max(10000),
    }),
  }),
  z.object({ op: z.literal("question.create"), bank: z.enum(["micro", "quiz", "exam"]), parentId: id, data: QuestionFields }),
  z.object({ op: z.literal("question.update"), bank: z.enum(["micro", "quiz", "exam"]), id, data: QuestionFields }),
  z.object({ op: z.literal("question.delete"), bank: z.enum(["micro", "quiz", "exam"]), id }),

  z.object({ op: z.literal("lab.save"), trackId: id, id: id.optional(), data: LabFields }),
  z.object({ op: z.literal("lab.delete"), id, confirm: z.boolean().optional() }),

  z.object({
    op: z.literal("capstone.save"), trackId: id,
    data: z.object({
      briefMd: z.string().min(20).max(20000),
      rubric: z.array(z.object({ criterion: s(200).min(2), weight: z.coerce.number().int().min(1).max(100), description: s(1000).optional() })).min(1).max(12),
      passThreshold: z.coerce.number().int().min(0).max(100),
    }),
  }),
]);

export type ContentOp = z.infer<typeof Op>;

export async function runOp(op: ContentOp): Promise<Record<string, unknown>> {
  await ensureLearnEditColumns();
  const t = now();

  switch (op.op) {
    // ── Tracks ──
    case "track.create": {
      if (await prisma.learnTrack.findUnique({ where: { slug: op.slug } })) throw new ContentError("A track with that slug already exists");
      const max = await prisma.learnTrack.aggregate({ _max: { sortOrder: true } });
      const row = await prisma.learnTrack.create({
        data: {
          slug: op.slug, title: op.title, description: "Describe what learners will be able to do by the end.",
          status: "draft", level: "beginner", certificateName: `TIBLOGICS Certified ${op.title}`,
          sortOrder: (max._max.sortOrder ?? 0) + 1, outcomes: [], editedAt: t,
        },
      });
      return { id: row.id };
    }
    case "track.update": {
      const d = op.data;
      if (d.status === "live") {
        const lessons = await prisma.lesson.count({ where: { module: { trackId: op.id } } });
        if (lessons === 0) throw new ContentError("Add at least one lesson before making a track live");
      }
      const saved = await prisma.learnTrack.update({
        where: { id: op.id },
        data: { ...d, tagline: d.tagline || null, audience: d.audience || null, heroImage: d.heroImage || null, levelEnd: d.levelEnd || null, outcomes: d.outcomes, editedAt: t },
      });
      if (saved.status === "live" || saved.status === "coming_soon") indexNowSoon(INDEXNOW_SECTIONS.track(saved.slug));
      return {};
    }
    case "track.status": {
      if (op.status === "live") {
        const lessons = await prisma.lesson.count({ where: { module: { trackId: op.id } } });
        if (lessons === 0) throw new ContentError("Add at least one lesson before making a track live");
      }
      // editedAt, as in the track editor: re-seeding then keeps this status.
      const saved = await prisma.learnTrack.update({ where: { id: op.id }, data: { status: op.status, editedAt: t } });
      if (saved.status === "live" || saved.status === "coming_soon") indexNowSoon(INDEXNOW_SECTIONS.track(saved.slug));
      return {};
    }
    case "track.delete": {
      const track = await prisma.learnTrack.findUnique({ where: { id: op.id }, select: { slug: true } });
      if (!track) throw new ContentError("Track not found", 404);
      const [certs, progress] = await Promise.all([
        prisma.learnCertificate.count({ where: { trackId: op.id } }),
        prisma.lessonProgress.count({ where: { lesson: { module: { trackId: op.id } } } }),
      ]);
      if (certs > 0) throw new ContentError(`This track has issued ${certs} certificate${certs === 1 ? "" : "s"}, which would stop verifying. Set it to draft instead.`, 409);
      confirmOrThrow(op.confirm, { "lesson completions": progress }, "track");
      await prisma.learnTrack.delete({ where: { id: op.id } });
      await addTombstone(`track:${track.slug}`);
      return {};
    }

    // ── Modules ──
    case "module.create": {
      const max = await prisma.learnModule.aggregate({ where: { trackId: op.trackId }, _max: { sortOrder: true } });
      const row = await prisma.learnModule.create({
        data: { trackId: op.trackId, title: op.title, summary: op.summary || null, sortOrder: (max._max.sortOrder ?? -1) + 1, editedAt: t },
      });
      return { id: row.id };
    }
    case "module.update":
      await prisma.learnModule.update({ where: { id: op.id }, data: { title: op.title, summary: op.summary || null, editedAt: t } });
      return {};
    case "module.move": {
      const m = await prisma.learnModule.findUnique({ where: { id: op.id }, select: { trackId: true } });
      if (!m) throw new ContentError("Module not found", 404);
      const siblings = await prisma.learnModule.findMany({ where: { trackId: m.trackId }, select: { id: true, sortOrder: true } });
      await move(siblings, op.id, op.dir, (mid, sortOrder) => prisma.learnModule.update({ where: { id: mid }, data: { sortOrder, editedAt: t } }));
      return {};
    }
    case "module.delete": {
      const m = await prisma.learnModule.findUnique({ where: { id: op.id }, select: { trackId: true, sortOrder: true } });
      if (!m) throw new ContentError("Module not found", 404);
      const [progress, quizAttempts] = await Promise.all([
        prisma.lessonProgress.count({ where: { lesson: { moduleId: op.id } } }),
        prisma.quizAttempt.count({ where: { quiz: { moduleId: op.id } } }),
      ]);
      confirmOrThrow(op.confirm, { "lesson completions": progress, "quiz attempts": quizAttempts }, "module");
      const slug = await trackSlugOf(m.trackId);
      await prisma.learnModule.delete({ where: { id: op.id } });
      await addTombstone(`module:${slug}#${m.sortOrder}`);
      return {};
    }

    // ── Lessons ──
    case "lesson.create": {
      const max = await prisma.lesson.aggregate({ where: { moduleId: op.moduleId }, _max: { sortOrder: true } });
      const row = await prisma.lesson.create({
        data: { moduleId: op.moduleId, title: op.title, sortOrder: (max._max.sortOrder ?? -1) + 1, bodyMd: "", contentType: "article", durationMinutes: 10, editedAt: t },
      });
      await recomputeModuleMinutes(op.moduleId);
      return { id: row.id };
    }
    case "lesson.update": {
      const d = op.data;
      const row = await prisma.lesson.update({
        where: { id: op.id },
        // videoUrl is left alone when not sent (the Video section saves it itself).
        data: { ...d, videoUrl: d.videoUrl === undefined ? undefined : d.videoUrl || null, objective: d.objective || null, editedAt: t },
      });
      await recomputeModuleMinutes(row.moduleId);
      return {};
    }
    case "lesson.move": {
      const l = await prisma.lesson.findUnique({ where: { id: op.id }, select: { moduleId: true } });
      if (!l) throw new ContentError("Lesson not found", 404);
      const siblings = await prisma.lesson.findMany({ where: { moduleId: l.moduleId }, select: { id: true, sortOrder: true } });
      await move(siblings, op.id, op.dir, (lid, sortOrder) => prisma.lesson.update({ where: { id: lid }, data: { sortOrder, editedAt: t } }));
      return {};
    }
    case "lesson.delete": {
      const l = await prisma.lesson.findUnique({ where: { id: op.id }, select: { moduleId: true, sortOrder: true, module: { select: { sortOrder: true, trackId: true } } } });
      if (!l) throw new ContentError("Lesson not found", 404);
      const [progress, checks] = await Promise.all([
        prisma.lessonProgress.count({ where: { lessonId: op.id } }),
        prisma.microCheckAttempt.count({ where: { microCheck: { lessonId: op.id } } }),
      ]);
      confirmOrThrow(op.confirm, { "lesson completions": progress, "check attempts": checks }, "lesson");
      const slug = await trackSlugOf(l.module.trackId);
      await prisma.lesson.delete({ where: { id: op.id } });
      await addTombstone(`lesson:${slug}#${l.module.sortOrder}#${l.sortOrder}`);
      await recomputeModuleMinutes(l.moduleId);
      return {};
    }

    // ── Resources ──
    case "resource.create": {
      const max = await prisma.lessonResource.aggregate({ where: { lessonId: op.lessonId }, _max: { sortOrder: true } });
      await prisma.$transaction([
        prisma.lessonResource.create({ data: { lessonId: op.lessonId, ...op.data, notes: op.data.notes || null, sortOrder: (max._max.sortOrder ?? -1) + 1 } }),
        prisma.lesson.update({ where: { id: op.lessonId }, data: { hasPractice: true, editedAt: t } }),
      ]);
      return {};
    }
    case "resource.update": {
      const r = await prisma.lessonResource.update({ where: { id: op.id }, data: { ...op.data, notes: op.data.notes || null } });
      await prisma.lesson.update({ where: { id: r.lessonId }, data: { editedAt: t } });
      return {};
    }
    case "resource.move": {
      const r = await prisma.lessonResource.findUnique({ where: { id: op.id }, select: { lessonId: true } });
      if (!r) throw new ContentError("Resource not found", 404);
      const siblings = await prisma.lessonResource.findMany({ where: { lessonId: r.lessonId }, select: { id: true, sortOrder: true } });
      await move(siblings, op.id, op.dir, (rid, sortOrder) => prisma.lessonResource.update({ where: { id: rid }, data: { sortOrder } }));
      await prisma.lesson.update({ where: { id: r.lessonId }, data: { editedAt: t } });
      return {};
    }
    case "resource.delete": {
      const r = await prisma.lessonResource.delete({ where: { id: op.id } });
      const left = await prisma.lessonResource.count({ where: { lessonId: r.lessonId } });
      await prisma.lesson.update({ where: { id: r.lessonId }, data: { editedAt: t, hasPractice: left > 0 } });
      return {};
    }

    // ── Question banks ──
    case "bank.settings": {
      if (op.bank === "micro") {
        await prisma.microCheck.upsert({
          where: { lessonId: op.parentId },
          create: { lessonId: op.parentId, passScore: op.passScore, questionsServed: op.questionsServed, editedAt: t },
          update: { passScore: op.passScore, questionsServed: op.questionsServed, editedAt: t },
        });
      } else {
        await prisma.quiz.upsert({
          where: { moduleId: op.parentId },
          create: { moduleId: op.parentId, passScore: op.passScore, questionsServed: op.questionsServed, editedAt: t },
          update: { passScore: op.passScore, questionsServed: op.questionsServed, editedAt: t },
        });
      }
      return {};
    }
    case "exam.settings": {
      if (op.data.distinctionScore < op.data.passScore) throw new ContentError("The distinction score cannot be below the pass score");
      await prisma.finalExam.upsert({
        where: { trackId: op.trackId },
        create: { trackId: op.trackId, ...op.data, editedAt: t },
        update: { ...op.data, editedAt: t },
      });
      return {};
    }
    case "question.create": {
      const { question, options, correctIndex, explanation, difficulty, moduleId } = op.data;
      const base = { question, options, correctIndex, explanation };
      if (op.bank === "micro") {
        const check = await prisma.microCheck.upsert({
          where: { lessonId: op.parentId },
          create: { lessonId: op.parentId, passScore: 67, questionsServed: 3, editedAt: t },
          update: { editedAt: t },
        });
        await prisma.microCheckQuestion.create({ data: { microCheckId: check.id, ...base } });
      } else if (op.bank === "quiz") {
        const quiz = await prisma.quiz.upsert({
          where: { moduleId: op.parentId },
          create: { moduleId: op.parentId, passScore: 80, questionsServed: 8, editedAt: t },
          update: { editedAt: t },
        });
        await prisma.quizQuestion.create({ data: { quizId: quiz.id, ...base } });
      } else {
        const exam = await prisma.finalExam.findUnique({ where: { trackId: op.parentId } });
        if (!exam) throw new ContentError("Save the exam settings first");
        await prisma.finalExam.update({ where: { id: exam.id }, data: { editedAt: t } });
        await prisma.finalExamQuestion.create({ data: { finalExamId: exam.id, ...base, difficulty: difficulty ?? 2, moduleId: moduleId || null } });
      }
      return {};
    }
    case "question.update": {
      const { question, options, correctIndex, explanation, difficulty, moduleId } = op.data;
      const base = { question, options, correctIndex, explanation };
      if (op.bank === "micro") {
        const q = await prisma.microCheckQuestion.update({ where: { id: op.id }, data: base });
        await prisma.microCheck.update({ where: { id: q.microCheckId }, data: { editedAt: t } });
      } else if (op.bank === "quiz") {
        const q = await prisma.quizQuestion.update({ where: { id: op.id }, data: base });
        await prisma.quiz.update({ where: { id: q.quizId }, data: { editedAt: t } });
      } else {
        // Answer order is shuffled per learner from the options, so changing a
        // question under someone mid-exam would change what their saved answer
        // means. Wait until live sessions that include it have finished.
        const live = await prisma.finalExamSession.count({
          where: { status: "in_progress", expiresAt: { gt: new Date() }, questionIds: { array_contains: [op.id] } },
        });
        if (live > 0) {
          throw new ContentError(`${live} learner${live === 1 ? " is" : "s are"} taking an exam that includes this question right now. Try again once they finish.`, 409);
        }
        const q = await prisma.finalExamQuestion.update({ where: { id: op.id }, data: { ...base, difficulty: difficulty ?? 2, moduleId: moduleId || null } });
        await prisma.finalExam.update({ where: { id: q.finalExamId }, data: { editedAt: t } });
      }
      return {};
    }
    case "question.delete": {
      // Scoring skips questions that no longer exist (exam-scoring.ts,
      // quiz/submit), so deleting one never breaks an attempt in progress.
      if (op.bank === "micro") {
        const q = await prisma.microCheckQuestion.delete({ where: { id: op.id } });
        await prisma.microCheck.update({ where: { id: q.microCheckId }, data: { editedAt: t } });
      } else if (op.bank === "quiz") {
        const q = await prisma.quizQuestion.delete({ where: { id: op.id } });
        await prisma.quiz.update({ where: { id: q.quizId }, data: { editedAt: t } });
      } else {
        const q = await prisma.finalExamQuestion.delete({ where: { id: op.id } });
        await prisma.finalExam.update({ where: { id: q.finalExamId }, data: { editedAt: t } });
      }
      return {};
    }

    // ── Labs ──
    case "lab.save": {
      const d = op.data;
      checkLabConfig(d.labType, d.config);
      const clash = await prisma.lab.findUnique({ where: { slug: d.slug }, select: { id: true } });
      if (clash && clash.id !== op.id) throw new ContentError("Another lab already uses that slug");
      const data = {
        trackId: op.trackId, moduleId: d.moduleId || null, lessonId: d.lessonId || null, slug: d.slug, title: d.title,
        labType: d.labType, briefMd: d.briefMd, scenarioMd: d.scenarioMd || null,
        objectives: d.objectives as unknown as Prisma.InputJsonValue,
        config: { ...d.config, kind: d.labType } as unknown as Prisma.InputJsonValue,
        passScore: d.passScore, points: d.points, estimatedMinutes: d.estimatedMinutes, isPublished: d.isPublished, editedAt: t,
      };
      const row = op.id
        ? await prisma.lab.update({ where: { id: op.id }, data })
        : await prisma.lab.create({ data: { ...data, sortOrder: (await prisma.lab.count({ where: { trackId: op.trackId } })) } });
      if (row.moduleId) await recomputeModuleMinutes(row.moduleId);
      return { id: row.id };
    }
    case "lab.delete": {
      const lab = await prisma.lab.findUnique({ where: { id: op.id }, select: { slug: true, moduleId: true } });
      if (!lab) throw new ContentError("Lab not found", 404);
      const attempts = await prisma.labAttempt.count({ where: { labId: op.id } });
      confirmOrThrow(op.confirm, { "lab attempts": attempts }, "lab");
      await prisma.lab.delete({ where: { id: op.id } });
      await addTombstone(`lab:${lab.slug}`);
      if (lab.moduleId) await recomputeModuleMinutes(lab.moduleId);
      return {};
    }

    // ── Capstone ──
    case "capstone.save": {
      const weight = op.data.rubric.reduce((n, r) => n + r.weight, 0);
      if (weight !== 100) throw new ContentError(`Rubric weights add up to ${weight}%; they must total 100%`);
      await prisma.capstone.upsert({
        where: { trackId: op.trackId },
        create: { trackId: op.trackId, ...op.data, rubric: op.data.rubric as unknown as Prisma.InputJsonValue, editedAt: t },
        update: { ...op.data, rubric: op.data.rubric as unknown as Prisma.InputJsonValue, editedAt: t },
      });
      return {};
    }
  }
}
