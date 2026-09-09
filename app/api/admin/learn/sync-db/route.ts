import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// Creates every TIBLOGICS Learn table. Managed DB — no migrations, so this
// mirrors the events/shop sync pattern. Fully idempotent.
export async function POST() {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const log: string[] = [];

  const statements = [
    `CREATE TABLE IF NOT EXISTS "Student" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "email" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "emailVerified" TIMESTAMP(3),
      "verifyToken" TEXT,
      "resetToken" TEXT,
      "resetTokenExpires" TIMESTAMP(3),
      "accessibilityMode" BOOLEAN NOT NULL DEFAULT false,
      "locale" TEXT NOT NULL DEFAULT 'en',
      "leaderboardOptIn" BOOLEAN NOT NULL DEFAULT false,
      "lastLoginAt" TIMESTAMP(3)
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Student_email_key" ON "Student"("email")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Student_verifyToken_key" ON "Student"("verifyToken")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Student_resetToken_key" ON "Student"("resetToken")`,

    `CREATE TABLE IF NOT EXISTS "LearnTrack" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "slug" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "titleFr" TEXT,
      "tagline" TEXT,
      "description" TEXT NOT NULL DEFAULT '',
      "descriptionFr" TEXT,
      "level" TEXT NOT NULL DEFAULT 'beginner',
      "levelEnd" TEXT,
      "status" TEXT NOT NULL DEFAULT 'draft',
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "accentColor" TEXT NOT NULL DEFAULT '#F47C4C',
      "heroImage" TEXT,
      "outcomes" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "audience" TEXT,
      "certificateName" TEXT NOT NULL DEFAULT '',
      "estimatedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "estimatedWeeksAt3Hrs" INTEGER
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "LearnTrack_slug_key" ON "LearnTrack"("slug")`,
    `CREATE INDEX IF NOT EXISTS "LearnTrack_status_idx" ON "LearnTrack"("status")`,

    `CREATE TABLE IF NOT EXISTS "LearnModule" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "trackId" TEXT NOT NULL REFERENCES "LearnTrack"("id") ON DELETE CASCADE,
      "title" TEXT NOT NULL,
      "summary" TEXT,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "estimatedMinutes" INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE INDEX IF NOT EXISTS "LearnModule_trackId_idx" ON "LearnModule"("trackId")`,

    `CREATE TABLE IF NOT EXISTS "Lesson" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "moduleId" TEXT NOT NULL REFERENCES "LearnModule"("id") ON DELETE CASCADE,
      "title" TEXT NOT NULL,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "contentType" TEXT NOT NULL DEFAULT 'mixed',
      "videoUrl" TEXT,
      "bodyMd" TEXT NOT NULL DEFAULT '',
      "durationMinutes" INTEGER NOT NULL DEFAULT 0,
      "objective" TEXT,
      "isPreview" BOOLEAN NOT NULL DEFAULT false,
      "hasPractice" BOOLEAN NOT NULL DEFAULT false
    )`,
    `CREATE INDEX IF NOT EXISTS "Lesson_moduleId_idx" ON "Lesson"("moduleId")`,

    `CREATE TABLE IF NOT EXISTS "LessonResource" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "lessonId" TEXT NOT NULL REFERENCES "Lesson"("id") ON DELETE CASCADE,
      "title" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "resourceType" TEXT NOT NULL DEFAULT 'tool',
      "isFree" BOOLEAN NOT NULL DEFAULT true,
      "isRequired" BOOLEAN NOT NULL DEFAULT false,
      "notes" TEXT,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "lastCheckedStatus" INTEGER
    )`,
    `CREATE INDEX IF NOT EXISTS "LessonResource_lessonId_idx" ON "LessonResource"("lessonId")`,

    `CREATE TABLE IF NOT EXISTS "MicroCheck" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "lessonId" TEXT NOT NULL REFERENCES "Lesson"("id") ON DELETE CASCADE,
      "passScore" INTEGER NOT NULL DEFAULT 67,
      "questionsServed" INTEGER NOT NULL DEFAULT 3
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "MicroCheck_lessonId_key" ON "MicroCheck"("lessonId")`,

    `CREATE TABLE IF NOT EXISTS "MicroCheckQuestion" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "microCheckId" TEXT NOT NULL REFERENCES "MicroCheck"("id") ON DELETE CASCADE,
      "question" TEXT NOT NULL,
      "options" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "correctIndex" INTEGER NOT NULL DEFAULT 0,
      "explanation" TEXT NOT NULL DEFAULT ''
    )`,
    `CREATE INDEX IF NOT EXISTS "MicroCheckQuestion_microCheckId_idx" ON "MicroCheckQuestion"("microCheckId")`,

    `CREATE TABLE IF NOT EXISTS "MicroCheckAttempt" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
      "microCheckId" TEXT NOT NULL REFERENCES "MicroCheck"("id") ON DELETE CASCADE,
      "score" INTEGER NOT NULL DEFAULT 0,
      "passed" BOOLEAN NOT NULL DEFAULT false,
      "answers" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "MicroCheckAttempt_studentId_idx" ON "MicroCheckAttempt"("studentId")`,

    `CREATE TABLE IF NOT EXISTS "Quiz" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "moduleId" TEXT NOT NULL REFERENCES "LearnModule"("id") ON DELETE CASCADE,
      "passScore" INTEGER NOT NULL DEFAULT 80,
      "questionsServed" INTEGER NOT NULL DEFAULT 8
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Quiz_moduleId_key" ON "Quiz"("moduleId")`,

    `CREATE TABLE IF NOT EXISTS "QuizQuestion" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "quizId" TEXT NOT NULL REFERENCES "Quiz"("id") ON DELETE CASCADE,
      "question" TEXT NOT NULL,
      "options" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "correctIndex" INTEGER NOT NULL DEFAULT 0,
      "explanation" TEXT NOT NULL DEFAULT ''
    )`,
    `CREATE INDEX IF NOT EXISTS "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId")`,

    `CREATE TABLE IF NOT EXISTS "QuizAttempt" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
      "quizId" TEXT NOT NULL REFERENCES "Quiz"("id") ON DELETE CASCADE,
      "score" INTEGER NOT NULL DEFAULT 0,
      "passed" BOOLEAN NOT NULL DEFAULT false,
      "answers" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "QuizAttempt_studentId_idx" ON "QuizAttempt"("studentId")`,

    `CREATE TABLE IF NOT EXISTS "FinalExam" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "trackId" TEXT NOT NULL REFERENCES "LearnTrack"("id") ON DELETE CASCADE,
      "title" TEXT NOT NULL,
      "timeLimitMinutes" INTEGER NOT NULL DEFAULT 60,
      "questionsServed" INTEGER NOT NULL DEFAULT 40,
      "passScore" INTEGER NOT NULL DEFAULT 75,
      "distinctionScore" INTEGER NOT NULL DEFAULT 90,
      "maxAttempts" INTEGER NOT NULL DEFAULT 3,
      "cooldownHours" INTEGER NOT NULL DEFAULT 24,
      "instructionsMd" TEXT NOT NULL DEFAULT ''
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "FinalExam_trackId_key" ON "FinalExam"("trackId")`,

    `CREATE TABLE IF NOT EXISTS "FinalExamQuestion" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "finalExamId" TEXT NOT NULL REFERENCES "FinalExam"("id") ON DELETE CASCADE,
      "moduleId" TEXT REFERENCES "LearnModule"("id") ON DELETE SET NULL,
      "question" TEXT NOT NULL,
      "options" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "correctIndex" INTEGER NOT NULL DEFAULT 0,
      "explanation" TEXT NOT NULL DEFAULT '',
      "difficulty" INTEGER NOT NULL DEFAULT 2
    )`,
    `CREATE INDEX IF NOT EXISTS "FinalExamQuestion_finalExamId_idx" ON "FinalExamQuestion"("finalExamId")`,

    `CREATE TABLE IF NOT EXISTS "FinalExamSession" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
      "finalExamId" TEXT NOT NULL REFERENCES "FinalExam"("id") ON DELETE CASCADE,
      "status" TEXT NOT NULL DEFAULT 'in_progress',
      "questionIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "submittedAt" TIMESTAMP(3),
      "score" INTEGER,
      "passed" BOOLEAN,
      "answers" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "perModuleScores" JSONB,
      "attemptNumber" INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE INDEX IF NOT EXISTS "FinalExamSession_studentId_idx" ON "FinalExamSession"("studentId")`,
    `CREATE INDEX IF NOT EXISTS "FinalExamSession_status_idx" ON "FinalExamSession"("status")`,

    `CREATE TABLE IF NOT EXISTS "Lab" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "trackId" TEXT NOT NULL REFERENCES "LearnTrack"("id") ON DELETE CASCADE,
      "moduleId" TEXT REFERENCES "LearnModule"("id") ON DELETE SET NULL,
      "lessonId" TEXT REFERENCES "Lesson"("id") ON DELETE SET NULL,
      "slug" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "labType" TEXT NOT NULL DEFAULT 'prompt',
      "briefMd" TEXT NOT NULL DEFAULT '',
      "scenarioMd" TEXT,
      "objectives" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "passScore" INTEGER NOT NULL DEFAULT 70,
      "points" INTEGER NOT NULL DEFAULT 40,
      "estimatedMinutes" INTEGER NOT NULL DEFAULT 20,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "isPublished" BOOLEAN NOT NULL DEFAULT true
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Lab_slug_key" ON "Lab"("slug")`,
    `CREATE INDEX IF NOT EXISTS "Lab_trackId_idx" ON "Lab"("trackId")`,
    `CREATE INDEX IF NOT EXISTS "Lab_lessonId_idx" ON "Lab"("lessonId")`,

    `CREATE TABLE IF NOT EXISTS "LabAttempt" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
      "labId" TEXT NOT NULL REFERENCES "Lab"("id") ON DELETE CASCADE,
      "status" TEXT NOT NULL DEFAULT 'in_progress',
      "submission" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "transcript" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "score" INTEGER,
      "passed" BOOLEAN NOT NULL DEFAULT false,
      "feedbackMd" TEXT,
      "breakdown" JSONB,
      "runCount" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "LabAttempt_studentId_idx" ON "LabAttempt"("studentId")`,
    `CREATE INDEX IF NOT EXISTS "LabAttempt_labId_idx" ON "LabAttempt"("labId")`,
    `CREATE INDEX IF NOT EXISTS "LabAttempt_status_idx" ON "LabAttempt"("status")`,

    `CREATE TABLE IF NOT EXISTS "Capstone" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "trackId" TEXT NOT NULL REFERENCES "LearnTrack"("id") ON DELETE CASCADE,
      "briefMd" TEXT NOT NULL DEFAULT '',
      "rubric" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "passThreshold" INTEGER NOT NULL DEFAULT 70
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Capstone_trackId_key" ON "Capstone"("trackId")`,

    `CREATE TABLE IF NOT EXISTS "CapstoneSubmission" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
      "capstoneId" TEXT NOT NULL REFERENCES "Capstone"("id") ON DELETE CASCADE,
      "status" TEXT NOT NULL DEFAULT 'submitted',
      "submissionUrl" TEXT,
      "submissionMd" TEXT,
      "reviewerNotes" TEXT,
      "aiPrereviewMd" TEXT,
      "score" INTEGER,
      "reviewedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "CapstoneSubmission_studentId_idx" ON "CapstoneSubmission"("studentId")`,
    `CREATE INDEX IF NOT EXISTS "CapstoneSubmission_status_idx" ON "CapstoneSubmission"("status")`,

    `CREATE TABLE IF NOT EXISTS "LearnSubscription" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
      "stripeCustomerId" TEXT,
      "stripeSubscriptionId" TEXT,
      "status" TEXT NOT NULL DEFAULT 'trialing',
      "plan" TEXT NOT NULL DEFAULT 'monthly',
      "currentPeriodEnd" TIMESTAMP(3),
      "graceUntil" TIMESTAMP(3),
      "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "LearnSubscription_studentId_key" ON "LearnSubscription"("studentId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "LearnSubscription_stripeSubscriptionId_key" ON "LearnSubscription"("stripeSubscriptionId")`,

    `CREATE TABLE IF NOT EXISTS "LessonProgress" (
      "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
      "lessonId" TEXT NOT NULL REFERENCES "Lesson"("id") ON DELETE CASCADE,
      "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("studentId","lessonId")
    )`,
    `CREATE INDEX IF NOT EXISTS "LessonProgress_studentId_idx" ON "LessonProgress"("studentId")`,

    `CREATE TABLE IF NOT EXISTS "PointsLedger" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
      "source" TEXT NOT NULL,
      "refId" TEXT,
      "points" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "PointsLedger_studentId_source_refId_key" ON "PointsLedger"("studentId","source","refId")`,
    `CREATE INDEX IF NOT EXISTS "PointsLedger_studentId_idx" ON "PointsLedger"("studentId")`,

    `CREATE TABLE IF NOT EXISTS "LearnCertificate" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
      "trackId" TEXT NOT NULL REFERENCES "LearnTrack"("id") ON DELETE CASCADE,
      "verificationId" TEXT NOT NULL,
      "recipientName" TEXT NOT NULL,
      "certificateName" TEXT NOT NULL DEFAULT '',
      "distinction" BOOLEAN NOT NULL DEFAULT false,
      "examScore" INTEGER,
      "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "pdfUrl" TEXT,
      "revoked" BOOLEAN NOT NULL DEFAULT false
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "LearnCertificate_verificationId_key" ON "LearnCertificate"("verificationId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "LearnCertificate_studentId_trackId_key" ON "LearnCertificate"("studentId","trackId")`,

    `CREATE TABLE IF NOT EXISTS "LearnWaitlist" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "trackSlug" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "LearnWaitlist_email_trackSlug_key" ON "LearnWaitlist"("email","trackSlug")`,
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      log.push(`✅ ${sql.trim().split("\n")[0].slice(0, 72)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.push(`⚠️  ${msg.slice(0, 140)}`);
    }
  }

  const tracks = await prisma.learnTrack.count().catch(() => -1);
  const students = await prisma.student.count().catch(() => -1);
  log.push(`✅ Tracks: ${tracks} · Students: ${students}`);

  return NextResponse.json({ ok: true, log, tracks, students });
}
