import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LevelBadge from "@/components/learn/LevelBadge";
import ModuleAccordion from "@/components/learn/ModuleAccordion";
import StickyEnrollBar from "@/components/learn/StickyEnrollBar";
import { getTrackBySlug } from "@/lib/learn/catalog";
import { formatHours, formatMinutes, pacingHint } from "@/lib/learn/types";
import { PLANS, formatPlanPrice } from "@/lib/payments/provider";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const track = await getTrackBySlug(slug);
  if (!track) return { title: "Track not found | TIBLOGICS Learn" };
  return {
    title: `${track.title} | TIBLOGICS Learn`,
    description: track.tagline ?? track.description.slice(0, 155),
  };
}

export default async function TrackLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const track = await getTrackBySlug(slug);
  if (!track) notFound();

  const outcomes = Array.isArray(track.outcomes) ? (track.outcomes as string[]) : [];
  const lessonCount = track.modules.reduce((n, m) => n + m._count.lessons, 0);
  const comingSoon = track.status === "coming_soon";

  const faqs = [
    {
      q: "Do I need any background to take this?",
      a: `This track is pitched at ${track.level} level. ${
        track.audience ?? "If you're unsure, the catalog has a three-question check that suggests where to start."
      }`,
    },
    {
      q: "How long will it actually take?",
      a: `About ${formatHours(track.estimatedHours)} of material. ${pacingHint(
        track.estimatedHours,
        track.estimatedWeeksAt3Hrs,
      )}. There's no deadline — the pace is yours.`,
    },
    {
      q: "What happens if I fail the final exam?",
      a: track.finalExam
        ? `You get ${track.finalExam.maxAttempts} attempts, with a short cooldown between them so you have time to review. Each attempt draws a fresh set of questions, and your results break down by module so you know exactly what to revisit.`
        : "Exam details are published before you sit it.",
    },
    {
      q: "Is the certificate actually worth anything?",
      a: "That depends entirely on whether it's hard to get — so we made it hard. You must pass every module quiz, clear a timed final exam, and have a capstone project approved by a human reviewer against a published rubric. Each certificate carries a public verification link anyone can check.",
    },
    {
      q: "What does it cost?",
      a: `${formatPlanPrice(PLANS.monthly)}/month or ${formatPlanPrice(
        PLANS.annual,
      )}/year, and that includes every track on the platform — not just this one. Cancel anytime.`,
    },
  ];

  return (
    <div className="bg-[var(--s2)] pb-28">
      {/* Hero */}
      <section
        className="px-4 py-14 text-white sm:py-20"
        style={{ background: `linear-gradient(135deg, var(--ink) 0%, ${track.accentColor}22 100%), var(--ink)` }}
      >
        <div className="mx-auto max-w-5xl">
          <Link href="/courses" className="text-sm text-white/50 hover:text-white/80">
            ← All tracks
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <LevelBadge level={track.level} levelEnd={track.levelEnd} size="md" />
            {comingSoon && (
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/80">
                Coming soon
              </span>
            )}
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
            {track.title}
          </h1>
          {track.tagline && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              {track.tagline}
            </p>
          )}

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            {[
              ["Length", formatHours(track.estimatedHours)],
              ["Modules", String(track.modules.length)],
              ["Lessons", String(lessonCount)],
              ["Certificate", track.certificateName],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wide text-white/40">{k}</dt>
                <dd className="mt-1 text-sm font-bold text-white">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-white/50">
            {pacingHint(track.estimatedHours, track.estimatedWeeksAt3Hrs)}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4">
        {/* Outcomes */}
        {outcomes.length > 0 && (
          <section className="-mt-8 rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--ink)]">What you'll be able to do</h2>
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
          </section>
        )}

        {/* Description */}
        {track.description && (
          <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-7">
            <h2 className="text-xl font-bold text-[var(--ink)]">About this track</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--ink2)]">
              {track.description}
            </p>
            {track.audience && (
              <p className="mt-4 rounded-xl bg-[var(--s2)] p-4 text-sm text-[var(--ink2)]">
                <strong className="text-[var(--ink)]">Who it's for: </strong>
                {track.audience}
              </p>
            )}
          </section>
        )}

        {/* Curriculum */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-[var(--ink)]">Curriculum</h2>
          <p className="mt-1 text-sm text-[var(--ink3)]">
            {track.modules.length} modules · {lessonCount} lessons ·{" "}
            {formatHours(track.estimatedHours)}
          </p>
          <div className="mt-5">
            <ModuleAccordion
              modules={track.modules.map((m) => ({
                id: m.id,
                title: m.title,
                summary: m.summary,
                estimatedMinutes: m.estimatedMinutes,
                hasQuiz: !!m.quiz,
                quizPassScore: m.quiz?.passScore ?? null,
                lessons: m.lessons.map((l) => ({
                  id: l.id,
                  title: l.title,
                  durationMinutes: l.durationMinutes,
                  isPreview: l.isPreview,
                  objective: l.objective,
                })),
              }))}
              accentColor={track.accentColor}
            />
          </div>
        </section>

        {/* How you're assessed */}
        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-7">
          <h2 className="text-xl font-bold text-[var(--ink)]">How you're assessed</h2>
          <p className="mt-2 text-sm text-[var(--ink2)]">
            Four gates stand between you and the certificate. All four must be cleared.
          </p>
          <ol className="mt-6 space-y-4">
            {[
              {
                t: "Quick checks after every lesson",
                d: "2–3 questions, instant feedback with an explanation. These keep you honest as you go.",
              },
              {
                t: "A quiz at the end of every module",
                d: track.modules[0]?.quiz
                  ? `${track.modules[0].quiz.questionsServed} questions drawn from a larger bank, ${track.modules[0].quiz.passScore}% to pass. Unlimited retakes with a different set each time.`
                  : "Drawn from a larger bank, with unlimited retakes and a different set each time.",
              },
              {
                t: track.finalExam?.title ?? "Timed final exam",
                d: track.finalExam
                  ? `${track.finalExam.questionsServed} questions in ${formatMinutes(
                      track.finalExam.timeLimitMinutes,
                    )}. ${track.finalExam.passScore}% to pass, ${track.finalExam.distinctionScore}%+ earns Distinction. Up to ${track.finalExam.maxAttempts} attempts, each with fresh questions. The clock runs on our server, so closing your laptop doesn't stop it.`
                  : "A timed, randomized exam covering the whole track.",
              },
              {
                t: "Capstone project, reviewed by a human",
                d: track.capstone
                  ? `A practical project scored against a published rubric, ${track.capstone.passThreshold}% to pass. A real reviewer reads it and writes you feedback.`
                  : "A practical project scored against a published rubric by a real reviewer.",
              },
            ].map((s, i) => (
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
        </section>

        {/* FAQ */}
        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-7">
          <h2 className="text-xl font-bold text-[var(--ink)]">Questions</h2>
          <div className="mt-5 divide-y divide-[var(--border)]">
            {faqs.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-[var(--ink)] marker:content-['']">
                  {f.q}
                  <span aria-hidden="true" className="shrink-0 text-[var(--ink3)] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink2)]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <StickyEnrollBar
        trackTitle={track.title}
        accentColor={track.accentColor}
        comingSoon={comingSoon}
        trackSlug={track.slug}
      />
    </div>
  );
}
