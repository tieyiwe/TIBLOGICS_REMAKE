"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/**
 * Inbox button for the learner nav: messages from the ARFA team, with the
 * number of unread conversations. The count is fetched (one small query) so
 * the nav needs no new prop, and refreshed on navigation.
 */
export default function InboxBell() {
  const t = useT();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let live = true;
    fetch("/api/learn/inbox/unread", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { unread: 0 }))
      .then((d: { unread?: number }) => {
        if (live) setUnread(Math.max(0, Number(d.unread) || 0));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [pathname]);

  const active = pathname.startsWith("/learn/inbox");
  const label = unread > 0 ? t("inbox.navUnread", { n: unread }) : t("inbox.nav");
  return (
    <Link
      href="/learn/inbox"
      aria-label={label}
      title={label}
      aria-current={active ? "page" : undefined}
      className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
        active ? "bg-[var(--s2)] text-[var(--ink)]" : "text-[var(--ink2)] hover:bg-[var(--s2)] hover:text-[var(--ink)]"
      }`}
    >
      <Bell size={20} aria-hidden />
      {unread > 0 && (
        <span
          aria-hidden
          className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--orange)] px-1 text-[10.5px] font-bold leading-none text-white ring-2 ring-white"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
