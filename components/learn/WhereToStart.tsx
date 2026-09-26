"use client";

import { useState } from "react";
import type { CatalogTrack } from "@/lib/learn/catalog";
import type { TrackLevel } from "@/lib/learn/types";

// "Where should I start?" (Part C1). Three questions, no account needed —
// the point is to remove the "which one is for me?" paralysis, not to gate.
const QUESTIONS = [
  {
    id: "comfort",
    prompt: "How comfortable are you with technology day to day?",
    options: [
      { label: "I use a phone and email, but that's about it", level: "starter" },
      { label: "I'm fine with everyday apps and spreadsheets", level: "beginner" },
      { label: "I work with technical tools or data regularly", level: "intermediate" },
      { label: "I build or configure software systems", level: "advanced" },
    ],
  },
  {
    id: "goal",
    prompt: "What are you hoping to get out of this?",
    options: [
      { label: "Understand what AI actually is, without hype", level: "starter" },
      { label: "Use AI tools well in my current job", level: "beginner" },
      { label: "Bring AI into how my team or business runs", level: "intermediate" },
      { label: "Design and ship AI systems myself", level: "advanced" },
    ],
  },
  {
    id: "time",
    prompt: "How much time can you give it each week?",
    options: [
      { label: "An hour or two", level: "starter" },
      { label: "About three hours", level: "beginner" },
      { label: "Five or more hours", level: "intermediate" },
    ],
  },
] as const;

const ORDER: TrackLevel[] = ["starter", "beginner", "intermediate", "advanced"];

export default function WhereToStart({
  tracks,
  onRecommend,
}: {
  tracks: CatalogTrack[];
  onRecommend: (slug: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CatalogTrack | null>(null);

  const step = QUESTIONS.findIndex((q) => !answers[q.id]);
  const current = step === -1 ? null : QUESTIONS[step];

  function choose(qid: string, level: string) {
    const next = { ...answers, [qid]: level };
    setAnswers(next);
    if (Object.keys(next).length === QUESTIONS.length) finish(next);
  }

  function finish(all: Record<string, string>) {
    // Average the three signals, then round DOWN — starting too easy is
    // recoverable; starting too hard makes people quit.
    const avg =
      Object.values(all).reduce((n, lv) => n + ORDER.indexOf(lv as TrackLevel), 0) /
      Object.values(all).length;
    const target = ORDER[Math.max(0, Math.floor(avg))];

    const live = tracks.filter((t) => t.status === "live");
    const pool = live.length > 0 ? live : tracks;
    const exact = pool.find((t) => t.level === target);
    const nearest =
      exact ??
      [...pool].sort(
        (a, b) =>
          Math.abs(ORDER.indexOf(a.level as TrackLevel) - ORDER.indexOf(target)) -
          Math.abs(ORDER.indexOf(b.level as TrackLevel) - ORDER.indexOf(target)),
      )[0];

    setResult(nearest ?? null);
    onRecommend(nearest?.slug ?? null);
  }

  function reset() {
    setAnswers({});
    setResult(null);
    onRecommend(null);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--blue-light)] to-[var(--orange-light)] p-5 text-left transition-shadow hover:shadow-md"
      >
        <span>
          <span className="block text-base font-bold text-[var(--ink)]">
            Not sure where to start?
          </span>
          <span className="mt-1 block text-sm text-[var(--ink2)]">
            Answer three quick questions and we'll point you to the right track.
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-bold text-white">
          Find my track →
        </span>
      </button>
    );
  }

  return (
    <section
      aria-label="Track recommender"
      className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"
    >
      {result ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
            We'd start you here
          </p>
          <h3 className="mt-2 text-xl font-bold text-[var(--ink)]">{result.title}</h3>
          {result.tagline && <p className="mt-1 text-sm text-[var(--ink2)]">{result.tagline}</p>}
          <p className="mt-3 text-sm text-[var(--ink2)]">
            It's highlighted below. This is a suggestion, not a rule — every track is included in
            your subscription, so you can start anywhere.
          </p>
          <button
            onClick={reset}
            className="mt-4 text-sm font-semibold text-[var(--blue2)] underline underline-offset-2"
          >
            Start over
          </button>
        </div>
      ) : current ? (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
              Question {step + 1} of {QUESTIONS.length}
            </p>
            <button onClick={() => setOpen(false)} className="text-sm text-[var(--ink3)] hover:text-[var(--ink)]">
              Close
            </button>
          </div>
          <h3 className="mt-2 text-lg font-bold text-[var(--ink)]">{current.prompt}</h3>
          <div className="mt-4 grid gap-2">
            {current.options.map((o) => (
              <button
                key={o.label}
                onClick={() => choose(current.id, o.level)}
                className="rounded-xl border border-[var(--border)] px-4 py-3 text-left text-sm text-[var(--ink2)] transition-colors hover:border-[var(--blue3)] hover:bg-[var(--blue-light)]"
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
