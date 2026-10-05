import type { ScannerLead } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { Locale, Vars } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/blueprint/config";
import type { Finding } from "./audit";
import type { ExtraFinding, OpportunityKey, PageSpeedResult, Tech } from "./extra";
import { findingText } from "./i18n";
import { reportPrice } from "./config";
import { readReport, type WrittenReport } from "./report-shape";

// What a visitor sees of a scan, by how much they have unlocked:
//
//   free   scores, problem counts per area, the 3 biggest problems (titles
//          only), how the site ranks among scanned sites, how many build
//          ideas we have, the detected platform. Everything else is a
//          blurred placeholder in the UI, never sent to the browser.
//   email  + every problem's title.
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
    report: WrittenReport | null;
    reportStatus: string | null;
    ideas: Array<{ key: string; title: string; body: string }>;
    compare: CompareRow[];
    rescan: { credits: number; until: string | null };
    unlockSource: string | null;
  };
  price: string | null;
  priceCents: number | null;
  hasEmail: boolean;
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
    ...base.filter((f) => f && typeof f.check === "string"),
    ...(extra?.findings ?? []),
    ...(extra?.pageSpeedFindings ?? []),
  ] as AnyFinding[];
  const typeRank = { bad: 0, warning: 1, good: 2 } as const;
  return list.sort(
    (a, b) => typeRank[a.type] - typeRank[b.type] || impactOf(b) - impactOf(a) || AREA_RANK[a.area] - AREA_RANK[b.area],
  );
}

export function readExtra(v: unknown): StoredExtra | null {
  if (!v || typeof v !== "object") return null;
  const e = v as StoredExtra;
  return typeof e.growthScore === "number" ? e : null;
}

type T = (key: string, vars?: Vars) => string;

function toView(t: T, locale: Locale, f: AnyFinding): ViewFinding {
  const service = "service" in f && f.service ? t(`tools.service.${f.service}`) : undefined;
  return { check: f.check, area: f.area, type: f.type, text: findingText(t, locale, f), ...(service ? { service } : {}) };
}

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
  const extra = readExtra(lead.extra);
  const held = !!extra?.held && !lead.unlockedAt && !opts.staff;
  const level: Level = held ? "free" : levelOf(lead, opts.staff);
  const findings = allFindings(lead);
  const counts = Object.fromEntries(AREAS.map((a) => [a, { bad: 0, warning: 0, good: 0 }])) as ReportView["counts"];
  for (const f of findings) counts[f.area] && counts[f.area][f.type]++;
  const problems = findings.filter((f) => f.type !== "good");
  const price = reportPrice();

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
    top: topThree(problems).map((f) => toView(t, locale, f)),
    problems: level === "free" ? null : problems.map((f) => toView(t, locale, f)),
    full: null,
    price: price ? formatMoney(price, locale) : null,
    priceCents: price,
    hasEmail: !!lead.email,
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
  }
  if (level === "full") {
    view.full = {
      findings: findings.map((f) => toView(t, locale, f)),
      tech: extra?.tech ?? null,
      pageSpeed: extra?.pageSpeed ?? null,
      report: readReport(lead.report),
      reportStatus: lead.reportStatus,
      ideas: (extra?.opportunities ?? []).map((k) => ({ key: k, title: t(`tools.opp.${k}.title`), body: t(`tools.opp.${k}.body`) })),
      compare: Array.isArray(lead.compare) ? (lead.compare as unknown as CompareRow[]) : [],
      rescan: { credits: lead.rescanUntil && lead.rescanUntil > new Date() ? lead.rescanCredits : 0, until: lead.rescanUntil?.toISOString() ?? null },
      unlockSource: lead.unlockSource,
    };
  }
  return view;
}
