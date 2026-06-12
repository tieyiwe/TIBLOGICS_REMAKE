"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, DollarSign, Users, Clock, ArrowRight, Bell, X, ExternalLink } from "lucide-react";

interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  price: number;
  currency: string;
  capacity?: number | null;
  spots?: number | null;
  location: string;
  date?: string | null;
  endDate?: string | null;
  timeSlot?: string | null;
  timezone: string;
  coverImage?: string | null;
  tags: string[];
  featured: boolean;
  registrationOpen: boolean;
  stripePaymentLink?: string | null;
}

interface TechEvent {
  name: string;
  organizer: string;
  when: string;
  location: string;
  description: string;
  coverImage: string;
  url: string;
}

const POPULAR_TECH_EVENTS: TechEvent[] = [
  {
    name: "Apple WWDC 2026",
    organizer: "Apple",
    when: "Jun 9–13, 2026",
    location: "Cupertino, CA + Online",
    description: "Apple's annual developer conference — iOS, macOS, Apple Intelligence updates, and the latest tools for building on the Apple ecosystem.",
    coverImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    url: "https://developer.apple.com/wwdc26/",
  },
  {
    name: "VivaTech 2026",
    organizer: "Vivendi / Les Echos",
    when: "Jun 11–14, 2026",
    location: "Paris, France",
    description: "Europe's largest startup and tech conference — AI innovation, digital transformation, and global technology partnerships across 150+ countries.",
    coverImage: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80",
    url: "https://vivatechnology.com/",
  },
  {
    name: "Collision Conference 2026",
    organizer: "Collision",
    when: "Jun 16–19, 2026",
    location: "Toronto, Canada",
    description: "North America's fastest-growing tech conference — startups, investors, and industry leaders exploring AI, climate tech, and market growth.",
    coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
    url: "https://collisionconf.com/",
  },
  {
    name: "London Tech Week 2026",
    organizer: "London & Partners",
    when: "Jun 15–19, 2026",
    location: "London, UK",
    description: "The UK's flagship tech event — government, enterprise, and startup leaders covering AI policy, investment trends, and the future of digital business.",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    url: "https://londontechweek.com/",
  },
  {
    name: "VentureBeat Transform 2026",
    organizer: "VentureBeat",
    when: "Jul 14–15, 2026",
    location: "San Francisco, CA",
    description: "Enterprise AI decision-makers, practitioners, and vendors converge to discuss real-world AI deployment, ROI, and responsible AI at scale.",
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
    url: "https://events.venturebeat.com/ai-impact-summit/",
  },
  {
    name: "Black Hat USA 2026",
    organizer: "Black Hat",
    when: "Aug 1–6, 2026",
    location: "Las Vegas, NV",
    description: "The world's most respected cybersecurity conference — AI-powered threats, offensive security research, and enterprise defense briefings.",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    url: "https://www.blackhat.com/us-26/",
  },
  {
    name: "SIGGRAPH 2026",
    organizer: "ACM SIGGRAPH",
    when: "Aug 10–14, 2026",
    location: "Denver, CO",
    description: "The premier annual conference on computer graphics and interactive techniques — where AI-generated imagery and 3D innovation define the next frontier.",
    coverImage: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=800&q=80",
    url: "https://s2026.siggraph.org/",
  },
  {
    name: "Salesforce Dreamforce 2026",
    organizer: "Salesforce",
    when: "Sep 15–18, 2026",
    location: "San Francisco, CA",
    description: "The world's largest software conference — Agentforce 3.0, AI-powered CRM, and 40,000+ attendees from every major industry worldwide.",
    coverImage: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=800&q=80",
    url: "https://www.salesforce.com/dreamforce/",
  },
  {
    name: "AI Summit New York 2026",
    organizer: "AI Summit",
    when: "Sep 23–24, 2026",
    location: "New York, NY",
    description: "Enterprise-focused AI conference for C-suite leaders and practitioners — real-world case studies, vendor briefings, and AI deployment at scale.",
    coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
    url: "https://theaisummit.com/newyork/",
  },
  {
    name: "TechCrunch Disrupt 2026",
    organizer: "TechCrunch",
    when: "Oct 7–9, 2026",
    location: "San Francisco, CA",
    description: "Startup Battlefield pitches, AI unicorn panels, and the investor conversations that shape the next wave of technology companies.",
    coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    url: "https://techcrunch.com/events/tc-disrupt-2026/",
  },
  {
    name: "GITEX Global 2026",
    organizer: "DWTC",
    when: "Oct 12–16, 2026",
    location: "Dubai, UAE",
    description: "The Middle East and Africa's largest tech show — AI, cloud, smart city innovation, and digital economy partnerships across 180+ countries.",
    coverImage: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80",
    url: "https://www.gitex.com/",
  },
  {
    name: "Gartner IT Symposium/Xpo 2026",
    organizer: "Gartner",
    when: "Oct 19–22, 2026",
    location: "Orlando, FL",
    description: "The world's most important gathering for CIOs and senior IT leaders — AI strategy, tech investment priorities, and the emerging vendor landscape.",
    coverImage: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80",
    url: "https://www.gartner.com/en/conferences/na/symposium-us",
  },
  {
    name: "OpenAI DevDay 2026",
    organizer: "OpenAI",
    when: "Oct/Nov 2026",
    location: "San Francisco, CA",
    description: "OpenAI's flagship developer event — new model capabilities, API updates, and the product roadmap defining the next generation of AI-powered applications.",
    coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
    url: "https://openai.com/",
  },
  {
    name: "Web Summit 2026",
    organizer: "Web Summit",
    when: "Nov 4–7, 2026",
    location: "Lisbon, Portugal",
    description: "70,000+ attendees and 2,500+ startups — AI policy, international investment, and the conversations that shape the global technology agenda.",
    coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
    url: "https://websummit.com/",
  },
  {
    name: "Microsoft Ignite 2026",
    organizer: "Microsoft",
    when: "Nov 10–14, 2026",
    location: "Chicago, IL + Online",
    description: "Microsoft's premier enterprise conference — Azure AI, Copilot platform updates, and developer tools powering the next generation of business software.",
    coverImage: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80",
    url: "https://ignite.microsoft.com/",
  },
  {
    name: "AWS re:Invent 2026",
    organizer: "Amazon Web Services",
    when: "Dec 1–5, 2026",
    location: "Las Vegas, NV",
    description: "The world's largest cloud computing conference — 60,000+ builders, major AI infrastructure announcements, and deep-dive technical sessions.",
    coverImage: "https://images.unsplash.com/photo-1676299081847-824916de030a?auto=format&fit=crop&w=800&q=80",
    url: "https://reinvent.awsevents.com/",
  },
  {
    name: "CES 2027",
    organizer: "Consumer Technology Association",
    when: "Jan 6–9, 2027",
    location: "Las Vegas, NV",
    description: "The defining consumer tech event of the year — AI hardware, robotics, smart devices, and the breakthroughs that set the global tech agenda for 2027.",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    url: "https://www.ces.tech/",
  },
  {
    name: "Mobile World Congress 2027",
    organizer: "GSMA",
    when: "Feb 22–25, 2027",
    location: "Barcelona, Spain",
    description: "The global hub for mobile and connectivity innovation — AI-powered networks, 6G roadmaps, and the device ecosystem driving the next billion connected users.",
    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    url: "https://www.mwcbarcelona.com/",
  },
];

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "event", label: "Events" },
  { id: "training", label: "Training" },
  { id: "workshop", label: "Workshops" },
  { id: "webinar", label: "Webinars" },
];

