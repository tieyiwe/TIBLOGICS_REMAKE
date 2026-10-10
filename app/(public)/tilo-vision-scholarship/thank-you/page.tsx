import type { Metadata } from "next";
import Link from "next/link";
import stripe from "@/lib/stripe";
import { getLocale, getT } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { recordDonation, DONATION_PRODUCT } from "@/lib/learn/scholarship/donations";
import ScholarSeal from "@/components/learn/scholarship/ScholarSeal";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("donate.thanks.metaTitle"), robots: { index: false, follow: false } };
}

// Stripe's success page for a gift. Reads the session back (nothing else is
// trusted from the URL), records the gift if the webhook has not yet, and
// thanks the donor. The thank-you email goes once, whichever comes first.
export default async function DonationThanksPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const [{ session_id: id = "" }, t, locale] = await Promise.all([searchParams, getT(), getLocale()]);
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  let gift: { amountCents: number; frequency: "once" | "monthly"; name: string | null } | null = null;
  if (/^cs_[A-Za-z0-9_]{6,200}$/.test(id) && (await checkRateLimit(`donate-thanks:${ip}`, 30, 60_000))) {
    try {
      const session = await stripe.checkout.sessions.retrieve(id);
      if (session.metadata?.product === DONATION_PRODUCT) gift = await recordDonation(session);
    } catch (err) {
      console.error("[donate/thank-you]", err instanceof Error ? err.message : err);
    }
  }
  const amount = gift
    ? new Intl.NumberFormat(locale, { style: "currency", currency: "USD", minimumFractionDigits: gift.amountCents % 100 ? 2 : 0, maximumFractionDigits: 2 }).format(gift.amountCents / 100)
    : null;
  const first = gift?.name?.trim().split(/\s+/)[0];
  return (
    <div className="bg-[var(--s2)] px-4 pb-20 pt-28 sm:pt-36">
      <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-[var(--border)] bg-white text-center shadow-sm" data-testid="donate-thanks">
        <div className="flex flex-col items-center bg-gradient-to-br from-[#1B2A5E] to-[#27407F] px-6 py-8 text-white">
          <ScholarSeal size={72} />
          <h1 className="mt-4 text-2xl font-black">{first ? t("donate.thanks.titleName", { name: first }) : t("donate.thanks.title")}</h1>
        </div>
        <div className="space-y-3 p-7">
          {amount ? (
            <p className="text-base font-semibold text-[var(--ink)]">{t(gift!.frequency === "monthly" ? "donate.thanks.monthly" : "donate.thanks.once", { amount })}</p>
          ) : (
            <p className="text-base text-[var(--ink2)]">{t("donate.thanks.pending")}</p>
          )}
          <p className="text-sm leading-relaxed text-[var(--ink2)]">{t("donate.thanks.body")}</p>
          <p className="text-xs text-[var(--ink3)]">{t("donate.thanks.email")}</p>
          <Link href="/tilo-vision-scholarship" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[var(--ink)] px-6 text-sm font-bold text-white hover:opacity-90">
            {t("donate.thanks.back")}
          </Link>
        </div>
      </div>
    </div>
  );
}
