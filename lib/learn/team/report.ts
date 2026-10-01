import prisma from "@/lib/prisma";
import { ensureMasteryTables } from "@/lib/learn/mastery/db";
import { ensureTeamTables } from "./db";

// What a team manager sees about members. PRIVACY: this file is the only
// reader for manager views, and it reads ONLY these sources:
//   lessons completed (LessonProgress, LessonMastery), quiz and exam SCORES
//   (QuizAttempt.score, FinalExamSession.score: never the answers),
//   certificates, Studio challenge completions and Daily Review days (both
//   from PointsLedger), assignments, and last-active dates.
// It never reads drafts (LearnerDraft), reflections (LessonReflection), Tutor
// conversations (Tutor*), practice pad or lab text (LabAttempt), capstone
// text or portfolio content. Keep it that way: members are told exactly this.

const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export interface TrackRef {
  id: string;
  slug: string;
  title: string;
}

async function liveTracks(): Promise<TrackRef[]> {
  return prisma.learnTrack.findMany({ where: { status: "live" }, orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, title: true } });
}

/** Lesson ids per live track. */
async function lessonsByTrack(): Promise<Map<string, string[]>> {
  const rows = await prisma.lesson.findMany({
    where: { module: { track: { status: "live" } } },
    select: { id: true, module: { select: { trackId: true } } },
  });
  const out = new Map<string, string[]>();
  for (const r of rows) {
    const list = out.get(r.module.trackId) ?? [];
    list.push(r.id);
    out.set(r.module.trackId, list);
  }
  return out;
}

/** Completed lessons per learner (completions and tested-out lessons), batched. */
async function doneLessons(studentIds: string[]) {
  const [progress, mastered] = await Promise.all([
    prisma.lessonProgress.findMany({ where: { studentId: { in: studentIds } }, select: { studentId: true, lessonId: true, completedAt: true } }),
    ensureMasteryTables()
      .then(() => prisma.lessonMastery.findMany({ where: { studentId: { in: studentIds } }, select: { studentId: true, lessonId: true } }))
      .catch(() => [] as Array<{ studentId: string; lessonId: string }>),
  ]);
  const done = new Map<string, Set<string>>();
  for (const r of [...progress, ...mastered]) {
    const s = done.get(r.studentId) ?? new Set<string>();
    s.add(r.lessonId);
    done.set(r.studentId, s);
  }
  return { done, progress };
}

/** Percent complete per learner per live track (same rule as lib/learn/progress.ts). */
export async function trackPercents(studentIds: string[]): Promise<Map<string, Map<string, number>>> {
  const out = new Map<string, Map<string, number>>();
  if (studentIds.length === 0) return out;
  const [byTrack, { done }] = await Promise.all([lessonsByTrack(), doneLessons(studentIds)]);
  for (const sid of studentIds) {
    const mine = done.get(sid) ?? new Set<string>();
    const m = new Map<string, number>();
    for (const [trackId, lessons] of byTrack) {
      const n = lessons.filter((l) => mine.has(l)).length;
      m.set(trackId, lessons.length ? Math.round((n / lessons.length) * 100) : 0);
    }
    out.set(sid, m);
  }
  return out;
}

/** Consecutive days with a finished Daily Review, ending today or yesterday (UTC). */
function reviewStreak(days: Set<string>): number {
  let d = new Date();
  if (!days.has(dayKey(d))) d = new Date(d.getTime() - DAY);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d = new Date(d.getTime() - DAY);
  }
  return n;
}

export interface MemberSummary {
  memberId: string;
  studentId: string | null;
  name: string | null;
  email: string;
  role: string;
  /** invited | active | expired (an invitation past its date) */
  status: string;
  invitedAt: string;
  joinedAt: string | null;
  inviteExpiresAt: string | null;
  lastActiveAt: string | null;
  tracksStarted: number;
  /** Average percent across the tracks this learner started (0 when none). */
  overallPercent: number;
  /** Average of the best score per quiz taken. */
  quizAverage: number | null;
  quizzesPassed: number;
  examBest: number | null;
  certificates: number;
  studioChallenges: number;
  studioPerfect: number;
  reviewStreak: number;
  reviewDays30: number;
}

export interface MemberActivity {
  perTrack: Map<string, number>;
  quizBest: Map<string, number>;
  quizPassed: Set<string>;
  exams: Map<string, number>;
  certs: Array<{ trackId: string; certificateName: string; issuedAt: Date; distinction: boolean; verificationId: string }>;
  studio: Array<{ tool: string; challenge: string; perfect: boolean }>;
  reviewDays: Set<string>;
  lastActive: Date | null;
}

