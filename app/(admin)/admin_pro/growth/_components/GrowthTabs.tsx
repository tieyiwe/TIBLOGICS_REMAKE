"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Section nav shared by every Growth page (content side and leads/outreach).
const TABS = [
  { href: "/admin_pro/growth", label: "Hub" },
  { href: "/admin_pro/growth/content", label: "Content kits" },
  { href: "/admin_pro/growth/calendar", label: "Calendar" },
  { href: "/admin_pro/growth/links", label: "Links & attribution" },
  { href: "/admin_pro/growth/leads", label: "Leads" },
  { href: "/admin_pro/growth/outreach", label: "Outreach" },
  { href: "/admin_pro/growth/settings", label: "Brand & audiences" },
];

export default function GrowthTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Growth sections" className="-mx-1 overflow-x-auto">
      <ul className="flex gap-1 px-1 min-w-max">
        {TABS.map((t) => {
          const active = t.href === "/admin_pro/growth" ? pathname === t.href : pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`inline-block rounded-full px-3 py-1.5 font-dm text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? "bg-[#1B3A6B] text-white" : "bg-white border border-[#D2DCE8] text-[#3A4A5C] hover:bg-[#F4F7FB]"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
