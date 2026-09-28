import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { Locale } from "../config";
import { localized, translated, type Fields } from "../content";

// Learning Box course content: tracks and lessons.
//
// Two kinds of record, each translated in one model call:
//
//   track:<slug>   everything a catalog card, landing page, outline or rail
//                  shows about a track: title, tagline, description, audience,
//                  outcomes, final exam title, module titles and summaries,
//                  and every lesson's title and objective. One record per
//                  track means an outline of 40 lessons costs one call, not 40.
//   lesson:<id>    what the lesson page shows: title, objective, the Markdown
//                  body and the "Practice it" resource titles and notes.
//
// Pages and warm() must hash exactly the same fields, so both build them with
// trackFields() / lessonFields() from rows loaded with TRACK_SOURCE /
// LESSON_SOURCE. Certificate names are deliberately left out: certificates
// are legal documents and keep their English name.

// ── Tracks ─────────────────────────────────────────────────────────────────

export const TRACK_SOURCE = {
  id: true,
  slug: true,
  title: true,
  tagline: true,
  description: true,
  audience: true,
  outcomes: true,
  finalExam: { select: { title: true } },
  modules: {
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      summary: true,
      lessons: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, objective: true } },
    },
  },
} satisfies Prisma.LearnTrackSelect;

export type TrackSource = Prisma.LearnTrackGetPayload<{ select: typeof TRACK_SOURCE }>;

export const trackKey = (slug: string) => `track:${slug}`;

function outcomesOf(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** The fields hashed and translated for a track. */
export function trackFields(t: TrackSource): Fields {
  const f: Fields = { title: t.title, description: t.description };
  if (t.tagline) f.tagline = t.tagline;
  if (t.audience) f.audience = t.audience;
  outcomesOf(t.outcomes).forEach((o, i) => { f[`outcome.${i}`] = o; });
  if (t.finalExam?.title) f.examTitle = t.finalExam.title;
  for (const m of t.modules) {
    f[`m.${m.id}.title`] = m.title;
    if (m.summary) f[`m.${m.id}.summary`] = m.summary;
    for (const l of m.lessons) {
      f[`l.${l.id}.title`] = l.title;
      if (l.objective) f[`l.${l.id}.objective`] = l.objective;
    }
  }
  return f;
}

/** A track's text in one language, with English for anything missing. */
export interface TrackText {
  title: string;
  tagline: string | null;
  description: string;
  audience: string | null;
  outcomes: string[];
  examTitle: string | null;
  modules: Record<string, { title: string; summary: string | null }>;
  lessons: Record<string, { title: string; objective: string | null }>;
}

export function trackText(t: TrackSource, f: Fields = trackFields(t)): TrackText {
  const modules: TrackText["modules"] = {};
  const lessons: TrackText["lessons"] = {};
  for (const m of t.modules) {
    modules[m.id] = { title: f[`m.${m.id}.title`] || m.title, summary: m.summary ? f[`m.${m.id}.summary`] || m.summary : null };
    for (const l of m.lessons) {
      lessons[l.id] = { title: f[`l.${l.id}.title`] || l.title, objective: l.objective ? f[`l.${l.id}.objective`] || l.objective : null };
    }
  }
  return {
    title: f.title || t.title,
    tagline: t.tagline ? f.tagline || t.tagline : null,
    description: f.description || t.description,
    audience: t.audience ? f.audience || t.audience : null,
    outcomes: outcomesOf(t.outcomes).map((o, i) => f[`outcome.${i}`] || o),
    examTitle: t.finalExam?.title ? f.examTitle || t.finalExam.title : null,
    modules,
    lessons,
  };
}

/** Load the translation source for tracks (by slug or id). */
export async function loadTrackSources(where: Prisma.LearnTrackWhereInput): Promise<TrackSource[]> {
  return prisma.learnTrack
    .findMany({ where, orderBy: { sortOrder: "asc" }, select: TRACK_SOURCE })
    .catch(() => []);
}

/** One track for a page: translated if cached, else English and queued. */
export async function localizedTrack(t: TrackSource, locale: Locale): Promise<{ text: TrackText; pending: boolean }> {
  const { value, pending } = await localized(trackKey(t.slug), locale, trackFields(t));
  return { text: trackText(t, value), pending };
}

/**
 * Several tracks for one page (catalog, dashboard) with a single cache read.
 * Misses are queued for translation (at most one call per track) and shown
 * in English meanwhile.
 */
export async function localizedTracks(
  list: TrackSource[],
  locale: Locale,
): Promise<{ texts: Map<string, TrackText>; pending: boolean }> {
  const texts = new Map<string, TrackText>();
  if (locale === "en") {
    for (const t of list) texts.set(t.slug, trackText(t));
    return { texts, pending: false };
  }
  const entries = list.map((t) => ({ key: trackKey(t.slug), fields: trackFields(t) }));
  const cached = await readCached(locale, entries);
  let pending = false;
  list.forEach((t, i) => {
    const hit = cached.get(entries[i].key);
    if (hit) texts.set(t.slug, trackText(t, hit));
    else {
      pending = true;
      texts.set(t.slug, trackText(t));
      void translated(entries[i].key, locale, entries[i].fields, "queue").catch(() => null);
    }
  });
  return { texts, pending };
}

// ── Lessons ────────────────────────────────────────────────────────────────

export const LESSON_SOURCE = {
  id: true,
  title: true,
  objective: true,
  bodyMd: true,
  resources: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, notes: true } },
} satisfies Prisma.LessonSelect;

