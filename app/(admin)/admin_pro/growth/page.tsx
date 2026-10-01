import Link from "next/link";
import { CalendarDays, Link2, Palette, Sparkles } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { ensureGrowthTables } from "@/lib/growth/db";
import { getGrowthSettings } from "@/lib/growth/settings";
import { getLinkReport } from "@/lib/growth/reports";
import { listPosts, statusCounts } from "@/lib/growth/content/posts";
import { configuredPlatforms } from "@/lib/growth/content/publish";
import { PLATFORM_INFO, PLATFORMS } from "@/lib/growth/content/platforms";
import { TYPE_LABEL, type CatalogType } from "@/lib/growth/catalog";
import { getOutreachSummary } from "@/lib/growth/outreach/summary";
import GrowthTabs from "./_components/GrowthTabs";
import WeekPlan from "./_components/WeekPlan";
import RunNow from "./_components/RunNow";
import { btn, Card, money, PageHeader, Stat } from "./_components/ui";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

export default async function GrowthHubPage() {
  await requireGrowthAdminPage();
  await ensureGrowthTables();
  const now = Date.now();
  const [settings, counts, week, r7, r30, kits, outreach] = await Promise.all([
    getGrowthSettings(),
    statusCounts(),
    listPosts({ from: new Date(now - 8 * DAY), to: new Date(now + 8 * DAY) }),
    getLinkReport(7),
    getLinkReport(30),
    prisma.growthKit.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, productTitle: true, productType: true, language: true, createdAt: true } }),
    getOutreachSummary().catch(() => null),
  ]);
  const configured = configuredPlatforms();
  const scheduledNext7 = week.filter((p) => p.status === "scheduled" && p.scheduledAt && Date.parse(p.scheduledAt) < now + 7 * DAY).length;
  const topLinks = r7.byLink.filter((l) => l.clicks > 0).sort((a, b) => b.clicks - a.clicks).slice(0, 6);
  const audiences = settings.audiences.map((a) => ({ id: a.id, name: a.name, timezone: a.timezone, language: a.language }));

  return (
    <div className="space-y-5 max-w-[1400px]">
      <GrowthTabs />
      <PageHeader
        title="Growth"
        subtitle="Marketing that keeps up with what you build: kits for every product, an approval queue, auto-publishing, tracked links and the revenue they bring."
        actions={
          <>
            <Link href="/admin_pro/growth/content" className={btn.primary}><Sparkles size={15} /> New marketing kit</Link>
            <Link href="/admin_pro/growth/calendar" className={btn.ghost}><CalendarDays size={15} /> Calendar</Link>
            <Link href="/admin_pro/growth/links#new" className={btn.ghost}><Link2 size={15} /> Tracked link</Link>
            <Link href="/admin_pro/growth/settings" className={btn.ghost}><Palette size={15} /> Brand</Link>
            <RunNow />
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Drafts awaiting approval" value={counts.draft ?? 0} note={<Link className="underline" href="/admin_pro/growth/calendar">Review in the calendar</Link>} />
        <Stat label="Scheduled, next 7 days" value={scheduledNext7} note={`${counts.scheduled ?? 0} scheduled in total`} />
        <Stat label="Ready to post by hand" value={counts.ready ?? 0} tone={(counts.ready ?? 0) > 0 ? "warn" : undefined} note="Due posts on platforms without tokens" />
        <Stat label="Failed" value={counts.failed ?? 0} tone={(counts.failed ?? 0) > 0 ? "warn" : undefined} note={`${counts.published ?? 0} published so far`} />
        <Stat label="Clicks, last 7 days" value={r7.totals.clicks.toLocaleString("en-US")} />
        <Stat label="Learn sign-ups, 30 days" value={r30.totals.signups.toLocaleString("en-US")} note="Attributed to a campaign" />
        <Stat label="Conversions, 30 days" value={r30.totals.conversions.toLocaleString("en-US")} />
        <Stat label="Attributed revenue, 30 days" value={money(r30.totals.revenueCents)} tone={r30.totals.revenueCents ? "good" : undefined} />
      </div>

      <Card title="This week's plan" subtitle="Your time zone. Click a post to edit, approve or post it." action={<Link href="/admin_pro/growth/calendar" className="font-dm text-sm text-[#2251A3] underline">Full calendar</Link>}>
        <WeekPlan initial={week} audiences={audiences} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Top links, last 7 days" action={<Link href="/admin_pro/growth/links" className="font-dm text-xs text-[#2251A3] underline">All links</Link>}>
          {topLinks.length === 0 ? <p className="font-dm text-sm text-[#7A8FA6]">No clicks yet.</p> : (
            <ul className="divide-y divide-[#E6ECF3] font-dm text-sm">
              {topLinks.map((l) => (
                <li key={l.key} className="py-1.5 flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-[#0D1B2A]">{l.label}</span>
                    <span className="block text-[11px] text-[#7A8FA6] truncate">{l.source} · {l.campaign}</span>
                  </span>
                  <span className="tabular-nums font-semibold">{l.clicks}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Conversions, last 30 days" action={<Link href="/admin_pro/growth/links?days=30" className="font-dm text-xs text-[#2251A3] underline">Attribution</Link>}>
          {r30.byKind.length === 0 ? <p className="font-dm text-sm text-[#7A8FA6]">None attributed yet. Share tracked links to start measuring.</p> : (
            <ul className="divide-y divide-[#E6ECF3] font-dm text-sm">
              {r30.byKind.map((k) => (
                <li key={k.kind} className="py-1.5 flex justify-between gap-2"><span>{k.label}</span><span className="tabular-nums">{k.converted}{k.revenueCents ? ` · ${money(k.revenueCents)}` : ""}</span></li>
              ))}
            </ul>
          )}
          {r30.byCampaign.filter((c) => c.revenueCents || c.signups || c.conversions).slice(0, 3).length > 0 && (
            <div className="mt-3">
              <p className="font-dm text-xs font-semibold text-[#3A4A5C] mb-1">Best campaigns</p>
              <ul className="font-dm text-xs text-[#3A4A5C] space-y-0.5">
                {r30.byCampaign.filter((c) => c.revenueCents || c.signups || c.conversions).slice(0, 3).map((c) => (
                  <li key={c.key} className="flex justify-between gap-2"><span className="truncate">{c.label}</span><span className="tabular-nums">{c.signups + c.conversions} · {money(c.revenueCents)}</span></li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card title="Outreach" action={<Link href="/admin_pro/growth/outreach" className="font-dm text-xs text-[#2251A3] underline">Open outreach</Link>}>
          {!outreach || !outreach.ok ? (
            <p className="font-dm text-sm text-[#7A8FA6]">Outreach numbers are not available yet.</p>
          ) : (
            <div className="space-y-2 font-dm text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-xs text-[#7A8FA6]">Leads</p><p className="font-syne font-bold text-xl">{outreach.totalLeads}</p></div>
                <div><p className="text-xs text-[#7A8FA6]">Awaiting approval</p><p className="font-syne font-bold text-xl">{outreach.awaitingApproval}</p></div>
                <div><p className="text-xs text-[#7A8FA6]">Emails sent this week</p><p className="font-syne font-bold text-xl">{outreach.emailsSentThisWeek}</p></div>
                <div><p className="text-xs text-[#7A8FA6]">Reply rate, 30 days</p><p className="font-syne font-bold text-xl">{Math.round(outreach.replyRate * 100)}%</p></div>
              </div>
              {outreach.hotList.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#3A4A5C]">Hot leads</p>
                  <ul className="text-xs text-[#3A4A5C]">{outreach.hotList.map((h) => <li key={h.id} className="truncate">{h.companyName}{h.area ? ` · ${h.area}` : ""}</li>)}</ul>
                </div>
              )}
              <Link href="/admin_pro/growth/leads" className="inline-block text-xs text-[#2251A3] underline">Lead workspace</Link>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Recent kits" action={<Link href="/admin_pro/growth/content" className="font-dm text-xs text-[#2251A3] underline">All kits</Link>}>
          {kits.length === 0 ? <p className="font-dm text-sm text-[#7A8FA6]">No kits yet. Pick a product and generate one.</p> : (
            <ul className="divide-y divide-[#E6ECF3] font-dm text-sm">
              {kits.map((k) => (
                <li key={k.id} className="py-1.5">
                  <Link href={`/admin_pro/growth/content/${k.id}`} className="hover:text-[#2251A3]">{k.productTitle}</Link>
                  <span className="ml-2 text-[11px] text-[#7A8FA6]">{TYPE_LABEL[k.productType as CatalogType] ?? k.productType} · {k.language.toUpperCase()} · {k.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Publishing connections" subtitle="Tokens are environment variables; platforms without them are posted by hand from the queue.">
          <ul className="divide-y divide-[#E6ECF3] font-dm text-sm">
            {PLATFORMS.map((p) => (
              <li key={p} className="py-1.5 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: PLATFORM_INFO[p].color }} />{PLATFORM_INFO[p].label}</span>
                <span className={configured[p] ? "text-[#0F6E56]" : "text-[#7A8FA6]"}>
                  {PLATFORM_INFO[p].api ? (configured[p] ? "Auto-publish on" : "No tokens: manual") : "Manual (copy + deep link)"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
