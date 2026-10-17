import type { Metadata } from "next";
import Link from "next/link";
import ReviewForm, { type ReviewFormLabels } from "@/components/reviews/ReviewForm";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { LOCALES, LOCALE_NAMES, isLocale, type Locale } from "@/lib/i18n/config";
import { verifyReviewToken, type TokenCheck } from "@/lib/reviews/token";
import { reviewExists } from "@/lib/reviews/db";
import { QUOTE_MAX, QUOTE_MIN, firstNameOf } from "@/lib/reviews/types";

export const dynamic = "force-dynamic";

// /review?t=TOKEN: the review form for someone TIBLOGICS invited (signed,
// 60-day link from lib/reviews/token.ts). Not indexed. The language is
// ?lang= if chosen here, else the invitation's language (staff picked it for
// this person), else the visitor's site language.

type Props = { searchParams: Promise<{ t?: string | string[]; lang?: string | string[] }> };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function resolve(searchParams: Props["searchParams"]): Promise<{ token: string; check: TokenCheck; locale: Locale }> {
  const sp = await searchParams;
  const token = one(sp.t);
  const check = verifyReviewToken(token);
  const lang = one(sp.lang);
  const locale: Locale = isLocale(lang) ? lang : check.ok ? check.claims.locale : await getLocale();
  return { token, check, locale };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { locale } = await resolve(searchParams);
  const t = translatorFor(locale);
  return { title: t("reviews.meta.title"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

export default async function ReviewPage({ searchParams }: Props) {
  const { token, check, locale } = await resolve(searchParams);
  const t = translatorFor(locale);
  const already = check.ok ? await reviewExists(check.claims.email, check.claims.source).catch(() => false) : false;
  const langHref = (l: Locale) => `/review?${new URLSearchParams({ ...(token ? { t: token } : {}), lang: l }).toString()}`;

  const labels: ReviewFormLabels = {
    name: t("reviews.form.name"),
    role: t("reviews.form.role"),
    rolePh: t(check.ok && check.claims.source === "arfa" ? "reviews.form.rolePhArfa" : "reviews.form.rolePh"),
    company: t("reviews.form.company"),
    optional: t("reviews.form.optional"),
    rating: t("reviews.form.rating"),
    quote: t("reviews.form.quote"),
    quotePh: t("reviews.form.quotePh"),
    quoteHint: t("reviews.form.quoteHint", { min: QUOTE_MIN, max: QUOTE_MAX }),
    consent: t("reviews.form.consent"),
    consentHint: t("reviews.form.consentHint"),
    submit: t("reviews.form.submit"),
    sending: t("reviews.form.sending"),
    errRating: t("reviews.err.rating"),
    errName: t("reviews.err.name"),
    errRole: t("reviews.err.role"),
    errQuoteShort: t("reviews.err.quoteShort", { min: QUOTE_MIN }),
    errQuoteLong: t("reviews.err.quoteLong", { max: QUOTE_MAX }),
    errGeneric: t("reviews.err.generic"),
    thanksTitle: t("reviews.thanks.title"),
    thanksBody: t("reviews.thanks.body"),
    thanksBodyPrivate: t("reviews.thanks.bodyPrivate"),
    thanksHome: t("reviews.thanks.home"),
    alreadyTitle: t("reviews.already.title"),
    alreadyBody: t("reviews.already.body"),
    star1: t("reviews.form.star.1"),
    star2: t("reviews.form.star.2"),
    star3: t("reviews.form.star.3"),
    star4: t("reviews.form.star.4"),
    star5: t("reviews.form.star.5"),
  };

  return (
    <div lang={locale} className="min-h-screen bg-gradient-to-b from-[#EEF3FA] via-[#F4F7FB] to-white">
      <header className="border-b border-[#D2DCE8]/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-syne text-xl font-extrabold tracking-wide text-[#1B3A6B]">
            TIB<span className="text-[#F47C20]">LOGICS</span>
          </Link>
          <nav aria-label="Language" className="flex items-center gap-1 text-xs font-bold">
            {LOCALES.map((l) => (
              <Link
                key={l}
                href={langHref(l)}
                hrefLang={l}
                lang={l}
                aria-current={l === locale ? "true" : undefined}
                className={`rounded-full px-2.5 py-1.5 ${l === locale ? "bg-[#0D1B2A] text-white" : "text-[#3A4A5C] hover:bg-[#E3E9F1]"}`}
                title={LOCALE_NAMES[l]}
                data-testid={`review-lang-${l}`}
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
        {!check.ok ? (
          <div className="rounded-3xl border border-[#D2DCE8] bg-white p-7 text-center shadow-[0_8px_32px_rgba(27,58,107,0.10)]" data-testid="review-invalid" data-reason={check.reason}>
            <div aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF0E3] text-2xl">⌛</div>
            <h1 className="mt-4 font-syne text-2xl font-extrabold text-[#0D1B2A]">{t(check.reason === "expired" ? "reviews.expired.title" : "reviews.invalid.title")}</h1>
            <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-[#3A4A5C]">{t(check.reason === "expired" ? "reviews.expired.body" : "reviews.invalid.body")}</p>
            <Link href="/contact" className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#0D1B2A] px-6 text-sm font-bold text-white hover:opacity-90">
              {t("reviews.invalid.contact")}
            </Link>
          </div>
        ) : already ? (
          <div className="rounded-3xl border border-[#D2DCE8] bg-white p-7 text-center shadow-[0_8px_32px_rgba(27,58,107,0.10)]" data-testid="review-already">
            <div aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F6EF] text-2xl text-[#0F6E56]">✓</div>
            <h1 className="mt-4 font-syne text-2xl font-extrabold text-[#0D1B2A]">{t("reviews.already.title")}</h1>
            <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-[#3A4A5C]">{t("reviews.already.body")}</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B8500A]">{t("reviews.form.kicker")}</p>
            <h1 className="mt-2 font-syne text-[26px] font-extrabold leading-tight text-[#0D1B2A] sm:text-3xl">
              {t(check.claims.source === "arfa" ? "reviews.form.titleArfa" : "reviews.form.title", { name: firstNameOf(check.claims.name) || check.claims.name })}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#3A4A5C]">{t("reviews.form.intro")}</p>
            <div className="mt-6">
              <ReviewForm token={token} locale={locale} initialName={check.claims.name} labels={labels} quoteMin={QUOTE_MIN} quoteMax={QUOTE_MAX} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
