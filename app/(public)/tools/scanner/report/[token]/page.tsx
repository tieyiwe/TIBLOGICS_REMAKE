import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import stripe from "@/lib/stripe";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { leadByToken } from "@/lib/scanner/lead";
import { isScannerStaff } from "@/lib/scanner/staff";
import { buildView } from "@/lib/scanner/view";
import { markReportPaid } from "@/lib/scanner/unlock";
import ReportView from "@/components/scanner/ReportView";

// One scan's report, by its secret link. Never indexed. Returning from
// Stripe (?paid=1&session_id=…) the session is checked with Stripe here too,
// so the report unlocks even if the webhook is slow.

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lead = await leadByToken((await params).token).catch(() => null);
  const t = translatorFor(await getLocale());
  return {
    title: lead ? t("tools.sr.page.title", { domain: lead.domain ?? "" }) : t("tools.sr.pdf.title"),
    robots: { index: false, follow: false },
  };
}

export default async function ScannerReportPage({ params, searchParams }: Props) {
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  let lead = await leadByToken(token);
  if (!lead) notFound();

  const sessionId = typeof sp.session_id === "string" ? sp.session_id : null;
  if (sessionId && !lead.unlockedAt && /^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId) && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (await markReportPaid(lead.id, session)) lead = (await leadByToken(token)) ?? lead;
    } catch (err) {
      console.error("[scanner/report] session check", err instanceof Error ? err.message : err);
    }
  }

  const locale = await getLocale();
  const t = translatorFor(locale);
  const view = await buildView(lead, t, locale, { staff: await isScannerStaff() });

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-20 pt-32 sm:pt-40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href="/tools/scanner" className="mb-4 inline-flex items-center gap-1.5 font-dm text-sm text-[#2251A3] hover:underline">
          <ArrowLeft size={15} aria-hidden /> {t("tools.sr.page.back")}
        </Link>
        <h1 className="mb-6 font-syne text-3xl font-extrabold text-[#0D1B2A] sm:text-4xl break-words">{t("tools.sr.page.title", { domain: view.domain })}</h1>
        <ReportView initial={view} paidReturn={sp.paid === "1"} canceled={sp.canceled === "1"} />
      </div>
    </div>
  );
}
