import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { reviewStatus } from "@/lib/learn/method/review";

// Dashboard cards for the TIBLOGICS Learn method: Daily Review (cards due,
// start button) and the Proof-of-Skill Portfolio. Server component; if the
// review status cannot be read the card still offers to start.
export default async function MethodDashboardCards({ studentId }: { studentId: string }) {
  const [t, status] = await Promise.all([
    getT(),
    reviewStatus(studentId).catch((err) => {
      console.error("[dashboard] review status", err);
      return null;
    }),
  ]);
  const due = status?.due ?? 0;

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">
          <span aria-hidden="true">🧠 </span>
          {t("method.dash.review.title")}
        </p>
        <p className="mt-1 text-xl font-black text-[var(--ink)]">
          {status && !status.available
            ? t("method.dash.review.none")
            : due > 0
            ? t(due === 1 ? "method.dash.review.due.one" : "method.dash.review.due.other", { n: due })
            : t("method.dash.review.none")}
        </p>
        <p className="mt-1 text-xs text-[var(--ink2)]">
          {status && !status.available
            ? t("method.dash.review.empty")
            : status?.doneToday
            ? `✓ ${t("method.dash.review.done")}`
            : t("method.dash.review.body")}
        </p>
        {(!status || status.available) && (
          <Link
            href="/learn/review"
            className="mt-4 inline-flex min-h-[44px] w-fit items-center rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-5 py-2.5 text-sm font-bold text-[var(--ink)] transition-opacity hover:opacity-90"
          >
            {t("method.dash.review.start")} →
          </Link>
        )}
      </div>

      <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">
          <span aria-hidden="true">🗂️ </span>
          {t("method.dash.portfolio.title")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("method.dash.portfolio.body")}</p>
        <Link
          href="/learn/portfolio"
          className="mt-4 inline-flex min-h-[44px] w-fit items-center rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] hover:border-[var(--ink3)]"
        >
          {t("method.dash.portfolio.open")} →
        </Link>
      </div>
    </section>
  );
}
