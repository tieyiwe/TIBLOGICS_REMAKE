// Idempotent seed runner. Re-running updates content in place and never
// duplicates a track, module, lesson, or question — safe to run on every
// deploy. Learner progress is never touched.
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  assertDurationConsistency,
  moduleMinutes,
  trackMinutes,
  type SeedQuestion,
  type SeedTrack,
} from "./types";
import { TRACKS } from "./tracks";

export interface SeedReport {
  track: string;
  created: boolean;
  modules: number;
  lessons: number;
  microQuestions: number;
  quizQuestions: number;
  examQuestions: number;
  labs: number;
  minutes: number;
  warnings: string[];
}

function q(question: SeedQuestion) {
  return {
    question: question.question,
    options: question.options as unknown as Prisma.InputJsonValue,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
  };
}

/** Validate a question bank before it reaches the database. */
function validateBank(label: string, bank: SeedQuestion[], warnings: string[]) {
  bank.forEach((question, i) => {
    if (question.options.length < 2) {
      warnings.push(`${label} Q${i + 1}: fewer than 2 options`);
    }
    if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
      throw new Error(`${label} Q${i + 1}: correctIndex ${question.correctIndex} is out of range`);
    }
    if (!question.explanation?.trim()) {
      warnings.push(`${label} Q${i + 1}: no explanation — learners see this after answering`);
    }
  });
}