/** Everything a manager may see, for a set of learners, in a handful of batched queries. */
async function activity(studentIds: string[]): Promise<Map<string, MemberActivity>> {
  const out = new Map<string, MemberActivity>();
  if (studentIds.length === 0) return out;
  const since30 = new Date(Date.now() - 400 * DAY);
  const [pct, quizzes, exams, certs, ledger, lastLedger, lastLesson, students] = await Promise.all([
    trackPercents(studentIds),
    prisma.quizAttempt.findMany({ where: { studentId: { in: studentIds } }, select: { studentId: true, quizId: true, score: true, passed: true } }),
    prisma.finalExamSession.findMany({
      where: { studentId: { in: studentIds }, status: "submitted", score: { not: null } },
      select: { studentId: true, score: true, finalExam: { select: { trackId: true } } },
    }),
    prisma.learnCertificate.findMany({
      where: { studentId: { in: studentIds }, revoked: false },
      select: { studentId: true, trackId: true, certificateName: true, issuedAt: true, distinction: true, verificationId: true },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.pointsLedger.findMany({
      where: {
        studentId: { in: studentIds },
        OR: [{ source: { in: ["studio_challenge", "studio_perfect"] } }, { source: "daily_review", createdAt: { gte: since30 } }],
      },
      select: { studentId: true, source: true, refId: true, createdAt: true },
    }),
    prisma.pointsLedger.groupBy({ by: ["studentId"], where: { studentId: { in: studentIds } }, _max: { createdAt: true } }),
    prisma.lessonProgress.groupBy({ by: ["studentId"], where: { studentId: { in: studentIds } }, _max: { completedAt: true } }),
    prisma.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, lastLoginAt: true } }),
  ]);
  for (const sid of studentIds) {
    out.set(sid, {
      perTrack: pct.get(sid) ?? new Map(),
      quizBest: new Map(),
      quizPassed: new Set(),
      exams: new Map(),
      certs: [],
      studio: [],
      reviewDays: new Set(),
      lastActive: null,
    });
  }
  for (const q of quizzes) {
    const a = out.get(q.studentId)!;
    a.quizBest.set(q.quizId, Math.max(a.quizBest.get(q.quizId) ?? 0, q.score));
    if (q.passed) a.quizPassed.add(q.quizId);
  }
  for (const e of exams) {
    const a = out.get(e.studentId)!;
    a.exams.set(e.finalExam.trackId, Math.max(a.exams.get(e.finalExam.trackId) ?? 0, e.score ?? 0));
  }
  for (const c of certs) out.get(c.studentId)!.certs.push(c);
  const studioSeen = new Map<string, Map<string, { tool: string; challenge: string; perfect: boolean }>>();
  for (const r of ledger) {
    const a = out.get(r.studentId)!;
    if (r.source === "daily_review") {
      a.reviewDays.add(dayKey(r.createdAt));
      continue;
    }
    const [tool, challenge] = String(r.refId ?? "").split(":");
    if (!tool || !challenge) continue;
    const m = studioSeen.get(r.studentId) ?? new Map();
    const c = m.get(`${tool}:${challenge}`) ?? { tool, challenge, perfect: false };
    if (r.source === "studio_perfect") c.perfect = true;
    m.set(`${tool}:${challenge}`, c);
    studioSeen.set(r.studentId, m);
  }
  for (const [sid, m] of studioSeen) out.get(sid)!.studio = [...m.values()];
  const latest = (sid: string, d: Date | null | undefined) => {
    const a = out.get(sid);
    if (a && d && (!a.lastActive || d > a.lastActive)) a.lastActive = d;
  };
  for (const r of lastLedger) latest(r.studentId, r._max.createdAt);
  for (const r of lastLesson) latest(r.studentId, r._max.completedAt);
  for (const s of students) latest(s.id, s.lastLoginAt);
  return out;
}

function summarize(a: MemberActivity | undefined) {
  if (!a) {
    return { lastActiveAt: null, tracksStarted: 0, overallPercent: 0, quizAverage: null, quizzesPassed: 0, examBest: null, certificates: 0, studioChallenges: 0, studioPerfect: 0, reviewStreak: 0, reviewDays30: 0 };
  }
  const started = [...a.perTrack.values()].filter((p) => p > 0);
  const best = [...a.quizBest.values()];
  const cutoff = dayKey(new Date(Date.now() - 30 * DAY));
  return {
    lastActiveAt: a.lastActive?.toISOString() ?? null,
    tracksStarted: started.length,
    overallPercent: started.length ? Math.round(started.reduce((x, y) => x + y, 0) / started.length) : 0,
    quizAverage: best.length ? Math.round(best.reduce((x, y) => x + y, 0) / best.length) : null,
    quizzesPassed: a.quizPassed.size,
    examBest: a.exams.size ? Math.max(...a.exams.values()) : null,
    certificates: a.certs.length,
    studioChallenges: a.studio.length,
    studioPerfect: a.studio.filter((s) => s.perfect).length,
    reviewStreak: reviewStreak(a.reviewDays),
    reviewDays30: [...a.reviewDays].filter((d) => d >= cutoff).length,
  };
}

