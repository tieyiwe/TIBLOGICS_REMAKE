import { Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getT } from "@/lib/i18n/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Dictionary keys under site.footer.svc.*
const services = ["ai", "automation", "strategy", "web", "security", "data", "mobile", "training"];

const products = [
  { label: "InStory School", href: "#" },
  { label: "CareFlow AI", href: "#" },
  { label: "ShipFrica", href: "#" },
  { label: "AI Academy", href: "#" },
  { label: "RoofGuard", href: "#" },
  { label: "Tibintel", href: "https://tibintel.com" },
  { label: "Goal Tester", href: "#" },
  { label: "AI Central", href: "#" },
];

// Dictionary keys under site.footer.*
const company = [
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "events", href: "/events" },
  { key: "tools", href: "/tools" },
  { key: "book", href: "/book" },
  { key: "contact", href: "/contact" },
];

export default async function Footer() {
  const t = await getT();
  return (
    <footer className="bg-[#1B3A6B] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="mb-3">
              <Image src="/footer-logo-light.png" alt="TIBLOGICS" width={192} height={96} className="h-24 w-auto" />
            </div>
            <p className="text-[#9DB9D6] text-sm font-dm leading-relaxed mb-4">
              {t("site.footer.tagline")}
            </p>
            <a
              href="mailto:info@tiblogics.com"
              className="inline-flex items-center gap-2 text-[#F9A738] hover:text-[#FEF0E3] text-sm font-dm font-medium transition-colors"
            >
              <Mail size={14} />
              info@tiblogics.com
            </a>
            <div className="mt-5">
              <LanguageSwitcher tone="dark" />
            </div>
          </div>

          {/* Services */}
          <div>
            <h2 className="font-syne font-700 text-sm uppercase tracking-wider text-[#E8EFF8] mb-4">
              {t("site.footer.services")}
            </h2>
            <ul className="space-y-2">
              {services.map((s) => (
                <li key={s}>
                  <Link
                    href="/services"
                    className="text-[#9DB9D6] hover:text-white text-sm font-dm transition-colors"
                  >
                    {t(`site.footer.svc.${s}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Startups & Products */}
          <div>
            <h2 className="font-syne font-700 text-sm uppercase tracking-wider text-[#E8EFF8] mb-4">
              {t("site.footer.products")}
            </h2>
            <ul className="space-y-2">
              {products.map((p) => (
                <li key={p.label}>
                  <Link
                    href={p.href}
                    className="text-[#9DB9D6] hover:text-white text-sm font-dm transition-colors"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h2 className="font-syne font-700 text-sm uppercase tracking-wider text-[#E8EFF8] mb-4">
              {t("site.footer.company")}
            </h2>
            <ul className="space-y-2">
              {company.map((c) => (
                <li key={c.key}>
                  <Link
                    href={c.href}
                    className="text-[#9DB9D6] hover:text-white text-sm font-dm transition-colors"
                  >
                    {t(`site.footer.${c.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#2251A3]/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[#9DB9D6] text-xs font-dm text-center sm:text-left">
            {t("site.footer.rights", { year: 2026 })}
          </p>
          <nav aria-label={t("site.footer.legal")} className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/privacy" className="text-[#9DB9D6] hover:text-white text-xs font-dm transition-colors">
              {t("site.footer.privacy")}
            </Link>
            <Link href="/terms" className="text-[#9DB9D6] hover:text-white text-xs font-dm transition-colors">
              {t("site.footer.terms")}
            </Link>
            <Link href="/accessibility" className="text-[#9DB9D6] hover:text-white text-xs font-dm transition-colors">
              {t("a11y.page.footerLink")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
