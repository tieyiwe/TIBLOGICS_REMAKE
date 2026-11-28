import type { ScannerLead } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { Locale, Vars } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/blueprint/config";
import { AGENT_CHECKS, type Finding } from "./audit";
import type { ExtraFinding, OpportunityKey, PageSpeedResult, Tech } from "./extra";
import { findingText } from "./i18n";
import { reportPrice } from "./config";
import { hideOwnStack, isOwnSite } from "./own";
import { SEVERITIES, isLockedSeverity, securityGrade, severityOf, type Severity } from "./severity";

// What a visitor sees of a scan, by how much they have unlocked:
//
//   free   scores, problem counts per area, the 3 biggest problems (titles
//          only), how the site ranks among scanned sites, how many build
//          ideas we have, the detected platform. Everything else is a
//          blurred placeholder in the UI, never sent to the browser.
//   email  the same page, which now says the results were emailed: every
//          problem (security ones up to medium) goes to their inbox with a
//          "fix this for me" link each (lib/scanner/email.ts), not onto a page
//          anyone holding the link could read.
//   Security findings carry a severity (lib/scanner/severity.ts). Critical and
//   high ones are counted but their text stays out of the page and the email
//   until the report is unlocked.
//   full   (paid, booked call, or staff) + every check, the written fix
//          steps, the build ideas, detected tools and versions, PageSpeed,
//          the competitor comparison, the PDF and the re-scan.

export type Area = "seo" | "perf" | "ux" | "ai" | "growth" | "security";
export const AREAS: Area[] = ["growth", "ai", "seo", "perf", "ux", "security"];
export type Level = "free" | "email" | "full";

/** What the scan stores in ScannerLead.extra. */
export interface StoredExtra {
  growthScore: number;
  securityScore: number;
  findings: ExtraFinding[];
  tech: Tech;
  opportunities: OpportunityKey[];
  page?: { title: string; description: string };
  measured?: Record<string, unknown>;
  pageSpeed?: PageSpeedResult | null;
  pageSpeedFindings?: ExtraFinding[];
  pageSpeedAt?: string;
  /** Scanned to be bought (over the free limit): nothing shows until paid. */
  held?: boolean;
}

export type AnyFinding = (Finding | ExtraFinding) & { area: Area };

export interface ViewFinding {
  check: string;
  area: Area;
  type: "bad" | "warning" | "good";
  text: string;
  service?: string;
  /** Security findings only. */
  severity?: Severity;
}

export interface SecuritySummary {
  grade: "A" | "B" | "C" | "D" | "F";
  score: number;
  counts: Record<Severity, number>;
  /** Findings whose text may be shown at this level (up to 2 before unlock). */
  shown: ViewFinding[];
  /** Locked findings: severity only, no text. */
  locked: Severity[];
}

export interface CompareRow {
  url: string;
  host: string;
  ok: boolean;
  error?: string;
  scores?: Record<"overall" | Area, number>;
}

export interface ReportView {
  token: string;
  url: string;
  domain: string;
  createdAt: string;
  level: Level;
  held: boolean;
  scores: Record<"overall" | Area, number | null>;
  counts: Record<Area, { bad: number; warning: number; good: number }>;
  problemsTotal: number;
  percentile: number | null;
  ideasCount: number;
  platform: string | null;
  top: ViewFinding[];
  problems: ViewFinding[] | null;
  full: null | {
    findings: ViewFinding[];
    tech: Tech | null;
    pageSpeed: PageSpeedResult | null;
    ideas: Array<{ key: string; title: string; body: string }>;
    compare: CompareRow[];
    rescan: { credits: number; until: string | null };
    unlockSource: string | null;
  };
  price: string | null;
  priceCents: number | null;
  hasEmail: boolean;
  /** The report was emailed (email level): the page says so. */
  emailed: boolean;
  /** Email level, but the email has not gone yet (slow or refused; the scanner job retries). */
  emailPending: boolean;
  /** Email level, but the address unsubscribed from our emails: it will not be sent. */
  emailBlocked: boolean;
  security: SecuritySummary | null;
}

