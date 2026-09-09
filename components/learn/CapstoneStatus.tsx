const STATUS_META: Record<
  string,
  { label: string; blurb: string; tone: "neutral" | "warn" | "good" | "bad" }
> = {
  submitted: {
    label: "Submitted",
    blurb: "We have your work. A reviewer will pick it up shortly.",
    tone: "neutral",
  },
  in_review: {
    label: "In review",
    blurb: "A TIBLOGICS reviewer is reading your submission now.",
    tone: "neutral",
  },
  revisions_requested: {
    label: "Revisions requested",
    blurb: "You're close. Address the notes below and resubmit — there's no limit on attempts.",
    tone: "warn",
  },
  passed: { label: "Passed", blurb: "Approved. Your certificate is on its way.", tone: "good" },
  failed: {
    label: "Not passed",
    blurb: "This one didn't meet the rubric. The notes explain what to strengthen — you can resubmit.",
    tone: "bad",
  },
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
  const meta = STATUS_META[status] ?? STATUS_META.submitted;
  const stepIndex = status === "passed" ? 2 : status === "in_review" ? 1 : 0;
  const terminalBad = status === "failed" || status === "revisions_requested";

  return (
    <section className={`rounded-2xl border-2 p-6 ${TONES[meta.tone]}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-[var(--ink)]">{meta.label}</h2>
        {score != null && (
          <span className="text-sm font-bold text-[var(--ink)]">
            {score}%{" "}
            <span className="font-normal text-[var(--ink3)]">({passThreshold}% to pass)</span>
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink2)]">{meta.blurb}</p>

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
                {STATUS_META[s].label}
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
            Reviewer feedback
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink2)]">
            {reviewerNotes}
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-[var(--ink3)]">
        Submitted {new Date(submittedAt).toLocaleDateString()}
        {reviewedAt && ` · reviewed ${new Date(reviewedAt).toLocaleDateString()}`}
      </p>
    </section>
  );
}
