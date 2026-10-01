import Link from "next/link";
import type { Metadata } from "next";
import { getStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import { previewInvite } from "@/lib/learn/team/service";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import JoinTeamButton from "@/components/learn/team/JoinTeamButton";
import { TeamPrivacyNote } from "@/components/learn/team/TeamMemberView";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("team.join.metaTitle"), robots: { index: false, follow: false } };
}

// The emailed invitation link. Outside /learn so a visitor without an account
// can read it: they create an account (or sign in) and come back here to
// join. Joining needs the invited email address; the link works once.
export default async function JoinTeamPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [inv, student, t] = await Promise.all([previewInvite(token), getStudent(), getT()]);
  const here = `/join-team/${token}`;

  let body: React.ReactNode;
  if (!inv) {
    body = <p className="text-sm text-[var(--ink2)]">{t("team.join.invalid")}</p>;
  } else if (inv.expired) {
    body = <p className="text-sm text-[var(--ink2)]">{t("team.join.expired")}</p>;
  } else if (!inv.teamActive) {
    body = <p className="text-sm text-[var(--ink2)]">{t("team.join.inactive")}</p>;
  } else if (!student) {
    body = (
      <div className="space-y-3">
        <Link
          href={`/learn/signup?next=${encodeURIComponent(here)}&email=${encodeURIComponent(inv.email)}`}
          className="block w-full rounded-full bg-[var(--ink)] px-5 py-3 text-center text-sm font-bold text-white hover:opacity-90"
        >
          {t("team.join.signup")}
        </Link>
        <Link href={`/learn/login?next=${encodeURIComponent(here)}`} className="block w-full rounded-full border border-[var(--border)] px-5 py-3 text-center text-sm font-semibold text-[var(--ink)]">
          {t("team.join.login")}
        </Link>
      </div>
    );
  } else if (student.email.toLowerCase() !== inv.email.toLowerCase()) {
    body = <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t("team.join.wrongEmailLong", { email: inv.email, current: student.email })}</p>;
  } else {
    body = <JoinTeamButton token={token} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--s2)] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center text-lg font-black tracking-tight text-[var(--ink)]">
          TIB<span className="text-[var(--orange)]">LOGICS</span>
          <span className="ml-1.5 text-sm font-semibold text-[var(--ink3)]">Learn</span>
        </Link>
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("team.join.kicker")}</p>
          <h1 className="mt-1 break-words text-xl font-black text-[var(--ink)]">
            {inv ? t("team.join.title", { team: inv.teamName }) : t("team.join.titleUnknown")}
          </h1>
          {inv && !inv.expired && (
            <p className="mt-2 break-words text-sm text-[var(--ink2)]">
              {inv.inviterName ? t("team.join.byLine", { name: inv.inviterName, email: inv.email }) : t("team.join.forLine", { email: inv.email })}
            </p>
          )}
          <div className="mt-5">{body}</div>
          {inv && !inv.expired && inv.teamActive && <TeamPrivacyNote />}
        </div>
        <div className="mt-4 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
