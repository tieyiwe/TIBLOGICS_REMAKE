import type { Metadata } from "next";
import Link from "next/link";
import CatalogBrowser from "@/components/learn/CatalogBrowser";
import { getCatalog } from "@/lib/learn/catalog";
import { PLANS, formatPlanPrice, FOUNDING_PRICING } from "@/lib/payments/provider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Course Catalog | TIBLOGICS Learn",
  description:
    "Practical AI and technology tracks that end in a verifiable certificate — quick checks after every lesson, a module quiz, a timed final exam, and a capstone reviewed by a human.",
};

export default async function CoursesPage() {
  const tracks = await getCatalog();
  const monthly = PLANS.monthly;

  return (
    <div className="bg-[var(--s2)]">
      {/* Hero */}
      <section className="bg-[var(--ink)] px-4 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--orange)]">
            TIBLOGICS Learn
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
            Learn AI properly — and prove it.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            Every track ends in a certificate you can actually defend: a quick check after each
            lesson, a quiz per module, a timed final exam, and a capstone project reviewed by a
            human being. No participation trophies.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
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

      {/* Catalog */}
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
        ) : (
          <CatalogBrowser tracks={tracks} />
        )}
      </section>

      {/* What every track includes */}
      <section className="border-t border-[var(--border)] bg-white px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-[var(--ink)]">What every track includes</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: "01",
                t: "Quick checks",
                d: "2–3 questions after every lesson. Instant feedback that explains why an answer is right — not just whether it was.",
              },
              {
                n: "02",
                t: "Module quizzes",
                d: "Eight questions drawn from a larger bank, 80% to pass. Retake as many times as you need; the set changes each time.",
              },
              {
                n: "03",
                t: "Timed final exam",
                d: "A real exam with a real clock, run on our server. Randomized per attempt, with a per-module breakdown of your result.",
              },
              {
                n: "04",
                t: "Reviewed capstone",
                d: "A practical project scored against a published rubric by a human reviewer. This is what makes the certificate mean something.",
              },
            ].map((x) => (
              <div key={x.n} className="rounded-2xl border border-[var(--border)] p-6">
                <span className="text-xs font-black text-[var(--orange)]">{x.n}</span>
                <h3 className="mt-2 text-base font-bold text-[var(--ink)]">{x.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
