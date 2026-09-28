import Link from "next/link";
import { getLocale, translatorFor } from "@/lib/i18n/server";

interface AfricaCard {
  emoji: string;
  /** Product and place names stay as they are; others are dictionary keys. */
  title: string | { key: string };
  descKey: string;
}

const cards: AfricaCard[] = [
  { emoji: "🇧🇫", title: "Burkina Faso", descKey: "home.africa.burkina" },
  { emoji: "📦", title: "ShipFrica", descKey: "home.africa.shipfrica" },
  { emoji: "🤝", title: { key: "home.africa.b2b.title" }, descKey: "home.africa.b2b.desc" },
  { emoji: "🎓", title: { key: "home.africa.training.title" }, descKey: "home.africa.training.desc" },
];

export default async function AfricaSection() {
  const locale = await getLocale();
  const t = translatorFor(locale);
  // The French motto and paragraph are the point of this section, so they
  // show in every language; the gloss beneath is in the visitor's language
  // and is left out for French readers, who would see the same text twice.
  const fr = translatorFor("fr");
  const showGloss = locale !== "fr";

  return (
    <section className="bg-[#1B3A6B] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-5">
            <span className="section-tag text-[#F47C20]">
              {t("home.africa.tag")}
            </span>

            <div>
              <h2 lang="fr" className="font-syne font-extrabold text-3xl text-white leading-tight">
                {fr("home.africa.motto")}
              </h2>
              {showGloss && (
                <p className="text-white/50 italic font-dm text-base mt-1">
                  {t("home.africa.mottoGloss")}
                </p>
              )}
            </div>

            <p lang="fr" className="text-white/70 font-dm text-base leading-relaxed">
              {fr("home.africa.bodyFr")}
            </p>

            {showGloss && (
              <p className="text-white/50 text-sm italic font-dm leading-relaxed">
                {t("home.africa.body")}
              </p>
            )}

            <div>
              <Link
                href="/contact"
                className="bg-[#F47C20] hover:bg-[#E05F00] text-white font-semibold rounded-lg px-5 py-2.5 transition-colors duration-200 inline-flex items-center gap-2"
              >
                {t("home.africa.cta")}
              </Link>
            </div>
          </div>

          {/* ── Right column — 2×2 grid ── */}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
            {cards.map((card) => {
              const title = typeof card.title === "string" ? card.title : t(card.title.key);
              return (
                <div
                  key={card.descKey}
                  className="bg-white/10 rounded-xl p-5 border border-white/10 flex flex-col gap-3"
                >
                  {/* Emoji in 36px circle */}
                  <div aria-hidden="true" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg flex-shrink-0">
                    {card.emoji}
                  </div>

                  <div>
                    <p className="text-white font-syne font-bold text-sm">
                      {title}
                    </p>
                    <p className="text-white/60 font-dm text-xs mt-0.5 leading-relaxed">
                      {t(card.descKey)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
