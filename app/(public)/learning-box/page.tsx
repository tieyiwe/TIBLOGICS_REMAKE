import type { Metadata } from "next";
import Link from "next/link";
import CatalogBrowser from "@/components/learn/CatalogBrowser";
import LevelPicker from "@/components/learn/LevelPicker";
import { LEVEL_SLUGS } from "@/lib/learn/levels";
import Reveal from "@/components/learn/Reveal";
import { getCatalog } from "@/lib/learn/catalog";
import { PLANS, formatPlanPrice, FOUNDING_PRICING } from "@/lib/payments/provider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Learning Box | TIBLOGICS Learn",
  description:
      "Three certification levels, Basic to Expert, that make you genuinely proficient with AI. Hands-on labs, quizzes, a timed exam and a reviewed capstone at every level, with systems thinking all the way through.",
};

export default async function LearningBoxPage() {
  const tracks = await getCatalog();
  const monthly = PLANS.monthly;
  // The three levels are the path; anything else in the catalog is listed
  // separately under it.
  const otherTracks = tracks.filter((t) => !LEVEL_SLUGS.has(t.slug));

  return (
    <div className="bg-[var(--s2)]">
      {/* Hero */}
      {/* pt clears the fixed Nav (5.5rem tall, 7.5rem from sm up) — without it
          the white header sits on top of the eyebrow and headline. */}
      <section className="bg-[var(--ink)] px-4 pb-16 pt-32 text-white sm:pb-20 sm:pt-44">
        <div className="learn-hero mx-auto max-w-6xl">
          <p
            className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--orange)]"
            style={{ "--stagger-index": 0 } as React.CSSProperties}
          >
            TIBLOGICS Learn
          </p>
          <h1
            className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl"
            style={{ "--stagger-index": 1 } as React.CSSProperties}
          >
            Learn AI properly — and prove it.
          </h1>
          <p
            className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg"
            style={{ "--stagger-index": 2 } as React.CSSProperties}
          >
            Three levels, from your first prompt to leading AI across an organisation. Each ends in
            a certificate you can actually defend: hands-on labs, a quiz per module, a timed final
            exam, and a capstone reviewed by a human being. No participation trophies.
          </p>
          <div
            className="mt-8 flex flex-wrap items-center gap-4"
            style={{ "--stagger-index": 3 } as React.CSSProperties}
          >
            <Link
              href="/learn/signup"
              className="rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-7 py-3.5 text-sm font-bold text-[var(--ink)] transition-opacity hover:opacity-90"
            >
              Start learning
            </Link>
            <p className="text-sm text-white/60">
              {FOUNDING_PRICING && (
                <span className="mr-2 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-[var(--orange)]">
                  Founding rate
                </span>
              )}
              <strong className="text-white">{formatPlanPrice(monthly)}/month</strong> — every track
              included. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* The certification path */}
      <section className="mx-auto max-w-6xl px-4 pt-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--orange)]">The certification path</p>
        <h2 className="mt-2 text-2xl font-black text-[var(--ink)] sm:text-3xl">Basic → Intermediate → Expert</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink2)]">
          Start where you are. Each level is a complete track with its own certificate, and each
          one assumes the one before it, so you can begin at Level 2 if you already use AI every day.
        </p>
        <div className="mt-8">
          <LevelPicker
            catalog={tracks.filter((t) => LEVEL_SLUGS.has(t.slug))}
            ladder={tracks.map((t) => ({
              slug: t.slug,
              title: t.title,
              accentColor: t.accentColor,
              certificateName: t.certificateName,
              estimatedHours: t.estimatedHours,
              outcomes: t.outcomes,
              moduleCount: t.moduleCount,
              labCount: t.labCount,
              status: t.status,
            }))}
          />
        </div>
      </section>

      {/* Systems thinking */}
      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="grid gap-8 rounded-3xl bg-[var(--ink)] p-8 text-white sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--orange)]">Our approach</p>
            <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Systems thinking, all the way through</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Most AI courses teach the tool. We teach the system around it: the people, steps,
              feedback loops and bottlenecks that decide whether AI actually helps, or just moves
              the problem somewhere else.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {[
              { l: "Basic", t: "See the whole picture", d: "Parts, connections and knock-on effects. Find the bottleneck before you automate anything." },
              { l: "Intermediate", t: "Map your own work", d: "Turn your workflow into a system map, then decide where AI belongs, and where it would only move the queue." },
              { l: "Expert", t: "Lead at scale", d: "Loops, delays, incentives and leverage points, applied to agents, evaluation, security and adoption." },
            ].map((x) => (
              <li key={x.l} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--orange)]">{x.l}</p>
                <p className="mt-1 text-sm font-bold">{x.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/60">{x.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Other tracks, if any sit outside the three levels */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        {tracks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-12 text-center">
            <h2 className="text-lg font-bold text-[var(--ink)]">The catalog is being prepared</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink2)]">
              Tracks are being finalised now. Check back shortly, or{" "}
              <Link href="/contact" className="font-semibold text-[var(--blue2)] underline">
                get in touch
              </Link>{" "}
              and we'll let you know the moment they open.
            </p>
          </div>
        ) : otherTracks.length > 0 ? (
          <>
            <h2 className="text-xl font-bold text-[var(--ink)]">More tracks</h2>
            <div className="mt-6">
              <CatalogBrowser tracks={otherTracks} />
            </div>
          </>
        ) : null}
      </section>

      {/* What every track includes */}
      <section className="border-t border-[var(--border)] bg-white px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-[var(--ink)]">What every level includes</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                n: "01",
                t: "Hands-on labs",
                d: "Do the work inside the platform: run prompts against a real model, find the planted errors in an AI answer, map a real system. Assessed against published criteria.",
              },
              {
                n: "02",
                t: "Quick checks",
                d: "Three questions after every lesson, with feedback that explains why an answer is right, not just whether it was.",
              },
              {
                n: "03",
                t: "Module quizzes",
                d: "Eight questions drawn from a larger bank, 80% to pass. Retake as often as you need; the questions and their order change each time.",
              },
              {
                n: "04",
                t: "Timed final exam",
                d: "A real exam with a real clock, run on our server. Randomized per attempt, with a per-module breakdown of your result.",
              },
              {
                n: "05",
                t: "Reviewed capstone",
                d: "A practical project scored against a published rubric by a human reviewer. This is what makes the certificate mean something.",
              },
            ].map((x, i) => (
              <Reveal key={x.n} delay={i * 80}>
                <div className="learn-lift h-full rounded-2xl border border-[var(--border)] p-6">
                  <span className="text-xs font-black text-[var(--orange)]">{x.n}</span>
                  <h3 className="mt-2 text-base font-bold text-[var(--ink)]">{x.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{x.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
