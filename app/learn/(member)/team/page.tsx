import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import { getMembership } from "@/lib/learn/team/access";
import { isManagerRole } from "@/lib/learn/team/config";
import { teamReport } from "@/lib/learn/team/report";
import { myAssignments, seatsUsed } from "@/lib/learn/team/service";
import { getTeamPricing, seatPrice } from "@/lib/learn/team/settings";
import { teamAiPool } from "@/lib/learn/ai-budget";
import TeamDashboard from "@/components/learn/team/TeamDashboard";
import TeamMemberView from "@/components/learn/team/TeamMemberView";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("team.meta.title") };
}

// Managers (owner, manager) get the team dashboard; members get what is
// shared, who manages them, their assignments and a way to leave. All data
// is for the viewer's own seat's team, resolved on the server.
export default async function TeamPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const [m, t, { welcome }] = await Promise.all([getMembership(student.id), getT(), searchParams]);

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
    const managers = await prisma.teamMember.findMany({
      where: { teamId: m.team.id, status: "active", role: { in: ["owner", "manager"] } },
      select: { studentId: true },
    });
    const names = await prisma.student.findMany({
      where: { id: { in: managers.map((x) => x.studentId).filter((x): x is string => !!x) } },
      select: { name: true },
    });
    const mine = await myAssignments(student.id);
    return (
      <TeamMemberView
        teamName={m.team.name}
        managers={names.map((n) => n.name)}
        role={m.role}
        entitled={m.entitled}
        assignments={(mine?.items ?? []).map((a) => ({ ...a, dueAt: a.dueAt?.toISOString() ?? null }))}
      />
    );
  }

  const [report, used, aiPool, pricing] = await Promise.all([teamReport(m.team.id), seatsUsed(m.team.id), teamAiPool(m.team.id), getTeamPricing()]);
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
      minSeats={pricing.minSeats}
      aiPool={{ used: aiPool.used, limit: aiPool.limit }}
      report={report}
      welcome={welcome === "1"}
    />
  );
}
