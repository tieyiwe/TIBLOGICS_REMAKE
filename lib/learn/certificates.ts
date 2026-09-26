// Certificate issuance (Part B rule 3). Gated on ALL FOUR requirements and
// idempotent — a learner can only ever hold one certificate per track, and
// re-running this never issues a duplicate.
import prisma from "@/lib/prisma";
import { certificationStatus } from "./assessments";
import { awardPoints } from "./points";
import { sendCertificateEmail } from "./emails";

export type IssueResult =
  | { ok: true; certificateId: string; verificationId: string; created: boolean }
  | { ok: false; reason: string; gates?: Record<string, boolean> };

/**
 * Issue a certificate if every gate is met. Safe to call on any completion
 * event — quiz pass, exam pass, or capstone approval.
 */
export async function issueCertificate(
  studentId: string,
  trackId: string,
  opts: { force?: boolean; issuedByAdmin?: boolean } = {},
): Promise<IssueResult> {
  // Already issued? Return it rather than creating a second.
  const existing = await prisma.learnCertificate
    .findUnique({ where: { studentId_trackId: { studentId, trackId } } })
    .catch(() => null);
  if (existing) {
    return {
      ok: true,
      certificateId: existing.id,
      verificationId: existing.verificationId,
      created: false,
    };
  }

  const gates = await certificationStatus(studentId, trackId);
  if (!gates.eligible && !opts.force) {
    return {
      ok: false,
      reason: "Not all requirements are met",
      gates: {
        microChecks: gates.microChecks,
        quizzes: gates.quizzes,
        exam: gates.exam,
        capstone: gates.capstone,
      },
    };
  }

  const [student, track] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId }, select: { name: true, email: true } }),
    prisma.learnTrack.findUnique({ where: { id: trackId }, select: { certificateName: true, title: true } }),
  ]);
  if (!student || !track) return { ok: false, reason: "Student or track not found" };

  // Distinction comes from the best passing exam score
  const bestExam = await prisma.finalExamSession
    .findFirst({
      where: { studentId, finalExam: { trackId }, passed: true },
      orderBy: { score: "desc" },
      select: { score: true, finalExam: { select: { distinctionScore: true } } },
    })
    .catch(() => null);

  const examScore = bestExam?.score ?? null;
  const distinction =
    examScore != null && bestExam?.finalExam?.distinctionScore != null
      ? examScore >= bestExam.finalExam.distinctionScore
      : false;

  try {
    const cert = await prisma.learnCertificate.create({
      data: {
        studentId,
        trackId,
        recipientName: student.name,
        certificateName: track.certificateName || track.title,
        distinction,
        examScore,
      },
    });

    await awardPoints(studentId, "track_complete", trackId);

    sendCertificateEmail({
      email: student.email,
      name: student.name,
      certificateName: cert.certificateName,
      verificationId: cert.verificationId,
      distinction,
    }).catch((err) => console.error("[issueCertificate] email", err));

    return { ok: true, certificateId: cert.id, verificationId: cert.verificationId, created: true };
  } catch {
    // Lost a race with a concurrent issue — fetch and return the winner.
    const raced = await prisma.learnCertificate
      .findUnique({ where: { studentId_trackId: { studentId, trackId } } })
      .catch(() => null);
    if (raced) {
      return { ok: true, certificateId: raced.id, verificationId: raced.verificationId, created: false };
    }
    return { ok: false, reason: "Could not issue certificate" };
  }
}

/**
 * Called after any gate-clearing event. Silently does nothing if the learner
 * isn't finished yet, so callers don't need to check first.
 */
export async function maybeIssueCertificate(studentId: string, trackId: string) {
  const result = await issueCertificate(studentId, trackId);
  return result.ok && result.created ? result : null;
}
