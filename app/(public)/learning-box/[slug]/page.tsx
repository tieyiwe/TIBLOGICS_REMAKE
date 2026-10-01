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
import { pageSales } from "@/lib/promotions/display";
import { fitTitle, pageMetadata } from "@/lib/seo/meta";
import JsonLd from "@/components/seo/JsonLd";
import { KeyTakeaways } from "@/components/seo/AnswerBlocks";
import { breadcrumbNode, courseNode, faqNode } from "@/lib/seo/jsonld";
import { levelText } from "@/lib/seo/academy";

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
  // A real 404 (not a 200 with a "not found" title) for crawlers that get
  // blocking metadata; see htmlLimitedBots in next.config.js.
  if (!track) notFound();
  const { text } = await textFor(slug, locale);
  const title = text?.title ?? track.title;
  const time = trackTime(track);
  const hours = totalHours(time.lessonMinutes, time.handsOnMinutes, track.estimatedHours);
  return pageMetadata({
    path: `/learning-box/${track.slug}`,
    locale,
    // Long track names would push "· ARFA AI Academy | TIBLOGICS" past what
    // search results show; fitTitle drops the suffixes until it fits.
    title: fitTitle([t("learn.track.metaTitle", { title }), `${title} · ARFA`, title]),
    absoluteTitle: true,
    description: t("seo.meta.track.description", {
      tagline: text?.tagline ?? track.tagline ?? "",
      level: levelText(t, track.level, track.levelEnd),
      hours: hours.toLocaleString(locale),
      price: fmtPrice(trackPriceCents(track.level, track.priceCents), locale),
      monthly: fmtPrice(PLANS.monthly.amount, locale),
    }),
    socialDescription: text?.tagline ?? track.tagline ?? undefined,
    image: track.heroImage ? { url: track.heroImage } : undefined,
  });
}

export default async function TrackLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [track, t, locale, sales] = await Promise.all([getTrackBySlug(slug), getT(), getLocale(), pageSales()]);
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
  // A live automatic sale (admin: /admin_pro/promotions), display only.
  const trackSale = sales.track(track.id, priceCents);

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
      q: t("seo.track.faq.lang.q"),
      a: t("seo.track.faq.lang.a"),
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

        {/* Key takeaways: the short answers search and AI engines quote */}
        <div className="mt-8">
          <KeyTakeaways
            title={t("seo.takeaways")}
            items={[
              t("seo.track.tldr.what", { title: text.title, level: levelText(t, track.level, track.levelEnd) }),
              t("seo.track.tldr.size", { hours: hours.toLocaleString(locale), modules: track.modules.length, lessons: lessonCount }),
              ...(comingSoon
                ? []
                : [t("seo.track.tldr.price", { price: fmtPrice(trackSale?.saleCents ?? priceCents, locale), monthly: fmtPrice(PLANS.monthly.amount, locale) })]),
              t("seo.track.tldr.cert", { cert: track.certificateName }),
              t("seo.track.tldr.lang"),
            ]}
          />
        </div>

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
                track={{ slug: track.slug, title: text.title, priceCents, salePriceCents: trackSale?.saleCents ?? null }}
                monthlyCents={PLANS.monthly.amount}
                monthlyCompareAtCents={PLANS.monthly.compareAtAmount}
                monthlySale={sales.monthly}
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

      <JsonLd
        data={[
          courseNode({
            slug: track.slug,
            name: text.title,
            description: text.description || text.tagline || track.description,
            level: track.level,
            levelEnd: track.levelEnd,
            estimatedHours: hours,
            priceCents: trackSale?.saleCents ?? priceCents,
            certificateName: track.certificateName,
            outcomes,
            audience: text.audience,
            image: track.heroImage,
            available: !comingSoon,
          }),
          // The questions shown in the FAQ section above, word for word.
          faqNode(faqs.map((f) => ({ q: f.q, a: f.a })), `/learning-box/${track.slug}`),
          breadcrumbNode([
            { name: t("seo.home"), path: "/" },
            { name: t("seo.academy"), path: "/learning-box" },
            { name: text.title, path: `/learning-box/${track.slug}` },
          ]),
        ]}
      />
      <StickyEnrollBar
        trackTitle={text.title}
        accentColor={track.accentColor}
        comingSoon={comingSoon}
        trackSlug={track.slug}
        priceCents={priceCents}
        salePriceCents={trackSale?.saleCents ?? null}
      />
    </div>
  );
}
