import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LevelBadge from "@/components/learn/LevelBadge";
import Reveal from "@/components/learn/Reveal";
import ModuleAccordion from "@/components/learn/ModuleAccordion";
import StickyEnrollBar from "@/components/learn/StickyEnrollBar";
import PurchaseOptions from "@/components/learn/PurchaseOptions";
import { trackPriceCents } from "@/lib/learn/pricing";
import { getTrackBySlug, trackTime } from "@/lib/learn/catalog";
import { fmtBreakdown, fmtMinutes, fmtPacing, fmtPrice, levelLabel, totalHours } from "@/lib/learn/format";
import { PLANS } from "@/lib/payments/provider";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadTrackSources, localizedTrack, trackText, type TrackText } from "@/lib/i18n/sources/learn";
import type { Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

/** The track's text in the visitor's language (English while pending). */
async function textFor(slug: string, locale: Locale): Promise<{ text: TrackText | null; pending: boolean }> {
  const [src] = await loadTrackSources({ slug });
  if (!src) return { text: null, pending: false };
  if (locale === "en") return { text: trackText(src), pending: false };
  return localizedTrack(src, locale);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [track, t, locale] = await Promise.all([getTrackBySlug(slug), getT(), getLocale()]);
  if (!track) return { title: t("learn.track.notFoundTitle") };
  const { text } = await textFor(slug, locale);
  const title = text?.title ?? track.title;
  const tagline = text?.tagline ?? track.tagline;
  return {
    title: t("learn.track.metaTitle", { title }),
    description: tagline ?? (text?.description ?? track.description).slice(0, 155),
  };
}

export default async function TrackLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [track, t, locale] = await Promise.all([getTrackBySlug(slug), getT(), getLocale()]);
  if (!track) notFound();
  const { text: loaded, pending } = await textFor(slug, locale);

  const fallbackOutcomes = Array.isArray(track.outcomes) ? (track.outcomes as string[]) : [];
  const text: TrackText = loaded ?? {
    title: track.title,
    tagline: track.tagline,
    description: track.description,
    audience: track.audience,
    outcomes: fallbackOutcomes,
    examTitle: track.finalExam?.title ?? null,
    modules: {},
    lessons: {},
  };
  const outcomes = text.outcomes;
  const lessonCount = track.modules.reduce((n, m) => n + m._count.lessons, 0);
  const comingSoon = track.status === "coming_soon";
  const time = trackTime(track);
  const hours = totalHours(time.lessonMinutes, time.handsOnMinutes, track.estimatedHours);
  const breakdown = fmtBreakdown(t, locale, { ...time, estimatedHours: track.estimatedHours });
  const pacing = fmtPacing(t, hours);
  const exam = track.finalExam;
  const firstQuiz = track.modules[0]?.quiz;
  // One-time price for this track (level default or the track's own).
  const priceCents = trackPriceCents(track.level, track.priceCents);

  const faqs = [
    {
      q: t("learn.track.faq.background.q"),
      a: `${t("learn.track.faq.background.a", { level: levelLabel(t, track.level) })} ${text.audience ?? t("learn.track.faq.background.unsure")}`,
    },
    {
      q: t("learn.track.faq.time.q"),
      a: t("learn.track.faq.time.a", { breakdown, pacing }),
    },
    {
      q: t("learn.track.faq.fail.q"),
      a: exam ? t("learn.track.faq.fail.a", { n: exam.maxAttempts }) : t("learn.track.faq.fail.none"),
    },
    {
      q: t("learn.track.faq.worth.q"),
      a: t("learn.track.faq.worth.a"),
    },
    {
      q: t("learn.track.faq.cost.q"),
      a: t("learn.track.faq.cost.a", {
        track: fmtPrice(priceCents, locale),
        monthly: fmtPrice(PLANS.monthly.amount, locale),
      }),
    },
  ];

  const count = (n: number, key: string) => t(`${key}.${n === 1 ? "one" : "other"}`, { n });

  const gates = [
    { t: t("learn.track.gate.checks.title"), d: t("learn.track.gate.checks.body") },
    {
      t: t("learn.track.gate.quiz.title"),
      d: firstQuiz
        ? t("learn.track.gate.quiz.body", { n: firstQuiz.questionsServed, score: firstQuiz.passScore })
        : t("learn.track.gate.quiz.bodyGeneric"),
    },
    {
      t: text.examTitle ?? t("learn.track.gate.exam.title"),
      d: exam
        ? t("learn.track.gate.exam.body", {
            n: exam.questionsServed,
            time: fmtMinutes(t, exam.timeLimitMinutes),
            score: exam.passScore,
            distinction: exam.distinctionScore,
            attempts: exam.maxAttempts,
          })
        : t("learn.track.gate.exam.bodyGeneric"),
    },
    {
      t: t("learn.track.gate.capstone.title"),
      d: track.capstone
        ? t("learn.track.gate.capstone.body", { score: track.capstone.passThreshold })
        : t("learn.track.gate.capstone.bodyGeneric"),
    },
  ];

  return (
    <div className="bg-[var(--s2)] pb-28">
      {/* Hero */}
      <section
        // pt clears the fixed Nav (5.5rem tall, 7.5rem from sm up) — without it
        // the white header sits on top of the "All tracks" link and title.
        className="px-4 pb-14 pt-32 text-white sm:pb-20 sm:pt-44"
        style={{ background: `linear-gradient(135deg, var(--ink) 0%, ${track.accentColor}22 100%), var(--ink)` }}
      >
        <div className="learn-hero mx-auto max-w-5xl">
          <Link href="/learning-box" className="text-sm text-white/50 hover:text-white/80">
            ← {t("learn.catalog.allTracks")}
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <LevelBadge level={track.level} levelEnd={track.levelEnd} size="md" />
            {comingSoon && (
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/80">
                {t("learn.catalog.comingSoon")}
              </span>
            )}
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">{text.title}</h1>
          {text.tagline && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">{text.tagline}</p>
          )}

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            {[
              [t("learn.catalog.length"), breakdown],
              [t("learn.catalog.modules"), String(track.modules.length)],
              [t("learn.catalog.lessons"), String(lessonCount)],
              [t("learn.catalog.certificate"), track.certificateName],
            ].map(([k, v]) => (
              <div key={k} className="max-w-full">
                <dt className="text-xs uppercase tracking-wide text-white/40">{k}</dt>
                <dd className="mt-1 text-sm font-bold text-white">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-white/50">{pacing}</p>
          {pending && (
            <p role="status" className="mt-4 text-xs text-white/60">
              {t("common.translationPending")}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4">
        {/* Outcomes */}
        {outcomes.length > 0 && (
          <Reveal as="section" className="-mt-8 rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--ink)]">{t("learn.catalog.outcomes")}</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {outcomes.map((o) => (
                <li key={o} className="flex gap-3 text-sm leading-relaxed text-[var(--ink2)]">
                  <span aria-hidden="true" className="mt-0.5 shrink-0 font-bold" style={{ color: track.accentColor }}>
                    ✓
                  </span>
                  {o}
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        {/* Description */}
        {text.description && (
          <Reveal as="section" className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-7">
            <h2 className="text-xl font-bold text-[var(--ink)]">{t("learn.catalog.about")}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--ink2)]">{text.description}</p>
            {text.audience && (
              <p className="mt-4 rounded-xl bg-[var(--s2)] p-4 text-sm text-[var(--ink2)]">
                <strong className="text-[var(--ink)]">{t("learn.catalog.whoFor")} </strong>
                {text.audience}
              </p>
            )}
          </Reveal>
        )}

        {/* Curriculum */}
        <Reveal as="section" className="mt-8">
          <h2 className="text-xl font-bold text-[var(--ink)]">{t("learn.catalog.curriculum")}</h2>
          <p className="mt-1 text-sm text-[var(--ink3)]">
            {count(track.modules.length, "learn.count.modules")} · {count(lessonCount, "learn.count.lessons")} · {breakdown}
          </p>
          <div className="mt-5">
            <ModuleAccordion
              modules={track.modules.map((m) => ({
                id: m.id,
                title: text.modules[m.id]?.title ?? m.title,
                summary: text.modules[m.id]?.summary ?? m.summary,
                estimatedMinutes: m.estimatedMinutes,
                hasQuiz: !!m.quiz,
                quizPassScore: m.quiz?.passScore ?? null,
                lessons: m.lessons.map((l) => ({
                  id: l.id,
                  title: text.lessons[l.id]?.title ?? l.title,
                  durationMinutes: l.durationMinutes,
                  isPreview: l.isPreview,
                  objective: text.lessons[l.id]?.objective ?? l.objective,
                })),
              }))}
              accentColor={track.accentColor}
            />
          </div>
        </Reveal>

        {/* Two ways to buy */}
        {!comingSoon && (
          <Reveal as="section" className="mt-8">
            <h2 className="text-xl font-bold text-[var(--ink)]">{t("learn.subscribe.metaTitle")}</h2>
            <div className="mt-5">
              <PurchaseOptions
                mode="link"
                track={{ slug: track.slug, title: text.title, priceCents }}
                monthlyCents={PLANS.monthly.amount}
                monthlyCompareAtCents={PLANS.monthly.compareAtAmount}
                accentColor={track.accentColor}
              />
            </div>
          </Reveal>
        )}

        {/* How you're assessed */}
        <Reveal as="section" className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-7">
          <h2 className="text-xl font-bold text-[var(--ink)]">{t("learn.catalog.howAssessed")}</h2>
          <p className="mt-2 text-sm text-[var(--ink2)]">{t("learn.track.gatesIntro")}</p>
          <ol className="mt-6 space-y-4">
            {gates.map((s, i) => (
              <li key={s.t} className="flex gap-4">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                  style={{ background: track.accentColor }}
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink)]">{s.t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--ink2)]">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* FAQ */}
        <Reveal as="section" className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-7">
          <h2 className="text-xl font-bold text-[var(--ink)]">{t("learn.track.faqTitle")}</h2>
          <div className="mt-5 divide-y divide-[var(--border)]">
            {faqs.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-[var(--ink)] marker:content-['']">
                  {f.q}
                  <span aria-hidden="true" className="learn-rotate shrink-0 text-[var(--ink3)] group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink2)]">{f.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>

      <StickyEnrollBar
        trackTitle={text.title}
        accentColor={track.accentColor}
        comingSoon={comingSoon}
        trackSlug={track.slug}
        priceCents={priceCents}
      />
    </div>
  );
}
