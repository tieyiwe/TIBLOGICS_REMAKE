import { redirect } from "next/navigation";
import Link from "next/link";
import PlanPicker from "@/components/learn/PlanPicker";
import { getLearnContext } from "@/lib/learn/session";
import { PLANS } from "@/lib/payments/provider";

export const dynamic = "force-dynamic";

// Sits OUTSIDE the (member) group so a learner without a subscription can
// reach it — the member layout would bounce them straight back here.
export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>;
}) {
  const { track } = await searchParams;
  const { student, entitlement } = await getLearnContext();
  if (!student) redirect("/learn/login");
  if (entitlement.entitled) redirect("/learn");

  const lapsed = entitlement.status === "canceled" || entitlement.status === "past_due";

  return (
    <div className="min-h-screen bg-[var(--s2)] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="block text-center text-lg font-black tracking-tight text-[var(--ink)]">
          TIB<span className="text-[var(--orange)]">LOGICS</span>
          <span className="ml-1.5 text-sm font-semibold text-[var(--ink3)]">Learn</span>
        </Link>

        <div className="mt-8 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)] sm:text-3xl">
            {lapsed ? "Reactivate your subscription" : `You're in, ${student.name.split(" ")[0]}.`}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--ink2)]">
            {lapsed
              ? "Your subscription has lapsed, so the member area is locked. Your progress, points and certificates are all still here — reactivate and pick up exactly where you left off."
              : "One subscription covers every track on the platform, including the ones we haven't published yet. Pick how you'd like to pay."}
          </p>
        </div>

        <div className="mt-10">
          <PlanPicker plans={[PLANS.monthly, PLANS.annual]} track={track} />
        </div>

        <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-sm font-bold text-[var(--ink)]">What's included</h2>
          <ul className="mt-4 space-y-2.5">
            {[
              "Every track — current and future",
              "Quick checks, module quizzes and timed final exams",
              "Capstone projects reviewed by a real person",
              "Verifiable certificates with a public verification link",
              "Cancel anytime; your certificates stay valid forever",
            ].map((x) => (
              <li key={x} className="flex gap-2.5 text-sm text-[var(--ink2)]">
                <span aria-hidden="true" className="font-bold text-[var(--orange)]">
                  ✓
                </span>
                {x}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-center text-xs text-[var(--ink3)]">
          Not ready?{" "}
          <Link href="/courses" className="underline">
            Browse the catalog
          </Link>{" "}
          first.
        </p>
      </div>
    </div>
  );
}
