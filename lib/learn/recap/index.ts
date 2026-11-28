import prisma from "@/lib/prisma";
import { runClaude } from "@/lib/claude";
import { translated } from "@/lib/i18n/content";
import { contentHash } from "@/lib/learn/video/select";
import { extractJson } from "@/lib/learn/video/script";

// Recaps: what a learner should remember from each lesson ("Key takeaways",
// shown at the end of the lesson) and quick recall cards (a question, the
// answer on tap), gathered per module before its quiz ("Module recap").
// Written by the fast model from the lesson's own text only, once per
// version of the lesson (content hash), and stored in LessonRecap. French
// and Swahili come from the content translation cache. The table mirrors
// the LessonRecap model in prisma/schema.prisma; db-prepare creates it too.

export interface Recap {
  takeaways: string[];
  cards: Array<{ q: string; a: string }>;
}

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "LessonRecap" (
    "lessonId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonRecap_pkey" PRIMARY KEY ("lessonId")
  )`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LessonRecap_lessonId_fkey') THEN
      ALTER TABLE "LessonRecap" ADD CONSTRAINT "LessonRecap_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
];

let ready: Promise<void> | null = null;
export function ensureRecapTable(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

const clean = (s: unknown, max: number) =>
  typeof s === "string" ? s.replace(/\s*—\s*/g, ", ").replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim().slice(0, max) : "";

export function readRecap(raw: unknown): Recap | null {
  const o = raw as { takeaways?: unknown; cards?: unknown } | null;
  if (!o || !Array.isArray(o.takeaways)) return null;
  const takeaways = o.takeaways.map((x) => clean(x, 200)).filter(Boolean).slice(0, 4);
  const cards = (Array.isArray(o.cards) ? o.cards : [])
    .map((c) => ({ q: clean((c as { q?: unknown })?.q, 160), a: clean((c as { a?: unknown })?.a, 240) }))
    .filter((c) => c.q && c.a)
    .slice(0, 3);
  return takeaways.length >= 2 ? { takeaways, cards } : null;
}

const SYSTEM = `You write the end-of-lesson recap for ARFA, the TIBLOGICS AI Academy (working adults learning to use AI).
From ONE lesson, write:
- "takeaways": 3 or 4 key points the learner should remember, each one plain sentence of at most 20 words.
- "cards": 2 or 3 quick recall cards: "q" is a short question (at most 15 words) that checks one key idea; "a" is its answer (at most 25 words).
Rules: use only what the lesson says (no outside facts, statistics or tools it does not mention). Plain words, "you" is fine. No Markdown, no emoji, no em dashes.
Return only JSON: {"takeaways": string[], "cards": [{"q": string, "a": string}]}`;

async function writeRecap(l: { title: string; objective: string | null; bodyMd: string }): Promise<Recap | null> {
  const body = l.bodyMd.length > 14_000 ? `${l.bodyMd.slice(0, 14_000)}\n[lesson continues]` : l.bodyMd;
  const { text } = await runClaude("lesson-recap", {
    system: SYSTEM,
    messages: [{ role: "user", content: `Lesson title: ${l.title}\n${l.objective ? `Objective: ${l.objective}\n` : ""}\n<lesson>\n${body}\n</lesson>\n\nJSON only.` }],
  });
  return readRecap(extractJson(text));
}

/**
 * Writes the missing or out-of-date recaps for lessons in live tracks, up to
 * `budget` model calls and the deadline. Staff-edited recaps are kept.
 */
export async function fillRecaps(opts: { budget: number; deadline?: number; trackId?: string }): Promise<{ written: number; failed: number; remaining: number }> {
  await ensureRecapTable();
  const lessons = await prisma.lesson.findMany({
    where: { module: { track: { status: "live", ...(opts.trackId ? { id: opts.trackId } : {}) } } },
    select: { id: true, title: true, objective: true, bodyMd: true },
    orderBy: [{ module: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
  const rows = await prisma.$queryRawUnsafe<Array<{ lessonId: string; contentHash: string; source: string }>>(`SELECT "lessonId", "contentHash", "source" FROM "LessonRecap"`);
  const have = new Map(rows.map((r) => [r.lessonId, r]));
  const todo = lessons.filter((l) => {
    const r = have.get(l.id);
    return !r || (r.source !== "staff" && r.contentHash !== contentHash(l));
  });
  let written = 0, failed = 0, budget = opts.budget;
  const queue = todo.slice();
  const worker = async () => {
    for (;;) {
      if (budget <= 0 || (opts.deadline && Date.now() > opts.deadline)) return;
      const l = queue.shift();
      if (!l) return;
      budget--;
      try {
        const recap = await writeRecap(l);
        if (!recap) {
          failed++;
          continue;
        }
        await prisma.$executeRawUnsafe(
          `INSERT INTO "LessonRecap" ("lessonId","contentHash","data","source","updatedAt") VALUES ($1,$2,$3::jsonb,'ai',NOW())
           ON CONFLICT ("lessonId") DO UPDATE SET "contentHash"=$2, "data"=$3::jsonb, "source"='ai', "updatedAt"=NOW()`,
          l.id,
          contentHash(l),
          JSON.stringify(recap),
        );
        written++;
      } catch (err) {
        failed++;
        console.error("[learn/recap]", l.id, err instanceof Error ? err.message : err);
      }
    }
  };
  await Promise.all(Array.from({ length: 3 }, worker));
  return { written, failed, remaining: Math.max(0, todo.length - written) };
}

/** How many lessons in live tracks have a current recap. */
export async function recapStats(): Promise<{ lessons: number; ready: number }> {
  await ensureRecapTable();
  const lessons = await prisma.lesson.findMany({ where: { module: { track: { status: "live" } } }, select: { id: true, title: true, objective: true, bodyMd: true } });
  const rows = await prisma.$queryRawUnsafe<Array<{ lessonId: string; contentHash: string; source: string }>>(`SELECT "lessonId", "contentHash", "source" FROM "LessonRecap"`);
  const have = new Map(rows.map((r) => [r.lessonId, r]));
  const ready = lessons.filter((l) => {
    const r = have.get(l.id);
    return r && (r.source === "staff" || r.contentHash === contentHash(l));
  }).length;
  return { lessons: lessons.length, ready };
}

async function localized(lessonId: string, recap: Recap, locale: string): Promise<Recap> {
  if (locale === "en") return recap;
  const fields: Record<string, string> = {};
  recap.takeaways.forEach((x, i) => (fields[`t${i}`] = x));
  recap.cards.forEach((c, i) => {
    fields[`q${i}`] = c.q;
    fields[`a${i}`] = c.a;
  });
  // "queue": shows English until the translation is ready, never waits on a page view.
  const tr = await translated(`lesson-recap:${lessonId}`, locale as "fr" | "sw", fields, "queue").catch(() => null);
  if (!tr) return recap;
  return {
    takeaways: recap.takeaways.map((x, i) => tr[`t${i}`] || x),
    cards: recap.cards.map((c, i) => ({ q: tr[`q${i}`] || c.q, a: tr[`a${i}`] || c.a })),
  };
}

/** The recap of one lesson in the learner's language, or null when none is written yet. */
export async function lessonRecap(lesson: { id: string; title: string; objective: string | null; bodyMd: string }, locale: string): Promise<Recap | null> {
  try {
    await ensureRecapTable();
    const rows = await prisma.$queryRawUnsafe<Array<{ contentHash: string; data: unknown; source: string }>>(
      `SELECT "contentHash", "data", "source" FROM "LessonRecap" WHERE "lessonId" = $1`,
      lesson.id,
    );
    const r = rows[0];
    // Written for an older version of the lesson: not shown (it may no longer match).
    if (!r || (r.source !== "staff" && r.contentHash !== contentHash(lesson))) return null;
    const recap = readRecap(r.data);
    return recap ? localized(lesson.id, recap, locale) : null;
  } catch {
    return null;
  }
}

/** Every lesson's recap in a module, in order (for the module recap before its quiz). */
export async function moduleRecap(moduleId: string, locale: string): Promise<Array<{ lessonId: string; title: string; recap: Recap }>> {
  const lessons = await prisma.lesson.findMany({
    where: { moduleId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, title: true, objective: true, bodyMd: true },
  });
  if (!lessons.length) return [];
  // Every recap of the module in one query, then the translations together.
  const rows = await (async () => {
    try {
      await ensureRecapTable();
      return await prisma.$queryRawUnsafe<Array<{ lessonId: string; contentHash: string; data: unknown; source: string }>>(
        `SELECT "lessonId", "contentHash", "data", "source" FROM "LessonRecap" WHERE "lessonId" = ANY($1::text[])`,
        lessons.map((l) => l.id),
      );
    } catch {
      return [];
    }
  })();
  const byId = new Map(rows.map((r) => [r.lessonId, r]));
  const recaps = await Promise.all(
    lessons.map(async (l) => {
      const r = byId.get(l.id);
      // Written for an older version of the lesson: not shown.
      if (!r || (r.source !== "staff" && r.contentHash !== contentHash(l))) return null;
      const recap = readRecap(r.data);
      return recap ? localized(l.id, recap, locale).catch(() => null) : null;
    }),
  );
  const out: Array<{ lessonId: string; title: string; recap: Recap }> = [];
  lessons.forEach((l, i) => {
    const recap = recaps[i];
    if (recap) out.push({ lessonId: l.id, title: l.title, recap });
  });
  return out;
}
