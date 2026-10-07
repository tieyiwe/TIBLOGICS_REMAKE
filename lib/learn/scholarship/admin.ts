import prisma from "@/lib/prisma";
import { ensureScholarshipTables } from "./db";
import { liveTracks, type ScholarshipStatus } from "./service";

// Staff view of the Tilo Vision Scholarship: every award with its recipient,
// and for each scholar what they unlocked and how they are doing (lessons
// done, best exam score, certificates, last sign-in).

export interface ScholarPick {
  trackId: string;
  trackTitle: string;
  listCents: number;
  paidCents: number;
  coveredCents: number;
  at: Date;
  lessonsDone: number;
  lessonsTotal: number;
  examBest: number | null;
  examPassed: boolean;
  certificate: string | null;
}

export interface ScholarshipRow {
  id: string;
  code: string;
  name: string;
  email: string;
  locale: string;
  status: ScholarshipStatus;
  /** approved but the link has run out. */
  expired: boolean;
  trackCount: number;
  coveragePct: number;
  trackIds: string[];
  trackTitles: string[];
  message: string | null;
  note: string | null;
  offerDays: number;
  offerExpiresAt: Date | null;
  createdAt: Date;
  createdBy: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  emailedAt: Date | null;
  claimedAt: Date | null;
  revokedAt: Date | null;
  sponsorName: string | null;
  sponsorEmail: string | null;
  pickDays: number | null;
  completeDays: number | null;
  /** Choose-by date and completion target (once accepted). */
  pickBy: Date | null;
  completeBy: Date | null;
  applicationId: string | null;
  partnerName: string | null;
  partnerRole: string | null;
  student: { id: string; name: string; email: string; lastLoginAt: Date | null } | null;
  /** An ARFA account with the awarded address (before it is accepted too). */
  accountId: string | null;
  picks: ScholarPick[];
  coveredCents: number;
  paidCents: number;
  /** Lessons done over lessons in the chosen tracks, 0-100. */
  progress: number | null;
}

