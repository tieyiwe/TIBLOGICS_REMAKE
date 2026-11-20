import { Tabs } from "@/components/admin/ui";
import { can, type Viewer } from "@/lib/admin/permissions";

// Section tabs shared by every analytics page. Revenue, Insights and the
// Business report show money: Business analytics ("insights"); the traffic
// pages need Visitor analytics ("analytics").

const TABS: Array<{ href: string; label: string; key: "insights" | "analytics" }> = [
  { href: "/admin_pro/analytics", label: "Insights", key: "insights" },
  { href: "/admin_pro/analytics/acquisition", label: "Acquisition", key: "analytics" },
  { href: "/admin_pro/analytics/funnels", label: "Funnels", key: "analytics" },
  { href: "/admin_pro/analytics/revenue", label: "Revenue", key: "insights" },
  { href: "/admin_pro/analytics/engagement", label: "Engagement", key: "analytics" },
  { href: "/admin_pro/analytics/usage", label: "Feature usage", key: "analytics" },
  { href: "/admin_pro/analytics/visitors", label: "Live", key: "analytics" },
  { href: "/admin_pro/analytics/report", label: "Business report", key: "insights" },
];

export function AnalyticsTabs({ active, viewer, qs = "" }: { active: string; viewer: Viewer; qs?: string }) {
  const items = TABS.filter((t) => can(viewer, t.key)).map((t) => ({
    label: t.label,
    // Keep the date range and filters when moving between sections (not on Live or the report).
    href: t.href,
    id: t.href,
    ...(qs && !t.href.endsWith("/visitors") && !t.href.endsWith("/report") ? { href: `${t.href}${qs}` } : {}),
  }));
  const current = items.find((i) => i.id === active)?.href;
  return (
    <div className="-mx-4 border-b border-[var(--a-border)] px-4 sm:mx-0 sm:px-0">
      <Tabs items={items.map(({ label, href }) => ({ label, href }))} active={current} ariaLabel="Analytics sections" />
    </div>
  );
}
