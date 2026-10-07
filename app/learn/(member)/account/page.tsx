import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getLearnContext } from "@/lib/learn/session";
import AccountSettings from "@/components/learn/AccountSettings";
import OpenHelpButton from "@/components/learn/support/OpenHelpButton";
import CommunitySettings from "@/components/learn/community/CommunitySettings";
import { getProfile } from "@/lib/learn/community/discussion";
import BillingPortalButton from "@/components/learn/BillingPortalButton";
import type { Metadata } from "next";
import { fmtDate } from "@/lib/learn/format";
import { getLocale, getT } from "@/lib/i18n/server";
import { ensureLeaderboardColumn } from "@/lib/learn/leaderboard";
import StudyReminders from "@/components/learn/pwa/StudyReminders";
import AppInstall from "@/components/learn/pwa/AppInstall";
import { getReminderSettings } from "@/lib/learn/reminders/store";
import ScholarshipCard from "@/components/learn/scholarship/ScholarshipCard";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.nav.account") };
}

export default async function AccountPage() {
  const { student, entitlement, access } = await getLearnContext();
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

  // Tracks bought outright (lifetime access).
  const owned = access.purchased.length
    ? await prisma.learnTrack
        .findMany({ where: { id: { in: access.purchased } }, orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, title: true } })
        .catch(() => [])
    : [];

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

      {/* Tilo Vision Scholarship: shown to scholars only */}
      <ScholarshipCard studentId={student.id} variant="account" />

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6" data-testid="account-inbox">
        <h2 className="text-sm font-bold text-[var(--ink)]">{t("inbox.account.title")}</h2>
        <p className="mt-1 text-sm text-[var(--ink2)]">{t("inbox.account.body")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/learn/inbox" className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--ink)] hover:border-[var(--ink3)]">
            {t("inbox.account.messages")}
          </Link>
          <Link href="/learn/inbox?tab=notifications" className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--ink)] hover:border-[var(--ink3)]">
            {t("inbox.account.notifications")}
          </Link>
          <OpenHelpButton className="inline-flex min-h-11 items-center rounded-full bg-[var(--ink)] px-4 text-sm font-bold text-white hover:opacity-90">
            {t("inbox.account.help")}
          </OpenHelpButton>
        </div>
      </section>

      <AccountSettings
        accessibilityMode={profile?.accessibilityMode ?? false}
        leaderboardOptIn={profile?.leaderboardOptIn ?? false}
      />

      {/* Community: reply digest opt-out (components/learn/community) */}
      <CommunitySettings
        replyDigest={await getProfile(student.id).then((p) => p.replyDigest).catch(() => true)}
      />

      {/* Study reminders (WhatsApp / email) and the installable app (components/learn/pwa) */}
      {await reminderSection(student.id, student.email, student.locale)}
      <AppInstall />

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

      {entitlement.team && (
        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t("team.account.title")}</h2>
          <p className="mt-1 text-sm text-[var(--ink2)]">{t("team.account.line", { team: entitlement.team.name })}</p>
          <Link href="/learn/team" className="mt-3 inline-block text-sm font-semibold text-[var(--blue2)] underline">
            {t("team.account.link")}
          </Link>
        </section>
      )}

      {owned.length > 0 && (
        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t("learn.account.owned")}</h2>
          <p className="mt-1 text-xs text-[var(--ink3)]">{t("learn.account.ownedNote")}</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {owned.map((tr) => (
              <li key={tr.id}>
                <Link href={`/learn/track/${tr.slug}`} className="font-semibold text-[var(--blue2)] underline">
                  {tr.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

async function reminderSection(studentId: string, email: string, locale: string) {
  const settings = await getReminderSettings(studentId, locale).catch(() => null);
  if (!settings) return null;
  const saved = await prisma.studyReminderPref.count({ where: { studentId } }).catch(() => 1);
  return <StudyReminders initial={settings} email={email} isNew={saved === 0} />;
}
