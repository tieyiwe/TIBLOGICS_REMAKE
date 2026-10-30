"use client";

import { useT } from "@/lib/i18n/client";

export interface InstantFeedback {
  /** The locked answer (what scoring will use). */
  choice: number;
  correct: boolean;
  correctIndex: number;
  explanation: string;
}

/**
 * One question's options with instant feedback (module quizzes and
 * micro-checks): picking an option checks it at once, shows right or wrong,
 * the correct option and the explanation, and locks the question.
 */
export default function InstantOptions({
  name,
  options,
  picked,
  feedback,
  checking,
  onPick,
}: {
  name: string;
  options: string[];
  picked: number | undefined;
  feedback: InstantFeedback | undefined;
  checking: boolean;
  onPick: (index: number) => void;
}) {
  const t = useT();
  const locked = !!feedback || checking;
  return (
    <>
      <div className="mt-3 space-y-2">
        {options.map((o, oi) => {
          const isCorrect = feedback && feedback.correctIndex === oi;
          const isWrongPick = feedback && feedback.choice === oi && !feedback.correct;
          const cls = isCorrect
            ? "border-green-600 bg-green-50 text-green-900"
            : isWrongPick
              ? "border-red-500 bg-red-50 text-red-900"
              : picked === oi
                ? "border-[var(--blue3)] bg-[var(--blue-light)]"
                : feedback
                  ? "border-[var(--border)] opacity-70"
                  : "border-[var(--border)] hover:border-[var(--ink3)]";
          return (
            <label
              key={oi}
              className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${locked ? "cursor-default" : "cursor-pointer"} ${cls}`}
            >
              <input type="radio" name={name} checked={picked === oi} disabled={locked} onChange={() => onPick(oi)} className="mt-0.5" />
              <span className={feedback ? "" : "text-[var(--ink2)]"}>
                {isCorrect && <span className="sr-only">{t("a11y.quiz.correctAnswer")}: </span>}
                {isWrongPick && <span className="sr-only">{t("a11y.quiz.yourWrongAnswer")}: </span>}
                {o}
              </span>
              {isCorrect && <span aria-hidden="true" className="ml-auto font-bold text-green-700">✓</span>}
              {isWrongPick && <span aria-hidden="true" className="ml-auto font-bold text-red-600">✗</span>}
            </label>
          );
        })}
      </div>
      <div aria-live="polite">
        {feedback && (
          <div
            className={`mt-3 rounded-lg px-3 py-2.5 text-sm leading-relaxed ${feedback.correct ? "bg-green-50 text-green-950" : "bg-amber-50 text-amber-950"}`}
            data-testid="instant-feedback"
          >
            <p className="font-bold">{feedback.correct ? t("labs.instant.correct") : t("labs.instant.wrong")}</p>
            {feedback.explanation && <p className="mt-1">{feedback.explanation}</p>}
          </div>
        )}
      </div>
    </>
  );
}
