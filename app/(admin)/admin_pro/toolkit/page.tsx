import { Wand2, ShieldCheck, Repeat, Cpu } from "lucide-react";
import { Badge, DataTable, EmptyState, Notice, PageHeader, StatCard, type BadgeTone } from "@/components/admin/ui";

const SUB_TONE: Record<string, BadgeTone> = { active: "success", trialing: "info", past_due: "warn", canceled: "neutral" };
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import { ensureToolkitTables } from "@/lib/toolkit/db";
import { toolkitPlans, formatPrice } from "@/lib/toolkit/config";

// Toolkit Live and Compliance Guard subscribers, and what their AI use costs.
export const dynamic = "force-dynamic";

// Claude Opus 5 list prices, USD per million tokens. Used only for the
// estimate on this page; the invoice from Anthropic is the real figure.
const INPUT_PER_M = 5;
const OUTPUT_PER_M = 25;

export default async function ToolkitAdminPage() {
  await requireAdminPage();
  await ensureToolkitTables();
  const plans = toolkitPlans();
  const now = new Date();
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [subs, usage, waitlist] = await Promise.all([
    prisma.toolkitSubscription.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.toolkitRun.groupBy({
      by: ["studentId"],
      where: { createdAt: { gte: month } },
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true },
    }),
    prisma.waitlistEntry.count({ where: { product: "toolkit-live" } }),
  ]);
  const students = await prisma.student.findMany({
    where: { id: { in: subs.map((s) => s.studentId) } },
    select: { id: true, email: true, name: true },
  });
  const who = new Map(students.map((s) => [s.id, s]));
  const use = new Map(usage.map((u) => [u.studentId, u]));

  const live = subs.filter((s) => ["active", "trialing", "past_due"].includes(s.status));
  const mrr = live.reduce((n, s) => n + (plans[s.plan as "toolkit" | "guard"]?.amount ?? 0), 0);
  const inTok = usage.reduce((n, u) => n + (u._sum.inputTokens ?? 0), 0);
  const outTok = usage.reduce((n, u) => n + (u._sum.outputTokens ?? 0), 0);
  const aiCost = (inTok / 1e6) * INPUT_PER_M + (outTok / 1e6) * OUTPUT_PER_M;

  type Sub = (typeof subs)[number];

  return (
    <div className="space-y-6">
      <PageHeader title="Toolkit Live" subtitle="Prompt library and Compliance Guard subscriptions." className="mb-0" />

      {(!plans.toolkit.amount || !plans.guard.amount) && (
        <Notice tone="warn" title="Not fully on sale">
          Set <code>TOOLKIT_PRICE_CENTS</code> and <code>GUARD_PRICE_CENTS</code> in Replit Secrets and republish. A plan
          without a price shows &ldquo;Opening soon&rdquo; and refuses checkout. Waitlist: {waitlist}.
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Toolkit Live subscribers" value={live.filter((s) => s.plan === "toolkit").length} icon={Wand2} tone="orange" />
        <StatCard label="Guard-only subscribers" value={live.filter((s) => s.plan === "guard").length} icon={ShieldCheck} tone="navy" />
        <StatCard label="Est. monthly revenue" value={`$${(mrr / 100).toLocaleString("en-US")}`} icon={Repeat} tone="success" />
        <StatCard label="Est. AI cost this month" value={`$${aiCost.toFixed(2)}`} icon={Cpu} hint="token counts at list price" />
      </div>
      <p className="-mt-3 font-dm text-[12.5px] text-[var(--a-ink-3)]">
        {plans.toolkit.amount ? `Toolkit Live ${formatPrice(plans.toolkit.amount)}` : "Toolkit Live unpriced"} ·{" "}
        {plans.guard.amount ? `Guard ${formatPrice(plans.guard.amount)}` : "Guard unpriced"}
      </p>

      <DataTable<Sub>
        caption="Toolkit subscribers"
        rows={subs}
        rowKey={(s) => s.id}
        empty={<EmptyState icon={Wand2} title="No subscribers yet" body="Toolkit Live and Guard subscribers appear here after checkout." />}
        columns={[
          {
            key: "customer",
            header: "Customer",
            primary: true,
            render: (s) => {
              const person = who.get(s.studentId);
              return (
                <div className="min-w-0">
                  <p className="font-medium text-[var(--a-ink)]">{person?.name ?? "Unknown learner"}</p>
                  <p className="text-[12px] text-[var(--a-ink-3)]">{person?.email}</p>
                </div>
              );
            },
          },
          { key: "plan", header: "Plan", render: (s) => (s.plan === "guard" ? "Compliance Guard" : "Toolkit Live") },
          {
            key: "status",
            header: "Status",
            render: (s) => (
              <Badge tone={SUB_TONE[s.status] ?? "neutral"} dot className="capitalize">
                {s.status.replace("_", " ")}
                {s.cancelAtPeriodEnd ? " (ending)" : ""}
              </Badge>
            ),
          },
          { key: "runs", header: "Runs this month", align: "right", render: (s) => <span className="tabular-nums">{use.get(s.studentId)?._count._all ?? 0}</span> },
          {
            key: "since",
            header: "Since",
            hideOnMobile: true,
            render: (s) => <span className="text-[12.5px] tabular-nums">{s.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>,
          },
        ]}
      />
    </div>
  );
}