async function teamMembers(teamId: string) {
  await ensureTeamTables();
  const rows = await prisma.teamMember.findMany({
    where: { teamId, status: { in: ["invited", "active"] } },
    orderBy: [{ status: "asc" }, { invitedAt: "asc" }],
  });
  const ids = rows.map((r) => r.studentId).filter((x): x is string => !!x);
  const students = await prisma.student.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  return { rows, ids, names: new Map(students.map((s) => [s.id, s.name])) };
}

export interface TeamReport {
  members: MemberSummary[];
  tracks: TrackRef[];
  progressByTrack: Array<{ trackId: string; title: string; avgPercent: number; started: number; completed: number }>;
  completionsByWeek: Array<{ week: string; lessons: number }>;
  skillGaps: Array<{ moduleId: string; module: string; track: string; avgScore: number; learners: number }>;
  assignments: Array<{ id: string; studentId: string; trackId: string; dueAt: string | null; percent: number; overdue: boolean }>;
}

export async function teamReport(teamId: string): Promise<TeamReport> {
  const [{ rows, ids, names }, tracks] = await Promise.all([teamMembers(teamId), liveTracks()]);
  const activeIds = rows.filter((r) => r.status === "active" && r.studentId).map((r) => r.studentId!);
  const [act, { progress }, quizzes, assignments] = await Promise.all([
    activity(ids),
    activeIds.length ? doneLessons(activeIds) : Promise.resolve({ progress: [] as Array<{ studentId: string; lessonId: string; completedAt: Date }> }),
    prisma.quiz.findMany({ select: { id: true, moduleId: true, module: { select: { title: true, track: { select: { title: true, status: true } } } } } }),
    prisma.teamAssignment.findMany({ where: { teamId }, orderBy: { createdAt: "asc" } }),
  ]);
  const now = new Date();

  const members: MemberSummary[] = rows.map((r) => {
    const expired = r.status === "invited" && (!r.inviteExpiresAt || r.inviteExpiresAt <= now);
    return {
      memberId: r.id,
      studentId: r.status === "active" ? r.studentId : null,
      name: r.studentId && r.status === "active" ? names.get(r.studentId) ?? null : null,
      email: r.email,
      role: r.role,
      status: expired ? "expired" : r.status,
      invitedAt: r.invitedAt.toISOString(),
      joinedAt: r.joinedAt?.toISOString() ?? null,
      inviteExpiresAt: r.inviteExpiresAt?.toISOString() ?? null,
      ...summarize(r.status === "active" && r.studentId ? act.get(r.studentId) : undefined),
    };
  });

  const progressByTrack = tracks.map((t) => {
    const ps = activeIds.map((sid) => act.get(sid)?.perTrack.get(t.id) ?? 0);
    const started = ps.filter((p) => p > 0);
    return {
      trackId: t.id,
      title: t.title,
      avgPercent: started.length ? Math.round(started.reduce((a, b) => a + b, 0) / started.length) : 0,
      started: started.length,
      completed: ps.filter((p) => p >= 100).length,
    };
  });

  // Lesson completions per week, last 12 weeks (weeks start Monday, UTC).
  const weekStart = (d: Date) => {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
    return x;
  };
  const first = new Date(weekStart(now).getTime() - 11 * 7 * DAY);
  const completionsByWeek = Array.from({ length: 12 }, (_, i) => ({ week: dayKey(new Date(first.getTime() + i * 7 * DAY)), lessons: 0 }));
  for (const p of progress) {
    if (p.completedAt < first) continue;
    const i = Math.floor((weekStart(p.completedAt).getTime() - first.getTime()) / (7 * DAY));
    if (completionsByWeek[i]) completionsByWeek[i].lessons++;
  }

  // Skills gaps: average best quiz score per module, lowest first.
  const byModule = new Map<string, number[]>();
  const quizModule = new Map(quizzes.filter((q) => q.module.track.status === "live").map((q) => [q.id, q]));
  for (const sid of activeIds) {
    for (const [quizId, best] of act.get(sid)?.quizBest ?? []) {
      const q = quizModule.get(quizId);
      if (!q) continue;
      const list = byModule.get(q.moduleId) ?? [];
      list.push(best);
      byModule.set(q.moduleId, list);
    }
  }
  const skillGaps = [...byModule.entries()]
    .map(([moduleId, scores]) => {
      const q = [...quizModule.values()].find((x) => x.moduleId === moduleId)!;
      return { moduleId, module: q.module.title, track: q.module.track.title, avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), learners: scores.length };
    })
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 10);

  return {
    members,
    tracks,
    progressByTrack,
    completionsByWeek,
    skillGaps,
    assignments: assignments
      .filter((a) => activeIds.includes(a.studentId))
      .map((a) => {
        const percent = act.get(a.studentId)?.perTrack.get(a.trackId) ?? 0;
        return { id: a.id, studentId: a.studentId, trackId: a.trackId, dueAt: a.dueAt?.toISOString() ?? null, percent, overdue: !!a.dueAt && a.dueAt < now && percent < 100 };
      }),
  };
}

