"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@/components/admin/ui";

// Section nav shared by every Growth page (content side and leads/outreach).
const TABS = [
  { href: "/admin_pro/growth", label: "Mission control" },
  { href: "/admin_pro/growth/campaigns", label: "Campaigns" },
  { href: "/admin_pro/growth/content", label: "Content kits" },
  { href: "/admin_pro/growth/calendar", label: "Calendar" },
  { href: "/admin_pro/growth/leads", label: "Leads" },
  { href: "/admin_pro/growth/outreach", label: "Outreach" },
  { href: "/admin_pro/growth/links", label: "Links & attribution" },
  { href: "/admin_pro/growth/settings", label: "Brand" },
];

export default function GrowthTabs({ extra }: { extra?: { href: string; label: string }[] }) {
  const pathname = usePathname() ?? "";
  const items = [...TABS, ...(extra ?? [])];
  const active =
    items
      .filter((t) => (t.href === "/admin_pro/growth" ? pathname === t.href : pathname === t.href || pathname.startsWith(`${t.href}/`)))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? "";
  return (
    <div className="border-b border-[var(--a-border)]">
      <Tabs items={items} active={active} ariaLabel="Growth sections" />
    </div>
  );
}