const TYPE_COLORS: Record<string, string> = {
  TRAINING: "bg-[#2251A3]/10 text-[#2251A3]",
  EVENT: "bg-purple-100 text-purple-700",
  WORKSHOP: "bg-emerald-100 text-emerald-700",
  WEBINAR: "bg-teal-100 text-teal-700",
};

const TYPE_FALLBACK_IMAGE: Record<string, string> = {
  TRAINING: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
  WORKSHOP: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
  WEBINAR: "https://images.unsplash.com/photo-1587440871875-191322ee64b0?auto=format&fit=crop&w=800&q=80",
  EVENT: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function NotifyModal({ eventName, onClose }: { eventName: string; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/events/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), event: eventName }),
      });
      if (res.ok) setStatus("done");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-[#7A8FA6] hover:text-[#0D1B2A]">
          <X size={18} />
        </button>

        {status === "done" ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="font-syne font-bold text-xl text-[#0D1B2A] mb-2">You&apos;re on the waitlist!</h3>
            <p className="font-dm text-sm text-[#3A4A5C]">We&apos;ll reach out as soon as registration opens.</p>
            <button onClick={onClose} className="mt-5 w-full bg-[#1B3A6B] text-white rounded-xl py-2.5 font-dm font-semibold text-sm hover:bg-[#2251A3] transition-colors">
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#F47C20]/10 flex items-center justify-center">
                <Bell size={18} className="text-[#F47C20]" />
              </div>
              <div>
                <h3 className="font-syne font-bold text-lg text-[#0D1B2A] leading-tight">Join the Waitlist</h3>
                <p className="font-dm text-xs text-[#7A8FA6]">{eventName}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl px-4 py-2.5 text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:border-[#2251A3] focus:ring-1 focus:ring-[#2251A3]/20"
                required
              />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl px-4 py-2.5 text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:border-[#2251A3] focus:ring-1 focus:ring-[#2251A3]/20"
                required
              />
              {status === "error" && (
                <p className="text-xs text-red-500 font-dm">Something went wrong. Please try again.</p>
              )}
              <button
                type="submit"
                disabled={status === "loading" || !form.name.trim() || !form.email.includes("@")}
                className="w-full bg-[#F47C20] text-white rounded-xl py-2.5 font-dm font-semibold text-sm hover:bg-[#e06a10] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Bell size={14} /> Join Waitlist
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const [notifyOpen, setNotifyOpen] = useState(false);
  const isFree = event.price === 0;
  const typeColor = TYPE_COLORS[event.type] ?? "bg-gray-100 text-gray-700";
  const eventHref = `/events/${event.slug}`;

  // Green gradient border = registration open (active)
  // Orange gradient border = coming soon
  const gradientBorder = event.registrationOpen
    ? "linear-gradient(135deg, #22c55e, #16a34a)"
    : "linear-gradient(135deg, #F47C20, #f9a738)";

  return (
    <>
      {notifyOpen && <NotifyModal eventName={event.title} onClose={() => setNotifyOpen(false)} />}
      {/* Gradient border wrapper */}
      <div style={{ padding: "2px", borderRadius: "18px", background: gradientBorder }} className="hover:-translate-y-0.5 transition-transform duration-300">
      <Link
        href={eventHref}
        className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group h-full"
        style={{ borderRadius: "16px" }}
      >
        <div className="relative w-full h-48 overflow-hidden flex-shrink-0">
          <Image
            src={event.coverImage || TYPE_FALLBACK_IMAGE[event.type] || TYPE_FALLBACK_IMAGE.EVENT}
            alt={event.title}
            fill
            unoptimized
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
          {!event.registrationOpen && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#F47C20] text-white text-xs font-dm font-semibold px-3 py-1 rounded-full shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
              Coming Soon
            </div>
          )}
          {event.registrationOpen && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-500 text-white text-xs font-dm font-semibold px-3 py-1 rounded-full shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
              Open Now
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col flex-1 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-dm font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>
              {event.type}
            </span>
            {event.featured && (
              <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-[#F47C20]/10 text-[#F47C20]">
                Featured
              </span>
            )}
            {isFree ? (
              <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 ml-auto">
                Free
              </span>
            ) : (
              <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-[#F47C20]/10 text-[#F47C20] ml-auto">
                ${(event.price / 100).toFixed(0)}
              </span>
            )}
          </div>

          <h3 className="font-syne font-bold text-lg text-[#0D1B2A] leading-snug group-hover:text-[#F47C20] transition-colors">
            {event.title}
          </h3>

          <p className="font-dm text-sm text-[#3A4A5C] leading-relaxed line-clamp-2 flex-1">
            {event.description}
          </p>

          <div className="flex flex-col gap-1.5 mt-1">
            {event.date && (
              <div className="flex items-center gap-2 text-[#7A8FA6] text-xs font-dm">
                <Calendar size={13} />
                <span>{formatDate(event.date)}</span>
              </div>
            )}
            {event.timeSlot && (
              <div className="flex items-center gap-2 text-[#7A8FA6] text-xs font-dm">
                <Clock size={13} />
                <span>{event.timeSlot}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[#7A8FA6] text-xs font-dm">
              <MapPin size={13} />
              <span>{event.location}</span>
            </div>
            {event.spots != null && (
              <div className="flex items-center gap-2 text-[#7A8FA6] text-xs font-dm">
                <Users size={13} />
                <span>{event.spots} spots available</span>
              </div>
            )}
          </div>

          <div className="mt-2 pt-3 border-t border-[#D2DCE8]">
            {event.registrationOpen ? (
              <div className="w-full text-center font-dm font-semibold text-sm text-white bg-[#F47C20] group-hover:bg-[#e06a10] transition-colors py-2 rounded-xl">
                {isFree ? "Join Free →" : "Register Now →"}
              </div>
            ) : (
              <div
                onClick={e => { e.preventDefault(); setNotifyOpen(true); }}
                className="w-full flex items-center justify-center gap-1.5 font-dm font-semibold text-sm text-white bg-[#1B3A6B] hover:bg-[#2251A3] transition-colors py-2 rounded-xl cursor-pointer"
              >
                <Bell size={13} /> Join Waitlist
              </div>
            )}
          </div>
        </div>
      </Link>
      </div>
    </>
  );
}


function TechEventCard({ ev }: { ev: TechEvent }) {
  return (
    <a
      href={ev.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col group"
    >
      <div className="relative w-full h-40 overflow-hidden">
        <Image
          src={ev.coverImage}
          alt={ev.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute bottom-3 left-3 text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
          INDUSTRY EVENT
        </span>
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-syne font-bold text-base text-[#0D1B2A] group-hover:text-[#2251A3] transition-colors">{ev.name}</h3>
        <p className="font-dm text-xs text-[#7A8FA6] font-medium">{ev.organizer}</p>
        <p className="font-dm text-sm text-[#3A4A5C] leading-relaxed flex-1 line-clamp-2">{ev.description}</p>
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center gap-2 text-[#7A8FA6] text-xs font-dm">
            <Calendar size={12} /><span>{ev.when}</span>
          </div>
          <div className="flex items-center gap-2 text-[#7A8FA6] text-xs font-dm">
            <MapPin size={12} /><span>{ev.location}</span>
          </div>
        </div>
        <div className="pt-3 border-t border-[#D2DCE8] mt-1 flex items-center justify-between">
          <span className="font-dm text-xs font-semibold text-[#2251A3] group-hover:text-[#F47C20] transition-colors">
            Visit official site →
          </span>
          <ExternalLink size={12} className="text-[#7A8FA6]" />
        </div>
      </div>
    </a>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events ?? []);
        }
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = events.filter((e) => {
    if (activeFilter === "all") return true;
    return e.type.toLowerCase() === activeFilter;
  });

  return (
    <main className="min-h-screen bg-[#F4F7FB]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0D1B2A] via-[#1B3A6B] to-[#2251A3] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-[#F47C20] text-sm">🎓</span>
            <span className="font-dm text-sm text-white/80">Events & Training</span>
          </div>
          <h1 className="font-syne font-extrabold text-4xl sm:text-5xl lg:text-6xl mb-5 leading-tight">
            Events &amp; Training
          </h1>
          <p className="font-dm text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Level up your AI knowledge — live sessions, workshops, and hands-on training.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="bg-white border-b border-[#D2DCE8] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full font-dm font-medium text-sm transition-all ${
                  activeFilter === tab.id
                    ? "bg-[#1B3A6B] text-white"
                    : "text-[#3A4A5C] hover:bg-[#EBF0FA] hover:text-[#1B3A6B]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TIBLOGICS Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-[#D2DCE8] rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {filtered.length === 0 && activeFilter !== "all" ? (
              <div className="text-center py-16">
                <p className="font-syne font-bold text-xl text-[#1B3A6B] mb-2">No {activeFilter}s yet</p>
                <p className="font-dm text-[#7A8FA6]">Check back soon or explore other categories.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}

            {/* Popular Tech Events */}
            {(activeFilter === "all" || activeFilter === "event") && (
              <div className="mt-16">
                <div className="flex items-center gap-3 mb-6">
                  <div>
                    <h2 className="font-syne font-bold text-2xl text-[#0D1B2A]">Popular Industry Events</h2>
                    <p className="font-dm text-sm text-[#7A8FA6] mt-1">Major tech conferences happening this year — stay informed.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {POPULAR_TECH_EVENTS.map((ev) => (
                    <TechEventCard key={ev.name} ev={ev} />
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-16 bg-gradient-to-r from-[#1B3A6B] to-[#2251A3] rounded-2xl p-8 sm:p-12 text-center text-white">
              <h2 className="font-syne font-bold text-2xl sm:text-3xl mb-3">
                Want private training for your team?
              </h2>
              <p className="font-dm text-white/70 mb-6 max-w-xl mx-auto">
                We offer customized AI training sessions for businesses, organizations, and individuals. Whether you&apos;re building a team capability or advancing your own career and income with AI — let&apos;s design a program that fits your goals.
              </p>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 bg-[#F47C20] hover:bg-[#e06a10] text-white font-dm font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Book a Free Consultation <ArrowRight size={16} />
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