/** Problems on scores that matter most for a business come first. */
const BASE_IMPACT: Record<string, number> = {
  title: 3, description: 3, "structured-data": 3, viewport: 3, https: 3, ttfb: 3, status: 3,
  "open-graph": 2, h1: 2, sitemap: 2, "page-weight": 2, compression: 2, caching: 2, "alt-text": 2,
  "content-depth": 2, "ai-crawlers": 2, "ai-summary": 2, canonical: 2, "semantic-html": 2, headings: 1,
};
const AREA_RANK: Record<Area, number> = { growth: 0, security: 1, ai: 2, seo: 3, perf: 4, ux: 5 };

function impactOf(f: AnyFinding): number {
  return "impact" in f && typeof f.impact === "number" ? f.impact : BASE_IMPACT[f.check] ?? 1;
}

/** Every finding of a lead, base and extra, worst first. */
export function allFindings(lead: Pick<ScannerLead, "findings" | "extra">): AnyFinding[] {
  const base = (Array.isArray(lead.findings) ? lead.findings : []) as unknown as Finding[];
  const extra = readExtra(lead.extra);
  const list: AnyFinding[] = [
    // Reports saved before AI Agent Readiness still hold its checks: not shown.
    ...base.filter((f) => f && typeof f.check === "string" && !AGENT_CHECKS.has(f.check)),
    ...(extra?.findings ?? []),
    ...(extra?.pageSpeedFindings ?? []),
  ] as AnyFinding[];
  const typeRank = { bad: 0, warning: 1, good: 2 } as const;
  return list.sort(
    (a, b) => typeRank[a.type] - typeRank[b.type] || impactOf(b) - impactOf(a) || AREA_RANK[a.area] - AREA_RANK[b.area],
  );
}

/** With the scanned URL, our own site's stack is left out (see ./own). */
export function readExtra(v: unknown, url?: string | null): StoredExtra | null {
  if (!v || typeof v !== "object") return null;
  const e = v as StoredExtra;
  if (typeof e.growthScore !== "number") return null;
  return e.tech && isOwnSite(url) ? { ...e, tech: hideOwnStack(e.tech, url) } : e;
}

type T = (key: string, vars?: Vars) => string;

function toView(t: T, locale: Locale, f: AnyFinding): ViewFinding {
  const service = "service" in f && f.service ? t(`tools.service.${f.service}`) : undefined;
  const severity = severityOf(f);
  return { check: f.check, area: f.area, type: f.type, text: findingText(t, locale, f), ...(service ? { service } : {}), ...(severity ? { severity } : {}) };
}

const mailSuppressed = (extra: unknown) => (extra as { mail?: { suppressed?: boolean } } | null)?.mail?.suppressed === true;

export function levelOf(lead: Pick<ScannerLead, "unlockedAt" | "email">, staff = false): Level {
  if (lead.unlockedAt || staff) return "full";
  return lead.email ? "email" : "free";
}

let pctCache: { at: number; scores: number[] } | null = null;

/** Share of sites scanned in the last 180 days that scored lower (needs 20+ scans). */
export async function percentileOf(score: number): Promise<number | null> {
  if (!pctCache || Date.now() - pctCache.at > 10 * 60_000) {
    const rows = await prisma.scannerLead
      .findMany({ where: { createdAt: { gte: new Date(Date.now() - 180 * 86_400_000) } }, select: { overallScore: true }, take: 20_000, orderBy: { createdAt: "desc" } })
      .catch(() => []);
    pctCache = { at: Date.now(), scores: rows.map((r) => r.overallScore) };
  }
  const s = pctCache.scores;
  if (s.length < 20) return null;
  return Math.round((s.filter((x) => x < score).length / s.length) * 100);
}

/** The free teaser: the worst problem of the worst areas first, so it shows the spread. */
function topThree(problems: AnyFinding[]): AnyFinding[] {
  const out: AnyFinding[] = [];
  for (const f of problems) if (out.length < 3 && !out.some((o) => o.area === f.area)) out.push(f);
  for (const f of problems) if (out.length < 3 && !out.includes(f)) out.push(f);
  return out;
}

