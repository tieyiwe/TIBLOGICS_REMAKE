"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader, type Crumb } from "@/components/admin/ui";

const TABS = [
  { href: "/admin_pro/command-center/finance", label: "Dashboard" },
  { href: "/admin_pro/command-center/finance/income", label: "Income" },
  { href: "/admin_pro/command-center/finance/expenses", label: "Expenses" },
  { href: "/admin_pro/command-center/finance/budgets", label: "Budgets" },
  { href: "/admin_pro/command-center/finance/reports", label: "Reports & taxes" },
];

/** Header and section tabs for every Finance page. */
export function FinanceShell({ title, subtitle, actions, children, breadcrumb }: { title: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; breadcrumb?: Crumb[] }) {
  const pathname = usePathname() ?? "";
  const active = [...TABS].reverse().find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.href;
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumb={breadcrumb ?? [{ label: "Command Center", href: "/admin_pro/command-center" }, { label: "Finance" }]}
        actions={actions}
        tabs={TABS.map((t) => ({ ...t, id: t.href }))}
        activeTab={active}
      />
      {children}
    </div>
  );
}
