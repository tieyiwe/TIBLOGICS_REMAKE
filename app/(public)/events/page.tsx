"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users, Clock, ArrowRight, Bell, X, ExternalLink } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";

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
  spotsLeft?: number | null;
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
  /** Dictionary id: pages.events.tech.<id>.desc */
  id: string;
  name: string;
  organizer: string;
  /** First day, ISO. Missing when only the months are known. */
  startsOn?: string;
  /** Last day, ISO. Drives the past/upcoming filter below. */
  endsOn: string;
  /** Dictionary id: pages.events.place.<place> */
  place: string;
  online?: boolean;
  coverImage: string;
  url: string;
}

const POPULAR_TECH_EVENTS: TechEvent[] = [
  {
    id: "wwdc",
    name: "Apple WWDC 2026",
    startsOn: "2026-06-09",
    endsOn: "2026-06-13",
    organizer: "Apple",
    place: "cupertino",
    online: true,
    coverImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    url: "https://developer.apple.com/wwdc26/",
  },
  {
    id: "vivatech",
    name: "VivaTech 2026",
    startsOn: "2026-06-11",
    endsOn: "2026-06-14",
    organizer: "Vivendi / Les Echos",
    place: "paris",
    coverImage: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80",
    url: "https://vivatechnology.com/",
  },
  {
    id: "collision",
    name: "Collision Conference 2026",
    startsOn: "2026-06-16",
    endsOn: "2026-06-19",
    organizer: "Collision",
    place: "toronto",
    coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
    url: "https://collisionconf.com/",
  },
  {
    id: "ltw",
    name: "London Tech Week 2026",
    startsOn: "2026-06-15",
    endsOn: "2026-06-19",
    organizer: "London & Partners",
    place: "london",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    url: "https://londontechweek.com/",
  },
  {
    id: "transform",
    name: "VentureBeat Transform 2026",
    startsOn: "2026-07-14",
    endsOn: "2026-07-15",
    organizer: "VentureBeat",
    place: "sf",
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
    url: "https://events.venturebeat.com/ai-impact-summit/",
  },
  {
    id: "blackhat",
    name: "Black Hat USA 2026",
    startsOn: "2026-08-01",
    endsOn: "2026-08-06",
    organizer: "Black Hat",
    place: "vegas",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    url: "https://www.blackhat.com/us-26/",
  },
  {
    id: "siggraph",
    name: "SIGGRAPH 2026",
    startsOn: "2026-08-10",
    endsOn: "2026-08-14",
    organizer: "ACM SIGGRAPH",
    place: "denver",
    coverImage: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=800&q=80",
    url: "https://s2026.siggraph.org/",
  },
  {
    id: "dreamforce",
    name: "Salesforce Dreamforce 2026",
    startsOn: "2026-09-15",
    endsOn: "2026-09-18",
    organizer: "Salesforce",
    place: "sf",
    coverImage: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=800&q=80",
    url: "https://www.salesforce.com/dreamforce/",
  },
  {
    id: "aisummit",
    name: "AI Summit New York 2026",
    startsOn: "2026-09-23",
    endsOn: "2026-09-24",
    organizer: "AI Summit",
    place: "ny",
    coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
    url: "https://theaisummit.com/newyork/",
  },
  {
    id: "disrupt",
    name: "TechCrunch Disrupt 2026",
    startsOn: "2026-10-07",
    endsOn: "2026-10-09",
    organizer: "TechCrunch",
    place: "sf",
    coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    url: "https://techcrunch.com/events/tc-disrupt-2026/",
  },
  {
    id: "gitex",
    name: "GITEX Global 2026",
    startsOn: "2026-10-12",
    endsOn: "2026-10-16",
    organizer: "DWTC",
    place: "dubai",
    coverImage: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80",
    url: "https://www.gitex.com/",
  },
  {
    id: "gartner",
    name: "Gartner IT Symposium/Xpo 2026",
    startsOn: "2026-10-19",
    endsOn: "2026-10-22",
    organizer: "Gartner",
    place: "orlando",
    coverImage: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80",
    url: "https://www.gartner.com/en/conferences/na/symposium-us",
  },
  {
    id: "devday",
    name: "OpenAI DevDay 2026",
    // Dates not announced yet: shown as "Oct/Nov 2026".
    endsOn: "2026-11-30",
    organizer: "OpenAI",
    place: "sf",
    coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
    url: "https://openai.com/",
  },
  {
    id: "websummit",
    name: "Web Summit 2026",
    startsOn: "2026-11-04",
    endsOn: "2026-11-07",
    organizer: "Web Summit",
    place: "lisbon",
    coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
    url: "https://websummit.com/",
  },
  {
    id: "ignite",
    name: "Microsoft Ignite 2026",
    startsOn: "2026-11-10",
    endsOn: "2026-11-14",
    organizer: "Microsoft",
    place: "chicago",
    online: true,
    coverImage: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80",
    url: "https://ignite.microsoft.com/",
  },
  {
    id: "reinvent",
    name: "AWS re:Invent 2026",
    startsOn: "2026-12-01",
    endsOn: "2026-12-05",
    organizer: "Amazon Web Services",
    place: "vegas",
    coverImage: "https://images.unsplash.com/photo-1676299081847-824916de030a?auto=format&fit=crop&w=800&q=80",
    url: "https://reinvent.awsevents.com/",
  },
  {
    id: "ces",
    name: "CES 2027",
    startsOn: "2027-01-06",
    endsOn: "2027-01-09",
    organizer: "Consumer Technology Association",
    place: "vegas",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    url: "https://www.ces.tech/",
  },
  {
    id: "mwc",
    name: "Mobile World Congress 2027",
    startsOn: "2027-02-22",
    endsOn: "2027-02-25",
    organizer: "GSMA",
    place: "barcelona",
    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    url: "https://www.mwcbarcelona.com/",
  },
];

