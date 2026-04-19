
import Link from "next/link";

interface AfricaCard {
  emoji: string;
  title: string;
  desc: string;
}

const cards: AfricaCard[] = [
  {
    emoji: "🇧🇫",
    title: "Burkina Faso",
    desc: "Government & enterprise digital transformation projects.",
  },
  {
    emoji: "📦",
    title: "ShipFrica",
    desc: "Diaspora shipping SaaS powering African logistics businesses.",
  },
  {
    emoji: "🤝",
    title: "B2B Partnerships",
    desc: "Strategic partnerships with Francophone African enterprises.",
  },
  {
    emoji: "🎓",
    title: "Formation IA",
    desc: "AI training programs in French for professionals and businesses.",
  },
];

export default function AfricaSection() {
  return (
    <section className="bg-[#1B3A6B] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-5">
            <span className="section-tag text-[#F47C20]">
              Francophone Africa
            </span>

            <div>
              <h2 className="font-syne font-extrabold text-3xl text-white leading-tight">
                L&apos;Afrique est notre c&oelig;ur.
              </h2>
              <p className="text-white/50 italic font-dm text-base mt-1">
                &quot;Africa is our heart.&quot;
              </p>
            </div>

            <p className="text-white/70 font-dm text-base leading-relaxed">
              Nous construisons des solutions num&eacute;riques pour
              l&apos;Afrique francophone &mdash; des outils qui parlent votre
              langue, comprennent votre march&eacute;, et transforment vos
              entreprises avec l&apos;IA.
            </p>

            <p className="text-white/50 text-sm italic font-dm leading-relaxed">
              We build digital solutions for Francophone Africa &mdash; tools
              that speak your language, understand your market, and transform
              your businesses with AI.
            </p>

            <div>
              <Link
                href="/contact"
                className="bg-[#F47C20] hover:bg-[#E05F00] text-white font-semibold rounded-lg px-5 py-2.5 transition-colors duration-200 inline-flex items-center gap-2"
              >
                Nous contacter →
              </Link>
            </div>
          </div>

          {/* ── Right column — 2×2 grid ── */}
          <div className="grid grid-cols-2 gap-4">
            {cards.map((card) => (
              <div
                key={card.title}
                className="bg-white/10 rounded-xl p-5 border border-white/10 flex flex-col gap-3"
              >
                {/* Emoji in 36px circle */}
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg flex-shrink-0">
                  {card.emoji}
                </div>

                <div>
                  <p className="text-white font-syne font-bold text-sm">
                    {card.title}
                  </p>
                  <p className="text-white/60 font-dm text-xs mt-0.5 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
