import { redirect } from "next/navigation";
import Link from "next/link";
import PlanPicker from "@/components/learn/PlanPicker";
import { getLearnContext } from "@/lib/learn/session";
import { PLANS } from "@/lib/payments/provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.subscribe.metaTitle") };
}

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

  const t = await getT();
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
            {lapsed ? t("learn.subscribe.reactivate") : t("learn.subscribe.youreIn", { name: student.name.split(" ")[0] })}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--ink2)]">
            {lapsed ? t("learn.subscribe.lapsedBody") : t("learn.subscribe.body")}
          </p>
        </div>

        <div className="mt-10">
          <PlanPicker plans={[PLANS.monthly, PLANS.annual]} track={track} />
        </div>

        <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t("learn.subscribe.included")}</h2>
          <ul className="mt-4 space-y-2.5">
            {[1, 2, 3, 4, 5].map((n) => t(`learn.subscribe.item.${n}`)).map((x) => (
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
          {t("learn.subscribe.notReady")}{" "}
          <Link href="/learning-box" className="underline">
            {t("learn.subscribe.browse")}
          </Link>
        </p>
        <div className="mt-4 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
