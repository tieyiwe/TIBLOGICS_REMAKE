import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import type { Locale } from "@/lib/i18n/config";
import { translatorFor } from "@/lib/i18n/server";
import { cachedLessons, loadTrackSources, localizedTrack, trackText } from "@/lib/i18n/sources/learn";
import { moduleRecap } from "@/lib/learn/recap";
import { termsInText } from "@/lib/learn/glossary/match";
import { formsPattern } from "@/lib/learn/glossary/pattern";
import { moduleSnippets, oneLine, plain, type Snippet } from "./extract";
import { cheatSheetPdf } from "./pdf";

// One-page cheat sheet per module (GET /api/learn/cheatsheet/[moduleId]):
// the key ideas (lesson recaps, else the lesson objectives), up to five
// prompts or code snippets from the lessons' fenced blocks, and the glossary
// terms the module uses, in the learner's language. No model calls: French
// text comes from the translation cache when it is there (English meanwhile).
// The rendered PDF is kept in memory per (module, locale, content hash), so
// a new lesson version, recap or translation makes a new sheet.

export interface CheatSheet {
  moduleId: string;
  locale: Locale;
  trackSlug: string;
  trackTitle: string;
  moduleNumber: number;
  moduleTitle: string;
  ideas: Array<{ lesson: string; points: string[] }>;
  snippets: Snippet[];
  terms: Array<{ term: string; def: string }>;
}

const MAX_TERMS = 8;

/** The module's sheet content, or null when the module does not exist. */
export async function cheatSheetData(moduleId: string, locale: Locale): Promise<CheatSheet | null> {
  const mod = await prisma.learnModule
    .findUnique({
      where: { id: moduleId },
      select: {
        id: true,
        title: true,
        trackId: true,
        track: { select: { slug: true, title: true } },
        lessons: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, objective: true, bodyMd: true } },
      },
    })
    .catch(() => null);
  if (!mod) return null;

  const [[src], recaps, bodies, siblings] = await Promise.all([
    loadTrackSources({ id: mod.trackId }),
    moduleRecap(mod.id, locale),
    cachedLessons(locale, mod.lessons.map((l) => l.id)),
    prisma.learnModule.findMany({ where: { trackId: mod.trackId }, orderBy: { sortOrder: "asc" }, select: { id: true } }).catch(() => []),
  ]);
  const text = src ? (locale === "en" ? trackText(src) : (await localizedTrack(src, locale)).text) : null;
  const recapOf = new Map(recaps.map((r) => [r.lessonId, r.recap]));

  const ideas = mod.lessons
    .map((l) => {
      const title = plain(text?.lessons[l.id]?.title ?? l.title);
      const recap = recapOf.get(l.id);
      if (recap) return { lesson: title, points: recap.takeaways.slice(0, 3).map(plain) };
      const objective = text?.lessons[l.id]?.objective ?? l.objective;
      return { lesson: title, points: objective ? [plain(objective)] : [] };
    })
    .filter((x) => x.points.length > 0);

  // Lesson bodies in the learner's language when cached, else English.
  const md = mod.lessons.map((l) => bodies.get(l.id)?.bodyMd ?? l.bodyMd);
  const snippets = moduleSnippets(md, 5);

  // Glossary terms, the most used first. Code is left out of the count.
  const prose = md.map((m) => m.replace(/```[\s\S]*?```/g, " ")).join("\n\n");
  const found = termsInText(prose, locale, 200);
  const terms = found
    .map((g) => ({ g, n: (prose.match(new RegExp(formsPattern(g.forms), "giu")) ?? []).length }))
    .sort((a, b) => b.n - a.n)
    .slice(0, MAX_TERMS)
    .map(({ g }) => ({ term: g.term, def: oneLine(g.def) }))
    .sort((a, b) => a.term.localeCompare(b.term, locale));

  const index = siblings.findIndex((s) => s.id === mod.id);
  return {
    moduleId: mod.id,
    locale,
    trackSlug: mod.track.slug,
    trackTitle: plain(text?.title ?? mod.track.title),
    moduleNumber: index >= 0 ? index + 1 : 1,
    moduleTitle: plain(text?.modules[mod.id]?.title ?? mod.title),
    ideas,
    snippets,
    terms,
  };
}

/** A content version for the cache: any change to what the sheet shows changes it. */
export function cheatSheetVersion(s: CheatSheet): string {
  return createHash("sha256").update(JSON.stringify(s)).digest("hex").slice(0, 20);
}

export function cheatSheetFileName(s: CheatSheet): string {
  const slug = (x: string) =>
    x
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);
  return `ARFA-cheat-sheet-${slug(s.trackSlug)}-module-${s.moduleNumber}${s.moduleTitle ? `-${slug(s.moduleTitle)}` : ""}-${s.locale}.pdf`;
}

// ── In-memory PDF cache ─────────────────────────────────────────────────────
// Small (a sheet is ~5 KB), bounded, per process. Keyed on the content hash,
// so it never serves an out-of-date sheet.

const CACHE_MAX = 300;
const cache = new Map<string, Uint8Array>();

export async function cheatSheetPdfCached(s: CheatSheet): Promise<{ pdf: Uint8Array; version: string; hit: boolean }> {
  const version = cheatSheetVersion(s);
  const key = `${s.moduleId}:${s.locale}:${version}`;
  const hit = cache.get(key);
  if (hit) {
    // Most recently used last.
    cache.delete(key);
    cache.set(key, hit);
    return { pdf: hit, version, hit: true };
  }
  const pdf = await cheatSheetPdf(s, translatorFor(s.locale));
  cache.set(key, pdf);
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
  return { pdf, version, hit: false };
}
