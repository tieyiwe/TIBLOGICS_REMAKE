"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Services", href: "/services" },
  { label: "Products", href: "/products" },
  { label: "Try Smart Tools", href: "/tools" },
  { label: "The Smart Room", href: "/blog" },
  { label: "About", href: "/about" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/90 backdrop-blur-[10px] border-b border-[#D2DCE8] shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="font-syne text-xl font-800 tracking-tight">
                <span className="text-[#1B3A6B]">TIB</span>
                <span className="text-[#F47C20]">LOGICS</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[#3A4A5C] hover:text-[#1B3A6B] font-dm font-medium text-sm transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Right Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <button className="text-sm font-dm font-medium text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors">
                EN / FR
              </button>
              <Link
                href="/tools/advisor"
                className="btn-primary text-sm py-2 px-4"
              >
                Talk to Tibo ↗
              </Link>
              <Link
                href="/book"
                className="btn-secondary text-sm py-2 px-4"
              >
                Book a Meeting
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg text-[#1B3A6B] hover:bg-[#EBF0FA] transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
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
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-[#D2DCE8]">
            <span className="font-syne font-800 text-lg">
              <span className="text-[#1B3A6B]">TIB</span>
              <span className="text-[#F47C20]">LOGICS</span>
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg hover:bg-[#F4F7FB] transition-colors"
            >
              <X size={20} className="text-[#3A4A5C]" />
            </button>
          </div>

          <nav className="p-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center px-3 py-3 rounded-xl text-[#3A4A5C] hover:bg-[#F4F7FB] hover:text-[#1B3A6B] font-dm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-[#D2DCE8] flex flex-col gap-3 mt-auto">
            <Link
              href="/tools/advisor"
              onClick={() => setMobileOpen(false)}
              className="btn-primary justify-center text-sm"
            >
              Talk to Tibo ↗
            </Link>
            <Link
              href="/book"
              onClick={() => setMobileOpen(false)}
              className="btn-secondary justify-center text-sm"
            >
              Book a Meeting
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