export type LessonSource = Prisma.LessonGetPayload<{ select: typeof LESSON_SOURCE }>;

export const lessonKey = (id: string) => `lesson:${id}`;

/** The fields hashed and translated for a lesson. */
export function lessonFields(l: LessonSource): Fields {
  const f: Fields = { title: l.title, bodyMd: l.bodyMd };
  if (l.objective) f.objective = l.objective;
  for (const r of l.resources) {
    f[`r.${r.id}.title`] = r.title;
    if (r.notes) f[`r.${r.id}.notes`] = r.notes;
  }
  return f;
}

export interface LessonText {
  title: string;
  objective: string | null;
  bodyMd: string;
  resources: Record<string, { title: string; notes: string | null }>;
}

export function lessonText(l: LessonSource, f: Fields = lessonFields(l)): LessonText {
  const resources: LessonText["resources"] = {};
  for (const r of l.resources) {
    resources[r.id] = { title: f[`r.${r.id}.title`] || r.title, notes: r.notes ? f[`r.${r.id}.notes`] || r.notes : null };
  }
  return {
    title: f.title || l.title,
    objective: l.objective ? f.objective || l.objective : null,
    bodyMd: f.bodyMd || l.bodyMd,
    resources,
  };
}

/** One lesson for the lesson page: translated if cached, else English and queued. */
export async function localizedLesson(l: LessonSource, locale: Locale): Promise<{ text: LessonText; pending: boolean }> {
  const { value, pending } = await localized(lessonKey(l.id), locale, lessonFields(l));
  return { text: lessonText(l, value), pending };
}

/**
 * Cached lesson translations for many lessons at once, without starting any
 * translation: one query for the sources, one for the cache. Returns only the
 * lessons whose cached translation matches the current English.
 */
export async function cachedLessons(locale: Locale, ids: string[]): Promise<Map<string, LessonText>> {
  const out = new Map<string, LessonText>();
  if (locale === "en" || ids.length === 0) return out;
  const rows = await prisma.lesson.findMany({ where: { id: { in: ids } }, select: LESSON_SOURCE }).catch(() => []);
  const cached = await readCached(locale, rows.map((l) => ({ key: lessonKey(l.id), fields: lessonFields(l) })));
  for (const l of rows) {
    const hit = cached.get(lessonKey(l.id));
    if (hit) out.set(l.id, lessonText(l, hit));
  }
  return out;
}

// ── Batch cache read ───────────────────────────────────────────────────────
//
// lib/i18n/content.ts reads one key at a time. Pages that list many records
// read them all in one query here. The table and the hash must match
// content.ts exactly: same CREATE TABLE, same hash of the sorted fields.

