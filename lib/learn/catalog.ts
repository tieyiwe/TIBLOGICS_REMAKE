// Public catalog queries. Safe for unauthenticated visitors — never returns
// question banks or answers.
import { ensureLearnEditColumns } from "@/lib/learn/admin/columns";
import prisma from "@/lib/prisma";
import { trackPriceCents } from "@/lib/learn/pricing";
import { cachedPublicData } from "@/lib/cache/public-data";

export interface CatalogTrack {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string;
  level: string;
  levelEnd: string | null;
  status: string;
  accentColor: string;
  certificateName: string;
  estimatedHours: number;
  estimatedWeeksAt3Hrs: number | null;
  audience: string | null;
  outcomes: string[];
  moduleCount: number;
  lessonCount: number;
  labCount: number;
  quizCount: number;
  hasExam: boolean;
  hasCapstone: boolean;
  /** Sum of lesson durations. */
  lessonMinutes: number;
  /** Labs, module quizzes, final exam and capstone (see handsOnMinutes). */
  handsOnMinutes: number;
  /** One-time price for lifetime access to this track, in cents. */
  priceCents: number;
  /** Price under a live automatic sale (lib/promotions/display.ts), display only. */
  salePriceCents?: number | null;
}

// Time to complete, beyond reading the lessons. Labs carry their own
// estimate; the rest are allowances: a module quiz takes about 10 minutes and
// a capstone about 3 hours, and the exam takes its time limit.
export const QUIZ_MINUTES = 10;
export const CAPSTONE_MINUTES = 180;

export function handsOnMinutes(x: {
  labMinutes: number[];
  quizCount: number;
  examMinutes: number | null | undefined;
  hasCapstone: boolean;
}): number {
  return (
    x.labMinutes.reduce((n, m) => n + m, 0) +
    x.quizCount * QUIZ_MINUTES +
    (x.examMinutes ?? 0) +
    (x.hasCapstone ? CAPSTONE_MINUTES : 0)
  );
}

function normalise(t: {
  id: string; slug: string; title: string; tagline: string | null; description: string;
  level: string; levelEnd: string | null; status: string; accentColor: string;
  certificateName: string; estimatedHours: number; estimatedWeeksAt3Hrs: number | null;
  audience: string | null; outcomes: unknown; priceCents?: number | null;
  modules: Array<{ _count: { lessons: number; labs?: number }; quiz: { id: string } | null; lessons: Array<{ durationMinutes: number }> }>;
  _count: { labs: number };
  labs: Array<{ estimatedMinutes: number }>;
  finalExam: { id: string; timeLimitMinutes: number } | null;
  capstone: { id: string } | null;
}): CatalogTrack {
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    tagline: t.tagline,
    description: t.description,
    level: t.level,
    levelEnd: t.levelEnd,
    status: t.status,
    accentColor: t.accentColor,
    certificateName: t.certificateName,
    estimatedHours: t.estimatedHours,
    estimatedWeeksAt3Hrs: t.estimatedWeeksAt3Hrs,
    audience: t.audience,
    outcomes: Array.isArray(t.outcomes) ? (t.outcomes as string[]) : [],
    moduleCount: t.modules.length,
    lessonCount: t.modules.reduce((n, m) => n + m._count.lessons, 0),
    labCount: t._count.labs,
    quizCount: t.modules.filter((m) => m.quiz).length,
    hasExam: !!t.finalExam,
    hasCapstone: !!t.capstone,
    lessonMinutes: t.modules.reduce((n, m) => n + m.lessons.reduce((a, l) => a + l.durationMinutes, 0), 0),
    handsOnMinutes: handsOnMinutes({
      labMinutes: t.labs.map((l) => l.estimatedMinutes),
      quizCount: t.modules.filter((m) => m.quiz).length,
      examMinutes: t.finalExam?.timeLimitMinutes,
      hasCapstone: !!t.capstone,
    }),
    priceCents: trackPriceCents(t.level, t.priceCents),
  };
}

/** One-time price per track id (live tracks), for member pages. */
export async function trackPrices(): Promise<Map<string, number>> {
  // Public data, cached until a track changes (lib/cache/public-data.ts).
  // A failed read is not cached: it falls back to "no prices" for this request only.
  return cachedPublicData("learn", "trackPrices", async () => {
    await ensureLearnEditColumns().catch(() => {});
    const rows = await prisma.learnTrack.findMany({ where: { status: "live" }, select: { id: true, level: true, priceCents: true } });
    return new Map(rows.map((r) => [r.id, trackPriceCents(r.level, r.priceCents)]));
  }).catch(() => new Map<string, number>());
}

/** Every track that should appear publicly (live + coming soon). */
export async function getCatalog(): Promise<CatalogTrack[]> {
  // Public data, cached until any track content changes (lib/cache/public-data.ts).
  // A failed read is not cached: it shows an empty catalog for this request only.
  return cachedPublicData("learn", "catalog", loadCatalog).catch(() => []);
}

async function loadCatalog(): Promise<CatalogTrack[]> {
  await ensureLearnEditColumns().catch(() => {});
  const tracks = await prisma.learnTrack
    .findMany({
      where: { status: { in: ["live", "coming_soon"] } },
      orderBy: { sortOrder: "asc" },
      include: {
        modules: {
          select: {
            _count: { select: { lessons: true } },
            quiz: { select: { id: true } },
            lessons: { select: { durationMinutes: true } },
          },
        },
        _count: { select: { labs: true } },
        labs: { where: { isPublished: true }, select: { estimatedMinutes: true } },
        finalExam: { select: { id: true, timeLimitMinutes: true } },
        capstone: { select: { id: true } },
      },
    });
  return tracks.map(normalise);
}

/** Full track detail for the landing page, including the module outline. */
export async function getTrackBySlug(slug: string) {
  // Public data, cached until any track content changes (lib/cache/public-data.ts).
  // A failed read is not cached: it reads as "no such track" for this request only.
  return cachedPublicData("learn", `track:${slug}`, () => loadTrackBySlug(slug)).catch(() => null);
}

async function loadTrackBySlug(slug: string) {
  await ensureLearnEditColumns().catch(() => {});
  const track = await prisma.learnTrack
    .findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { sortOrder: "asc" },
          include: {
            lessons: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true, title: true, durationMinutes: true,
                isPreview: true, objective: true, contentType: true,
              },
            },
            quiz: { select: { id: true, passScore: true, questionsServed: true } },
            _count: { select: { lessons: true } },
          },
        },
        finalExam: {
          select: {
            title: true, timeLimitMinutes: true, questionsServed: true,
            passScore: true, distinctionScore: true, maxAttempts: true,
          },
        },
        capstone: { select: { briefMd: true, passThreshold: true } },
        labs: { where: { isPublished: true }, select: { estimatedMinutes: true } },
      },
    });

  if (!track || track.status === "draft") return null;
  return track;
}

export type TrackDetail = NonNullable<Awaited<ReturnType<typeof getTrackBySlug>>>;

/** Lesson and hands-on minutes for a track landing page. */
export function trackTime(t: TrackDetail): { lessonMinutes: number; handsOnMinutes: number } {
  return {
    lessonMinutes: t.modules.reduce((n, m) => n + m.lessons.reduce((a, l) => a + l.durationMinutes, 0), 0),
    handsOnMinutes: handsOnMinutes({
      labMinutes: t.labs.map((l) => l.estimatedMinutes),
      quizCount: t.modules.filter((m) => m.quiz).length,
      examMinutes: t.finalExam?.timeLimitMinutes,
      hasCapstone: !!t.capstone,
    }),
  };
}
