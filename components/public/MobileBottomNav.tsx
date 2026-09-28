"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, BookOpen, CalendarDays, MessageCircle } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// `key` is the dictionary key under site.tabs.*
const tabs = [
  { icon: Home,         key: "home",    href: "/" },
  { icon: Wrench,       key: "tools",   href: "/tools" },
  { icon: BookOpen,     key: "aiTimes", href: "/ai-times" },
  { icon: CalendarDays, key: "book",    href: "/book" },
];

function openTibo() {
  window.dispatchEvent(new CustomEvent("tibo:open"));
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const t = useT();
  if (pathname?.startsWith("/admin_pro")) return null;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      aria-label={t("site.tabs.label")}
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 backdrop-blur-md border-t border-[#D2DCE8]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch h-[60px]">
        {tabs.map(({ icon: Icon, key, href }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 px-0.5 text-[11px] leading-tight font-dm font-medium transition-all active:scale-95 ${
                active ? "text-[#1B3A6B]" : "text-[#5A6E85]"
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#F47C20] rounded-full" />
              )}
              <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`max-w-full truncate ${active ? "font-semibold text-[#1B3A6B]" : ""}`}>{t(`site.tabs.${key}`)}</span>
            </Link>
          );
        })}

        {/* Tibo chat tab */}
        <button
          onClick={openTibo}
          aria-label={t("site.tabs.openTibo")}
          className="relative flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 text-[11px] font-dm font-medium text-[#5A6E85] transition-all active:scale-95"
        >
          <div className="relative">
            <MessageCircle size={21} strokeWidth={1.8} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-white" />
          </div>
          <span>{t("site.tabs.tibo")}</span>
        </button>
      </div>
    </nav>
  );
}