export async function seedTrack(track: SeedTrack): Promise<SeedReport> {
  const warnings: string[] = [];
  assertDurationConsistency(track);

  const minutes = trackMinutes(track);
  const estimatedHours = track.estimatedHours ?? Math.round((minutes / 60) * 10) / 10;

  const existing = await prisma.learnTrack.findUnique({
    where: { slug: track.slug },
    select: { id: true },
  });

  const trackData = {
    title: track.title,
    tagline: track.tagline ?? null,
    description: track.description,
    level: track.level,
    levelEnd: track.levelEnd ?? null,
    status: track.status,
    sortOrder: track.sortOrder,
    accentColor: track.accentColor,
    certificateName: track.certificateName,
    audience: track.audience ?? null,
    outcomes: track.outcomes as unknown as Prisma.InputJsonValue,
    estimatedHours,
    estimatedWeeksAt3Hrs: track.estimatedWeeksAt3Hrs ?? Math.max(1, Math.round(estimatedHours / 3)),
  };

  const row = await prisma.learnTrack.upsert({
    where: { slug: track.slug },
    create: { slug: track.slug, ...trackData },
    update: trackData,
  });

  let lessonCount = 0;
  let microQuestions = 0;
  let quizQuestions = 0;

  // Module numbers → ids, so final-exam questions can map to modules
  const moduleIds: string[] = [];

  for (const [mi, mod] of track.modules.entries()) {
    // sortOrder is the stable identity of a module within a track
    const existingModule = await prisma.learnModule.findFirst({
      where: { trackId: row.id, sortOrder: mi },
      select: { id: true },
    });

    const modData = {
      title: mod.title,
      summary: mod.summary ?? null,
      estimatedMinutes: moduleMinutes(mod),
    };

    const modRow = existingModule
      ? await prisma.learnModule.update({ where: { id: existingModule.id }, data: modData })
      : await prisma.learnModule.create({
          data: { trackId: row.id, sortOrder: mi, ...modData },
        });

    moduleIds[mi] = modRow.id;

    for (const [li, lesson] of mod.lessons.entries()) {
      const existingLesson = await prisma.lesson.findFirst({
        where: { moduleId: modRow.id, sortOrder: li },
        select: { id: true },
      });

      const lessonData = {
        title: lesson.title,
        contentType: lesson.contentType ?? (lesson.videoUrl ? "mixed" : "article"),
        videoUrl: lesson.videoUrl ?? null,
        bodyMd: lesson.bodyMd,
        durationMinutes: lesson.durationMinutes,
        objective: lesson.objective ?? null,
        isPreview: lesson.isPreview ?? false,
        hasPractice: (lesson.resources?.length ?? 0) > 0,
      };

      const lessonRow = existingLesson
        ? await prisma.lesson.update({ where: { id: existingLesson.id }, data: lessonData })
        : await prisma.lesson.create({
            data: { moduleId: modRow.id, sortOrder: li, ...lessonData },
          });

      lessonCount++;

      // Resources — replaced wholesale, they carry no learner state
      await prisma.lessonResource.deleteMany({ where: { lessonId: lessonRow.id } });
      if (lesson.resources?.length) {
        await prisma.lessonResource.createMany({
          data: lesson.resources.map((r, ri) => ({
            lessonId: lessonRow.id,
            title: r.title,
            url: r.url,
            resourceType: r.resourceType,
            isFree: r.isFree ?? true,
            isRequired: r.isRequired ?? false,
            notes: r.notes ?? null,
            sortOrder: ri,
          })),
        });
      }

      // Micro-check. Attempts reference the MicroCheck, not its questions, so
      // replacing the bank preserves learner history.
      if (lesson.microCheck?.length) {
        validateBank(`${track.slug} M${mi + 1}L${li + 1} micro`, lesson.microCheck, warnings);

        const check = await prisma.microCheck.upsert({
          where: { lessonId: lessonRow.id },
          create: { lessonId: lessonRow.id, passScore: 67, questionsServed: 3 },
          update: { questionsServed: Math.min(3, lesson.microCheck.length) },
        });
        await prisma.microCheckQuestion.deleteMany({ where: { microCheckId: check.id } });
        await prisma.microCheckQuestion.createMany({
          data: lesson.microCheck.map((question) => ({ microCheckId: check.id, ...q(question) })),
        });
        microQuestions += lesson.microCheck.length;
      }
    }

    // Module quiz
    if (mod.quiz?.length) {
      validateBank(`${track.slug} M${mi + 1} quiz`, mod.quiz, warnings);
      if (mod.quiz.length < 8) {
        warnings.push(
          `${track.slug} M${mi + 1}: quiz bank has ${mod.quiz.length} questions — serving ${Math.min(8, mod.quiz.length)}. A larger bank gives better retake variety.`,
        );
      }

      const quiz = await prisma.quiz.upsert({
        where: { moduleId: modRow.id },
        create: { moduleId: modRow.id, passScore: 80, questionsServed: Math.min(8, mod.quiz.length) },
        update: { questionsServed: Math.min(8, mod.quiz.length) },
      });
      await prisma.quizQuestion.deleteMany({ where: { quizId: quiz.id } });
      await prisma.quizQuestion.createMany({
        data: mod.quiz.map((question) => ({ quizId: quiz.id, ...q(question) })),
      });
      quizQuestions += mod.quiz.length;
    }
  }

  // ── Final exam ──────────────────────────────────────────────────────────
  let examQuestions = 0;
  if (track.finalExam) {
    const fe = track.finalExam;
    validateBank(`${track.slug} final exam`, fe.questions, warnings);

    const served = Math.min(fe.questionsServed, fe.questions.length);
    if (fe.questions.length < fe.questionsServed) {
      warnings.push(
        `${track.slug}: exam bank has ${fe.questions.length} questions but ${fe.questionsServed} were requested — serving ${served}.`,
      );
    }

    const examData = {
      title: fe.title,
      timeLimitMinutes: fe.timeLimitMinutes,
      questionsServed: served,
      passScore: fe.passScore ?? 75,
      distinctionScore: fe.distinctionScore ?? 90,
      maxAttempts: fe.maxAttempts ?? 3,
      cooldownHours: fe.cooldownHours ?? 24,
      instructionsMd: fe.instructionsMd,
    };

    const exam = await prisma.finalExam.upsert({
      where: { trackId: row.id },
      create: { trackId: row.id, ...examData },
      update: examData,
    });

    await prisma.finalExamQuestion.deleteMany({ where: { finalExamId: exam.id } });
    await prisma.finalExamQuestion.createMany({
      data: fe.questions.map((question) => ({
        finalExamId: exam.id,
        moduleId:
          question.moduleNumber != null ? moduleIds[question.moduleNumber - 1] ?? null : null,
        difficulty: question.difficulty ?? 2,
        ...q(question),
      })),
    });
    examQuestions = fe.questions.length;
  }

  // ── Labs ────────────────────────────────────────────────────────────────
  // Keyed on slug, so re-seeding updates a lab in place and learner attempts
  // (which reference the Lab id) survive.
  let labCount = 0;
  for (const [li, lab] of (track.labs ?? []).entries()) {
    if (lab.objectives.length === 0) {
      warnings.push(`${track.slug}: lab "${lab.slug}" has no objectives — nothing to score against.`);
    }

    const labData = {
      trackId: row.id,
      moduleId: lab.moduleNumber != null ? moduleIds[lab.moduleNumber - 1] ?? null : null,
      title: lab.title,
      labType: lab.labType,
      briefMd: lab.briefMd,
      scenarioMd: lab.scenarioMd ?? null,
      objectives: lab.objectives as unknown as Prisma.InputJsonValue,
      config: lab.config as unknown as Prisma.InputJsonValue,
      passScore: lab.passScore ?? 70,
      points: lab.points ?? 40,
      estimatedMinutes: lab.estimatedMinutes ?? 20,
      sortOrder: li,
      isPublished: lab.isPublished !== false,
    };

    await prisma.lab.upsert({
      where: { slug: lab.slug },
      create: { slug: lab.slug, ...labData },
      update: labData,
    });
    labCount++;
  }

  // ── Capstone ────────────────────────────────────────────────────────────
  if (track.capstone) {
    const capData = {
      briefMd: track.capstone.briefMd,
      rubric: track.capstone.rubric as unknown as Prisma.InputJsonValue,
      passThreshold: track.capstone.passThreshold ?? 70,
    };
    await prisma.capstone.upsert({
      where: { trackId: row.id },
      create: { trackId: row.id, ...capData },
      update: capData,
    });

    const weight = track.capstone.rubric.reduce((n, r) => n + r.weight, 0);
    if (weight !== 100) {
      warnings.push(`${track.slug}: capstone rubric weights sum to ${weight}%, not 100%.`);
    }
  }

  return {
    track: track.slug,
    created: !existing,
    modules: track.modules.length,
    lessons: lessonCount,
    microQuestions,
    quizQuestions,
    examQuestions,
    labs: labCount,
    minutes,
    warnings,
  };
}

/** Seed every track. Returns one report per track. */
export async function seedAll(): Promise<SeedReport[]> {
  const reports: SeedReport[] = [];
  for (const track of TRACKS) {
    reports.push(await seedTrack(track));
  }
  return reports;
}

export { TRACKS };
