"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, BookOpen, CalendarDays, MessageCircle } from "lucide-react";

const tabs = [
  { icon: Home,         label: "Home",    href: "/" },
  { icon: Wrench,       label: "Tools",   href: "/tools" },
  { icon: BookOpen,     label: "AI TIMES", href: "/blog" },
  { icon: CalendarDays, label: "Book",    href: "/book" },
];

function openTibo() {
  window.dispatchEvent(new CustomEvent("tibo:open"));
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin_pro")) return null;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 backdrop-blur-md border-t border-[#D2DCE8]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch h-[60px]">
        {tabs.map(({ icon: Icon, label, href }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-dm font-medium transition-all active:scale-95 ${
                active ? "text-[#1B3A6B]" : "text-[#7A8FA6]"
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#F47C20] rounded-full" />
              )}
              <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
              <span className={active ? "font-semibold text-[#1B3A6B]" : ""}>{label}</span>
            </Link>
          );
        })}

        {/* Tibo chat tab */}
        <button
          onClick={openTibo}
          className="relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-dm font-medium text-[#7A8FA6] transition-all active:scale-95"
        >
          <div className="relative">
            <MessageCircle size={21} strokeWidth={1.8} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-white" />
          </div>
          <span>Tibo</span>
        </button>
      </div>
    </nav>
  );
}
