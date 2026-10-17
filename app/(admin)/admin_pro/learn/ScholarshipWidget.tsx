import Link from "next/link";
import { Award } from "lucide-react";
import prisma from "@/lib/prisma";
import { Card } from "@/components/admin/ui";
import { scholarshipTablesReady } from "@/lib/learn/scholarship/db";

// The Tilo Vision Scholarship at a glance on the AI Academy overview: what
// needs staff (applications, drafts) and the fund (gifts, monthly donors).
export default async function ScholarshipWidget() {
  if (!(await scholarshipTablesReady())) return null;
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const [apps, drafts, scholars, raised, monthly] = await Promise.all([
    prisma.scholarshipApplication.count({ where: { status: "new" } }),
    prisma.scholarship.count({ where: { status: "draft" } }),
    prisma.scholarship.count({ where: { status: "claimed" } }),
    prisma.scholarshipDonation.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { amountCents: true } }),
    prisma.scholarshipDonation.count({ where: { stage: "first", frequency: "monthly", canceledAt: null } }),
  ]).catch(() => [0, 0, 0, { _sum: { amountCents: 0 } }, 0] as const);
  const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  const cell = (k: string, v: string | number, href: string) => (
    <Link href={href} className="rounded-lg border border-[var(--a-border)] px-3 py-2 hover:bg-[var(--a-surface-2)]">
      <p className="font-dm text-[18px] font-bold text-[var(--a-ink)]">{v}</p>
      <p className="font-dm text-[11.5px] text-[var(--a-ink-3)]">{k}</p>
    </Link>
  );
  return (
    <Card
      title="Tilo Vision Scholarship"
      icon={Award}
      action={<Link href="/admin_pro/learn/scholarships" className="font-dm text-[12.5px] font-semibold text-[var(--a-blue)] hover:underline">Open</Link>}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" data-testid="scholarship-widget">
        {cell("New applications", apps, "/admin_pro/learn/scholarships#applications")}
        {cell("Awards to approve", drafts, "/admin_pro/learn/scholarships")}
        {cell("Scholars", scholars, "/admin_pro/learn/scholarships?status=claimed")}
        {cell("Gifts this month", usd(raised._sum.amountCents ?? 0), "/admin_pro/learn/scholarships#donations")}
        {cell("Monthly donors", monthly, "/admin_pro/learn/scholarships#donations")}
      </div>
    </Card>
  );
}