export async function listScholarships(f: { status?: string | null; q?: string | null; ids?: string[]; sponsor?: string | null } = {}): Promise<ScholarshipRow[]> {
  await ensureScholarshipTables();
  const q = f.q?.trim().slice(0, 100) || null;
  const rows = await prisma.scholarship.findMany({
    where: {
      ...(f.ids ? { id: { in: f.ids } } : {}),
      ...(f.sponsor ? { sponsorName: { equals: f.sponsor, mode: "insensitive" } } : {}),
      ...(f.status && ["draft", "approved", "claimed", "revoked"].includes(f.status) ? { status: f.status } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { code: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
  if (!rows.length) return [];

  const ids = rows.map((r) => r.id);
  const studentIds = [...new Set(rows.map((r) => r.studentId).filter((x): x is string => !!x))];
  const [picks, students, accounts, all, trackRows] = await Promise.all([
    prisma.scholarshipTrack.findMany({ where: { scholarshipId: { in: ids } }, orderBy: { createdAt: "asc" } }),
    studentIds.length ? prisma.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, name: true, email: true, lastLoginAt: true } }) : [],
    prisma.student.findMany({ where: { email: { in: rows.map((r) => r.email) } }, select: { id: true, email: true } }),
    liveTracks().catch(() => []),
    prisma.learnTrack.findMany({ select: { id: true, title: true } }),
  ]);
  const titleOf = new Map(trackRows.map((t) => [t.id, t.title]));
  for (const t of all) titleOf.set(t.id, t.title);

  // Progress of the scholars on the tracks they unlocked.
  const pickTracks = [...new Set(picks.map((p) => p.trackId))];
  const pickStudents = [...new Set(picks.map((p) => p.studentId))];
  const [lessonTotals, lessonDone, exams, certs] = pickTracks.length
    ? await Promise.all([
        prisma.$queryRaw<Array<{ trackId: string; n: bigint }>>`
          SELECT m."trackId", COUNT(l."id") AS n FROM "Lesson" l JOIN "LearnModule" m ON m."id" = l."moduleId"
          WHERE m."trackId" = ANY(${pickTracks}) GROUP BY m."trackId"`,
        prisma.$queryRaw<Array<{ studentId: string; trackId: string; n: bigint }>>`
          SELECT p."studentId", m."trackId", COUNT(*) AS n FROM "LessonProgress" p
          JOIN "Lesson" l ON l."id" = p."lessonId" JOIN "LearnModule" m ON m."id" = l."moduleId"
          WHERE p."studentId" = ANY(${pickStudents}) AND m."trackId" = ANY(${pickTracks}) GROUP BY p."studentId", m."trackId"`,
        prisma.finalExamSession.findMany({
          where: { studentId: { in: pickStudents }, finalExam: { trackId: { in: pickTracks } } },
          select: { studentId: true, score: true, passed: true, finalExam: { select: { trackId: true } } },
        }),
        prisma.learnCertificate.findMany({
          where: { studentId: { in: pickStudents }, trackId: { in: pickTracks }, revoked: false },
          select: { studentId: true, trackId: true, verificationId: true },
        }),
      ])
    : [[], [], [], []];
  const total = new Map(lessonTotals.map((r) => [r.trackId, Number(r.n)]));
  const done = new Map(lessonDone.map((r) => [`${r.studentId}:${r.trackId}`, Number(r.n)]));
  const cert = new Map(certs.map((c) => [`${c.studentId}:${c.trackId}`, c.verificationId]));
  const exam = new Map<string, { best: number | null; passed: boolean }>();
  for (const e of exams) {
    const k = `${e.studentId}:${e.finalExam.trackId}`;
    const cur = exam.get(k) ?? { best: null, passed: false };
    if (e.score != null) cur.best = Math.max(cur.best ?? 0, e.score);
    if (e.passed) cur.passed = true;
    exam.set(k, cur);
  }
  const studentById = new Map(students.map((s) => [s.id, s]));
  const accountByEmail = new Map(accounts.map((a) => [a.email.toLowerCase(), a.id]));
  const now = Date.now();

  return rows.map((r) => {
    const mine: ScholarPick[] = picks
      .filter((p) => p.scholarshipId === r.id)
      .map((p) => {
        const k = `${p.studentId}:${p.trackId}`;
        return {
          trackId: p.trackId,
          trackTitle: titleOf.get(p.trackId) ?? "Track",
          listCents: p.listCents,
          paidCents: p.paidCents,
          coveredCents: p.coveredCents,
          at: p.createdAt,
          lessonsDone: done.get(k) ?? 0,
          lessonsTotal: total.get(p.trackId) ?? 0,
          examBest: exam.get(k)?.best ?? null,
          examPassed: exam.get(k)?.passed ?? false,
          certificate: cert.get(k) ?? null,
        };
      });
    const lessons = mine.reduce((n, p) => n + p.lessonsTotal, 0);
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      email: r.email,
      locale: r.locale,
      status: r.status as ScholarshipStatus,
      expired: r.status === "approved" && (!r.offerExpiresAt || r.offerExpiresAt.getTime() <= now),
      trackCount: r.trackCount,
      coveragePct: r.coveragePct,
      trackIds: r.trackIds,
      trackTitles: r.trackIds.map((id) => titleOf.get(id) ?? "Track"),
      message: r.message,
      note: r.note,
      offerDays: r.offerDays,
      offerExpiresAt: r.offerExpiresAt,
      createdAt: r.createdAt,
      createdBy: r.createdBy,
      approvedAt: r.approvedAt,
      approvedBy: r.approvedBy,
      emailedAt: r.emailedAt,
      claimedAt: r.claimedAt,
      revokedAt: r.revokedAt,
      sponsorName: r.sponsorName,
      sponsorEmail: r.sponsorEmail,
      pickDays: r.pickDays,
      completeDays: r.completeDays,
      pickBy: r.claimedAt && r.pickDays ? new Date(r.claimedAt.getTime() + r.pickDays * 86_400_000) : null,
      completeBy: r.claimedAt && r.completeDays ? new Date(r.claimedAt.getTime() + r.completeDays * 86_400_000) : null,
      applicationId: r.applicationId,
      partnerName: r.partnerName,
      partnerRole: r.partnerRole,
      student: r.studentId ? studentById.get(r.studentId) ?? null : null,
      accountId: r.studentId ?? accountByEmail.get(r.email) ?? null,
      picks: mine,
      coveredCents: mine.reduce((n, p) => n + p.coveredCents, 0),
      paidCents: mine.reduce((n, p) => n + p.paidCents, 0),
      progress: lessons ? Math.round((mine.reduce((n, p) => n + p.lessonsDone, 0) / lessons) * 100) : null,
    };
  });
}

/** The scholarships of one learner (by account or awarded address), for the learner page. */
export async function scholarshipsOfLearner(studentId: string, email: string): Promise<ScholarshipRow[]> {
  try {
    await ensureScholarshipTables();
    const ids = await prisma.scholarship.findMany({ where: { OR: [{ studentId }, { email: email.toLowerCase() }] }, select: { id: true } });
    if (!ids.length) return [];
    return await listScholarships({ ids: ids.map((x) => x.id) });
  } catch (err) {
    console.error("[scholarship] learner", err);
    return [];
  }
}

// ── Sponsors ──────────────────────────────────────────────────────────────

export interface SponsorSummary {
  name: string;
  email: string | null;
  awarded: number;
  accepted: number;
  tracksUnlocked: number;
  coveredCents: number;
  progress: number | null;
  certificates: number;
}

/** Every sponsor named on an award (not drafts or revoked), with totals. */
export function sponsorSummaries(rows: ScholarshipRow[]): SponsorSummary[] {
  const by = new Map<string, ScholarshipRow[]>();
  for (const r of rows) {
    if (!r.sponsorName || r.status === "draft" || r.status === "revoked") continue;
    const k = r.sponsorName.trim().toLowerCase();
    by.set(k, [...(by.get(k) ?? []), r]);
  }
  return [...by.values()]
    .map((list) => {
      const lessons = list.flatMap((r) => r.picks);
      const total = lessons.reduce((n, p) => n + p.lessonsTotal, 0);
      return {
        name: list[0].sponsorName!,
        email: list.find((r) => r.sponsorEmail)?.sponsorEmail ?? null,
        awarded: list.length,
        accepted: list.filter((r) => r.status === "claimed").length,
        tracksUnlocked: lessons.length,
        coveredCents: list.reduce((n, r) => n + r.coveredCents, 0),
        progress: total ? Math.round((lessons.reduce((n, p) => n + p.lessonsDone, 0) / total) * 100) : null,
        certificates: lessons.filter((p) => p.certificate).length,
      };
    })
    .sort((a, b) => b.awarded - a.awarded);
}

/** "Ama M.": what sponsors see of a scholar. */
export const publicName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
};