export interface MemberDetail {
  member: MemberSummary;
  tracks: Array<{ trackId: string; title: string; slug: string; percent: number; examBest: number | null; assignedDue: string | null; assigned: boolean }>;
  quizzes: Array<{ module: string; track: string; best: number; passed: boolean }>;
  certificates: Array<{ certificateName: string; issuedAt: string; distinction: boolean; verificationId: string }>;
  studio: Array<{ tool: string; challenge: string; perfect: boolean }>;
}

/** One member of THIS team (null when the id belongs to another team or is not active). */
export async function memberDetail(teamId: string, memberId: string): Promise<MemberDetail | null> {
  await ensureTeamTables();
  const row = await prisma.teamMember.findFirst({ where: { id: memberId, teamId, status: "active" } });
  if (!row?.studentId) return null;
  const sid = row.studentId;
  const [report, quizzes, assignments] = await Promise.all([
    activity([sid]),
    prisma.quiz.findMany({ select: { id: true, module: { select: { title: true, sortOrder: true, track: { select: { title: true, sortOrder: true } } } } } }),
    prisma.teamAssignment.findMany({ where: { teamId, studentId: sid } }),
  ]);
  const tracks = await liveTracks();
  const a = report.get(sid)!;
  const student = await prisma.student.findUnique({ where: { id: sid }, select: { name: true } });
  const qmap = new Map(quizzes.map((q) => [q.id, q]));
  return {
    member: {
      memberId: row.id,
      studentId: sid,
      name: student?.name ?? null,
      email: row.email,
      role: row.role,
      status: row.status,
      invitedAt: row.invitedAt.toISOString(),
      joinedAt: row.joinedAt?.toISOString() ?? null,
      inviteExpiresAt: null,
      ...summarize(a),
    },
    tracks: tracks.map((t) => {
      const as = assignments.find((x) => x.trackId === t.id);
      return { trackId: t.id, title: t.title, slug: t.slug, percent: a.perTrack.get(t.id) ?? 0, examBest: a.exams.get(t.id) ?? null, assigned: !!as, assignedDue: as?.dueAt?.toISOString() ?? null };
    }),
    quizzes: [...a.quizBest.entries()]
      .map(([qid, best]) => {
        const q = qmap.get(qid);
        return q ? { module: q.module.title, track: q.module.track.title, best, passed: a.quizPassed.has(qid), o: q.module.track.sortOrder * 1000 + q.module.sortOrder } : null;
      })
      .filter((x): x is { module: string; track: string; best: number; passed: boolean; o: number } => x !== null)
      .sort((x, y) => x.o - y.o)
      .map(({ o: _o, ...rest }) => rest),
    certificates: a.certs.map((c) => ({ certificateName: c.certificateName, issuedAt: c.issuedAt.toISOString(), distinction: c.distinction, verificationId: c.verificationId })),
    studio: a.studio,
  };
}

/** CSV of the team's progress (one row per active member per live track). */
export async function teamCsv(teamId: string): Promise<string> {
  const r = await teamReport(teamId);
  const act = await activity(r.members.filter((m) => m.studentId).map((m) => m.studentId!));
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    // Leading =,+,-,@ would run as a formula in a spreadsheet.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const head = ["name", "email", "role", "status", "joined", "last_active", "track", "percent", "exam_best", "assigned_due", "quiz_average", "certificates", "studio_challenges", "review_streak"];
  const lines = [head.join(",")];
  for (const m of r.members) {
    if (!m.studentId) {
      lines.push([m.name, m.email, m.role, m.status, "", "", "", "", "", "", "", "", "", ""].map(esc).join(","));
      continue;
    }
    const a = act.get(m.studentId);
    for (const t of r.tracks) {
      const as = r.assignments.find((x) => x.studentId === m.studentId && x.trackId === t.id);
      lines.push(
        [m.name, m.email, m.role, m.status, m.joinedAt?.slice(0, 10), m.lastActiveAt?.slice(0, 10), t.title, a?.perTrack.get(t.id) ?? 0, a?.exams.get(t.id) ?? "", as?.dueAt?.slice(0, 10) ?? "", m.quizAverage ?? "", m.certificates, m.studioChallenges, m.reviewStreak]
          .map(esc)
          .join(","),
      );
    }
  }
  return lines.join("\n") + "\n";
}
