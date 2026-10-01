// Admin read models for TIBLOGICS Learn learners: the Learners list (with
// filters, sorting, pagination and CSV export), the dashboard widget on the
// admin Learn page, and the per-learner detail page. Staff only: callers check
// requireAdminPage / requireAdmin first.
//
// Everything is batched: a page of 50 learners costs a fixed number of queries
// (groupBy / grouped raw SQL keyed by student id), never one per row.
//
// Privacy: no drafts, reflections or Tutor conversation content here, only
// counts.
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { OWNER_EMAIL } from "@/lib/auth";
import { ensureTrackPurchaseTable } from "@/lib/learn/purchases";
import { ensureMasteryTables } from "@/lib/learn/mastery/db";
import { ensureTeamTables } from "@/lib/learn/team/db";
import { ensureMethodTables } from "@/lib/learn/method/db";
import { ensureTutorTables } from "@/lib/learn/tutor/db";
import { ensureLoginEventTable } from "@/lib/learn/logins";

export const PAGE_SIZE = 50;
const DAY = 86_400_000;
const OWNER = OWNER_EMAIL.toLowerCase();

// ── Table readiness ─────────────────────────────────────────────────────────

export interface Ready { purchases: boolean; mastery: boolean; teams: boolean; method: boolean; tutor: boolean; logins: boolean }

/** Creates the runtime tables this module reads; each one may fail alone. */
export async function ensureLearnerTables(): Promise<Ready> {
  const ok = (p: Promise<void>, name: string) =>
    p.then(() => true).catch((err) => {
      console.error(`[admin/learners] ${name} tables`, err);
      return false;
    });
  const [purchases, mastery, teams, method, tutor, logins] = await Promise.all([
    ok(ensureTrackPurchaseTable(), "purchase"),
    ok(ensureMasteryTables(), "mastery"),
    ok(ensureTeamTables(), "team"),
    ok(ensureMethodTables(), "method"),
    ok(ensureTutorTables(), "tutor"),
    ok(ensureLoginEventTable(), "login"),
  ]);
  return { purchases, mastery, teams, method, tutor, logins };
}

// ── Filters ─────────────────────────────────────────────────────────────────

export const PLAN_FILTERS = ["monthly", "annual", "comped", "team", "tracks", "paid", "none"] as const;
export const SORTS = ["created", "name", "email", "lastLogin", "logins", "xp", "progress", "certs"] as const;
export type PlanFilter = (typeof PLAN_FILTERS)[number];
export type SortKey = (typeof SORTS)[number];

export interface LearnerFilters {
  q: string;
  plan: PlanFilter | null;
  /** Active (signed in, completed a lesson or earned XP) in the last N days. */
  active: 7 | 30 | null;
  /** Never came back: no sign-in after the sign-up session (10 minutes). */
  never: boolean;
  cert: boolean;
  track: string | null;
  sort: SortKey;
  dir: "asc" | "desc";
  page: number;
}

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseFilters(sp: Params | URLSearchParams): LearnerFilters {
  const get = (k: string) => (sp instanceof URLSearchParams ? sp.get(k) ?? "" : one(sp[k]));
  const plan = get("plan") as PlanFilter;
  const sort = get("sort") as SortKey;
  const active = get("active");
  return {
    q: get("q").trim().slice(0, 100),
    plan: PLAN_FILTERS.includes(plan) ? plan : null,
    active: active === "7" ? 7 : active === "30" ? 30 : null,
    never: get("never") === "1",
    cert: get("cert") === "1",
    track: /^[\w-]{1,64}$/.test(get("track")) ? get("track") : null,
    sort: SORTS.includes(sort) ? sort : "created",
    dir: get("dir") === "asc" ? "asc" : "desc",
    page: Math.max(1, Math.min(10_000, Number.parseInt(get("page"), 10) || 1)),
  };
}

