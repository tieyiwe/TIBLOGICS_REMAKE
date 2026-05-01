"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
    name: "Google I/O",
    organizer: "Google",
    when: "May 2025",
    location: "Mountain View, CA + Online",
    description: "Google's annual developer conference showcasing the latest in Android, AI, Chrome, and Google Cloud.",
    coverImage: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=800&q=80",
    url: "https://io.google/2025/",
  },
  {
    name: "Microsoft Build",
    organizer: "Microsoft",
    when: "May 2025",
    location: "Seattle, WA + Online",
    description: "Developers gather to explore the latest in Azure, Copilot, and AI-powered developer tools.",
    coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
    url: "https://build.microsoft.com/",
  },
  {
    name: "AWS re:Invent",
    organizer: "Amazon Web Services",
    when: "Dec 2025",
    location: "Las Vegas, NV",
    description: "The world's largest cloud computing conference — announcements, deep dives, and 60,000+ attendees.",
    coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    url: "https://reinvent.awsevents.com/",
  },
  {
    name: "OpenAI DevDay",
    organizer: "OpenAI",
    when: "TBD 2025",
    location: "San Francisco, CA",
    description: "OpenAI's developer event covering GPT updates, new APIs, and the future of AI-powered applications.",
    coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
    url: "https://openai.com/",
  },
  {
    name: "Salesforce Dreamforce",
    organizer: "Salesforce",
    when: "Sep 2025",
    location: "San Francisco, CA",
    description: "The world's largest software conference — AI, CRM innovation, and Agentforce keynotes.",
    coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
    url: "https://www.salesforce.com/dreamforce/",
  },
  {
    name: "TechCrunch Disrupt",
    organizer: "TechCrunch",
    when: "Oct 2025",
    location: "San Francisco, CA",
    description: "Startup pitches, industry leaders, and the Startup Battlefield. A must for entrepreneurs and investors.",
    coverImage: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80",
    url: "https://techcrunch.com/events/tc-disrupt-2025/",
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
            <h3 className="font-syne font-bold text-xl text-[#0D1B2A] mb-2">You&apos;re on the list!</h3>
            <p className="font-dm text-sm text-[#3A4A5C]">We&apos;ll notify you as soon as this training is ready.</p>
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
                <h3 className="font-syne font-bold text-lg text-[#0D1B2A] leading-tight">Get Notified</h3>
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
                    <Bell size={14} /> Notify Me
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
  const registerHref = event.stripePaymentLink || "/book";

  return (
    <>
      {notifyOpen && <NotifyModal eventName={event.title} onClose={() => setNotifyOpen(false)} />}
      <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
        <img
          src={event.coverImage || TYPE_FALLBACK_IMAGE[event.type] || TYPE_FALLBACK_IMAGE.EVENT}
          alt={event.title}
          className="w-full h-48 object-cover"
        />

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

          <h3 className="font-syne font-bold text-lg text-[#0D1B2A] leading-snug">
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

          <div className="flex gap-2 mt-2 pt-3 border-t border-[#D2DCE8]">
            <Link
              href={`/events/${event.slug}`}
              className="flex-1 text-center font-dm font-medium text-sm text-[#2251A3] hover:text-[#1B3A6B] transition-colors py-2 rounded-xl border border-[#D2DCE8] hover:border-[#2251A3]"
            >
              Learn More
            </Link>
            {event.registrationOpen ? (
              <a
                href={registerHref}
                target={event.stripePaymentLink ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="flex-1 text-center font-dm font-semibold text-sm text-white bg-[#F47C20] hover:bg-[#e06a10] transition-colors py-2 rounded-xl"
              >
                {isFree ? "Join Free" : "Register"} →
              </a>
            ) : (
              <button
                onClick={() => setNotifyOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 font-dm font-semibold text-sm text-white bg-[#1B3A6B] hover:bg-[#2251A3] transition-colors py-2 rounded-xl"
              >
                <Bell size={13} /> Notify Me
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ComingSoonCard() {
  const [notifyOpen, setNotifyOpen] = useState(false);

  return (
    <>
      {notifyOpen && <NotifyModal eventName="Practical AI Training" onClose={() => setNotifyOpen(false)} />}
      <div className="bg-white border-2 border-[#F47C20]/30 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col relative">
        <div className="w-full h-48 bg-gradient-to-br from-[#1B3A6B] via-[#2251A3] to-[#F47C20] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-16 h-16 border-2 border-white rounded-full" />
            <div className="absolute bottom-6 right-6 w-24 h-24 border-2 border-white rounded-full" />
            <div className="absolute top-12 right-12 w-8 h-8 border border-white rounded-full" />
          </div>
          <div className="text-center z-10">
            <div className="text-4xl mb-2">🚀</div>
            <p className="font-syne font-bold text-white text-lg">Practical AI Training</p>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-1 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-[#2251A3]/10 text-[#2251A3]">
              TRAINING
            </span>
            <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-[#F47C20] text-white ml-auto">
              Coming Soon
            </span>
          </div>

          <h3 className="font-syne font-bold text-lg text-[#0D1B2A] leading-snug">
            🚀 Practical AI Training
          </h3>

          <p className="font-dm text-sm text-[#3A4A5C] leading-relaxed flex-1">
            Hands-on AI implementation training for business owners and teams. Learn to build workflows, automate tasks, and integrate AI into your operations.
          </p>

          <div className="flex items-center gap-2 text-[#7A8FA6] text-xs font-dm">
            <MapPin size={13} />
            <span>Online · Live Sessions</span>
          </div>

          <div className="flex gap-2 mt-2 pt-3 border-t border-[#D2DCE8]">
            <button
              onClick={() => setNotifyOpen(true)}
              className="flex items-center justify-center gap-2 flex-1 text-center font-dm font-semibold text-sm text-white bg-[#F47C20] hover:bg-[#e06a10] transition-colors py-2 rounded-xl"
            >
              <Bell size={14} />
              Get Notified
            </button>
          </div>
        </div>
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
        <img
          src={ev.coverImage}
          alt={ev.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                {/* Always show coming soon card */}
                {(activeFilter === "all" || activeFilter === "training") && (
                  <ComingSoonCard />
                )}
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
                We offer customized AI training sessions for businesses and organizations. Let&apos;s design a program that fits your needs.
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
