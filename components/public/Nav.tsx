"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";

const NEW_LOGO = "/logo.png";

// `key` is the dictionary key (site.nav.*); labels are looked up at render.
const navLinks = [
  { key: "services", href: "/services" },
  { key: "products", href: "/products" },
  { key: "tools", href: "/tools" },
  { key: "aiTimes", href: "/ai-times" },
  { key: "events", href: "/events" },
  { key: "learningBox", href: "/learning-box" },
  { key: "store", href: "/store" },
  { key: "about", href: "/about" },
];

export default function Nav() {
  const pathname = usePathname();
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // The open drawer is a modal dialog: focus stays inside, Escape closes it,
  // and focus returns to the menu button.
  const drawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(drawerRef, mobileOpen);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white",
          scrolled
            ? "border-b border-[#D2DCE8] shadow-sm"
            : "border-b border-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between min-h-[5.5rem] sm:min-h-[7.5rem] py-0 sm:py-2">
            <Link href="/" className="flex items-center flex-shrink-0" aria-label={t("site.nav.home")}>
              <img src={NEW_LOGO} alt="TIBLOGICS" className="h-[5.5rem] sm:h-[7.5rem] w-auto" />
            </Link>

            {/* Desktop Nav */}
            {/* Gaps tighten below xl: French and Swahili labels run 20-40%
                longer than English, and the row must not overflow at 1024px. */}
            <nav aria-label={t("site.nav.main")} className="hidden lg:flex flex-1 min-w-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 2xl:gap-x-6 px-2">
              {navLinks.map((link) => {
                const label = t(`site.nav.${link.key}`);
                const isAITimes = link.key === "aiTimes";
                if (isAITimes) {
                  return (
                    <Link
                      key={link.key}
                      href={link.href}
                      className={cn(
                        "whitespace-nowrap font-dm font-semibold text-sm px-3 py-1.5 rounded-full transition-all duration-200",
                        "bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600 text-white shadow-sm hover:from-emerald-700 hover:to-teal-700",
                        isActive(link.href) && "ring-2 ring-[#F47C20] ring-offset-1"
                      )}
                    >
                      {label}
                    </Link>
                  );
                }
                return (
                  <Link
                    key={link.key}
                    href={link.href}
                    className={cn(
                      "whitespace-nowrap font-dm font-medium text-sm transition-colors duration-200",
                      isActive(link.href)
                        ? "text-[#1B3A6B] font-semibold"
                        : "text-[#3A4A5C] hover:text-[#1B3A6B]"
                    )}
                  >
                    {label}
                    {isActive(link.href) && (
                      <span className="block h-0.5 bg-[#F47C20] rounded-full mt-0.5" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop CTA — single button so the nav links have room to
                breathe. Tibo is still one click away from the floating
                launcher on every page, and from the Tibo tab in the mobile
                bottom bar. */}
            {/* The language picker sits above the button rather than beside
                it, so it costs the link row no width. */}
            <div className="hidden lg:flex flex-shrink-0 flex-col items-end gap-1.5">
              <LanguageSwitcher />
              <Link href="/book" className="btn-primary whitespace-nowrap text-sm py-2 px-4">
                {t("site.nav.cta")}
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg text-[#1B3A6B] hover:bg-[#EBF0FA] transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label={t("site.nav.openMenu")}
              aria-expanded={mobileOpen}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-all duration-300",
          mobileOpen ? "pointer-events-auto visible" : "pointer-events-none invisible"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />

        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("site.nav.main")}
          className={cn(
            "absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col",
            mobileOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between gap-3 p-4 border-b border-[#D2DCE8]">
            {/* The language picker sits at the top of the drawer so it is
                reachable on phones without scrolling the link list. */}
            <LanguageSwitcher />
            <button
              onClick={() => setMobileOpen(false)}
              aria-label={t("site.nav.closeMenu")}
              className="p-2 rounded-lg hover:bg-[#F4F7FB] transition-colors"
            >
              <X size={20} className="text-[#3A4A5C]" />
            </button>
          </div>

          <nav aria-label={t("site.nav.main")} className="p-4 flex flex-col gap-1 flex-1 overflow-y-auto">
            {navLinks.map((link) => {
              const label = t(`site.nav.${link.key}`);
              const isAITimes = link.key === "aiTimes";
              if (isAITimes) {
                return (
                  <Link
                    key={link.key}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center px-3 py-3 rounded-xl font-dm font-semibold transition-all",
                      "bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600 text-white",
                      isActive(link.href) && "ring-2 ring-[#F47C20] ring-offset-1"
                    )}
                  >
                    {label}
                  </Link>
                );
              }
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-3 rounded-xl font-dm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-[#EBF0FA] text-[#1B3A6B] font-semibold border-l-2 border-[#F47C20]"
                      : "text-[#3A4A5C] hover:bg-[#F4F7FB] hover:text-[#1B3A6B]"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[#D2DCE8] flex flex-col gap-3">
            {/* Tibo is omitted here too: the mobile bottom bar already has a
                dedicated Tibo tab, so repeating it in the drawer was
                duplicate navigation. */}
            <Link
              href="/book"
              onClick={() => setMobileOpen(false)}
              className="btn-primary justify-center text-sm"
            >
              {t("site.nav.ctaMobile")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
