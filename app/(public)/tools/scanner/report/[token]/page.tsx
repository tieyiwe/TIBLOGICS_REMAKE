import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import stripe from "@/lib/stripe";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { leadByToken } from "@/lib/scanner/lead";
import { isScannerStaff } from "@/lib/scanner/staff";
import { buildView, readExtra } from "@/lib/scanner/view";
import { cardUrl } from "@/lib/seo/og-card";
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
  // Shared reports advertise the scanner: "acme.com scored 72/100. Scan
  // yours free." Only the site and its overall score; never the findings.
  // A report bought but not paid yet shows no score anywhere.
  const held = !!(lead && readExtra(lead.extra)?.held && !lead.unlockedAt);
  const fr = (await getLocale()) === "fr";
  const site = lead?.domain ?? "";
  const image = cardUrl(
    lead && !held && site
      ? {
          title: fr ? `${site} a obtenu ${lead.overallScore}/100` : `${site} scored ${lead.overallScore}/100`,
          description: fr ? "Référencement, vitesse, sécurité, maturité IA et prospects. Et votre site ?" : "SEO, speed, security, AI readiness and lead capture. How does your site compare?",
          stat: String(lead.overallScore),
          statLabel: fr ? "sur 100" : "out of 100",
          chips: fr ? ["Gratuit", "30 secondes", "Sans inscription"] : ["Free", "30 seconds", "No sign-up"],
          cta: fr ? "Analyser mon site →" : "Scan your site free →",
          kicker: fr ? "Analyse de site" : "Website scan",
        }
      : {
          title: fr ? "Quelle note pour votre site ?" : "How does your website score?",
          description: fr ? "Analyse gratuite en 30 secondes." : "Free website scan in 30 seconds.",
          stat: "?/100",
          cta: fr ? "Analyser mon site →" : "Scan my site →",
          kicker: fr ? "Analyse de site" : "Website scan",
        },
  );
  const socialTitle = lead && !held && site ? (fr ? `${site} a obtenu ${lead.overallScore}/100 à l'analyse TIBLOGICS` : `${site} scored ${lead.overallScore}/100 on the TIBLOGICS scan`) : t("tools.sr.pdf.title");
  const socialDescription = fr ? "Analysez votre site gratuitement en 30 secondes." : "Scan your own site free in 30 seconds.";
  return {
    title: lead ? t("tools.sr.page.title", { domain: lead.domain ?? "" }) : t("tools.sr.pdf.title"),
    robots: { index: false, follow: false },
    openGraph: { title: socialTitle, description: socialDescription, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: socialTitle, description: socialDescription, images: [image] },
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
