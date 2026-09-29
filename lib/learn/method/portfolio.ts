// Proof-of-Skill Portfolio: what a learner has shown they can do, gathered
// from the records that already prove it (passed labs, Studio challenges in
// the points ledger, capstones, certificates, badges) plus their reflections.
//
// The same loader feeds the learner's own page and the public page. The
// public page passes the owner's sharing settings, and anything not shared
// is never read into the page: reflections and raw work text only with
// "include my work samples", hidden sections not at all, and the name cut to
// first name and last initial. Email is never selected.
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import type { Locale } from "@/lib/i18n/config";
import { labFields, labKey } from "@/lib/i18n/sources/labs";
import { cachedLessons, readCached } from "@/lib/i18n/sources/learn";
import { computeBadges } from "@/lib/learn/badges";
import { BADGE_BY_ID } from "@/lib/learn/badge-defs";
import { getTotalPoints } from "@/lib/learn/points";
import { STUDIO_BY_ID } from "@/lib/learn/studio/catalog";
import { ensureMethodTables } from "./db";
import { TOP_BOX } from "./review";

export const PORTFOLIO_SECTIONS = ["labs", "studio", "capstone", "certificates", "badges", "memory"] as const;
export type PortfolioSection = (typeof PORTFOLIO_SECTIONS)[number];

export interface PortfolioSettingsView {
  isPublic: boolean;
  slug: string | null;
  includeWork: boolean;
  hidden: PortfolioSection[];
}

export interface PortfolioLab {
  id: string;
  title: string;
  labType: string;
  score: number | null;
  date: string;
  /** A short excerpt of the learner's own work, or null when not shared. */
  excerpt: string | null;
  /** Code labs: automated checks passed. */
  checks: { passed: number; total: number } | null;
  /** Build labs: the artefact link the learner submitted (work sample). */
  artifactUrl: string | null;
}

export interface PortfolioData {
  displayName: string;
  totalXp: number;
  labs: PortfolioLab[];
  studio: Array<{ toolId: string; icon: string; challenges: number; perfect: number; date: string }>;
  capstones: Array<{ trackTitle: string; status: string; score: number | null; date: string }>;
  certificates: Array<{ name: string; verificationId: string; issuedAt: string; distinction: boolean }>;
  badges: Array<{ id: string; icon: string }>;
  memory: { cards: number; mastered: number };
  reflections: Array<{ lessonId: string; lessonTitle: string; text: string; updatedAt: string }>;
}

const EXCERPT = 280;

function clip(s: string, n = EXCERPT): string {
  const x = s.replace(/\s+/g, " ").trim();
  return x.length > n ? `${x.slice(0, n - 1).trimEnd()}…` : x;
}

/** "Jane Doe" → "Jane D."; one word stays as it is. */
export function publicName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

function labExcerpt(labType: string, raw: unknown): { excerpt: string | null; checks: PortfolioLab["checks"]; artifactUrl: string | null } {
  const sub = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  let excerpt = "";
  let checks: PortfolioLab["checks"] = null;
  let artifactUrl: string | null = null;
  if (labType === "prompt") excerpt = str(sub.prompt);
  else if (labType === "workbench" || labType === "code") {
    const answers = sub.answers && typeof sub.answers === "object" ? Object.values(sub.answers as Record<string, unknown>) : [];
    excerpt = answers.map(str).filter(Boolean).join(" · ");
  } else if (labType === "build") {
    excerpt = str(sub.reflection);
    const url = str(sub.artifactUrl);
    if (/^https?:\/\//i.test(url)) artifactUrl = url.slice(0, 500);
  }
  if (labType === "code" && Array.isArray(sub.checkResults)) {
    const list = sub.checkResults as Array<{ pass?: unknown }>;
    checks = { passed: list.filter((c) => c && c.pass === true).length, total: list.length };
  }
  return { excerpt: excerpt ? clip(excerpt) : null, checks, artifactUrl };
}

// ── Settings ──────────────────────────────────────────────────────────────

export function newSlug(): string {
  return randomBytes(9).toString("base64url");
}

const cleanHidden = (h: string[] | null | undefined): PortfolioSection[] =>
  (h ?? []).filter((x): x is PortfolioSection => (PORTFOLIO_SECTIONS as readonly string[]).includes(x));

export async function getPortfolioSettings(studentId: string): Promise<PortfolioSettingsView> {
  await ensureMethodTables();
  const row = await prisma.portfolioSettings.findUnique({ where: { studentId } });
  if (!row) return { isPublic: false, slug: null, includeWork: false, hidden: [] };
  return { isPublic: row.isPublic, slug: row.slug, includeWork: row.includeWork, hidden: cleanHidden(row.hidden) };
}

/** The owner of a public portfolio, or null (unknown slug, or not public). */
export async function publicPortfolioOwner(slug: string): Promise<{ studentId: string; settings: PortfolioSettingsView } | null> {
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(slug)) return null;
  await ensureMethodTables();
  const row = await prisma.portfolioSettings.findUnique({ where: { slug } });
  if (!row || !row.isPublic) return null;
  return {
    studentId: row.studentId,
    settings: { isPublic: true, slug: row.slug, includeWork: row.includeWork, hidden: cleanHidden(row.hidden) },
  };
}

// ── Loader ────────────────────────────────────────────────────────────────

