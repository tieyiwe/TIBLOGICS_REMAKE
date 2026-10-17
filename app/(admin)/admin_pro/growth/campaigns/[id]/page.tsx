import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { ensureGrowthTables } from "@/lib/growth/db";
import { acquireAvailable, campaignDTO, campaignProgress, matchLeads } from "@/lib/growth/campaigns";
import { getCatalogItem } from "@/lib/growth/catalog";
import { listPosts } from "@/lib/growth/content/posts";
import { getGrowthSettings } from "@/lib/growth/settings";
import GrowthTabs from "../../_components/GrowthTabs";
import { PageHeader } from "../../_components/ui";
import CampaignDetail from "./CampaignDetail";

export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  await requireGrowthAdminPage();
  await ensureGrowthTables();
  const { id } = await params;
  const row = await prisma.growthCampaign.findUnique({ where: { id } });
  if (!row) notFound();
  const c = campaignDTO(row);
  const [progress, posts, settings, products, matches, sequence] = await Promise.all([
    campaignProgress(row),
    c.kitId ? listPosts({ kitId: c.kitId }) : Promise.resolve([]),
    getGrowthSettings(),
    Promise.all(c.productKeys.map((k) => getCatalogItem(k))),
    c.sequenceId ? matchLeads(c.leadFilter, 100).catch(() => ({ count: 0, leads: [] })) : Promise.resolve({ count: 0, leads: [] }),
    c.sequenceId ? prisma.outreachSequence.findUnique({ where: { id: c.sequenceId }, select: { id: true, name: true, status: true } }).catch(() => null) : Promise.resolve(null),
  ]);
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        breadcrumb={[{ label: "Growth", href: "/admin_pro/growth" }, { label: "Campaigns", href: "/admin_pro/growth/campaigns" }, { label: c.name }]}
        title={c.name}
        subtitle={`${c.goalLabel} · ${fmt(c.startDate)} to ${fmt(c.endDate)} · utm_campaign "${c.slug}"`}
      />
      <GrowthTabs />
      <CampaignDetail
        campaign={c}
        progress={{
          value: progress.value, target: progress.target, display: progress.display, targetDisplay: progress.targetDisplay, pct: progress.pct,
          elapsed: progress.elapsed, daysLeft: progress.daysLeft, onTrack: progress.onTrack, posts: progress.posts, enrolled: progress.enrolled, replied: progress.replied,
          totals: progress.report.totals, byPlatform: progress.report.byPlatform, byLink: progress.report.byLink.slice(0, 12), daily: progress.report.daily,
        }}
        posts={posts}
        products={products.filter((p): p is NonNullable<typeof p> => !!p).map((p) => ({ key: p.key, title: p.title, url: p.url }))}
        matches={{ count: matches.count, ids: matches.leads.map((l) => l.id), sample: matches.leads.slice(0, 6).map((l) => ({ id: l.id, companyName: l.companyName, score: l.score, area: l.area })) }}
        sequence={sequence}
        acquire={acquireAvailable()}
        audiences={settings.audiences.map((a) => ({ id: a.id, name: a.name, timezone: a.timezone, language: a.language }))}
      />
    </div>
  );
}
