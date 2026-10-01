import { FileText, DollarSign, BadgeCheck, AlertTriangle } from "lucide-react";
import { Badge, DataTable, EmptyState, Notice, PageHeader, StatCard, type BadgeTone } from "@/components/admin/ui";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import { ensureBlueprintTables } from "@/lib/blueprint/db";
import { blueprintPrice, formatMoney } from "@/lib/blueprint/config";
import BlueprintActions from "./BlueprintActions";

// Paid Automation Blueprints: who bought one, whether it was written, and
// whether its credit has been applied to a build. Private links are not shown
// (only their hashes are stored); the customer can request a new one.
export const dynamic = "force-dynamic";

const STATUS: Record<string, BadgeTone> = {
  ready: "success",
  paid: "info",
  generating: "info",
  failed: "danger",
};

const day = (d: Date | null | undefined) =>
  d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

export default async function BlueprintsAdminPage() {
  await requireAdminPage();
  await ensureBlueprintTables();
  const price = blueprintPrice();
  const [rows, waitlist] = await Promise.all([
    prisma.blueprint.findMany({
      where: { status: { not: "draft" } },
      orderBy: { paidAt: "desc" },
      take: 300,
      select: {
        id: true, company: true, name: true, email: true, status: true, error: true, attempts: true, amountPaid: true,
        paidAt: true, creditCode: true, creditExpiresAt: true, creditUsedAt: true, inputTokens: true, outputTokens: true,
      },
    }),
    prisma.waitlistEntry.count({ where: { product: "automation-blueprint" } }),
  ]);
  const revenue = rows.reduce((n, r) => n + r.amountPaid, 0);
  const now = new Date();

  const failed = rows.filter((r) => r.status === "failed").length;
  type Row = (typeof rows)[number];

  return (
    <div className="space-y-6">
      <PageHeader title="Automation Blueprints" subtitle="One-time written plans, credited against a build." className="mb-0" />
      {!price && (
        <Notice tone="warn" title="Not on sale">
          Set <code>BLUEPRINT_PRICE_CENTS</code> (for example <code>29900</code> for $299) in Replit Secrets and republish.
          Waitlist: {waitlist}.
        </Notice>
      )}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Blueprints sold" value={rows.length} icon={FileText} tone="navy" />
        <StatCard label="Revenue" value={formatMoney(revenue)} icon={DollarSign} tone="success" />
        <StatCard label="Credits used on builds" value={rows.filter((r) => r.creditUsedAt).length} icon={BadgeCheck} tone="orange" />
        <StatCard label="Need attention" value={failed} icon={AlertTriangle} tone={failed > 0 ? "danger" : "default"} />
      </div>

      <DataTable<Row>
        caption="Blueprints"
        rows={rows}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={FileText} title="No blueprints sold yet" body="Paid blueprints show up here with their status and build credit." />}
        columns={[
          {
            key: "customer",
            header: "Customer",
            primary: true,
            render: (r) => (
              <div className="min-w-0">
                <p className="font-medium text-[var(--a-ink)]">{r.company}</p>
                <p className="text-[12px] text-[var(--a-ink-3)]">
                  {r.name} ·{" "}
                  <a href={`mailto:${r.email}`} className="text-[var(--a-blue)] hover:underline">
                    {r.email}
                  </a>
                </p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <div>
                <Badge tone={STATUS[r.status] ?? "neutral"} dot className="capitalize">
                  {r.status}
                </Badge>
                {r.status === "failed" && (
                  <p className="mt-1 max-w-[240px] text-[12px] text-[var(--a-danger)]">
                    {r.error} (attempt {r.attempts})
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "paid",
            header: "Paid",
            render: (r) => (
              <div className="text-[12.5px] tabular-nums">
                <p className="font-semibold text-[var(--a-ink)]">{formatMoney(r.amountPaid)}</p>
                <p className="text-[var(--a-ink-3)]">{day(r.paidAt)}</p>
              </div>
            ),
          },
          {
            key: "credit",
            header: "Credit",
            render: (r) => (
              <div className="text-[12.5px]">
                <p className="font-mono font-semibold text-[var(--a-ink)]">{r.creditCode}</p>
                <p className="text-[var(--a-ink-3)]">
                  {r.creditUsedAt
                    ? `used ${day(r.creditUsedAt)}`
                    : r.creditExpiresAt && r.creditExpiresAt > now
                      ? `valid to ${day(r.creditExpiresAt)}`
                      : "expired"}
                </p>
              </div>
            ),
          },
          {
            key: "actions",
            header: <span className="sr-only">Actions</span>,
            align: "right",
            render: (r) => <BlueprintActions id={r.id} status={r.status} creditUsed={!!r.creditUsedAt} />,
          },
        ]}
      />
    </div>
  );
}