export async function loadPortfolio(
  studentId: string,
  locale: Locale,
  view: { publicView: boolean; includeWork: boolean; hidden: PortfolioSection[] },
): Promise<PortfolioData | null> {
  await ensureMethodTables();
  const show = (s: PortfolioSection) => !view.publicView || !view.hidden.includes(s);
  // Private view shows everything; public view shows work text only if shared.
  const withWork = !view.publicView || view.includeWork;

  const [student, totalXp, attempts, ledger, capstones, certs, badges, cards, mastered, reflections] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId }, select: { name: true } }),
    getTotalPoints(studentId),
    show("labs")
      ? prisma.labAttempt.findMany({
          where: { studentId, passed: true },
          orderBy: { updatedAt: "desc" },
          select: {
            labId: true,
            score: true,
            updatedAt: true,
            submission: true,
            lab: { select: { slug: true, title: true, labType: true, briefMd: true, scenarioMd: true, objectives: true, config: true } },
          },
          take: 200,
        })
      : Promise.resolve([]),
    show("studio")
      ? prisma.pointsLedger.findMany({
          where: { studentId, source: { in: ["studio_challenge", "studio_perfect"] } },
          select: { source: true, refId: true, createdAt: true },
        })
      : Promise.resolve([]),
    show("capstone")
      ? prisma.capstoneSubmission.findMany({
          where: { studentId },
          orderBy: { updatedAt: "desc" },
          select: { status: true, score: true, updatedAt: true, capstone: { select: { trackId: true, track: { select: { title: true } } } } },
        })
      : Promise.resolve([]),
    show("certificates")
      ? prisma.learnCertificate.findMany({
          where: { studentId, revoked: false },
          orderBy: { issuedAt: "desc" },
          select: { certificateName: true, verificationId: true, issuedAt: true, distinction: true },
        })
      : Promise.resolve([]),
    show("badges") ? computeBadges(studentId).catch(() => []) : Promise.resolve([]),
    show("memory") ? prisma.reviewCard.count({ where: { studentId } }) : Promise.resolve(0),
    show("memory") ? prisma.reviewCard.count({ where: { studentId, box: TOP_BOX } }) : Promise.resolve(0),
    withWork
      ? prisma.lessonReflection.findMany({
          where: { studentId },
          orderBy: { updatedAt: "desc" },
          select: { lessonId: true, text: true, updatedAt: true, lesson: { select: { title: true } } },
          take: 100,
        })
      : Promise.resolve([]),
  ]);
  if (!student) return null;

  // Labs: the best passed attempt per lab, titles from the translation cache
  // in one query (English where a translation is not cached yet).
  const bestByLab = new Map<string, (typeof attempts)[number]>();
  for (const a of attempts) {
    const cur = bestByLab.get(a.labId);
    if (!cur || (a.score ?? 0) > (cur.score ?? 0)) bestByLab.set(a.labId, a);
  }
  const labRows = [...bestByLab.values()];
  const titleCache = await readCached(
    locale,
    labRows.map((a) => ({ key: labKey(a.lab.slug), fields: labFields(a.lab) })),
  );
  const labs: PortfolioLab[] = labRows.map((a) => {
    const ex = labExcerpt(a.lab.labType, a.submission);
    return {
      id: a.labId,
      title: titleCache.get(labKey(a.lab.slug))?.title ?? a.lab.title,
      labType: a.lab.labType,
      score: a.score,
      date: a.updatedAt.toISOString(),
      excerpt: withWork ? ex.excerpt : null,
      checks: ex.checks,
      artifactUrl: withWork ? ex.artifactUrl : null,
    };
  });

  // Studio: challenges per tool, from the ledger (refId "<tool>:<challenge>").
  const byTool = new Map<string, { challenges: Set<string>; perfect: Set<string>; last: number }>();
  for (const r of ledger) {
    const [tool, challenge] = String(r.refId ?? "").split(":");
    if (!tool || !challenge || !STUDIO_BY_ID.has(tool)) continue;
    const e = byTool.get(tool) ?? { challenges: new Set<string>(), perfect: new Set<string>(), last: 0 };
    e.challenges.add(challenge);
    if (r.source === "studio_perfect") e.perfect.add(challenge);
    e.last = Math.max(e.last, r.createdAt.getTime());
    byTool.set(tool, e);
  }
  const studio = [...byTool.entries()]
    .map(([toolId, e]) => ({
      toolId,
      icon: STUDIO_BY_ID.get(toolId)?.icon ?? "🧪",
      challenges: e.challenges.size,
      perfect: e.perfect.size,
      date: new Date(e.last).toISOString(),
    }))
    .sort((a, b) => b.challenges - a.challenges);

  // Capstones: the latest submission per track.
  const seenTrack = new Set<string>();
  const capstoneRows = capstones.filter((c) => {
    if (seenTrack.has(c.capstone.trackId)) return false;
    seenTrack.add(c.capstone.trackId);
    return true;
  });

  const lessonTitles = await cachedLessons(locale, reflections.map((r) => r.lessonId));

  return {
    displayName: view.publicView ? publicName(student.name) : student.name,
    totalXp,
    labs,
    studio,
    capstones: capstoneRows.map((c) => ({
      trackTitle: c.capstone.track.title,
      status: c.status,
      score: c.status === "passed" ? c.score : null,
      date: c.updatedAt.toISOString(),
    })),
    certificates: certs.map((c) => ({
      name: c.certificateName,
      verificationId: c.verificationId,
      issuedAt: c.issuedAt.toISOString(),
      distinction: c.distinction,
    })),
    badges: badges.filter((b) => b.earned).map((b) => ({ id: b.id, icon: BADGE_BY_ID.get(b.id)?.icon ?? "🏅" })),
    memory: { cards, mastered },
    reflections: reflections.map((r) => ({
      lessonId: r.lessonId,
      lessonTitle: lessonTitles.get(r.lessonId)?.title ?? r.lesson.title,
      text: r.text,
      updatedAt: r.updatedAt.toISOString(),
    })),
  };
}
