"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Reports each admin page a staff member opens to the Team & Roles footprint
 * (/api/admin/team/pageview, throttled server-side). Renders nothing.
 */
export function StaffPageView() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname?.startsWith("/admin_pro") || pathname.startsWith("/admin_pro/login") || pathname.startsWith("/admin_pro/accept-invite")) return;
    const t = setTimeout(() => {
      fetch("/api/admin/team/pageview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname }),
        keepalive: true,
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [pathname]);
  return null;
}