const TABLE_SQL = `CREATE TABLE IF NOT EXISTS "ContentTranslation" (
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentTranslation_pkey" PRIMARY KEY ("key", "locale")
  )`;

let tableReady: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  tableReady ??= prisma.$executeRawUnsafe(TABLE_SQL).then(
    () => undefined,
    (err) => {
      tableReady = null;
      throw err;
    },
  );
  return tableReady;
}

/** Same hash as lib/i18n/content.ts. */
export function hashFields(fields: Fields): string {
  const h = createHash("sha256");
  for (const k of Object.keys(fields).sort()) h.update(k).update("\0").update(fields[k] ?? "").update("\0");
  return h.digest("hex").slice(0, 32);
}

/**
 * Cached translations for many keys in one query. Only rows whose hash
 * matches the given English fields are returned (merged over the English, as
 * translated() does). Never calls the model.
 */
export async function readCached(
  locale: Locale,
  entries: Array<{ key: string; fields: Fields }>,
): Promise<Map<string, Fields>> {
  const out = new Map<string, Fields>();
  if (locale === "en" || entries.length === 0) return out;
  try {
    await ensureTable();
    const rows = await prisma.$queryRawUnsafe<Array<{ key: string; hash: string; value: Fields }>>(
      `SELECT "key", "hash", "value" FROM "ContentTranslation" WHERE "locale" = $1 AND "key" = ANY($2::text[])`,
      locale,
      entries.map((e) => e.key),
    );
    const byKey = new Map(rows.map((r) => [r.key, r]));
    for (const e of entries) {
      const r = byKey.get(e.key);
      if (r && r.hash === hashFields(e.fields)) out.set(e.key, { ...e.fields, ...r.value });
    }
  } catch (err) {
    console.error("[i18n/learn] batch cache read failed", err instanceof Error ? err.message : err);
  }
  return out;
}

// ── Warm-up (translate cron) ───────────────────────────────────────────────

/**
 * Translate what is not cached yet: tracks first (they drive every catalog
 * and outline), then lessons in track order. One model call per record;
 * stops when the budget runs out. Returns how many records it translated.
 */
export async function warm(locale: Locale, budget: { left: number }): Promise<number> {
  if (locale === "en" || budget.left <= 0) return 0;
  let done = 0;

  const tracks = await loadTrackSources({ status: { in: ["live", "coming_soon"] } });
  const trackEntries = tracks.map((t) => ({ key: trackKey(t.slug), fields: trackFields(t) }));
  const cachedTracks = await readCached(locale, trackEntries);
  for (const e of trackEntries) {
    if (budget.left <= 0) return done;
    if (cachedTracks.has(e.key)) continue;
    budget.left--;
    if (await translated(e.key, locale, e.fields, "wait")) done++;
  }

  const CHUNK = 20;
  for (const t of tracks) {
    const ids = t.modules.flatMap((m) => m.lessons.map((l) => l.id));
    for (let i = 0; i < ids.length; i += CHUNK) {
      if (budget.left <= 0) return done;
      const chunk = ids.slice(i, i + CHUNK);
      const rows = await prisma.lesson.findMany({ where: { id: { in: chunk } }, select: LESSON_SOURCE }).catch(() => []);
      const byId = new Map(rows.map((r) => [r.id, r]));
      const entries = chunk
        .map((id) => byId.get(id))
        .filter((l): l is LessonSource => !!l)
        .map((l) => ({ key: lessonKey(l.id), fields: lessonFields(l) }));
      const cached = await readCached(locale, entries);
      for (const e of entries) {
        if (budget.left <= 0) return done;
        if (cached.has(e.key)) continue;
        budget.left--;
        if (await translated(e.key, locale, e.fields, "wait")) done++;
      }
    }
  }
  return done;
}

/** A catalog-shaped record with its text swapped for a translation. */
export function withTrackText<R extends { title: string; tagline: string | null; description: string; audience: string | null; outcomes: string[] }>(
  r: R,
  text: TrackText | undefined,
): R {
  if (!text) return r;
  return { ...r, title: text.title, tagline: text.tagline, description: text.description, audience: text.audience, outcomes: text.outcomes };
}
