"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface ProjectCard {
  emoji: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
}

const projectCards: ProjectCard[] = [
  {
    emoji: "✈️",
    title: "SSR Airport — Mauritius",
    subtitle: "5-Solution AI Operations Suite",
    badge: "Active",
    badgeClass: "bg-green-100 text-green-700",
  },
  {
    emoji: "📚",
    title: "InStory Method Platform",
    subtitle: "K–8 AI Personalized Learning",
    badge: "Launch Ready",
    badgeClass: "bg-[#EBF0FA] text-[#2251A3]",
  },
  {
    emoji: "🍽️",
    title: "Caribbean Flavor Restaurant",
    subtitle: "Full Digital Transformation",
    badge: "In Progress",
    badgeClass: "bg-[#FEF0E3] text-[#F47C20]",
  },
  {
    emoji: "❤️",
    title: "CareFlow AI Platform",
    subtitle: "Social Work Automation",
    badge: "Beta",
    badgeClass: "bg-[#EBF0FA] text-[#2251A3]",
  },
];

export default function Hero() {
  return (
    <section className="pt-24 md:pt-32 pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-6">

            {/* Animated orange dot + pill */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 self-start bg-[#FEF0E3] border border-[#F47C20]/30 rounded-full px-3 py-1.5"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F47C20] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F47C20]" />
              </span>
              <span className="text-[#F47C20] text-xs font-semibold font-dm tracking-wide">
                AI-First Agency · Washington D.C. · Serving NA &amp; Africa
              </span>
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-syne font-extrabold text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight text-[#0D1B2A]"
            >
              We build{" "}
              <span className="text-[#2251A3]">AI systems</span>{" "}
              that make businesses{" "}
              <span className="text-[#F47C20]">unstoppable.</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-dm font-light text-lg text-[#3A4A5C] leading-relaxed max-w-xl"
            >
              TIBLOGICS is an AI implementation and digital solutions agency
              serving North America and Francophone Africa. We don&apos;t just
              add AI — we architect it from the ground up.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <Link href="/tools" className="btn-primary">
                Try Free Tools
              </Link>
              <Link href="/book" className="btn-secondary">
                Get AI Assessment ↗
              </Link>
            </motion.div>
          </div>

          {/* ── Right column — project cards ── */}
          <div className="flex flex-col gap-3">
            {projectCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i + 1) * 0.1 }}
                className="bg-white border border-[#D2DCE8] rounded-2xl p-4 flex items-center gap-3 hover:translate-x-1 transition-transform duration-200 cursor-default"
              >
                {/* Emoji in 40px circle */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F4F7FB] flex items-center justify-center text-lg">
                  {card.emoji}
                </div>

                {/* Title + subtitle */}
                <div className="flex-1 min-w-0">
                  <p className="font-syne font-bold text-sm text-[#0D1B2A] truncate">
                    {card.title}
                  </p>
                  <p className="text-xs text-[#7A8FA6] truncate">
                    {card.subtitle}
                  </p>
                </div>

                {/* Badge */}
                <span
                  className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${card.badgeClass}`}
                >
                  {card.badge}
                </span>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
