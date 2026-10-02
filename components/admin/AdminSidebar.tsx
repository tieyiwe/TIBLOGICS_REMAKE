"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ExternalLink, LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer } from "@/components/admin/ui";
import { activeHref, flattenNav, visibleSections, type NavItem, type NavSection } from "@/components/admin/shell/nav";
import { useAdminShell } from "@/components/admin/shell/AdminShellContext";

const GROUPS_KEY = "tib.admin.navGroups";

function readGroups(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(GROUPS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function NavRow({
  item,
  current,
  collapsed,
  badge,
  expanded,
  onToggleExpand,
  onNavigate,
}: {
  item: NavItem;
  current: string | null;
  collapsed: boolean;
  badge?: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onNavigate?: () => void;
}) {
  const subs = item.subItems ?? [];
  const hasSubs = subs.length > 1;
  const isSelf = current === item.href;
  const inBranch = isSelf || subs.some((s) => s.href === current);
  const Icon = item.icon;

  return (
    <li>
      <div className="group relative flex items-center">
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={isSelf ? "page" : undefined}
          aria-label={collapsed ? item.label : undefined}
          title={collapsed ? item.label : undefined}
          className={cn(
            "relative flex min-h-[36px] flex-1 items-center gap-3 rounded-[8px] font-dm text-[13.5px] font-medium transition-colors duration-150",
            collapsed ? "justify-center px-0" : "px-2.5",
            inBranch ? "bg-white/[.09] text-white" : "text-white/70 hover:bg-white/[.06] hover:text-white",
          )}
        >
          {inBranch ? (
            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[var(--a-orange)]" aria-hidden />
          ) : null}
          <Icon size={17} className={cn("shrink-0", inBranch ? "text-white" : "text-white/60 group-hover:text-white")} aria-hidden />
          {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
          {badge && badge > 0 ? (
            collapsed ? (
              <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-[var(--a-orange)]" aria-label={`${badge} new`} />
            ) : (
              <span className={cn("rounded-full bg-[var(--a-orange)] px-1.5 text-[11px] font-bold leading-[18px] text-[#0D1B2A] tabular-nums", hasSubs && "mr-7")}>
                {badge > 99 ? "99+" : badge}
              </span>
            )
          ) : null}
        </Link>
        {hasSubs && !collapsed ? (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={expanded}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
            className="absolute right-1 flex h-7 w-7 items-center justify-center rounded-md text-white/50 hover:bg-white/10 hover:text-white"
          >
            <ChevronDown size={14} className={cn("transition-transform duration-150", !expanded && "-rotate-90")} aria-hidden />
          </button>
        ) : null}
      </div>
      {hasSubs && !collapsed && expanded ? (
        <ul className="mb-1 ml-[22px] mt-0.5 flex flex-col gap-0.5 border-l border-white/10 pl-2">
          {subs.map((sub) => {
            const on = current === sub.href;
            return (
              <li key={sub.href}>
                <Link
                  href={sub.href}
                  onClick={onNavigate}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "flex min-h-[32px] items-center rounded-[7px] px-2.5 font-dm text-[13px] transition-colors duration-150",
                    on ? "bg-white/[.09] font-semibold text-white" : "text-white/60 hover:bg-white/[.06] hover:text-white",
                  )}
                >
                  <span className="truncate">{sub.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

function SidebarBody({
  sections,
  collapsed,
  onToggleCollapsed,
  onNavigate,
  mobile,
}: {
  sections: NavSection[];
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { counts } = useAdminShell();
  const isAdmin = session?.user?.isAdmin ?? false;

  const allHrefs = useMemo(() => flattenNav(sections).map((x) => x.href), [sections]);
  const current = activeHref(pathname, allHrefs);

  // Section collapse state (remembered) and per-item manual expansion.
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  useEffect(() => setClosedGroups(readGroups()), []);
  const toggleGroup = (id: string) =>
    setClosedGroups((g) => {
      const next = { ...g, [id]: !g[id] };
      try {
        window.localStorage.setItem(GROUPS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  const badgeFor = (href: string) =>
    href === "/admin_pro/appointments"
      ? counts.appointments
      : href === "/admin_pro/service-requests"
        ? counts.serviceRequests
        : href === "/admin_pro/communications/support" || href === "/admin_pro/communications"
          ? counts.support || undefined
          : undefined;

  return (
    <div className="a-sidebar flex h-full flex-col bg-[var(--a-navy-deep)] text-white">
      {/* Brand */}
      <div className={cn("flex h-16 shrink-0 items-center border-b border-white/[.08]", collapsed ? "justify-center px-2" : "justify-between px-4")}>
        <Link
          href="/admin_pro"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-md transition-opacity hover:opacity-90"
          aria-label="TIBLOGICS admin home"
        >
          {collapsed ? (
            <Image src="/tiblogics-icon.svg" alt="" width={34} height={34} className="h-[34px] w-[34px]" priority />
          ) : (
            <>
              <Image
                src="/footer-logo-light.png"
                alt="TIBLOGICS"
                width={600}
                height={173}
                className="h-9 w-auto"
                priority
              />
              <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-dm text-[10px] font-bold uppercase tracking-[.1em] text-white/70">
                Admin
              </span>
            </>
          )}
        </Link>
        {mobile && onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close navigation"
            className="flex h-11 w-11 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X size={20} aria-hidden />
          </button>
        ) : null}
        {!collapsed && onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-white/50 hover:bg-white/10 hover:text-white"
          >
            <PanelLeftClose size={17} aria-hidden />
          </button>
        ) : null}
      </div>

      {!isAdmin && session?.user && !collapsed ? (
        <div className="border-b border-white/[.08] px-4 py-3">
          <p className="truncate font-dm text-xs text-white/70">{session.user.name}</p>
          <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 font-dm text-xs font-semibold text-white/80">
            {(session.user as { role?: string }).role ?? "Collaborator"}
          </span>
        </div>
      ) : null}

      {/* Navigation */}
      <nav aria-label="Admin" className={cn("a-scroll-thin flex-1 overflow-y-auto py-3", collapsed ? "px-2" : "px-3")}>
        {sections.map((s, idx) => {
          const closed = !collapsed && !mobile && !!closedGroups[s.id] && !s.items.some((i) => i.href === current || i.subItems?.some((x) => x.href === current));
          const single = s.items.length === 1 && s.items[0].label === s.label;
          return (
            <div key={s.id} className={cn(idx > 0 && (collapsed ? "mt-2 border-t border-white/[.08] pt-2" : "mt-4"))}>
              {!collapsed && !single ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(s.id)}
                  aria-expanded={!closed}
                  className="mb-1 flex w-full items-center justify-between rounded-md px-2.5 py-1 text-left font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-white/50 hover:text-white/80"
                >
                  {s.label}
                  <ChevronDown size={12} className={cn("transition-transform duration-150", closed && "-rotate-90")} aria-hidden />
                </button>
              ) : null}
              {!closed ? (
                <ul className="flex flex-col gap-0.5">
                  {s.items.map((item) => {
                    const inBranch = item.href === current || !!item.subItems?.some((x) => x.href === current);
                    const expanded = openItems[item.href] ?? inBranch;
                    return (
                      <NavRow
                        key={item.href}
                        item={item}
                        current={current}
                        collapsed={collapsed}
                        badge={badgeFor(item.href)}
                        expanded={expanded}
                        onToggleExpand={() => setOpenItems((o) => ({ ...o, [item.href]: !expanded }))}
                        onNavigate={onNavigate}
                      />
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={cn("shrink-0 space-y-1 border-t border-white/[.08]", collapsed ? "p-2" : "p-3")}>
        {collapsed && onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="flex h-9 w-full items-center justify-center rounded-[8px] text-white/60 hover:bg-white/10 hover:text-white"
          >
            <PanelLeftOpen size={17} aria-hidden />
          </button>
        ) : null}
        <Link
          href="/"
          onClick={onNavigate}
          aria-label={collapsed ? "View website" : undefined}
          title={collapsed ? "View website" : undefined}
          className={cn(
            "flex h-9 items-center gap-2.5 rounded-[8px] font-dm text-[13px] font-medium text-white/70 hover:bg-white/[.06] hover:text-white",
            collapsed ? "justify-center" : "px-2.5",
          )}
        >
          <ExternalLink size={16} aria-hidden />
          {!collapsed ? "View website" : null}
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/admin_pro/login" })}
          aria-label={collapsed ? "Sign out" : undefined}
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "flex h-9 w-full items-center gap-2.5 rounded-[8px] font-dm text-[13px] font-medium text-white/70 hover:bg-white/[.06] hover:text-[#fca5a5]",
            collapsed ? "justify-center" : "px-2.5",
          )}
        >
          <LogOut size={16} aria-hidden />
          {!collapsed ? "Sign out" : null}
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar() {
  const { data: session } = useSession();
  const { collapsed, toggleCollapsed, mobileNavOpen, setMobileNavOpen } = useAdminShell();
  const viewer = {
    isAdmin: session?.user?.isAdmin ?? false,
    permissions: (session?.user?.permissions as string[] | undefined) ?? [],
  };
  const sections = useMemo(() => visibleSections(viewer), [viewer.isAdmin, viewer.permissions.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  const pathname = usePathname();

  // Close the mobile drawer on navigation.
  useEffect(() => setMobileNavOpen(false), [pathname, setMobileNavOpen]);

  return (
    <>
      <aside
        className="hidden shrink-0 transition-[width] duration-150 lg:block"
        style={{ width: collapsed ? "var(--a-sidebar-w-collapsed)" : "var(--a-sidebar-w)" }}
      >
        <SidebarBody sections={sections} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </aside>
      <Drawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        side="left"
        width="min(300px, 86vw)"
        hideHeader
        ariaLabel="Admin navigation"
        className="bg-[var(--a-navy-deep)] lg:hidden"
      >
        <SidebarBody sections={sections} collapsed={false} mobile onNavigate={() => setMobileNavOpen(false)} />
      </Drawer>
    </>
  );
}
