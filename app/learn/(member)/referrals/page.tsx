import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Gift } from "lucide-react";
import { getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { fmtNumber } from "@/lib/learn/format";
import { learnerStats, monthlyCap } from "@/lib/learn/referrals/service";
import ReferralShare from "./ReferralShare";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("referrals.metaTitle") };
}

export default async function ReferralsPage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const [t, locale, stats] = await Promise.all([
    getT(),
    getLocale(),
    learnerStats(student.id).catch((err) => {
      console.error("[learn/referrals]", err);
      return null;
    }),
  ]);

  if (!stats) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-black text-[var(--ink)]">{t("referrals.title")}</h1>
        <p className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-white p-6 text-sm text-[var(--ink2)]">{t("referrals.unavailable")}</p>
      </div>
    );
  }

  const tiles = [
    { label: t("referrals.stats.visits"), value: stats.visits },
    { label: t("referrals.stats.signups"), value: stats.signups },
    { label: t("referrals.stats.paid"), value: stats.paid },
    { label: t("referrals.stats.earned"), value: stats.rewardsEarned, accent: true },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-3xl bg-[#0D1B2A] p-6 text-white sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#F47C20]/20" aria-hidden>
            <Gift size={24} className="text-[#FFB98A]" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight sm:text-3xl">{t("referrals.title")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/80 sm:text-base">{t("referrals.intro")}</p>
            {stats.couponActive && <p className="mt-2 text-sm font-semibold text-[#FFB98A]">{t("referrals.friendGets")}</p>}
          </div>
        </div>
      </div>

      <section className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
        <ReferralShare link={stats.link} />
      </section>

      <section className="mt-5" aria-labelledby="ref-stats">
        <h2 id="ref-stats" className="text-lg font-black text-[var(--ink)]">
          {t("referrals.stats.title")}
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((x) => (
            <div key={x.label} className={`rounded-2xl border p-4 ${x.accent ? "border-[var(--orange)] bg-[var(--orange-light)]" : "border-[var(--border)] bg-white"}`}>
              <dt className="text-xs font-semibold text-[var(--ink2)]">{x.label}</dt>
              <dd className="mt-1 text-2xl font-black tabular-nums text-[var(--ink)]">{fmtNumber(x.value, locale)}</dd>
            </div>
          ))}
        </dl>
        {stats.rewardsPending > 0 && (
          <p className="mt-3 text-sm text-[var(--ink2)]">
            {t("referrals.stats.pending")}: <strong className="tabular-nums text-[var(--ink)]">{fmtNumber(stats.rewardsPending, locale)}</strong>
          </p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6" aria-labelledby="ref-how">
        <h2 id="ref-how" className="text-lg font-black text-[var(--ink)]">
          {t("referrals.how.title")}
        </h2>
        <ol className="mt-4 space-y-3">
          {[1, 2, 3].map((n) => (
            <li key={n} className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-xs font-black text-white" aria-hidden>
                {n}
              </span>
              <span className="pt-0.5 text-sm leading-relaxed text-[var(--ink2)]">{t(`referrals.how.${n}`)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs leading-relaxed text-[var(--ink3)]">{t("referrals.rules", { cap: monthlyCap() })}</p>
      </section>
    </div>
  );
}
