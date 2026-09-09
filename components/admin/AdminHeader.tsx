"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Bell, Calendar, Briefcase, Handshake, Users, User } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/admin_pro": "Dashboard",
  "/admin_pro/appointments": "Appointments",
  "/admin_pro/prospects": "Prospects",
  "/admin_pro/scanner-leads": "Scanner Leads",
  "/admin_pro/tools": "Tool Analytics",
  "/admin_pro/revenue": "Revenue",
  "/admin_pro/settings": "Settings",
  "/admin_pro/content": "Content Manager",
  "/admin_pro/command-center": "Command Center",
  "/admin_pro/command-center/kanban": "Command Center — Kanban",
  "/admin_pro/command-center/timeline": "Command Center — Timeline",
  "/admin_pro/command-center/list": "Command Center — All Projects",
  "/admin_pro/command-center/sync": "Command Center — Sync",
  "/admin_pro/partnerships": "Partnerships",
  "/admin_pro/waitlist": "Waitlist",
};

type NotifType = "appointment" | "contact" | "service_request" | "partnership" | "waitlist";

type NotifItem = {
  id: string; type: NotifType; title: string; subtitle: string;
  href: string; createdAt: string;
};

const TYPE_ICON: Record<NotifType, React.ElementType> = {
  appointment: Calendar,
  contact: User,
  service_request: Briefcase,
  partnership: Handshake,
  waitlist: Users,
};

const TYPE_COLOR: Record<NotifType, string> = {
  appointment: "bg-[#EBF0FA] text-[#2251A3]",
  contact: "bg-green-50 text-green-600",
  service_request: "bg-[#FEF0E3] text-[#F47C20]",
  partnership: "bg-purple-50 text-purple-600",
  waitlist: "bg-teal-50 text-teal-600",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [items, setItems] = useState<NotifItem[]>([]);
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageTitle = pageTitles[pathname] ?? "Admin";

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifs() {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } catch {}
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = items.filter(i => !seenIds.has(i.id)).length;

  function openDropdown() {
    setOpen(v => !v);
    if (!open) {
      setSeenIds(new Set(items.map(i => i.id)));
    }
  }

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <header className="bg-white border-b border-[#D2DCE8] px-6 py-4 flex items-center justify-between shrink-0">
      <h1 className="font-syne font-bold text-[#0D1B2A] text-lg leading-tight">{pageTitle}</h1>

      <div className="flex items-center gap-4">
        <Link href="/admin_pro/appointments" className="btn-primary px-4 py-2 text-sm">
          + New Appointment
        </Link>

        {/* Notification bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={openDropdown}
            className="relative w-9 h-9 rounded-xl bg-[#F4F7FB] hover:bg-[#EBF0FA] flex items-center justify-center transition-colors"
            aria-label="Notifications"
          >
            <Bell size={17} className="text-[#3A4A5C]" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F47C20] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-11 w-80 bg-white border border-[#D2DCE8] rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#F4F7FB] flex items-center justify-between">
                <p className="font-syne font-bold text-sm text-[#0D1B2A]">Notifications</p>
                <span className="text-xs font-dm text-[#7A8FA6]">Last 7 days</span>
              </div>

              {items.length === 0 ? (
                <div className="px-4 py-8 text-center font-dm text-sm text-[#7A8FA6]">
                  All clear — no new activity.
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto divide-y divide-[#F4F7FB]">
                  {items.map(item => {
                    const Icon = TYPE_ICON[item.type];
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.href)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#F4F7FB] transition-colors text-left"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${TYPE_COLOR[item.type]}`}>
                          <Icon size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-dm text-sm font-semibold text-[#0D1B2A] truncate">{item.title}</p>
                          <p className="font-dm text-xs text-[#7A8FA6] truncate">{item.subtitle}</p>
                        </div>
                        <span className="font-dm text-xs text-[#7A8FA6] shrink-0 mt-0.5">{timeAgo(item.createdAt)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="px-4 py-3 border-t border-[#F4F7FB] text-center">
                <p className="font-dm text-xs text-[#7A8FA6]">{items.length} item{items.length !== 1 ? "s" : ""} in the last 7 days</p>
              </div>
            </div>
          )}
        </div>

        {session?.user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2251A3] flex items-center justify-center text-white text-xs font-semibold font-dm">
              {session.user.name ? session.user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <span className="text-sm text-[#3A4A5C] font-dm hidden sm:block">
              {session.user.name ?? session.user.email}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
