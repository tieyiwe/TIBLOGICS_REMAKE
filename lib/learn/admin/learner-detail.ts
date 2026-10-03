// One learner, for /admin_pro/learn/learners/[id]. Staff only (the page calls
// requireAdminPage). Privacy: no drafts, reflections or Tutor conversation
// content, only counts; no full IPs (LoginEvent stores prefixes only).
import prisma from "@/lib/prisma";
import { ensureLearnerTables, planOf, type PlanInfo } from "./learners";

const DAY = 86_400_000;

export interface ModuleDetail {
  id: string;
  title: string;
  lessons: number;
  done: number;
  mastered: number;
  placement: { level: string; score: number; correct: number; asked: number; at: Date } | null;
  quiz: { attempts: number; best: number | null; passed: boolean; passScore: number } | null;
  labs: Array<{ title: string; status: string; score: number | null; passed: boolean }>;
}

export interface TrackDetail {
  id: string;
  slug: string;
  title: string;
  lessons: number;
  done: number;
  percent: number;
  modules: ModuleDetail[];
  diagnostic: { status: string; startedAt: Date; completedAt: Date | null } | null;
  exam: { attempts: number; best: number | null; passed: boolean; lastAt: Date | null } | null;
  capstone: { status: string; score: number | null; at: Date } | null;
  purchased: boolean;
}

