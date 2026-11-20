import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import YouthOnboarding from "@/components/learn/youth/YouthOnboarding";
import { canAccessTrack, getAccess, getStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import { isYouthSlug, YOUTH_EXPLORER } from "@/lib/learn/youth";
import { birthYearRange, getYouthProfile, laneForBirthYear, needsParentConsent, youthGate } from "@/lib/learn/youth-account";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.youth.metaTitle"), robots: { index: false, follow: false } };
}

/** "jane.doe@example.com" -> "ja***@example.com" */
function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  return `${user.slice(0, Math.min(2, user.length))}***@${domain}`;
}

// AI-Empowered Youth onboarding, outside the member area so a learner whose
// only tracks are youth lanes can reach it while they are locked:
//   setup    birth year (10 to 17) and a parent or guardian email
//   pending  under 13: waiting for the parent to confirm (resend button)
//   revoked  the parent turned access off
// ?lane=<youth slug> where they were going; ?buy=track|monthly continues to
// payment after the setup (the checkout sends them here when the profile is
// missing); ?from=join came from the one-page join flow.
export default async function YouthPage({
  searchParams,
}: {
  searchParams: Promise<{ lane?: string; buy?: string; from?: string }>;
}) {
  const sp = await searchParams;
  const student = await getStudent();
  if (!student) redirect("/learn/login?next=/learn/youth");
  const [t, profile, access] = await Promise.all([getT(), getYouthProfile(student.id), getAccess(student.id)]);
  const buy = sp.buy === "track" || sp.buy === "monthly" ? sp.buy : null;
  const from = sp.from === "join" ? "join" : null;
  const gate = youthGate(profile);
  const lane = profile?.birthYear ? laneForBirthYear(profile.birthYear) : isYouthSlug(sp.lane) ? sp.lane! : YOUTH_EXPLORER;

  // Nothing in the way: straight to the lane (or on to payment).
  if (!gate && !buy) {
    const track = await prisma.learnTrack.findUnique({ where: { slug: lane }, select: { id: true } }).catch(() => null);
    if (track && canAccessTrack(access, track.id)) redirect(`/learn/track/${lane}`);
    redirect(`/learn/subscribe?track=${lane}`);
  }

  const range = birthYearRange();
  return (
    <div className="min-h-screen bg-[var(--s2)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/learn" className="inline-block">
            <ArfaWordmark size="sm" academyLabel={t("learn.brand.academy")} />
          </Link>
          <LanguageSwitcher />
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-xl px-4 py-8">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--orange2)]">{t("learn.youth.program")}</p>
        <YouthOnboarding
          stage={gate ?? "ready"}
          firstName={student.name.split(" ")[0] ?? ""}
          lane={lane}
          buy={buy}
          from={from}
          birthYear={profile?.birthYear ?? null}
          parentEmailMasked={profile?.parentEmail ? maskEmail(profile.parentEmail) : null}
          consentNeeded={needsParentConsent(profile)}
          minYear={range.min}
          maxYear={range.max}
        />
      </main>
    </div>
  );
}
