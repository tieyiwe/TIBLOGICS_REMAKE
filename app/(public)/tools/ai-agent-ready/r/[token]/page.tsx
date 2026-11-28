import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import stripe from "@/lib/stripe";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/blueprint/config";
import { isScannerStaff } from "@/lib/scanner/staff";
import { markPaid, scanByToken, viewOf, KIT_RESCANS } from "@/lib/agent-ready/service";
import AgentReport from "@/components/agent-ready/AgentReport";

// One AI Agent Readiness report. The address is the access (like the website
// scanner's reports): not indexed. On the return from Stripe
// (?paid=1&session_id=…) the session is checked here too, so the buyer sees
// what they bought even before the webhook arrives.

type Props = { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await scanByToken((await params).token);
  const t = translatorFor(await getLocale());
  return {
    title: row ? t("tools.agent.r.title", { host: row.host }) : t("tools.agent.name"),
    robots: { index: false, follow: false },
  };
}

export default async function AgentReportPage({ params, searchParams }: Props) {
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  let row = await scanByToken(token);
  if (!row) notFound();

  const sessionId = typeof sp.session_id === "string" ? sp.session_id : null;
  if (sessionId && row.tier !== "kit" && /^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId) && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      // markPaid checks the session belongs to this scan.
      if (session.metadata?.scanId === row.id && (await markPaid(session))) row = (await scanByToken(token)) ?? row;
    } catch (err) {
      console.error("[agent-ready/report] session check", err instanceof Error ? err.message : err);
    }
  }

  const locale = await getLocale();
  const t = translatorFor(locale);
  const view = viewOf(row, await isScannerStaff());
  const money = (c: number | null) => (c ? formatMoney(c, locale) : null);

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-20 pt-32 sm:pt-44">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href="/tools/ai-agent-ready" className="mb-4 inline-flex items-center gap-1.5 font-dm text-sm text-[#2251A3] hover:underline">
          <ArrowLeft size={15} aria-hidden /> {t("tools.agent.r.back")}
        </Link>
        <h1 className="mb-6 break-words font-syne text-2xl font-extrabold text-[#0D1B2A] sm:text-4xl">{t("tools.agent.r.title", { host: view.host })}</h1>
        <AgentReport
          initial={view}
          prices={{ report: money(view.prices.report), kit: money(view.prices.kit) }}
          rescansTotal={KIT_RESCANS}
          paidReturn={sp.paid === "1"}
          canceled={sp.canceled === "1"}
        />
      </div>
    </div>
  );
}
