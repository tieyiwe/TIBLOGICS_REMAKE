"use client";

import { useLocale, useT } from "@/lib/i18n/client";

// Label and blurb for each status come from labs.capstone.status.<status>.
const STATUS_TONE: Record<string, "neutral" | "warn" | "good" | "bad"> = {
  submitted: "neutral",
  in_review: "neutral",
  revisions_requested: "warn",
  passed: "good",
  failed: "bad",
};

const TONES = {
  neutral: "border-[var(--border)] bg-white",
  warn: "border-amber-200 bg-amber-50",
  good: "border-green-200 bg-green-50",
  bad: "border-red-200 bg-red-50",
};

const STEPS = ["submitted", "in_review", "passed"];

export default function CapstoneStatus({
  status,
  score,
  reviewerNotes,
  submittedAt,
  reviewedAt,
  passThreshold,
  accentColor,
}: {
  status: string;
  score: number | null;
  reviewerNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  passThreshold: number;
  accentColor: string;
}) {
  const t = useT();
  const locale = useLocale();
  const key = status in STATUS_TONE ? status : "submitted";
  const tone = STATUS_TONE[key];
  const stepIndex = status === "passed" ? 2 : status === "in_review" ? 1 : 0;
  const terminalBad = status === "failed" || status === "revisions_requested";

  return (
    <section className={`rounded-2xl border-2 p-6 ${TONES[tone]}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-[var(--ink)]">{t(`labs.capstone.status.${key}`)}</h2>
        {score != null && (
          <span className="text-sm font-bold text-[var(--ink)]">
            {score}%{" "}
            <span className="font-normal text-[var(--ink3)]">{t("labs.capstone.toPass", { pass: passThreshold })}</span>
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink2)]">{t(`labs.capstone.status.${key}.blurb`)}</p>

      {/* Timeline */}
      {!terminalBad && (
        <ol className="mt-5 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: i <= stepIndex ? accentColor : "var(--s3)" }}
                aria-hidden="true"
              >
                {i < stepIndex ? "✓" : i + 1}
              </span>
              <span
                className={`text-xs font-semibold ${
                  i <= stepIndex ? "text-[var(--ink)]" : "text-[var(--ink3)]"
                }`}
              >
                {t(`labs.capstone.status.${s}`)}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className="ml-1 hidden h-0.5 flex-1 sm:block"
                  style={{ background: i < stepIndex ? accentColor : "var(--s3)" }}
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      )}

      {reviewerNotes && (
        <div className="mt-5 rounded-xl bg-white/70 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
            {t("labs.capstone.reviewerFeedback")}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink2)]">
            {reviewerNotes}
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-[var(--ink3)]">
        {t("labs.capstone.submittedOn", { date: new Date(submittedAt).toLocaleDateString(locale) })}
        {reviewedAt && ` · ${t("labs.capstone.reviewedOn", { date: new Date(reviewedAt).toLocaleDateString(locale) })}`}
      </p>
    </section>
  );
}
