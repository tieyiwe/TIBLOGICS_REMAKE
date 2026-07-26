// Public catalog queries. Safe for unauthenticated visitors — never returns
// question banks or answers.
import prisma from "@/lib/prisma";

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
}

function normalise(t: {
  id: string; slug: string; title: string; tagline: string | null; description: string;
  level: string; levelEnd: string | null; status: string; accentColor: string;
  certificateName: string; estimatedHours: number; estimatedWeeksAt3Hrs: number | null;
  audience: string | null; outcomes: unknown;
  modules: Array<{ _count: { lessons: number; labs?: number }; quiz: { id: string } | null }>;
  _count: { labs: number };
  finalExam: { id: string } | null;
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
  };
}

/** Every track that should appear publicly (live + coming soon). */
export async function getCatalog(): Promise<CatalogTrack[]> {
  const tracks = await prisma.learnTrack
    .findMany({
      where: { status: { in: ["live", "coming_soon"] } },
      orderBy: { sortOrder: "asc" },
      include: {
        modules: {
          select: { _count: { select: { lessons: true } }, quiz: { select: { id: true } } },
        },
        _count: { select: { labs: true } },
        finalExam: { select: { id: true } },
        capstone: { select: { id: true } },
      },
    })
    .catch(() => []);
  return tracks.map(normalise);
}

/** Full track detail for the landing page, including the module outline. */
export async function getTrackBySlug(slug: string) {
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
      },
    })
    .catch(() => null);

  if (!track || track.status === "draft") return null;
  return track;
}

export type TrackDetail = NonNullable<Awaited<ReturnType<typeof getTrackBySlug>>>;
