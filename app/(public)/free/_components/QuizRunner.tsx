"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { fmt, type Labels } from "@/lib/growth/acquire/fmt";
import { scoreQuiz, type QuizBand, type QuizQuestion } from "@/lib/growth/acquire/types";
import CaptureForm from "./CaptureForm";
import { trackAcquire } from "./track";

// The scorecard: one question per screen, an instant score with the matching
// result band and the tips from the weakest answers, then the email form that
// sends the full result and action plan.

export default function QuizRunner({
  slug,
  locale,
  labels: L,
  questions,
  bands,
  submitLabel,
}: {
  slug: string;
  locale: string;
  labels: Labels;
  questions: QuizQuestion[];
  bands: QuizBand[];
  submitLabel?: string;
}) {
  const [step, setStep] = useState(-1); // -1 intro, 0..n-1 question, n result
  const [answers, setAnswers] = useState<number[]>([]);
  const headRef = useRef<HTMLHeadingElement>(null);
  const n = questions.length;
  const done = step >= n;
  const result = done ? scoreQuiz({ questions, bands }, answers) : null;

  useEffect(() => {
    if (step >= 0) headRef.current?.focus();
  }, [step]);

  function choose(i: number) {
    const next = answers.slice(0, step);
    next[step] = i;
    setAnswers(next);
    if (step + 1 >= n) trackAcquire("magnet", slug, "quiz");
    setStep(step + 1);
  }

  if (step < 0) {
    return (
      <div className="text-center">
        <p className="font-dm text-sm text-[#3A4A5C]">{fmt(L, "acquire.quiz.minutes", { n })}</p>
        <button
          type="button"
          onClick={() => setStep(0)}
          className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#B8500A] px-6 font-dm text-[15px] font-bold text-white shadow-[0_6px_18px_rgba(184,80,10,0.25)] hover:bg-[#9c4408]"
        >
          {fmt(L, "acquire.quiz.start")}
        </button>
      </div>
    );
  }

  if (done && result) {
    const pct = result.score;
    const tone = pct >= 75 ? "#0F6E56" : pct >= 40 ? "#B45309" : "#B91C1C";
    return (
      <div>
        <h2 ref={headRef} tabIndex={-1} className="font-dm text-xs font-bold uppercase tracking-[0.08em] text-[#5A6E84] focus:outline-none">
          {fmt(L, "acquire.quiz.result")}
        </h2>
        <div className="mt-3 flex items-center gap-4">
          <div
            className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(${tone} ${pct * 3.6}deg, #E8EFF8 0deg)` }}
            role="img"
            aria-label={fmt(L, "acquire.quiz.score", { score: pct })}
          >
            <div className="grid h-[62px] w-[62px] place-items-center rounded-full bg-white">
              <span className="font-syne text-2xl font-bold tabular-nums text-[#0D1B2A]">{pct}</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-syne text-lg font-bold leading-snug text-[#0D1B2A]">{result.band?.title}</p>
            <p className="font-dm text-xs text-[#5A6E84]">{fmt(L, "acquire.quiz.score", { score: pct })}</p>
          </div>
        </div>
        {result.band?.body && <p className="mt-3 font-dm text-sm leading-relaxed text-[#3A4A5C]">{result.band.body}</p>}
        {result.tips.length > 0 && (
          <div className="mt-4 rounded-xl bg-[#F4F7FB] p-4">
            <p className="font-dm text-sm font-bold text-[#0D1B2A]">{fmt(L, "acquire.quiz.tips")}</p>
            <ul className="mt-2 space-y-1.5 pl-5 font-dm text-sm leading-relaxed text-[#3A4A5C] [list-style:disc]">
              {result.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-5 border-t border-[#E3E9F1] pt-5">
          <p className="mb-3 font-syne text-base font-bold text-[#0D1B2A]">{fmt(L, "acquire.quiz.emailTitle")}</p>
          <CaptureForm refType="magnet" slug={slug} locale={locale} labels={L} mode="magnet" answers={answers} submitLabel={submitLabel || fmt(L, "acquire.quiz.submit")} compact />
        </div>
        <button
          type="button"
          onClick={() => {
            setAnswers([]);
            setStep(0);
          }}
          className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 font-dm text-sm font-semibold text-[#2251A3]"
        >
          <RotateCcw size={15} aria-hidden /> {fmt(L, "acquire.quiz.retake")}
        </button>
      </div>
    );
  }

  const q = questions[step];
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-dm text-xs font-bold uppercase tracking-[0.08em] text-[#5A6E84]">{fmt(L, "acquire.quiz.progress", { n: step + 1, total: n })}</p>
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="inline-flex min-h-[44px] items-center gap-1 font-dm text-sm font-semibold text-[#2251A3]">
            <ArrowLeft size={15} aria-hidden /> {fmt(L, "acquire.quiz.back")}
          </button>
        )}
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#E8EFF8]" aria-hidden>
        <div className="h-full rounded-full bg-[#F47C20] transition-[width] duration-200" style={{ width: `${(step / n) * 100}%` }} />
      </div>
      <fieldset className="mt-4">
        <legend>
          <h2 ref={headRef} tabIndex={-1} className="font-syne text-lg font-bold leading-snug text-[#0D1B2A] focus:outline-none">
            {q.text}
          </h2>
        </legend>
        <div className="mt-3 space-y-2">
          {q.options.map((o, i) => (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              aria-pressed={answers[step] === i}
              className={`flex min-h-[48px] w-full items-center rounded-xl border px-4 py-2.5 text-left font-dm text-[15px] transition-colors ${
                answers[step] === i ? "border-[#1B3A6B] bg-[#EBF0FA] text-[#0D1B2A]" : "border-[#C3CFDD] bg-white text-[#0D1B2A] hover:border-[#2251A3] hover:bg-[#F4F7FB]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
