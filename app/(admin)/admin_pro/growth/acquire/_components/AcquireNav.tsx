"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@/components/admin/ui";
import GrowthTabs from "../../_components/GrowthTabs";

// Growth section tabs (with Acquisition) plus the Acquisition sub-sections.
const SUB = [
  { href: "/admin_pro/growth/acquire", label: "Overview" },
  { href: "/admin_pro/growth/acquire/magnets", label: "Lead magnets" },
  { href: "/admin_pro/growth/acquire/pages", label: "Landing pages" },
  { href: "/admin_pro/growth/acquire/referrals", label: "Referrals" },
];

export const ACQUIRE_TAB = { href: "/admin_pro/growth/acquire", label: "Acquisition" };

export default function AcquireNav({ counts }: { counts?: Partial<Record<string, number>> }) {
  const pathname = usePathname() ?? "";
  const active =
    SUB.filter((t) => (t.href === "/admin_pro/growth/acquire" ? pathname === t.href : pathname.startsWith(t.href)))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? "";
  return (
    <div className="space-y-3">
      <GrowthTabs extra={[ACQUIRE_TAB]} />
      <Tabs
        ariaLabel="Acquisition sections"
        active={active}
        items={SUB.map((s) => ({ ...s, count: counts?.[s.href] ?? null }))}
        className="-mb-0"
      />
    </div>
  );
}
