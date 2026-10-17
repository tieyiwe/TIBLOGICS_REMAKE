// Server side of the Learning Loop on a lesson page: which steps exist for
// this lesson and which the learner has done according to the records.
// "Read to the end" and "ran the practice pad" are tracked in the browser
// (lib/learn/method/loop-client.ts) and merged in by the strip.
//
// Four queries at most, run together, whatever the lesson.
import prisma from "@/lib/prisma";
import type { Locale } from "@/lib/i18n/config";
import { labFields, labKey } from "@/lib/i18n/sources/labs";
import { readCached } from "@/lib/i18n/sources/learn";
import { STUDIO_BY_ID } from "@/lib/learn/studio/catalog";
import { ensureMethodTables } from "./db";
import { REFLECTION_MIN_WORDS, countWords } from "./words";

export interface LoopState {
  understand: boolean;
  /** Null when the lesson has no Studio embed (the step is hidden). */
  play: { done: boolean } | null;
  /** Null when neither the lesson nor its module has a lab. */
  apply: { done: boolean; href: string; title: string } | null;
  reflect: boolean;
  reflection: { text: string; updatedAt: string } | null;
}

/** ```studio tool-id[:challenge-id] embeds in the lesson Markdown. */
export function studioEmbeds(md: string): Array<{ toolId: string; challengeId: string | null }> {
  const out: Array<{ toolId: string; challengeId: string | null }> = [];
  const re = /^\s*```studio[^\n]*\n\s*([a-z0-9-]+)(?::([a-z0-9-]+))?/gim;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    if (STUDIO_BY_ID.has(m[1])) out.push({ toolId: m[1], challengeId: m[2] ?? null });
  }
  return out;
}

export async function loadLoopState(
  studentId: string,
  lesson: { id: string; moduleId: string; sourceMd: string },
  locale: Locale,
  lessonDone: boolean,
): Promise<LoopState> {
  const embeds = studioEmbeds(lesson.sourceMd);
  const tables = ensureMethodTables().then(
    () => true,
    () => false,
  );

  const [labs, studioRows, reflection] = await Promise.all([
    prisma.lab.findMany({
      where: {
        isPublished: true,
        OR: [{ lessonId: lesson.id }, { moduleId: lesson.moduleId }, { lesson: { moduleId: lesson.moduleId } }],
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        lessonId: true,
        slug: true,
        title: true,
        labType: true,
        briefMd: true,
        scenarioMd: true,
        objectives: true,
        config: true,
        attempts: { where: { studentId, passed: true }, select: { id: true }, take: 1 },
      },
    }),
    embeds.length
      ? prisma.pointsLedger.findMany({
          where: {
            studentId,
            source: { in: ["studio_challenge", "studio_perfect"] },
            OR: embeds.map((e) => (e.challengeId ? { refId: `${e.toolId}:${e.challengeId}` } : { refId: { startsWith: `${e.toolId}:` } })),
          },
          select: { refId: true },
          take: 50,
        })
      : Promise.resolve([]),
    tables.then((ok) =>
      ok
        ? prisma.lessonReflection.findUnique({
            where: { studentId_lessonId: { studentId, lessonId: lesson.id } },
            select: { text: true, updatedAt: true },
          })
        : null,
    ),
  ]);

  // Labs attached to this lesson come first; otherwise the module's labs.
  const own = labs.filter((l) => l.lessonId === lesson.id);
  const relevant = own.length ? own : labs;
  let apply: LoopState["apply"] = null;
  if (relevant.length) {
    const next = relevant.find((l) => l.attempts.length === 0) ?? relevant[0];
    const cached = await readCached(locale, [{ key: labKey(next.slug), fields: labFields(next) }]);
    apply = {
      done: relevant.every((l) => l.attempts.length > 0),
      href: `/learn/lab/${next.slug}`,
      title: cached.get(labKey(next.slug))?.title ?? next.title,
    };
  }

  return {
    understand: lessonDone,
    play: embeds.length ? { done: studioRows.length > 0 } : null,
    apply,
    reflect: !!reflection && countWords(reflection.text) >= REFLECTION_MIN_WORDS,
    reflection: reflection ? { text: reflection.text, updatedAt: reflection.updatedAt.toISOString() } : null,
  };
}
