import Link from "next/link";
import { CalendarDays, Rocket, Sparkles } from "lucide-react";
import prisma from "@/lib/prisma";
import { Button, Badge } from "@/components/admin/ui";
import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { ensureGrowthTables } from "@/lib/growth/db";
import { getGrowthSettings } from "@/lib/growth/settings";
import { getLinkReport } from "@/lib/growth/reports";
import { listPosts, toView } from "@/lib/growth/content/posts";
import { configuredPlatforms } from "@/lib/growth/content/publish";
import { PLATFORM_INFO, PLATFORMS } from "@/lib/growth/content/platforms";
import { getGoalProgress, getGoals, getNextActions, getStreak } from "@/lib/growth/mission";
import { GOAL_TYPES } from "@/lib/growth/campaigns";
import GrowthTabs from "./_components/GrowthTabs";
import WeekPlan from "./_components/WeekPlan";
import RunNow from "./_components/RunNow";
import TrendIdeas from "./_components/TrendIdeas";
import { GoalTracker, MissionBrief, NextActions, StreakCard } from "./_components/MissionControl";
import { Card, money, PageHeader, Progress, Stat } from "./_components/ui";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

export default async function GrowthHubPage() {
  await requireGrowthAdminPage();
  await ensureGrowthTables();
  const now = Date.now();
  const [settings, week, r7, r30, actions, goals, streak, campaigns] = await Promise.all([
    getGrowthSettings(),
    listPosts({ from: new Date(now - 8 * DAY), to: new Date(now + 8 * DAY) }),
    getLinkReport(7),
    getLinkReport(30),
    getNextActions(),
    getGoals(),
    getStreak(),
    prisma.growthCampaign.findMany({ where: { status: "active" }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);
  const progress = await getGoalProgress(goals);
  const postIds = [...new Set(actions.flatMap((a) => [a.primary, ...(a.secondary ?? [])]).flatMap((b) => (b.type === "open-post" || b.type === "copy-open" ? [b.postId] : [])))];
  const actionPosts = postIds.length ? await prisma.growthPost.findMany({ where: { id: { in: postIds } } }) : [];
  const configured = configuredPlatforms();
  const audiences = settings.audiences.map((a) => ({ id: a.id, name: a.name, timezone: a.timezone, language: a.language }));
  const clicksSpark = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * DAY).toISOString().slice(0, 10);
    return r7.daily.find((x) => x.day === d)?.clicks ?? 0;
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        title="Mission control"
        subtitle="What to do next to land customers, in order. Approve in one click; everything else runs itself."
        actions={
          <>
            <Button variant="primary" icon={Rocket} href="/admin_pro/growth/campaigns/new">New campaign</Button>
            <Button icon={Sparkles} href="/admin_pro/growth/content">New kit</Button>
            <Button icon={CalendarDays} href="/admin_pro/growth/calendar" className="hidden sm:inline-flex">Calendar</Button>
            <RunNow />
          </>
        }
      />
      <GrowthTabs />

      <MissionBrief enabled={actions.length > 0} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <Card title="Next best actions" subtitle="Ranked by what moves revenue first. Hide one until tomorrow with the cross." action={<Badge tone={actions.length ? "orange" : "success"}>{actions.length ? `${actions.length} to do` : "Clear"}</Badge>}>
            <NextActions actions={actions} posts={Object.fromEntries(actionPosts.map((p) => [p.id, toView(p, configured)]))} audiences={audiences} />
          </Card>

          <Card title="This week's plan" subtitle="Your time zone. Click a post to edit, approve or post it." action={<Link href="/admin_pro/growth/calendar" className="font-dm text-[13px] font-semibold text-[var(--a-blue)] hover:underline">Full calendar</Link>}>
            <WeekPlan initial={week} audiences={audiences} />
          </Card>

          <TrendIdeas audiences={audiences} />
        </div>

        <aside className="space-y-5">
          <GoalTracker items={progress.items} elapsed={progress.elapsed} goals={goals} />
          <StreakCard streak={streak} />

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Clicks, 7 days" value={r7.totals.clicks.toLocaleString("en-US")} spark={clicksSpark} href="/admin_pro/growth/links?days=7" />
            <Stat label="Sign-ups, 30 days" value={r30.totals.signups.toLocaleString("en-US")} href="/admin_pro/growth/links?days=30" />
            <Stat label="Conversions, 30 days" value={r30.totals.conversions.toLocaleString("en-US")} href="/admin_pro/growth/links?days=30" />
            <Stat label="Revenue, 30 days" value={money(r30.totals.revenueCents)} tone={r30.totals.revenueCents ? "good" : undefined} href="/admin_pro/growth/links?days=30" />
          </div>

          <Card title="Active campaigns" action={<Link href="/admin_pro/growth/campaigns" className="font-dm text-[12.5px] font-semibold text-[var(--a-blue)] hover:underline">All</Link>}>
            {campaigns.length === 0 ? (
              <div className="space-y-2">
                <p className="font-dm text-[13px] text-[var(--a-ink-3)]">Pick a goal and the copilot plans the content, links and outreach for you.</p>
                <Button size="sm" variant="primary" icon={Rocket} href="/admin_pro/growth/campaigns/new">Start one</Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {campaigns.map((c) => {
                  const total = Math.max(1, c.endDate.getTime() - c.startDate.getTime());
                  const elapsed = Math.max(0, Math.min(1, (now - c.startDate.getTime()) / total));
                  return (
                    <li key={c.id}>
                      <Link href={`/admin_pro/growth/campaigns/${c.id}`} className="block rounded-[var(--a-radius-control)] p-1 -m-1 hover:bg-[var(--a-surface-2)]">
                        <span className="flex items-baseline justify-between gap-2 font-dm">
                          <span className="truncate text-[13px] font-semibold text-[var(--a-ink)]">{c.name}</span>
                          <span className="shrink-0 text-[11.5px] text-[var(--a-ink-3)]">{GOAL_TYPES.find((g) => g.key === c.goalType)?.label ?? c.goalType}: {c.goalTarget}</span>
                        </span>
                        <span className="mt-1.5 block"><Progress value={elapsed * 100} max={100} tone="blue" label="Time elapsed" /></span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Publishing connections" subtitle="Platforms without tokens are posted by hand from the queue.">
            <ul className="divide-y divide-[var(--a-border)] font-dm text-[13px]">
              {PLATFORMS.map((p) => (
                <li key={p} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: PLATFORM_INFO[p].color }} />{PLATFORM_INFO[p].label}</span>
                  <Badge tone={configured[p] ? "success" : "neutral"}>{PLATFORM_INFO[p].api ? (configured[p] ? "Auto-publish" : "Manual") : "Copy + open"}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
