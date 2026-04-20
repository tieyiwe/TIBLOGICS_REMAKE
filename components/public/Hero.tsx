import Link from "next/link";

const projectCards = [
  { emoji: "🧠", title: "First Principles Problem Solving", subtitle: "Strip assumptions. Rebuild from truth.", badge: "Our Method", badgeClass: "bg-[#EBF0FA] text-[#2251A3]" },
  { emoji: "🎯", title: "Design Is How It Works", subtitle: "Functionality is the real aesthetic.", badge: "Our Standard", badgeClass: "bg-[#FEF0E3] text-[#F47C20]" },
  { emoji: "💡", title: "If You Can Think It, We Build It", subtitle: "Your vision, engineered into reality.", badge: "Our Promise", badgeClass: "bg-green-100 text-green-700" },
  { emoji: "⚡", title: "Real Solutions, Not Buzzwords", subtitle: "Measurable outcomes. Zero hype.", badge: "Our Commitment", badgeClass: "bg-purple-100 text-purple-700" },
];

export default function Hero() {
  return (
    <section className="pt-24 md:pt-32 pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left column */}
          <div className="flex flex-col gap-6">
            <div className="anim-fade-in inline-flex items-center gap-2 self-start bg-[#FEF0E3] border border-[#F47C20]/30 rounded-full px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F47C20] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F47C20]" />
              </span>
              <span className="text-[#F47C20] text-xs font-semibold font-dm tracking-wide">
                AI-First Agency · Washington D.C. · Serving NA &amp; Africa
              </span>
            </div>

            <h1
              className="anim-fade-up font-syne font-extrabold text-4xl md:text-5xl lg:text-[3.75rem] tracking-tight leading-[1.12] text-[#0D1B2A]"
              style={{ animationDelay: "0.1s" }}
            >
              We build{" "}
              <span
                className="font-display font-semibold italic text-[#2251A3]"
                style={{ fontSize: "1.1em", letterSpacing: "-0.01em" }}
              >
                digital and AI solutions
              </span>
              <br className="hidden sm:block" />
              {" "}that eliminate inefficiency, automate the routine,
              <br className="hidden sm:block" />
              {" "}and solve{" "}
              <span
                className="font-display font-bold italic"
                style={{
                  fontSize: "1.1em",
                  letterSpacing: "-0.01em",
                  background: "linear-gradient(95deg, #F47C20 0%, #e05500 60%, #c44600 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                what&apos;s actually holding your business back.
              </span>
            </h1>

            <p
              className="anim-fade-up font-dm font-light text-lg text-[#3A4A5C] leading-relaxed max-w-xl"
              style={{ animationDelay: "0.2s" }}
            >
              TIBLOGICS is an AI implementation and digital solutions agency
              rooted in North America and Africa — and open to partnering with
              businesses anywhere in the world.
            </p>

            <div
              className="anim-fade-up flex flex-wrap gap-3"
              style={{ animationDelay: "0.3s" }}
            >
              <Link href="/tools" className="btn-primary">Try Smart Tools</Link>
              <Link href="/book" className="btn-secondary">Get AI Assessment ↗</Link>
            </div>
          </div>

          {/* Right column — project cards */}
          <div className="flex flex-col gap-3">
            {projectCards.map((card, i) => (
              <div
                key={card.title}
                className="anim-fade-up bg-white border border-[#D2DCE8] rounded-2xl p-4 flex items-center gap-3 hover:translate-x-1 transition-transform duration-200 cursor-default"
                style={{ animationDelay: `${(i + 1) * 0.1}s` }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F4F7FB] flex items-center justify-center text-lg">
                  {card.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-syne font-bold text-sm text-[#0D1B2A] truncate">{card.title}</p>
                  <p className="text-xs text-[#7A8FA6] truncate">{card.subtitle}</p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${card.badgeClass}`}>
                  {card.badge}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
