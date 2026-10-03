import { Radar, Repeat, Clock, Users } from "lucide-react";
import { Badge, DataTable, EmptyState, Notice, PageHeader, StatCard, type BadgeTone } from "@/components/admin/ui";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import { ensureMonitorTables } from "@/lib/monitor/db";
import { monitorPricing, formatMonitorPrice, MONITOR_PRODUCT } from "@/lib/monitor/config";
import { hostOf } from "@/lib/monitor/report";

// Readiness Monitor subscribers. Dashboard links are not shown here: only
// their hashes are stored, and a subscriber who has lost theirs requests a new
// one from the public page.
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, BadgeTone> = {
  active: "success",
  past_due: "warn",
  canceled: "neutral",
  pending: "info",
};

function fmt(d: Date | null) {
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never";
}

export default async function MonitorAdminPage() {
  await requireAdminPage();
  await ensureMonitorTables();
  const pricing = monitorPricing();

  const [subs, waitlist] = await Promise.all([
    prisma.monitorSubscription.findMany({
      // Abandoned checkouts are noise after a day; paid ones always show.
      where: { OR: [{ status: { not: "pending" } }, { createdAt: { gte: new Date(Date.now() - 86_400_000) } }] },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { scans: { where: { isOwn: true }, orderBy: { createdAt: "desc" }, take: 1, select: { overallScore: true, ok: true } } },
    }),
    prisma.waitlistEntry.count({ where: { product: MONITOR_PRODUCT } }),
  ]);

  const active = subs.filter((s) => s.status === "active").length;
  const pastDue = subs.filter((s) => s.status === "past_due").length;

  type Sub = (typeof subs)[number];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Readiness Monitor"
        subtitle="Paid weekly scans of a customer's site against up to three competitors."
        className="mb-0"
      />

      {!pricing && (
        <Notice tone="warn" title="Not on sale">
          <p>
            Set <code>MONITOR_PRICE_CENTS</code> in Replit Secrets (for example{" "}
            <code>9900</code> for $99 a month) and republish to open checkout. Until then the public page collects waitlist
            sign-ups ({waitlist} so far).
          </p>
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active subscribers" value={active} icon={Radar} tone="navy" />
        <StatCard
          label="Est. monthly revenue"
          value={pricing ? `$${((active * pricing.amount) / 100).toLocaleString("en-US")}` : "n/a"}
          hint={pricing ? `${formatMonitorPrice(pricing)}/month each` : "Not on sale"}
          icon={Repeat}
          tone="success"
        />
        <StatCard label="Payment failing" value={pastDue} icon={Clock} tone={pastDue > 0 ? "danger" : "default"} />
        <StatCard label="Waitlist" value={waitlist} icon={Users} />
      </div>
      {pricing && (
        <p className="-mt-3 font-dm text-[12.5px] text-[var(--a-ink-3)]">
          Revenue is active subscribers at today&apos;s price; discounts and promotion codes are only in Stripe.
        </p>
      )}

      <DataTable<Sub>
        caption="Monitor subscribers"
        rows={subs}
        rowKey={(s) => s.id}
        empty={
          <EmptyState
            icon={Radar}
            title="No subscribers yet"
            body={pricing ? "Paid subscribers appear here once checkout completes." : "Open checkout by setting a price, then subscribers appear here."}
          />
        }
        columns={[
          {
            key: "customer",
            header: "Customer",
            primary: true,
            render: (s) => (
              <div className="min-w-0">
                <p className="font-medium text-[var(--a-ink)]">{s.name ?? s.email}</p>
                {s.name && <p className="text-[12px] text-[var(--a-ink-3)]">{s.email}</p>}
                <p className="text-[12px] text-[var(--a-ink-3)]">since {fmt(s.createdAt)}</p>
              </div>
            ),
          },
          { key: "site", header: "Site", render: (s) => <span className="text-[var(--a-ink)]">{hostOf(s.siteUrl)}</span> },
          {
            key: "competitors",
            header: "Competitors",
            hideOnMobile: true,
            render: (s) => <span className="text-[12.5px]">{s.competitors.map(hostOf).join(", ") || "None"}</span>,
          },
          {
            key: "score",
            header: "Score",
            align: "right",
            render: (s) => <span className="font-semibold tabular-nums text-[var(--a-ink)]">{s.scans[0]?.ok ? s.scans[0].overallScore : "n/a"}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (s) => (
              <Badge tone={STATUS_TONE[s.status] ?? "neutral"} dot className="capitalize">
                {s.status.replace("_", " ")}
              </Badge>
            ),
          },
          { key: "last", header: "Last scan", render: (s) => <span className="text-[12.5px] tabular-nums">{fmt(s.lastRunAt)}</span> },
        ]}
      />
    </div>
  );
}
