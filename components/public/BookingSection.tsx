import Link from "next/link";
import { getLocale, translatorFor } from "@/lib/i18n/server";

interface Session {
  /** Dictionary key under home.booking.<key>.name / .desc */
  key: string;
  minutes: number;
  deliverable?: boolean;
  badge: "free" | "popular" | "new" | null;
  color: string;
  /** US dollars; formatted for the visitor's locale. */
  price: number | null;
}

const sessions: Session[] = [
  { key: "discovery", minutes: 30, badge: "free", color: "#F47C20", price: null },
  { key: "strategy", minutes: 60, badge: "popular", color: "#2251A3", price: 497 },
  { key: "audit", minutes: 90, deliverable: true, badge: null, color: "#1B3A6B", price: 897 },
  { key: "website", minutes: 45, badge: "new", color: "#0F6E56", price: 397 },
  { key: "pricing", minutes: 60, badge: null, color: "#7c3aed", price: 297 },
  { key: "general", minutes: 45, badge: null, color: "#3A4A5C", price: 297 },
];

export default async function BookingSection() {
  const locale = await getLocale();
  const t = translatorFor(locale);
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <section className="py-20 bg-[#F4F7FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="section-tag">{t("home.cta.tag")}</span>
          <h2 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mt-2">
            {t("home.booking.title")}
          </h2>
          <p className="font-dm text-[#3A4A5C] mt-3 max-w-xl mx-auto">
            {t("home.booking.intro")}
          </p>
        </div>

        {/* Session cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {sessions.map((session) => (
            <div
              key={session.key}
              className="relative bg-white border border-[#D2DCE8] rounded-2xl p-5 flex flex-col gap-2 card-hover overflow-hidden"
            >
              {/* Left color border */}
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ backgroundColor: session.color }}
              />

              {/* Badge (only if present) */}
              {session.badge && (
                <span className="self-start ml-1 bg-[#FEF0E3] text-[#F47C20] text-xs font-bold px-2 py-0.5 rounded-full">
                  {t(`home.booking.badge.${session.badge}`)}
                </span>
              )}

              {/* Name */}
              <p className="font-syne font-bold text-base text-[#0D1B2A] leading-snug pl-1 mt-1">
                {t(`home.booking.${session.key}.name`)}
              </p>

              {/* Description */}
              <p className="font-dm text-xs text-[#7A8FA6] pl-1 leading-relaxed flex-1">
                {t(`home.booking.${session.key}.desc`, { price: session.price ? money.format(session.price) : "" }).trim()}
              </p>

              {/* Duration */}
              <p className="font-dm text-xs text-[#3A4A5C] font-medium pl-1 flex items-center gap-1">
                <span aria-label={t("home.booking.duration")}>⏱</span>
                {t(session.deliverable ? "home.booking.minutesDeliverable" : "home.booking.minutes", { n: session.minutes })}
              </p>
            </div>
          ))}
        </div>

        {/* View all CTA */}
        <div className="flex justify-center mt-8">
          <Link href="/book" className="btn-primary text-center justify-center">
            {t("home.booking.cta")}
          </Link>
        </div>

      </div>
    </section>
  );
}
