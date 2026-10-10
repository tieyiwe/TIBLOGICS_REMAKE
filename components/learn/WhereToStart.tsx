"use client";

import Link from "next/link";
import { useState } from "react";
import type { CatalogTrack } from "@/lib/learn/catalog";
import { fmtBreakdown } from "@/lib/learn/format";
import { useLocale, useT } from "@/lib/i18n/client";

// "Where should I start?" (Part C1). A few questions, no account needed: the
// point is to remove the "which one is for me?" paralysis, not to gate.
//
// The first question picks a path (general skills, parents, building apps,
// professionals, small business). The comfort, goal and usage questions then
// measure readiness, and the build path adds one hands-on check. Readiness is
// averaged and rounded DOWN: starting too easy is recoverable, starting too
// hard makes people quit.

type Path = "core" | "parents" | "build" | "professional" | "business";
const PATHS: Path[] = ["core", "parents", "build", "professional", "business"];

type QuestionId = "path" | "comfort" | "goal" | "usage" | "code";

// Levels 0-3: starter, beginner, intermediate, advanced.
const READINESS: Array<{ id: QuestionId; options: number }> = [
  { id: "comfort", options: 4 },
  { id: "goal", options: 4 },
  // This used to ask how much time you have each week. Time says nothing about
  // which level fits (an hour a week does not make someone a beginner), so it
  // asks how you use AI now instead.
  { id: "usage", options: 4 },
];

// The three certification levels, by readiness.
const CORE = ["ai-foundations", "ai-foundations", "ai-practitioner", "ai-systems-expert"] as const;
const NEXT_CORE: Record<string, string | undefined> = {
  "ai-foundations": "ai-practitioner",
  "ai-practitioner": "ai-systems-expert",
};

interface Answers {
  path?: Path;
  comfort?: number;
  goal?: number;
  usage?: number;
  code?: number;
}

interface Rec {
  slug: string;
  note: string; // key under learn.wts.note.
}

function questionsFor(path: Path | undefined): Array<{ id: QuestionId; options: number }> {
  const qs = [{ id: "path" as QuestionId, options: PATHS.length }, ...READINESS];
  if (path === "build") qs.push({ id: "code", options: 3 });
  return qs;
}

/** Primary first, then up to two more. Only tracks in `available`. */
function recommend(a: Answers, available: Set<string>): Rec[] {
  const scores = [a.comfort ?? 0, a.goal ?? 0, a.usage ?? 0];
  const idx = Math.max(0, Math.min(3, Math.floor(scores.reduce((n, x) => n + x, 0) / scores.length)));
  const aiNew = (a.usage ?? 0) === 0;
  const daily = (a.usage ?? 0) >= 2;
  const core = CORE[idx];

  const out: Rec[] = [];
  const add = (slug: string | undefined, note: string) => {
    if (slug && available.has(slug) && !out.some((r) => r.slug === slug)) out.push({ slug, note });
  };

  switch (a.path) {
    case "parents":
      add("ai-for-parents", aiNew ? "parentsNew" : "parentsSome");
      if (aiNew || idx <= 1) add("ai-foundations", "parentsFoundations");
      else add(core, "coreOwnSkills");
      break;

    case "build": {
      const code = a.code ?? 0;
      if (idx === 0 && code === 0) {
        // Brand new to AI and to editing anything technical: build the basics
        // first, and keep the build track as the next step.
        add("ai-foundations", "buildFoundationsFirst");
        add("vibe-coding-engineer", "buildLater");
      } else {
        add("vibe-coding-engineer", aiNew ? "buildNewAi" : code === 0 ? "buildNewCode" : "buildReady");
        if (daily) add("ai-practitioner", "buildPractitioner");
        else add("ai-foundations", "buildFoundations");
      }
      break;
    }

    case "professional":
      add("ai-forward-professional", aiNew ? "proNew" : daily ? "proDaily" : "proSome");
      if (daily) add("ai-practitioner", "proThenPractitioner");
      else add("ai-foundations", "proFoundations");
      if (idx >= 3) add("ai-systems-expert", "proExpert");
      break;

    case "business":
      if (available.has("ai-small-business")) add("ai-small-business", "bizMain");
      else add(core, "bizMissing");
      add("ai-forward-professional", "bizPro");
      add(core, "coreStart");
      break;

    default: {
      add(core, core === "ai-foundations" && aiNew ? "coreNew" : "coreStart");
      add(NEXT_CORE[core], "coreNext");
      if (idx <= 2) add("ai-forward-professional", "corePro");
    }
  }

  // Nothing on the path is open yet: the nearest open core level, rounding
  // down, else anything open.
  if (out.length === 0) {
    for (let i = idx; i >= 0 && out.length === 0; i--) add(CORE[i], "fallback");
    for (let i = idx + 1; i < CORE.length && out.length === 0; i++) add(CORE[i], "fallback");
    if (out.length === 0) add([...available][0], "fallback");
  }
  return out.slice(0, 3);
}

