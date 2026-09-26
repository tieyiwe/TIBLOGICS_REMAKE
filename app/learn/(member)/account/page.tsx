import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getLearnContext } from "@/lib/learn/session";
import AccountSettings from "@/components/learn/AccountSettings";
import BillingPortalButton from "@/components/learn/BillingPortalButton";
import { localeCoverage } from "@/lib/learn/i18n";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { student, entitlement } = await getLearnContext();
  if (!student) redirect("/learn/login");

  const profile = await prisma.student
    .findUnique({
      where: { id: student.id },
      select: { accessibilityMode: true, leaderboardOptIn: true, locale: true, createdAt: true },
    })
    .catch(() => null);

  const sub = await prisma.learnSubscription
    .findUnique({ where: { studentId: student.id }, select: { plan: true, stripeCustomerId: true } })
    .catch(() => null);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-black text-[var(--ink)]">Account</h1>

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-sm font-bold text-[var(--ink)]">Profile</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ink3)]">Name on certificates</dt>
            <dd className="font-semibold text-[var(--ink)]">{student.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ink3)]">Email</dt>
            <dd className="font-semibold text-[var(--ink)]">{student.email}</dd>
          </div>
          {profile && (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink3)]">Member since</dt>
              <dd className="font-semibold text-[var(--ink)]">
                {profile.createdAt.toLocaleDateString()}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <AccountSettings
        accessibilityMode={profile?.accessibilityMode ?? false}
        leaderboardOptIn={profile?.leaderboardOptIn ?? false}
        locale={profile?.locale ?? "en"}
        frCoverage={localeCoverage("fr").percent}
      />

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-sm font-bold text-[var(--ink)]">Subscription</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ink3)]">Status</dt>
            <dd className="font-semibold capitalize text-[var(--ink)]">
              {entitlement.status?.replace("_", " ") ?? "None"}
            </dd>
          </div>
          {sub?.plan && (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink3)]">Plan</dt>
              <dd className="font-semibold capitalize text-[var(--ink)]">{sub.plan}</dd>
            </div>
          )}
          {entitlement.currentPeriodEnd && (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink3)]">
                {entitlement.cancelAtPeriodEnd ? "Access until" : "Renews"}
              </dt>
              <dd className="font-semibold text-[var(--ink)]">
                {entitlement.currentPeriodEnd.toLocaleDateString()}
              </dd>
            </div>
          )}
        </dl>

        {entitlement.cancelAtPeriodEnd && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Your subscription is set to cancel. Your certificates stay valid permanently.
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
