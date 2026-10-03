"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  Briefcase,
  Calendar,
  ChevronDown,
  ExternalLink,
  Handshake,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  User,
  Users,
  ListChecks,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Kbd } from "@/components/admin/ui";
import { activeHref, canSee, flattenNav, visibleSections } from "@/components/admin/shell/nav";
import { useAdminShell, type NotifType } from "@/components/admin/shell/AdminShellContext";
import { CommandPalette, visibleQuickActions } from "@/components/admin/shell/CommandPalette";

const TYPE_ICON: Record<NotifType, React.ElementType> = {
  appointment: Calendar,
  contact: User,
  service_request: Briefcase,
  partnership: Handshake,
  waitlist: Users,
  task: ListChecks,
  finance: Wallet,
};

const TYPE_COLOR: Record<NotifType, string> = {
  appointment: "bg-[var(--a-info-bg)] text-[var(--a-info)]",
  contact: "bg-[var(--a-success-bg)] text-[var(--a-success)]",
  service_request: "bg-[var(--a-orange-bg)] text-[var(--a-orange-text)]",
  partnership: "bg-[#F3EEFD] text-[#6D28D9]",
  waitlist: "bg-[#E6F6F4] text-[#0F766E]",
  task: "bg-[var(--a-info-bg)] text-[var(--a-navy)]",
  finance: "bg-[var(--a-warn-bg)] text-[var(--a-warn)]",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Click-outside + Escape dismissable popover anchored to a trigger. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLElement>("[data-trigger]")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

function MenuPanel({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <div
      role="menu"
      aria-label={label}
      className={cn(
        "a-anim-pop absolute right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[14px] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-pop)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

const menuItemCls =
  "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-dm text-[13.5px] text-[var(--a-ink-2)] hover:bg-[var(--a-surface-2)] hover:text-[var(--a-ink)] focus:bg-[var(--a-surface-2)] focus:outline-none";

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { notifications: items, paletteOpen, setPaletteOpen, setMobileNavOpen } = useAdminShell();

  const viewer = useMemo(
    () => ({
      isAdmin: session?.user?.isAdmin ?? false,
      permissions: (session?.user?.permissions as string[] | undefined) ?? [],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.user?.isAdmin, ((session?.user?.permissions as string[] | undefined) ?? []).join(",")],
  );
  const sections = useMemo(() => visibleSections(viewer), [viewer]);
  const flat = useMemo(() => flattenNav(sections), [sections]);
  const quick = useMemo(() => visibleQuickActions(viewer), [viewer]);

  // Page context: the nav entry this route belongs to, plus its section.
  const cur = activeHref(pathname, flat.map((f) => f.href));
  const curEntry = flat.find((f) => f.href === cur);
  const pageTitle = curEntry ? (curEntry.parent ? curEntry.label.split(": ").pop()! : curEntry.label) : "Admin";
  const crumb = curEntry ? (curEntry.parent ? `${curEntry.section} / ${curEntry.parent}` : curEntry.section) : null;
  const deeper = !!cur && pathname !== cur;

  const bell = usePopover();
  const create = usePopover();
  const profile = usePopover();
  // Seen notification ids persist per browser so the badge only counts new items.
  const SEEN_KEY = "tib.admin.notifSeen";
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      setSeenIds(new Set(JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "[]") as string[]));
    } catch {}
  }, []);
  const unread = items.filter((i) => !seenIds.has(i.id)).length;

  function toggleBell() {
    bell.setOpen(!bell.open);
    if (!bell.open) {
      const next = new Set(items.map((i) => i.id));
      setSeenIds(next);
      try {
        window.localStorage.setItem(SEEN_KEY, JSON.stringify([...next].slice(-200)));
      } catch {}
    }
  }

  function navigate(href: string) {
    bell.setOpen(false);
    router.push(href);
  }

  const name = session?.user?.name ?? session?.user?.email ?? "Admin";
  const role = viewer.isAdmin ? "Admin" : ((session?.user as { role?: string } | undefined)?.role ?? "Collaborator");

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--a-border)] bg-[var(--a-surface)]/95 px-3 backdrop-blur sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--a-radius-control)] text-[var(--a-ink-2)] hover:bg-[var(--a-surface-2)] lg:hidden"
        >
          <Menu size={20} aria-hidden />
        </button>

        <div className="min-w-0 flex-1">
          {crumb ? (
            <p className="hidden truncate font-dm text-[11.5px] font-medium text-[var(--a-ink-3)] sm:block">
              {crumb}
              {deeper ? " / Detail" : ""}
            </p>
          ) : null}
          <p className="truncate font-dm text-[15px] font-semibold text-[var(--a-ink)] sm:text-base">
            {deeper && curEntry ? (
              <Link href={cur!} className="hover:underline">
                {pageTitle}
              </Link>
            ) : (
              pageTitle
            )}
          </p>
        </div>

        {/* Search / command palette */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          aria-label="Search pages and actions"
          aria-keyshortcuts="Control+K Meta+K"
          className="hidden h-9 w-64 items-center gap-2 rounded-[var(--a-radius-control)] border border-[var(--a-border)] bg-[var(--a-surface-2)] px-3 font-dm text-[13px] text-[var(--a-ink-3)] transition-colors hover:border-[var(--a-border-strong)] md:flex xl:w-80"
        >
          <Search size={15} aria-hidden />
          <span className="flex-1 text-left">Search or jump to</span>
          <Kbd>Ctrl K</Kbd>
        </button>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          aria-label="Search pages and actions"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--a-radius-control)] text-[var(--a-ink-2)] hover:bg-[var(--a-surface-2)] md:hidden"
        >
          <Search size={19} aria-hidden />
        </button>

        {/* Create menu */}
        {quick.length > 0 ? (
          <div className="relative" ref={create.ref}>
            <button
              type="button"
              data-trigger
              onClick={() => create.setOpen(!create.open)}
              aria-haspopup="menu"
              aria-expanded={create.open}
              aria-label="Create"
              className="flex h-11 w-11 items-center justify-center gap-1.5 rounded-[var(--a-radius-control)] bg-[var(--a-orange-text)] font-dm text-[13.5px] font-semibold text-white transition-colors hover:bg-[#9c4408] sm:h-9 sm:w-auto sm:px-3.5"
            >
              <Plus size={16} aria-hidden />
              <span className="hidden sm:inline">Create</span>
              <ChevronDown size={14} className="hidden sm:inline" aria-hidden />
            </button>
            {create.open ? (
              <MenuPanel label="Create" className="w-60 py-1.5">
                {quick.map((a) => (
                  <Link key={a.label} role="menuitem" href={a.href} onClick={() => create.setOpen(false)} className={menuItemCls}>
                    <a.icon size={15} className="text-[var(--a-ink-3)]" aria-hidden />
                    {a.label}
                  </Link>
                ))}
              </MenuPanel>
            ) : null}
          </div>
        ) : null}

        {/* Notification bell */}
        <div className="relative" ref={bell.ref}>
          <button
            type="button"
            data-trigger
            onClick={toggleBell}
            aria-haspopup="true"
            aria-expanded={bell.open}
            aria-label={unread > 0 ? `Notifications, ${unread} new` : "Notifications"}
            className="relative flex h-11 w-11 items-center justify-center rounded-[var(--a-radius-control)] text-[var(--a-ink-2)] transition-colors hover:bg-[var(--a-surface-2)] sm:h-9 sm:w-9"
          >
            <Bell size={18} aria-hidden />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--a-orange)] px-1 text-[10px] font-bold text-[#0D1B2A] sm:-right-1 sm:-top-1">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {bell.open && (
            <div className="a-anim-pop fixed left-3 right-3 top-[60px] z-50 overflow-hidden rounded-[14px] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-pop)] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-[360px]">
              <div className="flex items-center justify-between border-b border-[var(--a-border)] px-4 py-3">
                <p className="font-dm text-sm font-semibold text-[var(--a-ink)]">Notifications</p>
                <span className="font-dm text-xs text-[var(--a-ink-3)]">Last 7 days</span>
              </div>

              {items.length === 0 ? (
                <div className="px-4 py-8 text-center font-dm text-sm text-[var(--a-ink-3)]">All clear. No new activity.</div>
              ) : (
                <div className="max-h-96 divide-y divide-[var(--a-border)] overflow-y-auto">
                  {items.map((item) => {
                    const Icon = TYPE_ICON[item.type] ?? Bell;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(item.href)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--a-surface-2)]"
                      >
                        <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", TYPE_COLOR[item.type])}>
                          <Icon size={14} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-dm text-sm font-semibold text-[var(--a-ink)]">{item.title.replace(" — ", ": ")}</p>
                          <p className="truncate font-dm text-xs text-[var(--a-ink-3)]">{item.subtitle}</p>
                        </div>
                        <span className="mt-0.5 shrink-0 font-dm text-xs text-[var(--a-ink-3)]">{timeAgo(item.createdAt)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-[var(--a-border)] px-4 py-2.5 text-center">
                <p className="font-dm text-xs text-[var(--a-ink-3)]">
                  {items.length} item{items.length !== 1 ? "s" : ""} in the last 7 days
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Profile menu */}
        {session?.user ? (
          <div className="relative" ref={profile.ref}>
            <button
              type="button"
              data-trigger
              onClick={() => profile.setOpen(!profile.open)}
              aria-haspopup="menu"
              aria-expanded={profile.open}
              aria-label="Account menu"
              className="flex h-11 items-center gap-2 rounded-[var(--a-radius-control)] px-1 transition-colors hover:bg-[var(--a-surface-2)] sm:h-9 sm:pr-2"
            >
              <Avatar name={name} size={32} />
              <span className="hidden max-w-[140px] truncate font-dm text-[13.5px] font-medium text-[var(--a-ink-2)] xl:block">{name}</span>
              <ChevronDown size={14} className="hidden text-[var(--a-ink-3)] sm:block" aria-hidden />
            </button>
            {profile.open ? (
              <MenuPanel label="Account" className="w-64">
                <div className="border-b border-[var(--a-border)] px-3.5 py-3">
                  <p className="truncate font-dm text-sm font-semibold text-[var(--a-ink)]">{session.user.name ?? "Signed in"}</p>
                  {session.user.email ? <p className="truncate font-dm text-xs text-[var(--a-ink-3)]">{session.user.email}</p> : null}
                  <span className="mt-1.5 inline-block rounded-full bg-[var(--a-surface-2)] px-2 py-0.5 font-dm text-[11px] font-semibold text-[var(--a-ink-2)]">
                    {role}
                  </span>
                </div>
                <div className="py-1.5">
                  <Link role="menuitem" href="/" target="_blank" rel="noopener" onClick={() => profile.setOpen(false)} className={menuItemCls}>
                    <ExternalLink size={15} className="text-[var(--a-ink-3)]" aria-hidden />
                    View website
                  </Link>
                  {canSee("/admin_pro/settings", viewer) ? (
                    <Link role="menuitem" href="/admin_pro/settings" onClick={() => profile.setOpen(false)} className={menuItemCls}>
                      <Settings size={15} className="text-[var(--a-ink-3)]" aria-hidden />
                      Settings
                    </Link>
                  ) : null}
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/admin_pro/login" })}
                    className={cn(menuItemCls, "hover:text-[var(--a-danger)]")}
                  >
                    <LogOut size={15} className="text-[var(--a-ink-3)]" aria-hidden />
                    Sign out
                  </button>
                </div>
              </MenuPanel>
            ) : null}
          </div>
        ) : null}
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} sections={sections} viewer={viewer} />
    </>
  );
}