/** The impact report for one sponsor (aggregates, scholars by first name and initial). */
export async function sponsorReport(sponsor: string) {
  const rows = (await listScholarships({ sponsor })).filter((r) => r.status === "approved" || r.status === "claimed");
  const picks = rows.flatMap((r) => r.picks);
  return {
    sponsor: rows[0]?.sponsorName ?? sponsor,
    email: rows.find((r) => r.sponsorEmail)?.sponsorEmail ?? null,
    awarded: rows.length,
    accepted: rows.filter((r) => r.status === "claimed").length,
    tracksUnlocked: picks.length,
    coveredCents: rows.reduce((n, r) => n + r.coveredCents, 0),
    lessonsDone: picks.reduce((n, p) => n + p.lessonsDone, 0),
    lessonsTotal: picks.reduce((n, p) => n + p.lessonsTotal, 0),
    certificates: picks.filter((p) => p.certificate).length,
    examsPassed: picks.filter((p) => p.examPassed).length,
    scholars: rows
      .filter((r) => r.status === "claimed")
      .map((r) => ({
        who: publicName(r.student?.name ?? r.name),
        since: r.claimedAt,
        tracks: r.picks.map((p) => ({ title: p.trackTitle, done: p.lessonsDone, total: p.lessonsTotal, certified: !!p.certificate })),
      })),
  };
}
