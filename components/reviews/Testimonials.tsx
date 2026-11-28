import JsonLd from "@/components/seo/JsonLd";
import Stars from "@/components/reviews/Stars";
import { translatorFor } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import { publicReviews, type ReviewScope } from "@/lib/reviews/db";
import { reviewNodes } from "@/lib/seo/jsonld";
import { ARFA_ID, ORG_ID } from "@/lib/seo/site";

// Real, approved reviews (lib/reviews), server-rendered so the HTML carries
// them, with Review structured data. Renders nothing at all until at least
// one review is approved: no empty placeholders, no sample quotes.
//   scope "site"  the home page: clients (every source but ARFA)
//   scope "arfa"  the Learning Box: ARFA learners
// Phones get a horizontal snap carousel; wider screens a grid.

export default async function Testimonials({ scope, locale }: { scope: ReviewScope; locale: Locale }) {
  const set = await publicReviews(scope);
  if (set.items.length === 0) return null;
  const t = translatorFor(locale);
  const k = scope === "arfa" ? "learn" : "home";
  const avg = set.count >= 3 ? (Math.round(set.average * 10) / 10).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : null;
  const headingId = `testimonials-${scope}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`testimonials ${scope === "arfa" ? "bg-white" : "bg-gradient-to-b from-[#F4F7FB] to-white"} py-16`}
      data-testid={scope === "arfa" ? "learner-testimonials" : "testimonials"}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#B8500A]">{t(`reviews.${k}.kicker`)}</span>
            <h2 id={headingId} className="mt-2 font-syne text-3xl font-extrabold text-[#0D1B2A]">{t(`reviews.${k}.title`)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#3A4A5C]">{t(`reviews.${k}.sub`)}</p>
          </div>
          {avg && (
            <p className="inline-flex items-center gap-2 self-start rounded-full border border-[#D2DCE8] bg-white px-4 py-2 text-sm font-semibold text-[#0D1B2A] sm:self-auto" data-testid="testimonials-average">
              <Stars rating={Math.round(set.average)} label={t("reviews.stars", { n: avg })} size={16} />
              {t("reviews.average", { avg, n: set.count.toLocaleString(locale) })}
            </p>
          )}
        </div>

        <ul
          className="-mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:scroll-px-0 sm:px-0 lg:grid-cols-3"
          aria-label={t(`reviews.${k}.title`)}
        >
          {set.items.map((r) => (
            <li
              key={r.id}
              className="w-[85%] max-w-[360px] shrink-0 snap-start sm:w-auto sm:max-w-none"
              data-testid="testimonial-card"
            >
              <figure className="relative flex h-full flex-col rounded-2xl border border-[#D2DCE8] bg-white p-6 shadow-[0_4px_24px_rgba(27,58,107,0.08)]">
                <span aria-hidden="true" className="absolute right-5 top-2 font-serif text-6xl leading-none text-[#F47C20]/20">&ldquo;</span>
                <Stars rating={r.rating} label={t("reviews.stars", { n: r.rating })} />
                <blockquote lang={r.locale} className="mt-4 flex-1 text-[15px] leading-relaxed text-[#0D1B2A]">
                  <p>{r.quote}</p>
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-[#EEF2F7] pt-4">
                  <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1B3A6B] to-[#2251A3] text-sm font-bold text-white">
                    {r.firstName.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-[#0D1B2A]" data-testid="testimonial-name">{r.firstName}</span>
                    <span className="block break-words text-xs text-[#5A6E84]">
                      {r.role}
                      {r.company ? `, ${r.company}` : ""}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
      <JsonLd
        data={reviewNodes({
          itemId: scope === "arfa" ? ARFA_ID : ORG_ID,
          itemType: scope === "arfa" ? "EducationalOrganization" : "Organization",
          reviews: set.items.map((r) => ({ id: r.id, author: r.firstName, quote: r.quote, rating: r.rating, approvedAt: r.approvedAt, locale: r.locale })),
          aggregate: { count: set.count, average: set.average },
        })}
      />
    </section>
  );
}