/**
 * Industry events that have not finished yet, soonest first.
 *
 * The list used to render verbatim, and the dates were display text ("Jun 9-13,
 * 2026") that no code can compare against today — so every entry stayed on the
 * page forever and the section filled up with conferences that had already
 * happened. endsOn is the machine-readable counterpart; this drops anything
 * past and keeps the rest in order, with no maintenance.
 *
 * Annual events whose next edition is not announced simply disappear until
 * someone updates endsOn — better an honest gap than a wrong date.
 */
function upcomingTechEvents(now: Date = new Date()): TechEvent[] {
  const today = now.toISOString().slice(0, 10);
  return POPULAR_TECH_EVENTS
    .filter((e) => e.endsOn >= today)
    .sort((a, b) => a.endsOn.localeCompare(b.endsOn));
}


const FILTER_TABS = ["all", "event", "training", "workshop", "webinar"];

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

function formatDate(dateStr: string, locale: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

/** Money in the event's own currency, written the visitor's way. */
function formatPrice(cents: number, currency: string, locale: string) {
  const whole = cents % 100 === 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(whole ? 0 : 2)}`;
  }
}

type T = (key: string, vars?: Record<string, string | number>) => string;

/** "9–13 June 2026" in the visitor's language, from the ISO days. */
function techEventWhen(ev: TechEvent, locale: string, t: T): string {
  const end = new Date(`${ev.endsOn}T12:00:00Z`);
  if (!ev.startsOn) return t("pages.events.octNov", { y: end.getUTCFullYear() });
  const start = new Date(`${ev.startsOn}T12:00:00Z`);
  const f = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return f.formatRange(start, end);
}

function NotifyModal({ eventName, eventSlug, onClose }: { eventName: string; eventSlug: string; onClose: () => void }) {
  const t = useT();
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/events/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), whatsapp: form.whatsapp.trim() || null, event: eventName, slug: eventSlug }),
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
        <button onClick={onClose} aria-label={t("pages.events.notify.close")} className="absolute top-4 right-4 text-[#7A8FA6] hover:text-[#0D1B2A]">
          <X size={18} />
        </button>

        {status === "done" ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="font-syne font-bold text-xl text-[#0D1B2A] mb-2">{t("pages.events.notify.done.title")}</h3>
            <p className="font-dm text-sm text-[#3A4A5C]">{t("pages.events.notify.done.body")}</p>
            <button onClick={onClose} className="mt-5 w-full bg-[#1B3A6B] text-white rounded-xl py-2.5 font-dm font-semibold text-sm hover:bg-[#2251A3] transition-colors">
              {t("pages.events.notify.close")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5 pr-6">
              <div className="w-10 h-10 shrink-0 rounded-full bg-[#F47C20]/10 flex items-center justify-center">
                <Bell size={18} className="text-[#F47C20]" />
              </div>
              <div>
                <h3 className="font-syne font-bold text-lg text-[#0D1B2A] leading-tight">{t("pages.events.notify.title")}</h3>
                <p className="font-dm text-xs text-[#7A8FA6]">{eventName}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder={t("pages.events.notify.name")}
                aria-label={t("pages.events.notify.name")}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl px-4 py-2.5 text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:border-[#2251A3] focus:ring-1 focus:ring-[#2251A3]/20"
                required
              />
              <input
                type="email"
                placeholder={t("pages.events.notify.email")}
                aria-label={t("pages.events.notify.email")}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl px-4 py-2.5 text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:border-[#2251A3] focus:ring-1 focus:ring-[#2251A3]/20"
                required
              />
              <input
                type="tel"
                placeholder={t("pages.events.notify.whatsapp")}
                aria-label={t("pages.events.notify.whatsapp")}
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                className="w-full bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl px-4 py-2.5 text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:border-[#2251A3] focus:ring-1 focus:ring-[#2251A3]/20"
              />
              {status === "error" && (
                <p className="text-xs text-red-500 font-dm">{t("pages.events.notify.error")}</p>
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
                    <Bell size={14} /> {t("pages.events.notify.submit")}
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

/**
 * Has this event's last session already happened?
 *
 * Read from the date rather than from registrationOpen, because the flag is set
 * by hand and nobody remembers to clear it. The June cohort sat on this page
 * badged "Open Now" and taking $849 registrations for three months after it
 * finished. A date in the past now closes an event on its own.
 */
function hasFinished(event: EventItem, now: Date = new Date()): boolean {
  const last = event.endDate ?? event.date;
  if (!last) return false; // "date TBA" is not a past event
  const end = new Date(last);
  if (isNaN(end.getTime())) return false;
  // Give the final day its full length rather than closing it at midnight.
  return end.getTime() + 24 * 60 * 60 * 1000 < now.getTime();
}

function EventCard({ event }: { event: EventItem }) {
  const t = useT();
  const locale = useLocale();
  const typeLabel = t(`pages.events.type.${event.type}`);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const isFree = event.price === 0;
  const typeColor = TYPE_COLORS[event.type] ?? "bg-gray-100 text-gray-700";
  const finished = hasFinished(event);
  const isOpen = event.registrationOpen && !finished;

  const gradientBorder = isOpen
    ? "linear-gradient(135deg, #22c55e, #16a34a)"
    : "linear-gradient(135deg, #F47C20, #f9a738)";

  // Tags prefixed with "module:" render as module pills on the card
  const modules = event.tags.filter(t => t.startsWith("module:")).map(t => t.slice(7));

  const inner = (
    <div className={`bg-white flex flex-col h-full${isOpen ? " group" : ""}`} style={{ borderRadius: "16px", overflow: "hidden" }}>
      <div className="relative w-full h-48 overflow-hidden flex-shrink-0">
        <Image
          src={event.coverImage || TYPE_FALLBACK_IMAGE[event.type] || TYPE_FALLBACK_IMAGE.EVENT}
          alt={event.title}
          fill
          unoptimized
          className={`object-cover transition-transform duration-500${isOpen ? " group-hover:scale-[1.02]" : ""}`}
        />
        {isOpen ? (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-500 text-white text-xs font-dm font-semibold px-3 py-1 rounded-full shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
            {t("pages.events.card.openNow")}
          </div>
        ) : finished ? (
          // A cohort that has run is neither open nor coming: saying "Coming
          // Soon" over a date that has passed is worse than saying nothing.
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#3A4A5C] text-white text-xs font-dm font-semibold px-3 py-1 rounded-full shadow">
            {t("pages.events.card.completed")}
          </div>
        ) : (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#F47C20] text-white text-xs font-dm font-semibold px-3 py-1 rounded-full shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
            {t("pages.events.card.comingSoon")}
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-dm font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>
            {typeLabel.startsWith("pages.") ? event.type : typeLabel}
          </span>
          {event.featured && (
            <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-[#F47C20]/10 text-[#F47C20]">
              {t("pages.events.card.featured")}
            </span>
          )}
          {!isOpen && (
            <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-[#F47C20]/10 text-[#F47C20] ml-auto">
              {event.price > 0
                ? formatPrice(event.price, event.currency, locale)
                : t("pages.events.card.priceTba")}
            </span>
          )}
          {isOpen && (isFree ? (
            <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 ml-auto">{t("pages.events.card.free")}</span>
          ) : (
            <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-[#F47C20]/10 text-[#F47C20] ml-auto">
              {formatPrice(event.price, event.currency, locale)}
            </span>
          ))}
        </div>

        <h3 className={`font-syne font-bold text-lg text-[#0D1B2A] leading-snug transition-colors${isOpen ? " group-hover:text-[#F47C20]" : ""}`}>
          {event.title}
        </h3>

        <p className="font-dm text-sm text-[#3A4A5C] leading-relaxed line-clamp-2">
          {event.description}
        </p>

        {/* Module pills */}
        {modules.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="font-dm text-[10px] font-semibold text-[#7A8FA6] uppercase tracking-widest">{t("pages.events.card.modules")}</p>
            {modules.map((m, i) => (
              <div key={m} className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#F47C20]/10 text-[#F47C20] font-syne font-bold text-[10px] flex items-center justify-center">{i + 1}</span>
                <span className="font-dm text-xs text-[#0D1B2A] font-medium leading-snug">{m}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1.5 mt-auto">
          {event.date && (
            <div className="flex items-center gap-2 text-[#7A8FA6] text-xs font-dm">
              <Calendar size={13} /><span>{formatDate(event.date, locale)}</span>
            </div>
          )}
          {event.timeSlot && (
            <div className="flex items-center gap-2 text-[#7A8FA6] text-xs font-dm">
              <Clock size={13} /><span>{event.timeSlot}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[#7A8FA6] text-xs font-dm">
            <MapPin size={13} /><span>{event.location}</span>
          </div>
          {isOpen && event.spotsLeft != null && (
            <div className={`flex items-center gap-2 text-xs font-dm font-semibold ${event.spotsLeft <= 5 ? "text-red-500" : "text-[#F47C20]"}`}>
              <Users size={13} />
              <span>
                {event.spotsLeft === 0
                  ? t("pages.events.card.soldOut")
                  : event.spotsLeft === 1
                  ? t("pages.events.card.onlyOne")
                  : event.spotsLeft <= 5
                  ? t("pages.events.card.onlyFew", { n: event.spotsLeft })
                  : t("pages.events.card.seatsLeft", { n: event.spotsLeft.toLocaleString(locale) })}
              </span>
            </div>
          )}
          {!isOpen && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-dm font-semibold px-2.5 py-0.5 rounded-full bg-[#F47C20]/10 text-[#F47C20]">
                <Calendar size={12} /><span>{t("pages.events.card.thisJune")}</span>
              </div>
              {event.spots != null && (
                <div className="flex items-center gap-1.5 text-xs font-dm font-semibold text-[#F47C20]">
                  <Users size={13} /><span>{t("pages.events.card.seatsAvailable", { n: event.spots.toLocaleString(locale) })}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-[#D2DCE8]">
          {isOpen ? (
            <div className="w-full text-center font-dm font-semibold text-sm text-white bg-[#F47C20] group-hover:bg-[#e06a10] transition-colors py-2 rounded-xl">
              {isFree ? t("pages.events.card.joinFree") : t("pages.events.card.register")}
            </div>
          ) : (
            <div
              onClick={e => { e.preventDefault(); e.stopPropagation(); setNotifyOpen(true); }}
              className="w-full flex items-center justify-center gap-1.5 font-dm font-semibold text-sm text-white bg-[#1B3A6B] hover:bg-[#2251A3] transition-colors py-2 rounded-xl cursor-pointer"
            >
              <Bell size={13} /> {t("pages.events.card.waitlist")}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {notifyOpen && <NotifyModal eventName={event.title} eventSlug={event.slug} onClose={() => setNotifyOpen(false)} />}
      <div style={{ padding: "2px", borderRadius: "18px", background: gradientBorder }} className="hover:-translate-y-0.5 transition-transform duration-300">
        <Link href={`/events/${event.slug}`} className="h-full flex flex-col" style={{ borderRadius: "16px" }}>
          {inner}
        </Link>
      </div>
    </>
  );
}


function TechEventCard({ ev }: { ev: TechEvent }) {
  const t = useT();
  const locale = useLocale();
  const place = t(`pages.events.place.${ev.place}`);
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
          {t("pages.events.industry.badge")}
        </span>
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-syne font-bold text-base text-[#0D1B2A] group-hover:text-[#2251A3] transition-colors">{ev.name}</h3>
        <p className="font-dm text-xs text-[#7A8FA6] font-medium">{ev.organizer}</p>
        <p className="font-dm text-sm text-[#3A4A5C] leading-relaxed flex-1 line-clamp-2">{t(`pages.events.tech.${ev.id}.desc`)}</p>
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center gap-2 text-[#7A8FA6] text-xs font-dm">
            <Calendar size={12} /><span>{techEventWhen(ev, locale, t)}</span>
          </div>
          <div className="flex items-center gap-2 text-[#7A8FA6] text-xs font-dm">
            <MapPin size={12} /><span>{ev.online ? t("pages.events.online", { place }) : place}</span>
          </div>
        </div>
        <div className="pt-3 border-t border-[#D2DCE8] mt-1 flex items-center justify-between">
          <span className="font-dm text-xs font-semibold text-[#2251A3] group-hover:text-[#F47C20] transition-colors">
            {t("pages.events.industry.visit")}
          </span>
          <ExternalLink size={12} className="text-[#7A8FA6]" />
        </div>
      </div>
    </a>
  );
}

export default function EventsPage() {
  const t = useT();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
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
    // Re-fetch every 60 s so spotsLeft stays current as people register
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const filtered = events.filter((e) => {
    if (activeFilter === "all") return true;
    return e.type.toLowerCase() === activeFilter;
  });

  // Computed once per mount rather than per render, so the list cannot shift
  // underneath a re-render and server and client agree on the same day.
  const upcomingEvents = useMemo(() => upcomingTechEvents(), []);

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0D1B2A] via-[#1B3A6B] to-[#2251A3] text-white pt-28 sm:pt-36 lg:pt-44 pb-10 sm:pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-[#F47C20] text-sm">🎓</span>
            <span className="font-dm text-sm text-white/80">{t("pages.events.hero.badge")}</span>
          </div>
          <h1 className="font-syne font-extrabold text-4xl sm:text-5xl lg:text-6xl mb-4 leading-tight">
            {t("pages.events.hero.title")}
          </h1>
          <p className="font-dm text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            {t("pages.events.hero.body")}
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="bg-white border-b border-[#D2DCE8] sticky top-[89px] lg:top-[137px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`flex-shrink-0 px-4 py-2 rounded-full font-dm font-medium text-sm transition-all ${
                  activeFilter === tab
                    ? "bg-[#1B3A6B] text-white"
                    : "text-[#3A4A5C] hover:bg-[#EBF0FA] hover:text-[#1B3A6B]"
                }`}
              >
                {t(`pages.events.filter.${tab}`)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TIBLOGICS Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-[#D2DCE8] rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {filtered.length === 0 ? (
              // On "All" an empty TIBLOGICS list says nothing: the industry
              // events below fill the page. Other tabs get a short note.
              activeFilter === "all" && upcomingEvents.length > 0 ? null : (
              <div className="text-center py-8">
                <p className="font-syne font-bold text-xl text-[#1B3A6B] mb-2">
                  {t(`pages.events.empty.${activeFilter}`)}
                </p>
                <p className="font-dm text-[#7A8FA6]">{t("pages.events.empty.body")}</p>
              </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}

            {/* Popular Tech Events */}
            {(activeFilter === "all" || activeFilter === "event") && upcomingEvents.length > 0 && (
              <div className={filtered.length === 0 ? "" : "mt-12"}>
                <div className="flex items-center gap-3 mb-6">
                  <div>
                    <h2 className="font-syne font-bold text-2xl text-[#0D1B2A]">{t("pages.events.industry.title")}</h2>
                    <p className="font-dm text-sm text-[#7A8FA6] mt-1">{t("pages.events.industry.body")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((ev) => (
                    <TechEventCard key={ev.id} ev={ev} />
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-16 bg-gradient-to-r from-[#1B3A6B] to-[#2251A3] rounded-2xl p-8 sm:p-12 text-center text-white">
              <h2 className="font-syne font-bold text-2xl sm:text-3xl mb-3">
                {t("pages.events.cta.title")}
              </h2>
              <p className="font-dm text-white/70 mb-6 max-w-xl mx-auto">
                {t("pages.events.cta.body")}
              </p>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 bg-[#F47C20] hover:bg-[#e06a10] text-white font-dm font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                {t("pages.events.cta.button")} <ArrowRight size={16} />
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
