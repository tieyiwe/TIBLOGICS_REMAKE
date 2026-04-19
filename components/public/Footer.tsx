import { Mail } from "lucide-react";
import Link from "next/link";

const services = [
  "AI Implementation",
  "Workflow Automation",
  "AI Strategy & Consulting",
  "Web & App Development",
  "Cybersecurity",
  "Data Analytics",
  "Mobile Development",
  "AI Training & Academy",
];

const products = [
  { label: "InStory Method", href: "#" },
  { label: "CareFlow AI", href: "#" },
  { label: "ShipFrica", href: "#" },
  { label: "AI Academy", href: "#" },
  { label: "Goal Tester", href: "#" },
  { label: "AutoIQ", href: "#" },
];

const company = [
  { label: "About Us", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Try Smart Tools", href: "/tools" },
  { label: "Book a Session", href: "/book" },
  { label: "Contact", href: "/contact" },
  { label: "Admin", href: "/admin" },
];

export default function Footer() {
  return (
    <footer className="bg-[#1B3A6B] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="font-syne text-2xl font-800 mb-3">
              <span className="text-white">TIB</span>
              <span className="text-[#F47C20]">LOGICS</span>
            </div>
            <p className="text-[#7A9BBF] text-sm font-dm leading-relaxed mb-4">
              We create the right logics to fulfill your technical needs. AI-first.
              Tech-complete. North America & Francophone Africa.
            </p>
            <a
              href="mailto:ai@tiblogics.com"
              className="inline-flex items-center gap-2 text-[#F47C20] hover:text-[#FEF0E3] text-sm font-dm font-medium transition-colors"
            >
              <Mail size={14} />
              ai@tiblogics.com
            </a>
            <div className="flex items-center gap-2 text-[#7A9BBF] text-sm font-dm mt-2">
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-syne font-700 text-sm uppercase tracking-wider text-[#E8EFF8] mb-4">
              Services
            </h4>
            <ul className="space-y-2">
              {services.map((s) => (
                <li key={s}>
                  <Link
                    href="/services"
                    className="text-[#7A9BBF] hover:text-white text-sm font-dm transition-colors"
                  >
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-syne font-700 text-sm uppercase tracking-wider text-[#E8EFF8] mb-4">
              Products
            </h4>
            <ul className="space-y-2">
              {products.map((p) => (
                <li key={p.label}>
                  <Link
                    href={p.href}
                    className="text-[#7A9BBF] hover:text-white text-sm font-dm transition-colors"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-syne font-700 text-sm uppercase tracking-wider text-[#E8EFF8] mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              {company.map((c) => (
                <li key={c.label}>
                  <Link
                    href={c.href}
                    className="text-[#7A9BBF] hover:text-white text-sm font-dm transition-colors"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#2251A3]/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[#7A9BBF] text-xs font-dm">
            © 2026 TIBLOGICS. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-[#7A9BBF] hover:text-white text-xs font-dm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[#7A9BBF] hover:text-white text-xs font-dm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
