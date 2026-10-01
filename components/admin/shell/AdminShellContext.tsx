"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { rememberRecent } from "./CommandPalette";

export type NotifType = "appointment" | "contact" | "service_request" | "partnership" | "waitlist";
export type NotifItem = { id: string; type: NotifType; title: string; subtitle: string; href: string; createdAt: string };

type ShellState = {
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  notifications: NotifItem[];
  /** Cheap nav badges derived from the notifications feed (pending, last 7 days). */
  counts: { appointments: number; serviceRequests: number };
};

const COLLAPSE_KEY = "tib.admin.sidebarCollapsed";

const Ctx = createContext<ShellState | null>(null);

export function useAdminShell(): ShellState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdminShell must be used inside <AdminShellProvider>");
  return v;
}

export function AdminShellProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {}
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  // One poll of the existing notifications feed serves the bell and the nav badges.
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/notifications");
        if (res.ok && alive) {
          const data = await res.json();
          setNotifications(data.items ?? []);
        }
      } catch {}
    }
    load();
    const t = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // Recent pages for the command palette.
  const pathname = usePathname();
  useEffect(() => {
    if (pathname && pathname.startsWith("/admin_pro")) rememberRecent(pathname);
  }, [pathname]);

  // Global Cmd/Ctrl+K.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = useMemo(
    () => ({
      appointments: notifications.filter((n) => n.type === "appointment").length,
      serviceRequests: notifications.filter((n) => n.type === "service_request").length,
    }),
    [notifications],
  );

  const value = useMemo<ShellState>(
    () => ({
      collapsed,
      toggleCollapsed,
      mobileNavOpen,
      setMobileNavOpen,
      paletteOpen,
      setPaletteOpen,
      notifications,
      counts,
    }),
    [collapsed, toggleCollapsed, mobileNavOpen, paletteOpen, notifications, counts],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