export async function buildView(lead: ScannerLead, t: T, locale: Locale, opts: { staff?: boolean } = {}): Promise<ReportView> {
  const extra = readExtra(lead.extra, lead.url);
  const held = !!extra?.held && !lead.unlockedAt && !opts.staff;
  const level: Level = held ? "free" : levelOf(lead, opts.staff);
  const findings = allFindings(lead);
  const counts = Object.fromEntries(AREAS.map((a) => [a, { bad: 0, warning: 0, good: 0 }])) as ReportView["counts"];
  for (const f of findings) counts[f.area] && counts[f.area][f.type]++;
  const problems = findings.filter((f) => f.type !== "good");
  const price = reportPrice();
  // Critical and high security findings stay out of anything shown before unlock.
  const open = problems.filter((f) => !isLockedSeverity(severityOf(f)));
  const security = securitySummary(extra?.securityScore ?? null, problems, level === "full", t, locale);

  const view: ReportView = {
    token: lead.token ?? "",
    url: lead.url,
    domain: lead.domain ?? "",
    createdAt: lead.createdAt.toISOString(),
    level,
    held,
    scores: {
      overall: lead.overallScore, seo: lead.seoScore, perf: lead.perfScore, ux: lead.uxScore, ai: lead.aiScore,
      growth: extra?.growthScore ?? null, security: extra?.securityScore ?? null,
    },
    counts,
    problemsTotal: problems.length,
    percentile: await percentileOf(lead.overallScore),
    ideasCount: extra?.opportunities?.length ?? 0,
    platform: extra?.tech ? [extra.tech.cms, extra.tech.shop].filter(Boolean).join(" · ") || null : null,
    top: topThree(level === "full" ? problems : open).map((f) => toView(t, locale, f)),
    // The list itself is emailed, not shown (see the header comment).
    problems: null,
    full: null,
    price: price ? formatMoney(price, locale) : null,
    priceCents: price,
    hasEmail: !!lead.email,
    // Sent (emailedAt), or on its way: the send failed or is slow and the
    // scanner job retries it. A visitor who unlocked has the full report.
    emailed: level === "email" && !!lead.emailedAt,
    emailPending: level === "email" && !lead.emailedAt && !mailSuppressed(lead.extra),
    emailBlocked: level === "email" && !lead.emailedAt && mailSuppressed(lead.extra),
    security,
  };
  if (held) {
    // Bought over the free limit and not paid yet: only the site and price.
    view.top = [];
    view.problems = null;
    view.scores = { overall: null, seo: null, perf: null, ux: null, ai: null, growth: null, security: null };
    view.counts = Object.fromEntries(AREAS.map((a) => [a, { bad: 0, warning: 0, good: 0 }])) as ReportView["counts"];
    view.problemsTotal = 0;
    view.percentile = null;
    view.platform = null;
    view.security = null;
  }
  if (level === "full") {
    view.full = {
      findings: findings.map((f) => toView(t, locale, f)),
      tech: extra?.tech ?? null,
      pageSpeed: extra?.pageSpeed ?? null,
      ideas: (extra?.opportunities ?? []).map((k) => ({ key: k, title: t(`tools.opp.${k}.title`), body: t(`tools.opp.${k}.body`) })),
      compare: Array.isArray(lead.compare) ? (lead.compare as unknown as CompareRow[]) : [],
      rescan: { credits: lead.rescanUntil && lead.rescanUntil > new Date() ? lead.rescanCredits : 0, until: lead.rescanUntil?.toISOString() ?? null },
      unlockSource: lead.unlockSource,
    };
  }
  return view;
}

/** The security card: grade, counts by severity, and what may be shown at this level. */
function securitySummary(score: number | null, problems: AnyFinding[], unlocked: boolean, t: T, locale: Locale): SecuritySummary | null {
  if (score === null) return null;
  const sec = problems.filter((f) => f.area === "security");
  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>;
  for (const f of sec) {
    const s = severityOf(f);
    if (s) counts[s]++;
  }
  const bySeverity = (f: AnyFinding) => SEVERITIES.indexOf(severityOf(f) ?? "low");
  const sorted = [...sec].sort((a, b) => bySeverity(a) - bySeverity(b));
  return {
    grade: securityGrade(score, counts),
    score,
    counts,
    shown: (unlocked ? sorted : sorted.filter((f) => !isLockedSeverity(severityOf(f))).slice(0, 2)).map((f) => toView(t, locale, f)),
    locked: unlocked ? [] : sorted.map(severityOf).filter((s): s is Severity => isLockedSeverity(s)),
  };
}
