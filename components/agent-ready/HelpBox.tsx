"use client";

import Link from "next/link";
import { CalendarCheck, Mail, Wrench } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// "Prefer we do it for you?": on the landing page and every report.

export default function HelpBox() {
  const t = useT();
  return (
    <section className="mt-16 rounded-2xl bg-gradient-to-br from-[#0D1B2A] to-[#1B3A6B] p-6 text-white sm:p-8" data-testid="agent-help">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="flex items-center gap-2 font-syne text-xl font-bold">
            <Wrench size={20} className="text-[#F47C20]" aria-hidden /> {t("tools.agent.help.title")}
          </h2>
          <p className="mt-2 font-dm text-sm text-white/80">{t("tools.agent.help.body")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/book?topic=ai-agent-readiness" data-track="cta-agent-ready-book" className="btn-primary justify-center rounded-xl px-5 py-3">
            <CalendarCheck size={16} aria-hidden /> {t("tools.agent.help.book")}
          </Link>
          <Link href="/contact?topic=ai-agent-readiness" data-track="cta-agent-ready-contact" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-5 py-3 font-dm text-sm font-semibold text-white hover:bg-white/10">
            <Mail size={16} aria-hidden /> {t("tools.agent.help.contact")}
          </Link>
        </div>
      </div>
    </section>
  );
}
