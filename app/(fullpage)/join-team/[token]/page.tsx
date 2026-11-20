import Link from "next/link";
import type { Metadata } from "next";
import { getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { localTitles } from "@/lib/learn/team/titles";
import { previewInvite } from "@/lib/learn/team/service";
import { previewTeamLink } from "@/lib/learn/team/link";
import { emailOnDomain } from "@/lib/learn/team/config";
import { getPlan } from "@/lib/learn/team/plan";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import JoinTeamButton from "@/components/learn/team/JoinTeamButton";
import TeamLinkJoin from "@/components/learn/team/TeamLinkJoin";
import { TeamPrivacyNote } from "@/components/learn/team/TeamMemberView";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("team.join.metaTitle"), robots: { index: false, follow: false } };
}

// The emailed invitation link (single use, one address) or the team's
// shareable join link (one company domain). Outside /learn so a visitor
// without an account can read it: they create an account (or sign in) and
// come back here to join.
export default async function JoinTeamPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [inv, student, t] = await Promise.all([previewInvite(token), getStudent(), getT()]);
  const linkInfo = inv ? null : await previewTeamLink(token);
  const here = `/join-team/${token}`;
  const plan = inv && !inv.expired ? await getPlan(inv.teamId, inv.memberId).catch(() => null) : null;
  const planTracks = plan?.trackIds.length
    ? await (async () => {
        const titles = await localTitles(await getLocale(), plan.trackIds);
        return plan.trackIds.map((id) => titles.map[id]).filter((x): x is string => !!x);
      })()
    : [];

  const authButtons = (email?: string) => (
    <div className="space-y-3">
      <Link
        href={`/learn/signup?next=${encodeURIComponent(here)}${email ? `&email=${encodeURIComponent(email)}` : ""}`}
        className="block w-full rounded-full bg-[var(--ink)] px-5 py-3 text-center text-sm font-bold text-white hover:opacity-90"
      >
        {t("team.join.signup")}
      </Link>
      <Link href={`/learn/login?next=${encodeURIComponent(here)}`} className="block w-full rounded-full border border-[var(--border)] px-5 py-3 text-center text-sm font-semibold text-[var(--ink)]">
        {t("team.join.login")}
      </Link>
    </div>
  );

  let title: string;
  let sub: React.ReactNode = null;
  let body: React.ReactNode;
  let showPrivacy = false;

  if (inv) {
    title = t("team.join.title", { team: inv.teamName });
    if (!inv.expired) {
      sub = inv.inviterName ? t("team.join.byLine", { name: inv.inviterName, email: inv.email }) : t("team.join.forLine", { email: inv.email });
    }
    if (inv.expired) body = <p className="text-sm text-[var(--ink2)]">{t("team.join.expired")}</p>;
    else if (!inv.teamActive) body = <p className="text-sm text-[var(--ink2)]">{t("team.join.inactive")}</p>;
    else if (!student) body = authButtons(inv.email);
    else if (student.email.toLowerCase() !== inv.email.toLowerCase()) {
      body = <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t("team.join.wrongEmailLong", { email: inv.email, current: student.email })}</p>;
    } else body = <JoinTeamButton token={token} />;
    showPrivacy = !inv.expired && inv.teamActive;
  } else if (linkInfo) {
    title = t("team.join.title", { team: linkInfo.teamName });
    sub = t("team.link.pageLine", { domain: linkInfo.domain });
    if (!linkInfo.teamActive) body = <p className="text-sm text-[var(--ink2)]">{t("team.join.inactive")}</p>;
    else if (!student) body = authButtons();
    else if (!emailOnDomain(student.email, linkInfo.domain)) {
      body = <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t("team.link.wrongDomainLong", { domain: linkInfo.domain, current: student.email })}</p>;
    } else body = <TeamLinkJoin token={token} />;
    showPrivacy = linkInfo.teamActive;
  } else {
    title = t("team.join.titleUnknown");
    body = <p className="text-sm text-[var(--ink2)]">{t("team.join.invalid")}</p>;
  }
  const tracks = inv ? planTracks : linkInfo?.trackTitles ?? [];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--s2)] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center" aria-label="ARFA">
          <ArfaWordmark size="md" academyLabel={t("team.brand.academy")} />
        </Link>
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("team.join.kicker")}</p>
          <h1 className="mt-1 break-words text-xl font-black text-[var(--ink)]">{title}</h1>
          {sub && <p className="mt-2 break-words text-sm text-[var(--ink2)]">{sub}</p>}
          {tracks.length > 0 && showPrivacy && (
            <div className="mt-4 rounded-xl bg-[var(--s2)] px-4 py-3 text-sm">
              <p className="font-semibold text-[var(--ink)]">{t(tracks.length === 1 ? "team.join.tracks.one" : "team.join.tracks.other")}</p>
              <ul className="mt-1 list-disc pl-5 text-[var(--ink2)]">
                {tracks.map((x) => <li key={x} className="break-words">{x}</li>)}
              </ul>
            </div>
          )}
          <div className="mt-5">{body}</div>
          {showPrivacy && <TeamPrivacyNote />}
        </div>
        <div className="mt-4 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
