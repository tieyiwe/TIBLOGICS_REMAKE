"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  Rocket,
  BarChart2,
  Columns,
  GanttChartSquare,
  List,
  RefreshCw,
  Calendar,
  Users,
  Search,
  DollarSign,
  Settings,
  FileEdit,
  LogOut,
  Menu,
  X,
  BookOpen,
  Bot,
  Mail,
  Briefcase,
  Sparkles,
} from "lucide-react";

interface NavSubItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  subItems?: NavSubItem[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    label: "Command Center",
    href: "/admin/command-center",
    icon: Rocket,
    subItems: [
      { label: "Overview", href: "/admin/command-center", icon: BarChart2 },
      { label: "Kanban", href: "/admin/command-center/kanban", icon: Columns },
      {
        label: "Timeline",
        href: "/admin/command-center/timeline",
        icon: GanttChartSquare,
      },
      {
        label: "All Projects",
        href: "/admin/command-center/list",
        icon: List,
      },
      { label: "Sync", href: "/admin/command-center/sync", icon: RefreshCw },
    ],
  },
  {
    label: "Appointments",
    href: "/admin/appointments",
    icon: Calendar,
    subItems: [
      { label: "All Appointments", href: "/admin/appointments", icon: Calendar },
      { label: "Availability", href: "/admin/appointments/availability", icon: Settings },
    ],
  },
  { label: "Contacts", href: "/admin/contacts", icon: Users },
  { label: "Prospects", href: "/admin/prospects", icon: Users },
  { label: "Scanner Leads", href: "/admin/scanner-leads", icon: Search },
  { label: "Tool Analytics", href: "/admin/tools", icon: BarChart2 },
  { label: "Revenue", href: "/admin/revenue", icon: DollarSign },
  {
    label: "Blog",
    href: "/admin/blog",
    icon: BookOpen,
    subItems: [
      { label: "All Posts", href: "/admin/blog", icon: FileEdit },
      { label: "News Agent", href: "/admin/blog/news-agent", icon: Bot },
      { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
    ],
  },
  { label: "Service Requests", href: "/admin/service-requests", icon: Briefcase },
  { label: "Partnerships", href: "/admin/partnerships", icon: Briefcase },
  { label: "Waitlist", href: "/admin/waitlist", icon: Users },
  { label: "Visitor Analytics", href: "/admin/analytics", icon: BarChart2 },
  {
    label: "AI Agents",
    href: "/admin/agents",
    icon: Sparkles,
    subItems: [
      { label: "All Agents", href: "/admin/agents", icon: Sparkles },
      { label: "Aria — Marketing", href: "/admin/agents/aria", icon: Bot },
      { label: "Rex — Sales", href: "/admin/agents/rex", icon: Bot },
      { label: "Nova — Operations", href: "/admin/agents/nova", icon: Bot },
    ],
  },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
}) {
  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname === item.href || pathname.startsWith(item.href + "/");

  const hasSubItems = !!item.subItems;
  const subActive = hasSubItems && pathname.startsWith(item.href + "/");

  const Icon = item.icon;

  return (
    <div>
      <Link
        href={item.href}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-dm font-medium transition-colors cursor-pointer ${
          isActive
            ? "bg-[#2251A3]/40 text-white border-l-2 border-[#F47C20]"
            : "text-white/60 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Icon size={16} />
        {item.label}
      </Link>

      {/* Sub-items when section is active */}
      {hasSubItems && (isActive || subActive) && item.subItems && (
        <div className="ml-4 mt-0.5 flex flex-col gap-0.5">
          {item.subItems.map((sub) => {
            const subIsActive =
              sub.href === "/admin/command-center"
                ? pathname === "/admin/command-center"
                : pathname === sub.href;
            const SubIcon = sub.icon;
            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={onClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-dm font-medium transition-colors cursor-pointer ${
                  subIsActive
                    ? "bg-[#2251A3]/40 text-white border-l-2 border-[#F47C20]"
                    : "text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                <SubIcon size={14} />
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Maps nav hrefs to the permission key required to see them
const NAV_PERMISSION_MAP: Record<string, string> = {
  "/admin/command-center": "command_center",
  "/admin/appointments":   "appointments",
  "/admin/contacts":       "contacts",
  "/admin/prospects":      "prospects",
  "/admin/scanner-leads":  "scanner_leads",
  "/admin/tools":          "tools",
  "/admin/revenue":        "revenue",
  "/admin/blog":           "blog",
  "/admin/newsletter":     "blog",
  "/admin/service-requests": "service_requests",
  "/admin/partnerships":     "service_requests",
  "/admin/waitlist":         "service_requests",
  "/admin/analytics":      "analytics",
  "/admin/agents":         "agents",
  "/admin/settings":       "__admin_only__",
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  const isAdmin = session?.user?.isAdmin ?? false;
  const permissions: string[] = session?.user?.permissions ?? [];

  function canSee(href: string): boolean {
    if (isAdmin || permissions.includes("*")) return true;
    const required = NAV_PERMISSION_MAP[href];
    if (!required) return true; // dashboard and unlisted items always visible
    if (required === "__admin_only__") return false;
    return permissions.includes(required);
  }

  const visibleItems = navItems
    .map(item => ({
      ...item,
      subItems: item.subItems?.filter(s => canSee(s.href)),
    }))
    .filter(item => canSee(item.href));

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center">
          <img src="/footer-logo-transparent.png" alt="TIBLOGICS" className="h-28 w-auto max-w-[220px]" />
        </div>
        {!isAdmin && session?.user && (
          <div className="mt-2 px-1">
            <p className="text-white/60 text-xs font-dm truncate">{session.user.name}</p>
            <span className="text-xs font-dm font-semibold bg-white/10 text-white/70 px-2 py-0.5 rounded-full mt-0.5 inline-block">
              {(session.user as any).role ?? "Collaborator"}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="px-3 py-4 flex flex-col gap-1 flex-1 overflow-y-auto">
        {visibleItems.map((item, idx) => {
          const nextItem = visibleItems[idx + 1];
          const showDivider =
            item.href === "/admin/command-center" && nextItem !== undefined;

          return (
            <div key={item.href}>
              <NavLink
                item={item}
                pathname={pathname}
                onClick={() => setMobileOpen(false)}
              />
              {showDivider && (
                <hr className="border-white/10 my-2" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 p-3 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          ← Back to Site
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-red-300 transition-colors rounded-lg hover:bg-white/5 cursor-pointer"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#1B3A6B] text-white p-2 rounded-lg shadow-lg"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless open, always visible on lg+ */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-[#1B3A6B] z-40 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
