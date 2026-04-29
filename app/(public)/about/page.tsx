import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Globe, Zap, Users, Shield, Target, Lightbulb, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "About TIBLOGICS — AI Implementation Agency",
  description:
    "Learn about TIBLOGICS — an AI implementation and digital solutions agency serving businesses across North America and Africa. First-principles thinking. Measurable outcomes.",
  keywords: [
    "about TIBLOGICS", "AI agency mission", "AI implementation company", "Tieyiwe Bassole",
    "AI consulting firm", "digital solutions agency", "AI for African businesses",
    "bilingual AI agency", "AI first principles",
  ],
  alternates: { canonical: "https://tiblogics.com/about" },
  openGraph: {
    title: "About TIBLOGICS — AI Implementation & Digital Solutions",
    description: "We don't just talk about AI. We implement it. Learn about our mission, our team, and how we deliver measurable outcomes.",
    url: "https://tiblogics.com/about",
    type: "website",
    images: [{ url: "https://tiblogics.com/og-image.png", width: 1200, height: 630, alt: "About TIBLOGICS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About TIBLOGICS",
    description: "AI implementation agency built for businesses ready to stop watching the future arrive and start leading it.",
    creator: "@tiblogics",
    images: ["https://tiblogics.com/og-image.png"],
  },
};

const principles = [
  { icon: Shield, title: "Integrity, Always", desc: "We tell the truth about what AI can and cannot do. Our clients make better decisions because we give them honest advice, not what sounds impressive." },
  { icon: Zap, title: "Move with Urgency", desc: "Speed matters. We don't let process slow down progress. We move decisively and deliver without unnecessary delay." },
  { icon: Lightbulb, title: "First Principles Thinking", desc: "We don't copy templates. We strip every problem to its core and engineer the right solution from the ground up." },
  { icon: Target, title: "The Right Logic for Every Challenge", desc: "Not every problem needs AI. We apply the right tool — automation, development, analytics, or AI — to get the best outcome." },
  { icon: TrendingUp, title: "Results You Can Measure", desc: "We define success in numbers before we start. Hours saved, revenue generated, errors eliminated — if we can't measure it, we don't count it." },
  { icon: Users, title: "Your Growth Is Our Mission", desc: "We measure our performance by what changes in your business, not by the deliverables we hand over." },
];

const industries = [
  { label: "Healthcare & Social Work", emoji: "🏥" },
  { label: "Education & EdTech", emoji: "📚" },
  { label: "Logistics & Shipping", emoji: "📦" },
  { label: "Hospitality & Food Service", emoji: "🍽️" },
  { label: "Government & Public Sector", emoji: "🏛️" },
  { label: "Startups & SaaS", emoji: "🚀" },
  { label: "Nonprofits", emoji: "🤝" },
  { label: "Enterprise", emoji: "🏢" },
];

const services = [
  "AI Implementation", "AI Consulting", "Workflow Automation",
  "Web & Mobile Development", "Cybersecurity", "Data Analytics",
  "AI Agent Development", "SaaS Product Development", "Digital Transformation",
];

export default function AboutPage() {
  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen">

      {/* Hero */}
      <div className="bg-[#1B3A6B] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="section-tag">About TIBLOGICS</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-white mt-4 leading-tight">
            We don&apos;t just talk about AI.{" "}
            <span className="text-[#F47C20]">We implement it.</span>
          </h1>
          <p className="font-dm text-white/75 text-lg mt-5 max-w-3xl leading-relaxed">
            TIBLOGICS is an AI implementation and digital solutions agency built for businesses that are ready to stop watching the future arrive and start leading it.
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="bg-white border-b border-[#E8EFF8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            <div className="lg:col-span-2">
              <span className="section-tag">Our Mission</span>
              <p className="font-dm text-[#3A4A5C] text-lg leading-relaxed mt-4">
                To make intelligent technology <strong className="text-[#0D1B2A]">accessible, practical, and transformative</strong> — empowering businesses of every size to operate smarter, move faster, and compete in a world where AI is no longer optional.
              </p>
              <p className="font-dm text-[#3A4A5C] leading-relaxed mt-4">
                Our work spans the full digital stack: AI integration, workflow automation, web and mobile app development, data analytics, and cybersecurity. Whether you&apos;re a growing local business or a large enterprise operating across borders, we bring the same standard — precision engineering, measurable outcomes, and technology your team can actually use.
              </p>
            </div>
            <div className="bg-[#F4F7FB] rounded-2xl p-6 border border-[#E8EFF8]">
              <Globe size={20} className="text-[#2251A3] mb-3" />
              <p className="font-syne font-bold text-sm text-[#0D1B2A] mb-2">Serving Markets Worldwide</p>
              <p className="font-dm text-sm text-[#3A4A5C] leading-relaxed">
                While our primary focus is the <strong>United States and African markets</strong>, we are equipped to serve clients across the globe — with bilingual English and French delivery.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What Sets Us Apart */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <span className="section-tag">What Sets Us Apart</span>
          <h2 className="font-syne font-extrabold text-2xl md:text-3xl text-[#0D1B2A] mt-2 leading-snug">
            Scope. Experience. Cultural intelligence.
          </h2>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-7">
            <p className="font-dm text-[#3A4A5C] leading-relaxed">
              We&apos;ve built AI solutions for the <strong className="text-[#0D1B2A]">patient care space, airports, schools, restaurants, and diaspora shipping operators</strong>. We design and deploy AI agents that function as actual employees — completing real tasks, handling real interactions, and delivering real results around the clock. From custom AI chatbots and voice agents to full SaaS product development, we&apos;ve taken ideas from zero to launch-ready.
            </p>
          </div>

          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-7">
            <p className="font-dm text-[#3A4A5C] leading-relaxed">
              We serve international markets with <strong className="text-[#0D1B2A]">bilingual English and French delivery</strong> and a cultural intelligence that most digital agencies simply don&apos;t have. We walk with our clients through the entire journey — from idea discovery and strategy, through design and development, all the way to deployment and scaling. No idea is too early and no project is too complex.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#EBF0FA] to-[#F4F7FB] border border-[#D2DCE8] rounded-2xl p-7">
            <h3 className="font-syne font-bold text-base text-[#1B3A6B] mb-3">Our commitment to small businesses</h3>
            <p className="font-dm text-[#3A4A5C] leading-relaxed">
              One of our deepest commitments is making sure that individuals and small businesses are <strong className="text-[#0D1B2A]">not left behind</strong> as the world rapidly shifts toward AI. We believe AI readiness is not a luxury reserved for large enterprises — it is a necessity for anyone who wants to remain competitive. We are here to make that transition accessible, practical, and transformative for every client we serve.
            </p>
          </div>
        </div>
      </div>

      {/* Founder */}
      <div className="bg-[#F4F7FB] border-y border-[#E8EFF8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <span className="section-tag">Founder</span>
          <div className="mt-6 flex flex-col sm:flex-row gap-8 items-start">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1B3A6B] to-[#2251A3] rounded-2xl flex items-center justify-center shrink-0">
              <span className="font-syne font-extrabold text-3xl text-white">T</span>
            </div>
            <div>
              <blockquote className="border-l-4 border-[#F47C20] pl-5 mb-6">
                <p className="font-dm text-[#3A4A5C] leading-relaxed italic">
                  &ldquo;At my core, I believe in first-principles thinking. By stripping every challenge down to its fundamental truths, I ensure we never lose sight of what is essential; this approach effectively eliminates the noise of unnecessary costs and complexity. I invest heavily in studying the core of a problem so that the eventual implementation is not just fast, but precise. There is nothing more rewarding than delivering a solution that buys a company its time back while fueling its growth and service quality.&rdquo;
                </p>
              </blockquote>
              <div className="flex flex-wrap gap-3">
                <a href="mailto:ai@tiblogics.com" className="btn-primary text-sm py-2 inline-flex items-center gap-2">
                  <Mail size={14} /> ai@tiblogics.com
                </a>
                <Link href="/book" className="btn-secondary text-sm py-2">Book a Meeting</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Track Record */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <span className="section-tag">Track Record</span>
          <h2 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mt-2">Real results. Real deployments.</h2>
          <p className="font-dm text-[#7A8FA6] mt-3 max-w-2xl mx-auto leading-relaxed">
            Our work is backed by years of hands-on experience, a team of excellent technology professionals, and a portfolio of deployed AI solutions serving clients from local businesses to international airports.
          </p>
        </div>

        {/* Who we work with */}
        <div className="mb-12">
          <h3 className="font-syne font-bold text-base text-[#0D1B2A] mb-4 text-center">Who we work with</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {industries.map((ind) => (
              <div key={ind.label} className="bg-white border border-[#D2DCE8] rounded-xl px-4 py-3 flex items-center gap-2.5">
                <span className="text-lg">{ind.emoji}</span>
                <span className="font-dm text-xs text-[#3A4A5C] font-medium leading-tight">{ind.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Principles */}
        <div className="text-center mb-8">
          <span className="section-tag">How We Work</span>
          <h2 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mt-2">Our operating principles.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {principles.map((p) => (
            <div key={p.title} className="bg-[#F4F7FB] rounded-2xl p-6 border border-[#E8EFF8]">
              <div className="w-10 h-10 bg-[#EBF0FA] rounded-xl flex items-center justify-center mb-3">
                <p.icon size={18} className="text-[#2251A3]" />
              </div>
              <h3 className="font-syne font-bold text-base text-[#0D1B2A] mb-2">{p.title}</h3>
              <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Services */}
      <div className="bg-[#F4F7FB] border-t border-[#E8EFF8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-7">
            <span className="section-tag">Key Services</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {services.map((s) => (
              <span key={s} className="bg-white border border-[#D2DCE8] text-[#3A4A5C] font-dm text-sm px-4 py-2 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#F4F7FB] py-16 px-4">
        <div className="max-w-xl mx-auto bg-[#1B3A6B] rounded-2xl px-8 py-12 text-center">
          <p className="font-dm text-[#7A9BBF] text-sm uppercase tracking-widest mb-4">Ready to build?</p>
          <h2 className="font-syne font-extrabold text-3xl md:text-4xl text-white leading-tight mb-4">
            We are not a vendor.<br />
            <span className="text-[#F47C20]">We are your implementation partner.</span>
          </h2>
          <p className="font-dm text-white/70 text-base max-w-xl mx-auto mb-8 leading-relaxed">
            If you are ready to build something meaningful, automate what is slowing you down, or find the right AI solutions for your business — your next step starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/book" className="btn-primary">Book a Free Discovery Call</Link>
            <Link href="/services" className="bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg px-5 py-2.5 transition-colors inline-flex items-center gap-2 border border-white/20">
              Explore Our Services →
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