export default function WhereToStart({
  tracks,
  onRecommend,
}: {
  tracks: CatalogTrack[];
  onRecommend: (slug: string | null) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<Rec[] | null>(null);

  const questions = questionsFor(answers.path);
  const step = questions.findIndex((q) => answers[q.id] === undefined);
  const current = step === -1 ? null : questions[step];
  const bySlug = new Map(tracks.map((x) => [x.slug, x]));

  function choose(qid: QuestionId, value: number) {
    const next: Answers = qid === "path" ? { ...answers, path: PATHS[value] } : { ...answers, [qid]: value };
    setAnswers(next);
    const qs = questionsFor(next.path);
    if (qs.every((q) => next[q.id] !== undefined)) finish(next);
  }

  function finish(all: Answers) {
    // Only live tracks are recommended; before anything is live, fall back to
    // whatever the catalog lists so the questions still lead somewhere.
    const live = tracks.filter((x) => x.status === "live").map((x) => x.slug);
    const available = new Set(live.length > 0 ? live : tracks.map((x) => x.slug));
    const recs = recommend(all, available);
    setResult(recs);
    onRecommend(recs[0]?.slug ?? null);
  }

  function back() {
    const prev = questions[Math.max(0, step === -1 ? questions.length - 1 : step - 1)];
    const next = { ...answers };
    delete next[prev.id];
    setAnswers(next);
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
        className="flex w-full flex-col items-stretch gap-4 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--blue-light)] to-[var(--orange-light)] p-5 text-left transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="min-w-0 sm:flex-1">
          <span className="block text-base font-bold text-[var(--ink)]">{t("learn.wts.ctaTitle")}</span>
          <span className="mt-1 block text-sm text-[var(--ink2)]">{t("learn.wts.ctaBody")}</span>
        </span>
        <span className="rounded-full bg-[var(--ink)] px-4 py-2 text-center text-sm font-bold text-white sm:shrink-0">
          {t("learn.wts.ctaButton")} →
        </span>
      </button>
    );
  }

  const primary = result?.[0] ? bySlug.get(result[0].slug) : undefined;

  return (
    <section aria-label={t("learn.wts.ariaLabel")} className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
      {result ? (
        <div aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.wts.resultEyebrow")}</p>
          {primary ? (
            <div className="mt-2 rounded-xl border-l-4 bg-[var(--s2)] p-4" style={{ borderLeftColor: primary.accentColor }}>
              <h3 className="text-xl font-bold text-[var(--ink)]">{primary.title}</h3>
              {primary.tagline && <p className="mt-1 text-sm text-[var(--ink2)]">{primary.tagline}</p>}
              <p className="mt-2 text-xs font-semibold text-[var(--ink3)]">{fmtBreakdown(t, locale, primary)}</p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">{t(`learn.wts.note.${result[0].note}`)}</p>
              <Link
                href={`/learning-box/${primary.slug}`}
                className="mt-3 inline-block text-sm font-bold underline underline-offset-2"
                style={{ color: primary.accentColor }}
              >
                {t("learn.wts.viewTrack")} →
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--ink2)]">{t("learn.wts.nothingOpen")}</p>
          )}

          {result.length > 1 && (
            <>
              <p className="mt-5 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.wts.alsoFit")}</p>
              <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                {result.slice(1).map((r) => {
                  const x = bySlug.get(r.slug);
                  if (!x) return null;
                  return (
                    <li key={r.slug} className="rounded-xl border border-[var(--border)] p-4">
                      <Link href={`/learning-box/${x.slug}`} className="text-sm font-bold text-[var(--ink)] underline-offset-2 hover:underline">
                        {x.title}
                      </Link>
                      <p className="mt-1 text-xs text-[var(--ink3)]">{fmtBreakdown(t, locale, x)}</p>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--ink2)]">{t(`learn.wts.note.${r.note}`)}</p>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <p className="mt-4 text-sm text-[var(--ink2)]">{t("learn.wts.suggestion")}</p>
          <button onClick={reset} className="mt-3 text-sm font-semibold text-[var(--blue2)] underline underline-offset-2">
            {t("learn.common.startOver")}
          </button>
        </div>
      ) : current ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
              {t("learn.wts.progress", { n: step + 1, total: questions.length })}
            </p>
            <div className="flex items-center gap-4">
              {step > 0 && (
                <button onClick={back} className="text-sm text-[var(--ink3)] hover:text-[var(--ink)]">
                  ← {t("learn.common.back")}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-sm text-[var(--ink3)] hover:text-[var(--ink)]">
                {t("learn.common.close")}
              </button>
            </div>
          </div>
          <h3 className="mt-2 text-lg font-bold text-[var(--ink)]">{t(`learn.wts.q.${current.id}`)}</h3>
          <div className="mt-4 grid gap-2">
            {Array.from({ length: current.options }, (_, i) => (
              <button
                key={`${current.id}-${i}`}
                onClick={() => choose(current.id, i)}
                className="rounded-xl border border-[var(--border)] px-4 py-3 text-left text-sm text-[var(--ink2)] transition-colors hover:border-[var(--blue3)] hover:bg-[var(--blue-light)]"
              >
                {t(current.id === "path" ? `learn.wts.path.${PATHS[i]}` : `learn.wts.a.${current.id}.${i}`)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
