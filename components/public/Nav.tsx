import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const NEW_LOGO = "/new-logo.png";

const navLinks = [
  { label: "Services", href: "/services" },
  { label: "Startups & Products", href: "/products" },
  { label: "Try Smart Tools", href: "/tools" },
  { label: "AI TIMES", href: "/blog" },
  { label: "About", href: "/about" },
];

function openTibo() {
  window.dispatchEvent(new CustomEvent("tibo:open"));
}

export default function Nav() {
  const pathname = usePathname();
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
          <div className="flex items-center justify-between h-20 sm:h-[120px]">
            <Link href="/" className="flex items-center flex-shrink-0">
              <img src={NEW_LOGO} alt="TIBLOGICS" className="h-10 sm:h-14 w-auto" />
            </Link>

            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <img src="/logo.svg" alt="TIBLOGICS" className="h-10 sm:h-14 w-auto" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "font-dm font-medium text-sm transition-colors duration-200",
                    isActive(link.href)
                      ? "text-[#1B3A6B] font-semibold"
                      : "text-[#3A4A5C] hover:text-[#1B3A6B]"
                  )}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="block h-0.5 bg-[#F47C20] rounded-full mt-0.5" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              <button onClick={openTibo} className="btn-primary text-sm py-2 px-4">
                Talk to Tibo ↗
              </button>
              <Link href="/book" className="btn-secondary text-sm py-2 px-4">
                Book a Meeting
              </Link>
              <Link
                href="/admin/login"
                className="flex items-center gap-1 text-xs text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors py-2 px-2"
                title="Admin"
              >
                <Lock size={13} />
                <span>Admin</span>
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
        <div
          className={cn(
            "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />

        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col",
            mobileOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-[#D2DCE8]">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <img src="/logo.svg" alt="TIBLOGICS" className="h-9 w-auto" />
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg hover:bg-[#F4F7FB] transition-colors"
            >
              <X size={20} className="text-[#3A4A5C]" />
            </button>
          </div>

          <nav className="p-4 flex flex-col gap-1 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center px-3 py-3 rounded-xl font-dm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-[#EBF0FA] text-[#1B3A6B] font-semibold border-l-2 border-[#F47C20]"
                    : "text-[#3A4A5C] hover:bg-[#F4F7FB] hover:text-[#1B3A6B]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-[#D2DCE8] flex flex-col gap-3">
            <button
              onClick={() => { setMobileOpen(false); openTibo(); }}
              className="btn-primary justify-center text-sm"
            >
              Talk to Tibo ↗
            </button>
            <Link
              href="/book"
              onClick={() => setMobileOpen(false)}
              className="btn-secondary justify-center text-sm"
            >
              Book a Meeting
            </Link>
            <Link
              href="/admin/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-1.5 text-xs text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors py-1"
            >
              <Lock size={12} />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
