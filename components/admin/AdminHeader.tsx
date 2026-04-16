"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/appointments": "Appointments",
  "/admin/prospects": "Prospects",
  "/admin/scanner-leads": "Scanner Leads",
  "/admin/tools": "Tool Analytics",
  "/admin/revenue": "Revenue",
  "/admin/settings": "Settings",
  "/admin/content": "Content Manager",
  "/admin/command-center": "Command Center",
  "/admin/command-center/kanban": "Command Center — Kanban",
  "/admin/command-center/timeline": "Command Center — Timeline",
  "/admin/command-center/list": "Command Center — All Projects",
  "/admin/command-center/sync": "Command Center — Sync",
};

export default function AdminHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const pageTitle = pageTitles[pathname] ?? "Admin";

  return (
    <header className="bg-white border-b border-[#D2DCE8] px-6 py-4 flex items-center justify-between shrink-0">
      {/* Left: Page title */}
      <h1 className="font-syne font-bold text-[#0D1B2A] text-lg leading-tight">
        {pageTitle}
      </h1>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/appointments"
          className="btn-primary px-4 py-2 text-sm"
        >
          + New Appointment
        </Link>

        {session?.user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2251A3] flex items-center justify-center text-white text-xs font-semibold font-dm">
              {session.user.name
                ? session.user.name.charAt(0).toUpperCase()
                : "A"}
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
