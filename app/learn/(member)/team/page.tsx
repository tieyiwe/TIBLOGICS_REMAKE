import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { getMembership } from "@/lib/learn/team/access";
import { isManagerRole } from "@/lib/learn/team/config";
import { teamReport } from "@/lib/learn/team/report";
import { seatsUsed } from "@/lib/learn/team/service";
import { getTeamPricing, seatPrice } from "@/lib/learn/team/settings";
import { getPrefs } from "@/lib/learn/team/prefs";
import { inviteUrl } from "@/lib/learn/team/emails";
import { myTeamPlan } from "@/lib/learn/team/next";
import { localTitles } from "@/lib/learn/team/titles";
import { teamBoard } from "@/lib/learn/team/board";
import { teamAiPool } from "@/lib/learn/ai-budget";
import TeamDashboard from "@/components/learn/team/TeamDashboard";
import TeamMemberView from "@/components/learn/team/TeamMemberView";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("team.meta.title") };
}

// Managers (owner, manager) get the team dashboard (tabs: ?tab=overview |
// people | invite | assignments | reports | billing); members get their
// plan, who manages them, what is shared, the opt-in team board and a way to
// leave. All data is for the viewer's own seat's team, resolved on the server.
export default async function TeamPage({ searchParams }: { searchParams: Promise<{ welcome?: string; tab?: string }> }) {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const [m, t, locale, sp] = await Promise.all([getMembership(student.id), getT(), getLocale(), searchParams]);

  if (!m) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[var(--border)] bg-white p-8 text-center">
        <h1 className="text-xl font-black text-[var(--ink)]">{t("team.none.title")}</h1>
        <p className="mt-2 text-sm text-[var(--ink2)]">{t("team.none.body")}</p>
        <Link href="/learn/subscribe?team=1#teams" className="mt-5 inline-block rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white">
          {t("team.none.cta")}
        </Link>
      </div>
    );
  }

  if (!isManagerRole(m.role)) {
    const [plan, board] = await Promise.all([myTeamPlan(student.id), m.entitled ? teamBoard(m.team.id, student.id).catch(() => null) : null]);
    const titles = await localTitles(locale, plan?.items.map((a) => a.trackId) ?? []);
    return (
      <TeamMemberView
        teamName={m.team.name}
        managers={plan?.managers ?? []}
        role={m.role}
        entitled={m.entitled}
        assignments={(plan?.items ?? []).map((a) => ({
          id: a.id,
          slug: a.slug,
          title: titles.track(a.trackId, a.title),
          dueAt: a.dueAt?.toISOString() ?? null,
          assignedAt: a.assignedAt.toISOString(),
          percent: a.percent,
          overdue: a.overdue,
        }))}
        next={plan?.next ? { href: plan.next.href, kind: plan.next.kind, title: titles.lesson(plan.next.trackId, plan.next.lessonId, plan.next.title) } : null}
        board={board}
      />
    );
  }

  const [report, used, aiPool, pricing, prefs, titles] = await Promise.all([
    teamReport(m.team.id),
    seatsUsed(m.team.id),
    teamAiPool(m.team.id),
    getTeamPricing(),
    getPrefs(m.team.id),
    localTitles(locale),
  ]);
  const link = prefs.joinLink;
  return (
    <TeamDashboard
      team={{
        id: m.team.id,
        name: m.team.name,
        status: m.team.status,
        seats: m.team.seats,
        comped: m.team.comped,
        inGrace: m.inGrace,
        graceUntil: m.team.graceUntil?.toISOString() ?? null,
        entitled: m.entitled,
        cancelAtPeriodEnd: m.team.cancelAtPeriodEnd,
        currentPeriodEnd: m.team.currentPeriodEnd?.toISOString() ?? null,
        hasBilling: !!m.team.stripeCustomerId && !!m.team.stripeSubscriptionId,
      }}
      role={m.role}
      used={used}
      seatPriceCents={seatPrice(m.team, pricing)}
      pricing={{ seatPriceCents: pricing.seatPriceCents, minSeats: pricing.minSeats, tiers: pricing.tiers }}
      aiPool={{ used: aiPool.used, limit: aiPool.limit }}
      report={report}
      titles={titles.map}
      link={link ? { url: inviteUrl(link.token), domain: link.domain, trackIds: link.trackIds, dueAt: link.dueAt, createdAt: link.createdAt } : null}
      digestOn={!prefs.digestOff.includes(student.id)}
      tab={sp.tab}
      welcome={sp.welcome === "1"}
    />
  );
}
