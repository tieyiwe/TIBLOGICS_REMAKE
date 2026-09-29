import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import { MIN_FOR_COMPLETE, reviewStatus, type ReviewStatus } from "@/lib/learn/method/review";
import DailyReview from "@/components/learn/method/DailyReview";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("method.review.metaTitle") };
}

export default async function ReviewPage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const t = await getT();
  // The status only sets the start screen; the session itself is loaded by
  // the client. If it cannot be worked out, the learner can still start.
  const status: ReviewStatus = await reviewStatus(student.id).catch((err) => {
    console.error("[review] status", err);
    return { due: 0, totalCards: 0, available: true, doneToday: false };
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-black text-[var(--ink)]">
        <span aria-hidden="true">🧠 </span>
        {t("method.review.title")}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("method.review.intro")}</p>
      <div className="mt-6">
        <DailyReview
          initialDue={status.due}
          available={status.available}
          doneToday={status.doneToday}
          minForComplete={MIN_FOR_COMPLETE}
        />
      </div>
    </div>
  );
}
