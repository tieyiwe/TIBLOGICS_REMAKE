// The public course catalog as data, for machines: the JSON catalog
// (/api/public/courses), the Markdown pages (/learning-box.md,
// /learning-box/<slug>.md) and /llms-full.txt all read this one shape, so an
// AI assistant citing ARFA gets the same facts the track pages show.
//
// Only what the public track pages already show: titles, summaries, the
// module and lesson outline, hours, prices, how assessment works. Never
// lesson bodies, quiz questions, answers, capstone briefs or anything about
// learners. English: the source language (French is served on the pages).

import { separateMonthlyNames } from "@/lib/learn/track-monthly";
import { getCatalog, getTrackBySlug, trackTime, type CatalogTrack } from "@/lib/learn/catalog";
import { trackPriceCents } from "@/lib/learn/pricing";
import { cachedPublicData } from "@/lib/cache/public-data";
import { PLANS } from "@/lib/payments/provider";
import { getTeamPricing } from "@/lib/learn/team/settings";
import { trackHours } from "./academy";
import { plain } from "./meta";
import { ORG, SITE_URL, absUrl } from "./site";

const LEVEL: Record<string, string> = { starter: "Beginner", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
export const levelName = (a: string, b?: string | null) => (b && b !== a ? `${LEVEL[a] ?? a} to ${LEVEL[b] ?? b}` : LEVEL[a] ?? a);

export interface PublicModule {
  title: string;
  summary: string | null;
  minutes: number;
  lessons: Array<{ title: string; minutes: number }>;
  hasQuiz: boolean;
}

export interface PublicCourse {
  slug: string;
  url: string;
  markdownUrl: string;
  status: "live" | "coming_soon";
  title: string;
  tagline: string | null;
  description: string;
  audience: string | null;
  level: string;
  levelLabel: string;
  /** Lessons plus labs, quizzes, exam and capstone, as shown on the page. */
  hours: number;
  moduleCount: number;
  lessonCount: number;
  labCount: number;
  outcomes: string[];
  certificate: { name: string; verification: string };
  assessment: {
    moduleQuizzes: number;
    quizPassScore: number | null;
    finalExam: { questions: number; timeLimitMinutes: number; passScore: number; distinctionScore: number; attempts: number } | null;
    capstone: { passScore: number } | null;
  };
  /** One-time price for lifetime access to this track (no live sale applied). */
  price: { amount: number; currency: "USD"; cents: number };
  languages: Array<"en" | "fr">;
  modules: PublicModule[];
}

export interface PublicCatalog {
  provider: { name: string; academy: string; url: string; email: string };
  generatedAt: string;
  languages: Array<"en" | "fr">;
  subscription: { amount: number; currency: "USD"; interval: "month"; includes: string };
  teams: { seatPrice: number; currency: "USD"; interval: "month"; minSeats: number; volumeTiers: Array<{ minSeats: number; seatPrice: number }> } | null;
  courses: PublicCourse[];
}

const dollars = (c: number) => Math.round(c) / 100;

async function courseFor(c: CatalogTrack): Promise<PublicCourse | null> {
  const d = await getTrackBySlug(c.slug);
  if (!d) return null;
  const time = trackTime(d);
  const cents = trackPriceCents(d.level, d.priceCents);
  const quizScores = d.modules.map((m) => m.quiz?.passScore).filter((x): x is number => typeof x === "number");
  return {
    slug: d.slug,
    url: absUrl(`/learning-box/${d.slug}`),
    markdownUrl: absUrl(`/learning-box/${d.slug}.md`),
    status: d.status === "live" ? "live" : "coming_soon",
    title: d.title,
    tagline: d.tagline ? plain(d.tagline) : null,
    description: plain(d.description),
    audience: d.audience ? plain(d.audience) : null,
    level: d.level,
    levelLabel: levelName(d.level, d.levelEnd),
    hours: trackHours({ lessonMinutes: time.lessonMinutes, handsOnMinutes: time.handsOnMinutes, estimatedHours: d.estimatedHours }),
    moduleCount: d.modules.length,
    lessonCount: c.lessonCount,
    labCount: c.labCount,
    outcomes: c.outcomes.map(plain),
    certificate: {
      name: d.certificateName,
      verification: `Each certificate has a public page at ${SITE_URL}/certificates/<reference> that anyone can open to check it.`,
    },
    assessment: {
      moduleQuizzes: d.modules.filter((m) => m.quiz).length,
      quizPassScore: quizScores.length ? Math.min(...quizScores) : null,
      finalExam: d.finalExam
        ? {
            questions: d.finalExam.questionsServed,
            timeLimitMinutes: d.finalExam.timeLimitMinutes,
            passScore: d.finalExam.passScore,
            distinctionScore: d.finalExam.distinctionScore,
            attempts: d.finalExam.maxAttempts,
          }
        : null,
      capstone: d.capstone ? { passScore: d.capstone.passThreshold } : null,
    },
    price: { amount: dollars(cents), currency: "USD", cents },
    languages: ["en", "fr"],
    modules: d.modules.map((m) => ({
      title: m.title,
      summary: m.summary ? plain(m.summary) : null,
      minutes: m.estimatedMinutes ?? m.lessons.reduce((n, l) => n + l.durationMinutes, 0),
      lessons: m.lessons.map((l) => ({ title: l.title, minutes: l.durationMinutes })),
      hasQuiz: !!m.quiz,
    })),
  };
}

/**
 * Every public track (live first, then coming soon), with its outline.
 * Cached with the catalog: any track edit clears it (lib/cache/public-data.ts).
 */
export async function publicCatalog(): Promise<PublicCatalog> {
  const [courses, team] = await Promise.all([
    cachedPublicData("learn", "seo:publicCourses", async () => {
      const catalog = await getCatalog();
      const rows = await Promise.all(catalog.map(courseFor));
      return rows
        .filter((x): x is PublicCourse => !!x)
        .sort((a, b) => (a.status === b.status ? 0 : a.status === "live" ? -1 : 1));
    }),
    getTeamPricing().catch(() => null),
  ]);
  return {
    provider: { name: "TIBLOGICS", academy: "ARFA AI Academy (AI Readiness For All)", url: absUrl("/learning-box"), email: ORG.academyEmail },
    generatedAt: new Date().toISOString(),
    languages: ["en", "fr"],
    subscription: { amount: dollars(PLANS.monthly.amount), currency: "USD", interval: "month", includes: `Every track except ${separateMonthlyNames()} (sold on its own monthly plan); cancel anytime.` },
    teams: team
      ? {
          seatPrice: dollars(team.seatPriceCents),
          currency: "USD",
          interval: "month",
          minSeats: team.minSeats,
          volumeTiers: team.tiers.map((x) => ({ minSeats: x.minSeats, seatPrice: dollars(x.seatPriceCents) })),
        }
      : null,
    courses,
  };
}

/** One public track by slug, or null. */
export async function publicCourse(slug: string): Promise<PublicCourse | null> {
  const { courses } = await publicCatalog();
  return courses.find((c) => c.slug === slug) ?? null;
}