/** Query string for a filter set (page and sort overridable), for links. */
export function filterQuery(f: LearnerFilters, over: Partial<LearnerFilters> = {}): string {
  const m = { ...f, ...over };
  const p = new URLSearchParams();
  if (m.q) p.set("q", m.q);
  if (m.plan) p.set("plan", m.plan);
  if (m.active) p.set("active", String(m.active));
  if (m.never) p.set("never", "1");
  if (m.cert) p.set("cert", "1");
  if (m.track) p.set("track", m.track);
  if (m.sort !== "created") p.set("sort", m.sort);
  if (m.dir !== "desc") p.set("dir", m.dir);
  if (m.page > 1) p.set("page", String(m.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

const LIVE_SUB = ["active", "trialing", "past_due"];

async function activeTeamMemberIds(ready: Ready): Promise<string[]> {
  if (!ready.teams) return [];
  const rows = await prisma.teamMember
    .findMany({ where: { status: "active", studentId: { not: null } }, select: { studentId: true } })
    .catch(() => []);
  return [...new Set(rows.map((r) => r.studentId!).filter(Boolean))];
}

async function buildWhere(f: LearnerFilters, ready: Ready): Promise<Prisma.StudentWhereInput> {
  const and: Prisma.StudentWhereInput[] = [];
  if (f.q) {
    and.push({ OR: [{ name: { contains: f.q, mode: "insensitive" } }, { email: { contains: f.q, mode: "insensitive" } }] });
  }
  if (f.plan) {
    const teamIds = f.plan === "team" || f.plan === "none" ? await activeTeamMemberIds(ready) : [];
    const purchased: Prisma.StudentWhereInput = ready.purchases ? { trackPurchases: { some: {} } } : { id: { in: [] } };
    switch (f.plan) {
      case "monthly":
      case "annual":
        and.push({ subscription: { plan: f.plan, status: { in: LIVE_SUB } } });
        break;
      case "comped":
        and.push({ OR: [{ subscription: { status: "comped" } }, { email: OWNER }] });
        break;
      case "team":
        and.push({ id: { in: teamIds } });
        break;
      case "tracks":
        and.push(purchased);
        break;
      case "paid":
        and.push({ OR: [{ subscription: { status: { in: LIVE_SUB }, stripeSubscriptionId: { not: null } } }, purchased] });
        break;
      case "none":
        and.push({
          NOT: { subscription: { status: { in: [...LIVE_SUB, "comped"] } } },
          email: { not: OWNER },
          id: { notIn: teamIds },
          ...(ready.purchases ? { trackPurchases: { none: {} } } : {}),
        });
        break;
    }
  }
  if (f.active) {
    const since = new Date(Date.now() - f.active * DAY);
    and.push({
      OR: [
        { lastLoginAt: { gte: since } },
        { progress: { some: { completedAt: { gte: since } } } },
        { points: { some: { createdAt: { gte: since } } } },
      ],
    });
  }
  if (f.never) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Student"
      WHERE "lastLoginAt" IS NULL OR "lastLoginAt" < "createdAt" + interval '10 minutes'`;
    and.push({ id: { in: rows.map((r) => r.id) } });
  }
  if (f.cert) and.push({ certificates: { some: { revoked: false } } });
  if (f.track) {
    const t = f.track;
    const diag = ready.mastery
      ? await prisma.diagnosticSession.findMany({ where: { trackId: t }, select: { studentId: true }, distinct: ["studentId"] }).catch(() => [])
      : [];
    and.push({
      OR: [
        { progress: { some: { lesson: { module: { trackId: t } } } } },
        { quizAttempts: { some: { quiz: { module: { trackId: t } } } } },
        { labAttempts: { some: { lab: { trackId: t } } } },
        { certificates: { some: { trackId: t } } },
        ...(ready.purchases ? [{ trackPurchases: { some: { trackId: t } } }] : []),
        { id: { in: diag.map((d) => d.studentId) } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

// ── Batched per-learner metrics ─────────────────────────────────────────────

const idFilter = (col: Prisma.Sql, ids: string[] | null) => (ids ? Prisma.sql`AND ${col} = ANY(${ids})` : Prisma.empty);

/** Lessons done (completed or tested out) per learner per track. */
async function lessonsDone(ids: string[] | null, ready: Ready) {
  const progress = Prisma.sql`
    SELECT lp."studentId", m."trackId", lp."lessonId" FROM "LessonProgress" lp
    JOIN "Lesson" l ON l."id" = lp."lessonId" JOIN "LearnModule" m ON m."id" = l."moduleId"
    WHERE TRUE ${idFilter(Prisma.sql`lp."studentId"`, ids)}`;
  const mastery = ready.mastery
    ? Prisma.sql`UNION SELECT lm."studentId", lm."trackId", lm."lessonId" FROM "LessonMastery" lm WHERE TRUE ${idFilter(Prisma.sql`lm."studentId"`, ids)}`
    : Prisma.empty;
  return prisma.$queryRaw<Array<{ studentId: string; trackId: string; done: number }>>`
    SELECT x."studentId", x."trackId", COUNT(DISTINCT x."lessonId")::int AS done
    FROM (${progress} ${mastery}) x GROUP BY 1, 2`;
}

/** Tracks a learner has touched: lessons, quizzes, labs, exam, placement. */
async function tracksTouched(ids: string[] | null, ready: Ready) {
  const f = (c: string) => idFilter(Prisma.raw(c), ids);
  const diag = ready.mastery
    ? Prisma.sql`UNION SELECT d."studentId", d."trackId" FROM "DiagnosticSession" d WHERE TRUE ${f(`d."studentId"`)}`
    : Prisma.empty;
  return prisma.$queryRaw<Array<{ studentId: string; trackId: string }>>`
    SELECT lp."studentId", m."trackId" FROM "LessonProgress" lp
      JOIN "Lesson" l ON l."id" = lp."lessonId" JOIN "LearnModule" m ON m."id" = l."moduleId" WHERE TRUE ${f(`lp."studentId"`)}
    UNION SELECT qa."studentId", m."trackId" FROM "QuizAttempt" qa
      JOIN "Quiz" q ON q."id" = qa."quizId" JOIN "LearnModule" m ON m."id" = q."moduleId" WHERE TRUE ${f(`qa."studentId"`)}
    UNION SELECT la."studentId", lb."trackId" FROM "LabAttempt" la JOIN "Lab" lb ON lb."id" = la."labId" WHERE TRUE ${f(`la."studentId"`)}
    UNION SELECT es."studentId", fe."trackId" FROM "FinalExamSession" es JOIN "FinalExam" fe ON fe."id" = es."finalExamId" WHERE TRUE ${f(`es."studentId"`)}
    ${diag}`;
}

async function lessonTotals(): Promise<Map<string, number>> {
  const rows = await prisma.$queryRaw<Array<{ trackId: string; n: number }>>`
    SELECT m."trackId", COUNT(l."id")::int AS n FROM "LearnModule" m JOIN "Lesson" l ON l."moduleId" = m."id" GROUP BY 1`;
  return new Map(rows.map((r) => [r.trackId, r.n]));
}

/** Overall progress %: lessons done over lessons in the tracks touched. */
async function progressByStudent(ids: string[] | null, ready: Ready, totals?: Map<string, number>) {
  const [done, touched, tot] = await Promise.all([lessonsDone(ids, ready), tracksTouched(ids, ready), totals ?? lessonTotals()]);
  const tracks = new Map<string, Set<string>>();
  for (const r of [...touched, ...done]) {
    if (!tracks.has(r.studentId)) tracks.set(r.studentId, new Set());
    tracks.get(r.studentId)!.add(r.trackId);
  }
  const doneBy = new Map<string, Map<string, number>>();
  for (const r of done) {
    if (!doneBy.has(r.studentId)) doneBy.set(r.studentId, new Map());
    doneBy.get(r.studentId)!.set(r.trackId, r.done);
  }
  const out = new Map<string, { tracks: string[]; percent: number; done: Map<string, number> }>();
  for (const [sid, set] of tracks) {
    const d = doneBy.get(sid) ?? new Map<string, number>();
    let n = 0;
    let total = 0;
    for (const t of set) {
      n += d.get(t) ?? 0;
      total += tot.get(t) ?? 0;
    }
    out.set(sid, { tracks: [...set], percent: total ? Math.round((n / total) * 100) : 0, done: d });
  }
  return out;
}

async function xpBy(ids: string[] | null) {
  const rows = await prisma.pointsLedger.groupBy({
    by: ["studentId"],
    where: ids ? { studentId: { in: ids } } : undefined,
    _sum: { points: true },
  });
  return new Map(rows.map((r) => [r.studentId, r._sum.points ?? 0]));
}

async function logins30By(ids: string[] | null, ready: Ready) {
  if (!ready.logins) return new Map<string, number>();
  const rows = await prisma.loginEvent.groupBy({
    by: ["studentId"],
    where: { at: { gte: new Date(Date.now() - 30 * DAY) }, ...(ids ? { studentId: { in: ids } } : {}) },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.studentId, r._count._all]));
}

async function certsBy(ids: string[] | null) {
  const rows = await prisma.learnCertificate.groupBy({
    by: ["studentId"],
    where: { revoked: false, ...(ids ? { studentId: { in: ids } } : {}) },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.studentId, r._count._all]));
}

// ── Plan ────────────────────────────────────────────────────────────────────

export interface PlanInfo {
  /** Short labels: "Monthly", "Annual (legacy)", "Comped", "Comped (owner)", "Team Acme", "Tracks: A, B", "None". */
  labels: string[];
  status: "active" | "trial" | "past due" | "cancelled" | "lifetime" | "none";
  paid: boolean;
}

interface SubLite { status: string; plan: string; stripeSubscriptionId: string | null }
interface TeamLite { name: string; status: string; comped: boolean; role: string; teamId: string }

export function planOf(
  email: string,
  sub: SubLite | null | undefined,
  team: TeamLite | null | undefined,
  purchasedTitles: string[],
): PlanInfo {
  const labels: string[] = [];
  let status: PlanInfo["status"] = "none";
  const live = !!sub && sub.status !== "canceled";
  if (sub && sub.status === "comped") {
    labels.push("Comped");
    status = "active";
  } else if (live) {
    labels.push(sub!.plan === "annual" ? "Annual (legacy)" : "Monthly");
    status = sub!.status === "trialing" ? "trial" : sub!.status === "past_due" ? "past due" : "active";
  } else if (email.toLowerCase() === OWNER) {
    labels.push("Comped (owner)");
    status = "active";
  }
  if (team) {
    labels.push(`Team ${team.name}${team.role !== "member" ? ` (${team.role})` : ""}`);
    if (status === "none") {
      status = team.comped || team.status === "active" || team.status === "comped" ? "active"
        : team.status === "trialing" ? "trial" : team.status === "past_due" ? "past due"
        : team.status === "canceled" ? "cancelled" : "none";
    }
  }
  if (purchasedTitles.length) {
    labels.push(`Tracks: ${purchasedTitles.join(", ")}`);
    if (status === "none") status = "lifetime";
  }
  if (sub?.status === "canceled" && status === "none") status = "cancelled";
  if (labels.length === 0) labels.push(sub?.status === "canceled" ? `None (${sub.plan === "annual" ? "annual" : "monthly"} cancelled)` : "None");
  const paid = (!!sub && !!sub.stripeSubscriptionId && LIVE_SUB.includes(sub.status)) || purchasedTitles.length > 0;
  return { labels, status, paid };
}

async function teamsBy(ids: string[], ready: Ready): Promise<Map<string, TeamLite>> {
  if (!ready.teams || ids.length === 0) return new Map();
  try {
    const seats = await prisma.teamMember.findMany({
      where: { studentId: { in: ids }, status: "active" },
      select: { studentId: true, teamId: true, role: true },
    });
    const teams = await prisma.team.findMany({
      where: { id: { in: [...new Set(seats.map((s) => s.teamId))] } },
      select: { id: true, name: true, status: true, comped: true },
    });
    const byId = new Map(teams.map((t) => [t.id, t]));
    const out = new Map<string, TeamLite>();
    for (const s of seats) {
      const t = byId.get(s.teamId);
      if (!t || !s.studentId) continue;
      if (!out.has(s.studentId) || t.status === "active" || t.comped) {
        out.set(s.studentId, { name: t.name, status: t.status, comped: t.comped, role: s.role, teamId: t.id });
      }
    }
    return out;
  } catch (err) {
    console.error("[admin/learners] teams", err);
    return new Map();
  }
}

// ── List ────────────────────────────────────────────────────────────────────

export interface LearnerRow {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  locale: string;
  emailVerified: boolean;
  plan: PlanInfo;
  tracksStarted: string[];
  progress: number;
  placement: Array<{ track: string; done: boolean; summary: string }>;
  lastLoginAt: Date | null;
  logins30: number;
  xp: number;
  certificates: number;
}

export interface TrackLite { id: string; slug: string; title: string }

export async function trackList(): Promise<TrackLite[]> {
  return prisma.learnTrack
    .findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, title: true } })
    .catch(() => []);
}

/** Full rows for these learners, in the order given. Fixed query count. */
async function rowsFor(ids: string[], ready: Ready, tracks: TrackLite[]): Promise<LearnerRow[]> {
  if (ids.length === 0) return [];
  const title = new Map(tracks.map((t) => [t.id, t.title]));
  const [students, subs, purchases, teams, progress, xp, logins, certs, diags, estimates] = await Promise.all([
    prisma.student.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, email: true, createdAt: true, locale: true, emailVerified: true, lastLoginAt: true },
    }),
    prisma.learnSubscription.findMany({
      where: { studentId: { in: ids } },
      select: { studentId: true, status: true, plan: true, stripeSubscriptionId: true },
    }),
    ready.purchases
      ? prisma.trackPurchase.findMany({ where: { studentId: { in: ids } }, select: { studentId: true, trackId: true } }).catch(() => [])
      : [],
    teamsBy(ids, ready),
    progressByStudent(ids, ready),
    xpBy(ids),
    logins30By(ids, ready),
    certsBy(ids),
    ready.mastery
      ? prisma.diagnosticSession
          .findMany({ where: { studentId: { in: ids }, status: "completed" }, select: { studentId: true, trackId: true, completedAt: true } })
          .catch(() => [])
      : [],
    ready.mastery
      ? prisma.masteryEstimate
          .groupBy({ by: ["studentId", "trackId", "level"], where: { studentId: { in: ids } }, _count: { _all: true } })
          .catch(() => [])
      : [],
  ]);

  const subBy = new Map(subs.map((s) => [s.studentId, s]));
  const boughtBy = new Map<string, string[]>();
  for (const p of purchases) boughtBy.set(p.studentId, [...(boughtBy.get(p.studentId) ?? []), title.get(p.trackId) ?? p.trackId]);
  const diagBy = new Map<string, Set<string>>();
  for (const d of diags) diagBy.set(d.studentId, (diagBy.get(d.studentId) ?? new Set()).add(d.trackId));
  const estBy = new Map<string, Record<string, number>>();
  for (const e of estimates) {
    const k = `${e.studentId}|${e.trackId}`;
    const rec = estBy.get(k) ?? {};
    rec[e.level] = (rec[e.level] ?? 0) + e._count._all;
    estBy.set(k, rec);
  }
  const byId = new Map(students.map((s) => [s.id, s]));

  return ids.flatMap((id) => {
    const s = byId.get(id);
    if (!s) return [];
    const prog = progress.get(id);
    const placedTracks = new Set([...(diagBy.get(id) ?? [])]);
    for (const k of estBy.keys()) if (k.startsWith(`${id}|`)) placedTracks.add(k.slice(id.length + 1));
    const started = new Set([...(prog?.tracks ?? []), ...placedTracks]);
    const placement = [...started].map((t) => {
      const e = estBy.get(`${id}|${t}`);
      return {
        track: title.get(t) ?? t,
        done: placedTracks.has(t),
        summary: e ? placementSummary(e) : "",
      };
    });
    return [{
      id: s.id,
      name: s.name,
      email: s.email,
      createdAt: s.createdAt,
      locale: s.locale,
      emailVerified: !!s.emailVerified,
      plan: planOf(s.email, subBy.get(id), teams.get(id), boughtBy.get(id) ?? []),
      tracksStarted: [...started].map((t) => title.get(t) ?? t),
      progress: prog?.percent ?? 0,
      placement,
      lastLoginAt: s.lastLoginAt,
      logins30: logins.get(id) ?? 0,
      xp: xp.get(id) ?? 0,
      certificates: certs.get(id) ?? 0,
    }];
  });
}

export function placementSummary(levels: Record<string, number>): string {
  return [
    levels.mastered ? `${levels.mastered} mastered` : null,
    levels.partial ? `${levels.partial} partly` : null,
    levels.new ? `${levels.new} new` : null,
  ].filter(Boolean).join(" · ");
}

export interface LearnerPage { rows: LearnerRow[]; total: number; page: number; pages: number; ready: Ready; tracks: TrackLite[] }

/** Ids matching the filters, sorted. `all` skips pagination (CSV). */
async function sortedIds(f: LearnerFilters, ready: Ready, all: boolean): Promise<{ ids: string[]; total: number }> {
  const where = await buildWhere(f, ready);
  const dir = f.dir;
  const dbOrder: Record<string, Prisma.StudentOrderByWithRelationInput[]> = {
    created: [{ createdAt: dir }],
    name: [{ name: dir }, { createdAt: "desc" }],
    email: [{ email: dir }],
    lastLogin: [{ lastLoginAt: { sort: dir, nulls: "last" } }, { createdAt: "desc" }],
  };
  const skip = (f.page - 1) * PAGE_SIZE;
  if (dbOrder[f.sort]) {
    const [total, rows] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        orderBy: dbOrder[f.sort],
        select: { id: true },
        ...(all ? {} : { skip, take: PAGE_SIZE }),
      }),
    ]);
    return { ids: rows.map((r) => r.id), total };
  }
  // Computed sorts: rank every matching learner by one aggregate (one grouped
  // query over the whole table), then page in memory.
  const matching = await prisma.student.findMany({ where, orderBy: { createdAt: "desc" }, select: { id: true } });
  const metric: Map<string, number> =
    f.sort === "xp" ? await xpBy(null)
    : f.sort === "logins" ? await logins30By(null, ready)
    : f.sort === "certs" ? await certsBy(null)
    : new Map([...(await progressByStudent(null, ready)).entries()].map(([k, v]) => [k, v.percent]));
  const sign = dir === "asc" ? 1 : -1;
  const ids = matching
    .map((r, i) => ({ id: r.id, v: metric.get(r.id) ?? 0, i }))
    .sort((a, b) => (a.v - b.v) * sign || a.i - b.i)
    .map((r) => r.id);
  return { ids: all ? ids : ids.slice(skip, skip + PAGE_SIZE), total: matching.length };
}

export async function listLearners(f: LearnerFilters): Promise<LearnerPage> {
  const ready = await ensureLearnerTables();
  const tracks = await trackList();
  const { ids, total } = await sortedIds(f, ready, false);
  const rows = await rowsFor(ids, ready, tracks);
  return { rows, total, page: f.page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), ready, tracks };
}

// ── CSV ─────────────────────────────────────────────────────────────────────

/** One CSV cell: quoted, with formula-leading characters neutralised. */
function cell(v: string | number | null | undefined): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const iso = (d: Date | null) => (d ? d.toISOString() : "");

export async function learnersCsv(f: LearnerFilters): Promise<{ csv: string; count: number }> {
  const ready = await ensureLearnerTables();
  const tracks = await trackList();
  const { ids } = await sortedIds(f, ready, true);
  const head = [
    "Name", "Email", "Signed up (UTC)", "Language", "Email verified", "Plan", "Status", "Tracks started",
    "Progress %", "Placement check", "Last login (UTC)", "Logins (30 days)", "Total XP", "Certificates", "Admin link",
  ];
  const lines = [head.map(cell).join(",")];
  const site = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");
  // Rows in batches so a large export stays at a bounded query size.
  for (let i = 0; i < ids.length; i += 500) {
    for (const r of await rowsFor(ids.slice(i, i + 500), ready, tracks)) {
      lines.push([
        r.name, r.email, iso(r.createdAt), r.locale, r.emailVerified ? "yes" : "no", r.plan.labels.join("; "), r.plan.status,
        r.tracksStarted.join("; "), r.progress,
        r.placement.map((p) => `${p.track}: ${p.done ? `yes${p.summary ? ` (${p.summary})` : ""}` : "no"}`).join("; "),
        iso(r.lastLoginAt), r.logins30, r.xp, r.certificates, `${site}/admin_pro/learn/learners/${r.id}`,
      ].map(cell).join(","));
    }
  }
  return { csv: "﻿" + lines.join("\r\n") + "\r\n", count: ids.length };
}

// ── Dashboard widget ────────────────────────────────────────────────────────

export interface LearnerStats {
  signupsToday: number;
  signups7: number;
  signups30: number;
  active7: number;
  /** Learners who signed up in the last 30 days and pay (subscription or purchase). */
  converted30: number;
  /** New paid subscriptions and track purchases in the last 30 days (any sign-up date). */
  newSubs30: number;
  newPurchases30: number;
}

export async function learnerStats(): Promise<LearnerStats | null> {
  try {
    const ready = await ensureLearnerTables();
    const now = Date.now();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const d7 = new Date(now - 7 * DAY);
    const d30 = new Date(now - 30 * DAY);
    const paidSub: Prisma.StudentWhereInput = { subscription: { stripeSubscriptionId: { not: null }, status: { in: [...LIVE_SUB, "canceled"] } } };
    const [signupsToday, signups7, signups30, active7, converted30, newSubs30, newPurchases30] = await Promise.all([
      prisma.student.count({ where: { createdAt: { gte: today } } }),
      prisma.student.count({ where: { createdAt: { gte: d7 } } }),
      prisma.student.count({ where: { createdAt: { gte: d30 } } }),
      prisma.student.count({
        where: {
          OR: [
            { lastLoginAt: { gte: d7 } },
            { progress: { some: { completedAt: { gte: d7 } } } },
            { points: { some: { createdAt: { gte: d7 } } } },
          ],
        },
      }),
      prisma.student.count({
        where: {
          createdAt: { gte: d30 },
          OR: [paidSub, ...(ready.purchases ? [{ trackPurchases: { some: {} } }] : [])],
        },
      }),
      prisma.learnSubscription.count({ where: { createdAt: { gte: d30 }, stripeSubscriptionId: { not: null } } }),
      ready.purchases ? prisma.trackPurchase.count({ where: { createdAt: { gte: d30 } } }) : 0,
    ]);
    return { signupsToday, signups7, signups30, active7, converted30, newSubs30, newPurchases30 };
  } catch (err) {
    console.error("[admin/learners] stats", err);
    return null;
  }
}