export async function loadLearnerDetail(id: string) {
  const ready = await ensureLearnerTables();
  const student = await prisma.student.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, createdAt: true, updatedAt: true, locale: true, emailVerified: true,
      lastLoginAt: true, accessibilityMode: true, leaderboardOptIn: true,
    },
  });
  if (!student) return null;

  const since30 = new Date(Date.now() - 30 * DAY);
  const [
    sub, purchases, seats, ownedTeams, progress, mastered, estimates, diags, quizAttempts, labAttempts,
    examSessions, capstones, certificates, ledger, reviewCards, tutor, logins, loginCount, logins30, portfolio,
  ] = await Promise.all([
    prisma.learnSubscription.findUnique({ where: { studentId: id } }),
    ready.purchases ? prisma.trackPurchase.findMany({ where: { studentId: id }, orderBy: { createdAt: "asc" } }) : [],
    ready.teams ? prisma.teamMember.findMany({ where: { studentId: id }, orderBy: { invitedAt: "desc" } }).catch(() => []) : [],
    ready.teams ? prisma.team.findMany({ where: { ownerStudentId: id }, select: { id: true, name: true, status: true, seats: true } }).catch(() => []) : [],
    prisma.lessonProgress.findMany({ where: { studentId: id }, select: { lessonId: true, completedAt: true } }),
    ready.mastery ? prisma.lessonMastery.findMany({ where: { studentId: id }, select: { lessonId: true, moduleId: true, trackId: true } }) : [],
    ready.mastery ? prisma.masteryEstimate.findMany({ where: { studentId: id } }) : [],
    ready.mastery
      ? prisma.diagnosticSession.findMany({
          where: { studentId: id },
          orderBy: { createdAt: "desc" },
          select: { trackId: true, status: true, createdAt: true, completedAt: true },
        })
      : [],
    prisma.quizAttempt.groupBy({ by: ["quizId"], where: { studentId: id }, _max: { score: true }, _count: { _all: true } }),
    prisma.labAttempt.findMany({
      where: { studentId: id },
      orderBy: { updatedAt: "desc" },
      select: { labId: true, status: true, score: true, passed: true },
    }),
    prisma.finalExamSession.findMany({
      where: { studentId: id },
      orderBy: { startedAt: "desc" },
      select: { status: true, score: true, passed: true, startedAt: true, finalExam: { select: { trackId: true } } },
    }),
    prisma.capstoneSubmission.findMany({
      where: { studentId: id },
      orderBy: { createdAt: "desc" },
      select: { status: true, score: true, createdAt: true, capstone: { select: { trackId: true } } },
    }),
    prisma.learnCertificate.findMany({
      where: { studentId: id },
      orderBy: { issuedAt: "desc" },
      select: { id: true, verificationId: true, certificateName: true, distinction: true, examScore: true, issuedAt: true, revoked: true, trackId: true },
    }),
    prisma.pointsLedger.findMany({ where: { studentId: id }, orderBy: { createdAt: "desc" }, select: { source: true, refId: true, points: true, createdAt: true } }),
    ready.method
      ? prisma.reviewCard.groupBy({ by: ["box"], where: { studentId: id }, _count: { _all: true } }).catch(() => [])
      : [],
    ready.tutor
      ? prisma.$queryRaw<Array<{ threads: number; messages: number; last: Date | null }>>`
          SELECT COUNT(DISTINCT t."id")::int AS threads,
                 COUNT(m."id") FILTER (WHERE m."role" = 'user')::int AS messages,
                 MAX(m."createdAt") FILTER (WHERE m."role" = 'user') AS last
          FROM "TutorThread" t LEFT JOIN "TutorMessage" m ON m."threadId" = t."id"
          WHERE t."studentId" = ${id}`.catch(() => [])
      : [],
    ready.logins ? prisma.loginEvent.findMany({ where: { studentId: id }, orderBy: { at: "desc" }, take: 100 }) : [],
    ready.logins ? prisma.loginEvent.count({ where: { studentId: id } }) : 0,
    ready.logins ? prisma.loginEvent.count({ where: { studentId: id, at: { gte: since30 } } }) : 0,
    ready.method ? prisma.portfolioSettings.findUnique({ where: { studentId: id }, select: { isPublic: true, slug: true } }).catch(() => null) : null,
  ]);

  const reviewDue = ready.method
    ? await prisma.reviewCard.count({ where: { studentId: id, dueAt: { lte: new Date() } } }).catch(() => 0)
    : 0;

  // Team rows for the seats found.
  const teamRows = seats.length
    ? await prisma.team.findMany({ where: { id: { in: seats.map((s) => s.teamId) } }, select: { id: true, name: true, status: true, comped: true } }).catch(() => [])
    : [];
  const teamById = new Map(teamRows.map((t) => [t.id, t]));
  const teams = seats.map((s) => ({
    teamId: s.teamId,
    name: teamById.get(s.teamId)?.name ?? s.teamId,
    teamStatus: teamById.get(s.teamId)?.status ?? "?",
    comped: teamById.get(s.teamId)?.comped ?? false,
    role: s.role,
    status: s.status,
    joinedAt: s.joinedAt,
  }));
  const activeTeam = teams.find((t) => t.status === "active");

  // Tracks this learner touched or bought, with their structure.
  const lessonIds = progress.map((p) => p.lessonId);
  const labIds = [...new Set(labAttempts.map((l) => l.labId))];
  const quizIds = quizAttempts.map((q) => q.quizId);
  const [lessonTracks, labRows, quizRows] = await Promise.all([
    lessonIds.length
      ? prisma.lesson.findMany({ where: { id: { in: lessonIds } }, select: { id: true, moduleId: true, module: { select: { trackId: true } } } })
      : [],
    labIds.length ? prisma.lab.findMany({ where: { id: { in: labIds } }, select: { id: true, title: true, trackId: true, moduleId: true } }) : [],
    quizIds.length ? prisma.quiz.findMany({ where: { id: { in: quizIds } }, select: { id: true, moduleId: true, passScore: true, module: { select: { trackId: true } } } }) : [],
  ]);
  const trackIds = new Set<string>([
    ...lessonTracks.map((l) => l.module.trackId),
    ...mastered.map((m) => m.trackId),
    ...estimates.map((e) => e.trackId),
    ...diags.map((d) => d.trackId),
    ...labRows.map((l) => l.trackId),
    ...quizRows.map((q) => q.module.trackId),
    ...examSessions.map((e) => e.finalExam.trackId),
    ...capstones.map((c) => c.capstone.trackId),
    ...certificates.map((c) => c.trackId),
    ...purchases.map((p) => p.trackId),
  ]);
  const trackRows = trackIds.size
    ? await prisma.learnTrack.findMany({
        where: { id: { in: [...trackIds] } },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true, slug: true, title: true,
          modules: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, title: true, lessons: { select: { id: true } }, quiz: { select: { id: true, passScore: true } } },
          },
        },
      })
    : [];
  const trackTitle = new Map(trackRows.map((t) => [t.id, t.title]));

  const doneSet = new Set(lessonIds);
  const masteredSet = new Set(mastered.map((m) => m.lessonId));
  const estByModule = new Map(estimates.map((e) => [e.moduleId, e]));
  const quizById = new Map(quizAttempts.map((q) => [q.quizId, q]));
  const quizPass = new Map(quizRows.map((q) => [q.id, q.passScore]));
  // Best attempt per lab (attempts are newest first).
  const labBest = new Map<string, { status: string; score: number | null; passed: boolean }>();
  for (const a of labAttempts) {
    const cur = labBest.get(a.labId);
    if (!cur || (a.passed && !cur.passed) || (a.score ?? -1) > (cur.score ?? -1)) labBest.set(a.labId, { status: a.status, score: a.score, passed: a.passed });
  }
  const labsByModule = new Map<string, Array<{ title: string; status: string; score: number | null; passed: boolean }>>();
  for (const l of labRows) {
    const key = l.moduleId ?? `track:${l.trackId}`;
    const best = labBest.get(l.id);
    if (!best) continue;
    labsByModule.set(key, [...(labsByModule.get(key) ?? []), { title: l.title, ...best }]);
  }

  const tracks: TrackDetail[] = trackRows.map((t) => {
    const modules: ModuleDetail[] = t.modules.map((m) => {
      const ids = m.lessons.map((l) => l.id);
      const est = estByModule.get(m.id);
      const qa = m.quiz ? quizById.get(m.quiz.id) : undefined;
      return {
        id: m.id,
        title: m.title,
        lessons: ids.length,
        done: ids.filter((x) => doneSet.has(x) || masteredSet.has(x)).length,
        mastered: ids.filter((x) => masteredSet.has(x)).length,
        placement: est ? { level: est.level, score: est.score, correct: est.correct, asked: est.asked, at: est.updatedAt } : null,
        quiz: m.quiz && qa
          ? { attempts: qa._count._all, best: qa._max.score, passed: (qa._max.score ?? 0) >= (quizPass.get(m.quiz.id) ?? m.quiz.passScore), passScore: m.quiz.passScore }
          : null,
        labs: labsByModule.get(m.id) ?? [],
      };
    });
    const lessons = modules.reduce((n, m) => n + m.lessons, 0);
    const done = modules.reduce((n, m) => n + m.done, 0);
    const exams = examSessions.filter((e) => e.finalExam.trackId === t.id);
    const scores = exams.map((e) => e.score).filter((s): s is number => s != null);
    const diag = diags.find((d) => d.trackId === t.id && d.status === "completed") ?? diags.find((d) => d.trackId === t.id);
    const cap = capstones.find((c) => c.capstone.trackId === t.id);
    const trackLabs = labsByModule.get(`track:${t.id}`);
    if (trackLabs?.length) modules.push({ id: `track:${t.id}`, title: "Track labs", lessons: 0, done: 0, mastered: 0, placement: null, quiz: null, labs: trackLabs });
    return {
      id: t.id,
      slug: t.slug,
      title: t.title,
      lessons,
      done,
      percent: lessons ? Math.round((done / lessons) * 100) : 0,
      modules,
      diagnostic: diag ? { status: diag.status, startedAt: diag.createdAt, completedAt: diag.completedAt } : null,
      exam: exams.length
        ? { attempts: exams.length, best: scores.length ? Math.max(...scores) : null, passed: exams.some((e) => e.passed), lastAt: exams[0].startedAt }
        : null,
      capstone: cap ? { status: cap.status, score: cap.score, at: cap.createdAt } : null,
      purchased: purchases.some((p) => p.trackId === t.id),
    };
  });

  // XP: totals by source, and per week for the last 12 weeks.
  const xpTotal = ledger.reduce((n, r) => n + r.points, 0);
  const bySource = new Map<string, { points: number; count: number }>();
  for (const r of ledger) {
    const cur = bySource.get(r.source) ?? { points: 0, count: 0 };
    bySource.set(r.source, { points: cur.points + r.points, count: cur.count + 1 });
  }
  const weekStart = (d: Date) => {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
    return x.getTime();
  };
  const thisWeek = weekStart(new Date());
  const weeks = Array.from({ length: 12 }, (_, i) => ({ start: new Date(thisWeek - (11 - i) * 7 * DAY), points: 0 }));
  for (const r of ledger) {
    const w = weeks.find((x) => x.start.getTime() === weekStart(r.createdAt));
    if (w) w.points += r.points;
  }

  const studioDone = ledger.filter((r) => r.source === "studio_challenge");
  const studioByTool = new Map<string, number>();
  for (const r of studioDone) {
    const tool = (r.refId ?? "").split(":")[0] || "unknown";
    studioByTool.set(tool, (studioByTool.get(tool) ?? 0) + 1);
  }
  const reviews = ledger.filter((r) => r.source === "daily_review");
  const cards = (reviewCards as Array<{ box: number; _count: { _all: number } }>);
  const tutorRow = (tutor as Array<{ threads: number; messages: number; last: Date | null }>)[0];

  const plan: PlanInfo = planOf(
    student.email,
    sub,
    activeTeam ? { name: activeTeam.name, status: activeTeam.teamStatus, comped: activeTeam.comped, role: activeTeam.role, teamId: activeTeam.teamId } : null,
    purchases.map((p) => trackTitle.get(p.trackId) ?? p.trackId),
  );

  return {
    student,
    plan,
    subscription: sub
      ? {
          status: sub.status, plan: sub.plan, createdAt: sub.createdAt, updatedAt: sub.updatedAt,
          currentPeriodEnd: sub.currentPeriodEnd, graceUntil: sub.graceUntil, cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          stripe: !!sub.stripeSubscriptionId,
          stripeCustomerId: sub.stripeCustomerId,
          stripeSubscriptionId: sub.stripeSubscriptionId,
        }
      : null,
    purchases: purchases.map((p) => ({
      id: p.id, track: trackTitle.get(p.trackId) ?? p.trackId, amountCents: p.amountCents, currency: p.currency, createdAt: p.createdAt,
    })),
    teams,
    ownedTeams,
    tracks,
    placementTaken: diags.filter((d) => d.status === "completed").length,
    certificates: certificates.map((c) => ({ ...c, track: trackTitle.get(c.trackId) ?? c.trackId })),
    xp: {
      total: xpTotal,
      bySource: [...bySource.entries()].map(([source, v]) => ({ source, ...v })).sort((a, b) => b.points - a.points),
      weeks,
      recent: ledger.slice(0, 25),
    },
    review: {
      cards: cards.reduce((n, c) => n + c._count._all, 0),
      byBox: cards.map((c) => ({ box: c.box, count: c._count._all })).sort((a, b) => a.box - b.box),
      due: reviewDue,
      sessions: reviews.length,
      lastAt: reviews[0]?.createdAt ?? null,
    },
    studio: { done: studioDone.length, byTool: [...studioByTool.entries()].map(([tool, n]) => ({ tool, n })).sort((a, b) => b.n - a.n) },
    tutor: { threads: tutorRow?.threads ?? 0, messages: tutorRow?.messages ?? 0, lastAt: tutorRow?.last ?? null },
    logins: { recent: logins, total: loginCount, last30: logins30, ready: ready.logins },
    portfolio,
  };
}

export type LearnerDetail = NonNullable<Awaited<ReturnType<typeof loadLearnerDetail>>>;
