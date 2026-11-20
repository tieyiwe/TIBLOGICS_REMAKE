import Link from "next/link";
import { Megaphone, Rocket } from "lucide-react";
import prisma from "@/lib/prisma";
import { Badge, Button, EmptyState } from "@/components/admin/ui";
import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { ensureGrowthTables } from "@/lib/growth/db";
import { campaignProgress, channelLabel, GOAL_TYPES, normalizePlan } from "@/lib/growth/campaigns";
import GrowthTabs from "../_components/GrowthTabs";
import { Card, PageHeader, Progress } from "../_components/ui";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default async function CampaignsPage() {
  await requireGrowthAdminPage();
  await ensureGrowthTables();
  const rows = await prisma.growthCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  const progress = await Promise.all(rows.map((c) => campaignProgress(c).catch(() => null)));
  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        title="Campaigns"
        subtitle="Goal-driven campaigns: one plan, every asset drafted, progress measured against the goal."
        actions={<Button variant="primary" icon={Rocket} href="/admin_pro/growth/campaigns/new" data-testid="new-campaign">New campaign</Button>}
      />
      <GrowthTabs />
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            body="Pick a goal like 20 AI Academy sign-ups or 5 discovery calls. The copilot plans it and drafts everything in a minute."
            action={<Button variant="primary" icon={Rocket} href="/admin_pro/growth/campaigns/new">Plan your first campaign</Button>}
          />
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c, i) => {
            const p = progress[i];
            const plan = normalizePlan(c.plan);
            const goal = GOAL_TYPES.find((g) => g.key === c.goalType);
            return (
              <li key={c.id}>
                <Link href={`/admin_pro/growth/campaigns/${c.id}`} className="block h-full rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-5 shadow-[var(--a-shadow-card)] transition-colors hover:border-[var(--a-border-strong)]" data-testid="campaign-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-syne text-[17px] font-bold text-[var(--a-ink)]">{c.name}</p>
                    <Badge tone={c.status === "active" ? "success" : c.status === "paused" ? "warn" : "neutral"} dot>{c.status}</Badge>
                  </div>
                  <p className="mt-0.5 font-dm text-[12.5px] text-[var(--a-ink-3)]">{fmt(c.startDate)} to {fmt(c.endDate)} · {goal?.label ?? c.goalType}</p>
                  {p && (
                    <div className="mt-4">
                      <div className="mb-1 flex items-baseline justify-between font-dm">
                        <span className="text-[24px] font-bold tabular-nums text-[var(--a-ink)]">{p.display}<span className="text-[13px] font-semibold text-[var(--a-ink-3)]"> / {p.targetDisplay}</span></span>
                        <Badge tone={p.pct >= 100 ? "success" : p.onTrack ? "info" : "warn"}>{p.pct >= 100 ? "Goal reached" : p.onTrack ? "On track" : "Behind"}</Badge>
                      </div>
                      <Progress value={p.value} max={p.target} tone={p.pct >= 100 ? "success" : p.onTrack ? "blue" : "warn"} label="Goal progress" />
                      <p className="mt-2 font-dm text-[12px] text-[var(--a-ink-3)]">{p.report.totals.clicks} clicks · {p.daysLeft} day{p.daysLeft === 1 ? "" : "s"} left</p>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {plan.channels.slice(0, 4).map((ch) => <Badge key={ch.channel} tone="neutral">{channelLabel(ch.channel)} {ch.share}%</Badge>)}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
