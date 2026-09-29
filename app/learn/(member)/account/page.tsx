import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getLearnContext } from "@/lib/learn/session";
import AccountSettings from "@/components/learn/AccountSettings";
import BillingPortalButton from "@/components/learn/BillingPortalButton";
import type { Metadata } from "next";
import { fmtDate } from "@/lib/learn/format";
import { getLocale, getT } from "@/lib/i18n/server";
import { ensureLeaderboardColumn } from "@/lib/learn/leaderboard";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.nav.account") };
}

export default async function AccountPage() {
  const { student, entitlement } = await getLearnContext();
  if (!student) redirect("/learn/login");

  await ensureLeaderboardColumn().catch(() => {});
  const profile = await prisma.student
    .findUnique({
      where: { id: student.id },
      select: { accessibilityMode: true, leaderboardOptIn: true, locale: true, createdAt: true },
    })
    .catch(() => null);

  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const has = (k: string) => t(k) !== k;

  const sub = await prisma.learnSubscription
    .findUnique({ where: { studentId: student.id }, select: { plan: true, stripeCustomerId: true } })
    .catch(() => null);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-black text-[var(--ink)]">{t("learn.nav.account")}</h1>

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-sm font-bold text-[var(--ink)]">{t("learn.account.profile")}</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ink3)]">{t("learn.account.nameOnCertificates")}</dt>
            <dd className="font-semibold text-[var(--ink)]">{student.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ink3)]">{t("learn.account.email")}</dt>
            <dd className="font-semibold text-[var(--ink)]">{student.email}</dd>
          </div>
          {profile && (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink3)]">{t("learn.account.memberSince")}</dt>
              <dd className="font-semibold text-[var(--ink)]">
                {fmtDate(profile.createdAt, locale)}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <AccountSettings
        accessibilityMode={profile?.accessibilityMode ?? false}
        leaderboardOptIn={profile?.leaderboardOptIn ?? false}
      />

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-sm font-bold text-[var(--ink)]">{t("learn.account.subscription")}</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ink3)]">{t("learn.account.status")}</dt>
            <dd className="font-semibold text-[var(--ink)]">
              {entitlement.status
                ? has(`learn.sub.${entitlement.status}`)
                  ? t(`learn.sub.${entitlement.status}`)
                  : entitlement.status.replace("_", " ")
                : t("learn.sub.none")}
            </dd>
          </div>
          {sub?.plan && (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink3)]">{t("learn.account.plan")}</dt>
              <dd className="font-semibold capitalize text-[var(--ink)]">
                {has(`learn.plan.${sub.plan}.label`) ? t(`learn.plan.${sub.plan}.label`) : sub.plan}
              </dd>
            </div>
          )}
          {entitlement.currentPeriodEnd && (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink3)]">
                {entitlement.cancelAtPeriodEnd ? t("learn.account.accessUntil") : t("learn.account.renews")}
              </dt>
              <dd className="font-semibold text-[var(--ink)]">
                {fmtDate(entitlement.currentPeriodEnd, locale)}
              </dd>
            </div>
          )}
        </dl>

        {entitlement.cancelAtPeriodEnd && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {t("learn.account.willCancel")}
          </p>
        )}

        {sub?.stripeCustomerId && (
          <div className="mt-5">
            <BillingPortalButton />
          </div>
        )}
      </section>
    </div>
  );
}
