import Link from "next/link";
import { FileText, Gift, Inbox, LayoutTemplate, Magnet, Plus } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { ensureAcquireTables } from "@/lib/growth/acquire/db";
import { capturesByDay, recentCaptures, statsFor, type RefStats } from "@/lib/growth/acquire/stats";
import { MAGNET_TYPE_LABEL, type MagnetType } from "@/lib/growth/acquire/types";
import { adminReferralOverview } from "@/lib/learn/referrals/service";
import { Badge, Button, Card, DataTable, EmptyState, PageHeader, StatCard, type Column } from "@/components/admin/ui";
import AcquireNav from "./_components/AcquireNav";

export const dynamic = "force-dynamic";

const pct = (r: number | null) => (r === null ? "n/a" : `${(r * 100).toFixed(r < 0.1 ? 1 : 0)}%`);
const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
};

type MagRow = { id: string; slug: string; title: string; type: string; status: string; s: RefStats };
type PageRow = { id: string; slug: string; title: string; status: string; s: RefStats };

export default async function AcquireOverviewPage() {
  await requireGrowthAdminPage();
  await ensureAcquireTables();
  const [magnets, pages, spark, recent, ref] = await Promise.all([
    prisma.acquireMagnet.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.acquirePage.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    capturesByDay(30),
    recentCaptures(8),
    adminReferralOverview().catch(() => null),
  ]);
  const [mStats, pStats] = await Promise.all([statsFor("magnet", magnets), statsFor("page", pages)]);
  const magRows: MagRow[] = magnets.map((m) => ({ id: m.id, slug: m.slug, title: m.title, type: m.type, status: m.status, s: mStats.get(m.id)! }));
  const pageRows: PageRow[] = pages.map((p) => ({ id: p.id, slug: p.slug, title: p.title, status: p.status, s: pStats.get(p.id)! }));

  const sum = (rows: { s: RefStats }[], k: keyof RefStats) => rows.reduce((n, r) => n + ((r.s[k] as number) ?? 0), 0);
  const mViews = sum(magRows, "views");
  const mCaps = sum(magRows, "captures");
  const pViews = sum(pageRows, "views");
  const pLeads = sum(pageRows, "captures");
  const last30 = spark.reduce((a, b) => a + b, 0);
  const pending = ref?.totals.pending ?? 0;
  const creditDue = ref?.totals.creditDue ?? 0;

  const todo: { text: string; href: string; action: string }[] = [];
  if (pending) todo.push({ text: `${pending} referral reward${pending === 1 ? "" : "s"} waiting for approval`, href: "/admin_pro/growth/acquire/referrals", action: "Review" });
  if (creditDue) todo.push({ text: `${creditDue} Stripe credit${creditDue === 1 ? "" : "s"} to apply by hand`, href: "/admin_pro/growth/acquire/referrals", action: "Open" });
  const drafts = magRows.filter((m) => m.status !== "published").length + pageRows.filter((p) => p.status !== "published").length;
  if (drafts) todo.push({ text: `${drafts} draft${drafts === 1 ? "" : "s"} not published yet`, href: magRows.some((m) => m.status !== "published") ? "/admin_pro/growth/acquire/magnets" : "/admin_pro/growth/acquire/pages", action: "Finish" });
  const leaky = magRows.find((m) => m.status === "published" && m.s.views >= 30 && (m.s.rate ?? 0) < 0.05);
  if (leaky) todo.push({ text: `"${leaky.title}" converts under 5% of ${leaky.s.views} visitors: try a sharper headline`, href: `/admin_pro/growth/acquire/magnets/${leaky.id}`, action: "Edit" });

  const magCols: Column<MagRow>[] = [
    { key: "title", header: "Lead magnet", primary: true, render: (r) => <Link href={`/admin_pro/growth/acquire/magnets/${r.id}`} className="hover:underline">{r.title}</Link> },
    { key: "type", header: "Type", hideOnMobile: true, render: (r) => MAGNET_TYPE_LABEL[r.type as MagnetType] ?? r.type },
    { key: "status", header: "Status", render: (r) => <Badge tone={r.status === "published" ? "success" : "neutral"} dot>{r.status === "published" ? "Live" : "Draft"}</Badge> },
    { key: "views", header: "Views", align: "right", render: (r) => <span className="tabular-nums">{r.s.views}</span> },
    { key: "caps", header: "Sign-ups", align: "right", render: (r) => <span className="tabular-nums font-semibold text-[var(--a-ink)]">{r.s.captures}</span> },
    { key: "rate", header: "Conversion", align: "right", render: (r) => <span className="tabular-nums">{pct(r.s.rate)}</span> },
    { key: "cta", header: "Product clicks", align: "right", hideOnMobile: true, render: (r) => <span className="tabular-nums">{r.s.ctas}</span> },
  ];
  const pageCols: Column<PageRow>[] = [
    { key: "title", header: "Landing page", primary: true, render: (r) => <Link href={`/admin_pro/growth/acquire/pages/${r.id}`} className="hover:underline">{r.title}</Link> },
    { key: "status", header: "Status", render: (r) => <Badge tone={r.status === "published" ? "success" : "neutral"} dot>{r.status === "published" ? "Live" : "Draft"}</Badge> },
    { key: "views", header: "Visits", align: "right", render: (r) => <span className="tabular-nums">{r.s.views}</span> },
    { key: "leads", header: "Leads", align: "right", render: (r) => <span className="tabular-nums font-semibold text-[var(--a-ink)]">{r.s.captures}</span> },
    { key: "cta", header: "CTA clicks", align: "right", hideOnMobile: true, render: (r) => <span className="tabular-nums">{r.s.ctas}</span> },
    { key: "conv", header: "Conversions", align: "right", render: (r) => <span className="tabular-nums">{r.s.signups + r.s.conversions}</span> },
    { key: "rev", header: "Revenue", align: "right", hideOnMobile: true, render: (r) => <span className="tabular-nums">{money(r.s.revenueCents)}</span> },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <AcquireNav counts={{ "/admin_pro/growth/acquire/referrals": pending || undefined }} />
      <PageHeader
        title="Acquisition"
        subtitle="Free resources, campaign pages and learner referrals that bring in leads and customers on their own. Every sign-up lands in Leads with express consent and in the newsletter."
        actions={
          <>
            <Button href="/admin_pro/growth/acquire/pages?new=1" icon={LayoutTemplate}>New landing page</Button>
            <Button href="/admin_pro/growth/acquire/magnets?new=1" variant="primary" icon={Plus}>New lead magnet</Button>
          </>
        }
        className="!mb-0"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sign-ups, last 30 days" value={last30} spark={spark} tone="orange" icon={Inbox} hint="Magnet and landing page opt-ins" />
        <StatCard label="Lead magnet conversion" value={mViews ? pct(mCaps / mViews) : "n/a"} hint={`${mCaps} sign-ups from ${mViews} views`} icon={Magnet} href="/admin_pro/growth/acquire/magnets" />
        <StatCard label="Landing page leads" value={pLeads} hint={`${pViews} visits, ${pViews ? pct(pLeads / pViews) : "n/a"} convert`} icon={FileText} href="/admin_pro/growth/acquire/pages" />
        <StatCard
          label="Referral rewards to review"
          value={pending}
          tone={pending ? "warn" : "default"}
          hint={ref ? `${ref.totals.signups} referred sign-ups, ${ref.totals.paid} paid` : "Referrals unavailable"}
          icon={Gift}
          href="/admin_pro/growth/acquire/referrals"
        />
      </div>

      {todo.length > 0 && (
        <Card title="Needs you" subtitle="The few things that keep acquisition running">
          <ul className="divide-y divide-[var(--a-border)] -my-2">
            {todo.map((t) => (
              <li key={t.text} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span className="font-dm text-[14px] text-[var(--a-ink)]">{t.text}</span>
                <Button href={t.href} size="sm">{t.action}</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-syne text-[17px] font-bold text-[var(--a-ink)]">Lead magnets</h2>
              <Link href="/admin_pro/growth/acquire/magnets" className="font-dm text-[13px] font-semibold text-[var(--a-blue)] hover:underline">All magnets</Link>
            </div>
            <DataTable
              columns={magCols}
              rows={magRows.slice(0, 8)}
              rowKey={(r) => r.id}
              caption="Lead magnets"
              empty={<EmptyState icon={Magnet} title="No lead magnets yet" body="A checklist, guide or scorecard people trade their email for. AI drafts it from your brand and a product." action={<Button href="/admin_pro/growth/acquire/magnets?new=1" variant="primary" icon={Plus}>Create the first one</Button>} />}
            />
          </section>
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-syne text-[17px] font-bold text-[var(--a-ink)]">Landing pages</h2>
              <Link href="/admin_pro/growth/acquire/pages" className="font-dm text-[13px] font-semibold text-[var(--a-blue)] hover:underline">All pages</Link>
            </div>
            <DataTable
              columns={pageCols}
              rows={pageRows.slice(0, 8)}
              rowKey={(r) => r.id}
              caption="Landing pages"
              empty={<EmptyState icon={LayoutTemplate} title="No landing pages yet" body="Turn a content kit into a campaign page with a lead form in one click." action={<Button href="/admin_pro/growth/acquire/pages?new=1" variant="primary" icon={Plus}>Create a landing page</Button>} />}
            />
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Referrals" icon={Gift} action={<Button href="/admin_pro/growth/acquire/referrals" size="sm" variant="ghost">Open</Button>}>
            {ref ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 font-dm">
                {[
                  ["Personal links", ref.totals.links],
                  ["Shares", ref.totals.shares],
                  ["Link visits", ref.totals.visits],
                  ["Sign-ups", ref.totals.signups],
                  ["Paid", ref.totals.paid],
                  ["Rewards pending", ref.totals.pending],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-[12px] text-[var(--a-ink-3)]">{k}</dt>
                    <dd className="text-[20px] font-bold tabular-nums text-[var(--a-ink)]">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="font-dm text-sm text-[var(--a-ink-3)]">Referral data is unavailable right now.</p>
            )}
          </Card>
          <Card title="Latest sign-ups" icon={Inbox} padded={false}>
            {recent.length ? (
              <ul className="divide-y divide-[var(--a-border)]">
                {recent.map((c) => (
                  <li key={c.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{c.name || c.email}</span>
                      <span className="shrink-0 font-dm text-[12px] text-[var(--a-ink-3)]">{ago(c.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate font-dm text-[12.5px] text-[var(--a-ink-3)]">
                      {c.refType === "magnet" ? "Magnet" : "Page"} /{c.slug}
                      {c.score !== null ? ` · score ${c.score}` : ""}
                      {c.leadId ? (
                        <>
                          {" · "}
                          <Link href="/admin_pro/growth/leads" className="text-[var(--a-blue)] hover:underline">in Leads</Link>
                        </>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon={Inbox} title="No sign-ups yet" body="They appear here the moment someone opts in." />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
