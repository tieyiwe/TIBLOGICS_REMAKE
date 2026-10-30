"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
  url: string;
}

// Major AI and tech conferences, through 2027. Dates are the organizers'
// own (checked October 2026); where the next edition has no announced
// dates, startsOn is left out and endsOn is the last day of the month it
// usually takes place ("Expected May 2027"). Past entries drop off by date.
const POPULAR_TECH_EVENTS: TechEvent[] = [
  {
    id: "disrupt",
    name: "TechCrunch Disrupt 2026",
    startsOn: "2026-10-07",
    endsOn: "2026-10-09",
    organizer: "TechCrunch",
    place: "sf",
    url: "https://techcrunch.com/events/tc-disrupt-2026/",
  },
  {
    id: "gartner",
    name: "Gartner IT Symposium/Xpo 2026",
    startsOn: "2026-10-19",
    endsOn: "2026-10-22",
    organizer: "Gartner",
    place: "orlando",
    url: "https://www.gartner.com/en/conferences/na/symposium-us",
  },
  {
    id: "devday",
    name: "OpenAI DevDay 2026",
    endsOn: "2026-11-30",
    organizer: "OpenAI",
    place: "sf",
    url: "https://openai.com/",
  },
  {
    id: "websummit",
    name: "Web Summit 2026",
    startsOn: "2026-11-04",
    endsOn: "2026-11-07",
    organizer: "Web Summit",
    place: "lisbon",
    url: "https://websummit.com/",
  },
  {
    id: "ignite",
    name: "Microsoft Ignite 2026",
    startsOn: "2026-11-17",
    endsOn: "2026-11-20",
    organizer: "Microsoft",
    place: "sf",
    online: true,
    url: "https://ignite.microsoft.com/",
  },
  {
    id: "reinvent",
    name: "AWS re:Invent 2026",
    startsOn: "2026-12-01",
    endsOn: "2026-12-05",
    organizer: "Amazon Web Services",
    place: "vegas",
    url: "https://reinvent.awsevents.com/",
  },
  {
    id: "gitex",
    name: "GITEX Global 2026",
    startsOn: "2026-12-07",
    endsOn: "2026-12-11",
    organizer: "Dubai World Trade Centre",
    place: "dubai",
    url: "https://www.gitex.com/",
  },
  {
    id: "ces",
    name: "CES 2027",
    startsOn: "2027-01-06",
    endsOn: "2027-01-09",
    organizer: "Consumer Technology Association",
    place: "vegas",
    url: "https://www.ces.tech/",
  },
  {
    id: "mwc",
    name: "MWC Barcelona 2027",
    startsOn: "2027-03-01",
    endsOn: "2027-03-04",
    organizer: "GSMA",
    place: "barcelona",
    url: "https://www.mwcbarcelona.com/",
  },
  {
    id: "nvidia-gtc-2027",
    name: "NVIDIA GTC 2027",
    startsOn: "2027-03-15",
    endsOn: "2027-03-18",
    organizer: "NVIDIA",
    place: "sanjose",
    online: true,
    url: "https://www.nvidia.com/gtc/",
  },
  {
    id: "sxsw-2027",
    name: "SXSW 2027",
    startsOn: "2027-03-15",
    endsOn: "2027-03-21",
    organizer: "SXSW",
    place: "austin",
    url: "https://sxsw.com/",
  },
  {
    id: "gitex-africa-2027",
    name: "GITEX Africa 2027",
    endsOn: "2027-04-30",
    organizer: "Kaoun International",
    place: "marrakech",
    url: "https://gitexafrica.com/",
  },
  {
    id: "google-io-2027",
    name: "Google I/O 2027",
    endsOn: "2027-05-31",
    organizer: "Google",
    place: "mountainview",
    online: true,
    url: "https://io.google/",
  },
  {
    id: "web-summit-vancouver-2027",
    name: "Web Summit Vancouver 2027",
    startsOn: "2027-05-25",
    endsOn: "2027-05-28",
    organizer: "Web Summit",
    place: "vancouver",
    url: "https://vancouver.websummit.com/",
  },
  {
    id: "toronto-tech-week-2027",
    name: "Toronto Tech Week 2027",
    startsOn: "2027-05-31",
    endsOn: "2027-06-04",
    organizer: "Toronto Tech Week",
    place: "toronto",
    url: "https://www.torontotechweek.com/",
  },
  {
    id: "computex-2027",
    name: "Computex 2027",
    startsOn: "2027-06-01",
    endsOn: "2027-06-04",
    organizer: "TAITRA",
    place: "taipei",
    url: "https://www.computextaipei.com.tw/en/index.html",
  },
  {
    id: "london-tech-week-2027",
    name: "London Tech Week 2027",
    startsOn: "2027-06-07",
    endsOn: "2027-06-11",
    organizer: "Informa Tech",
    place: "london",
    url: "https://londontechweek.com/",
  },
  {
    id: "web-summit-rio-2027",
    name: "Web Summit Rio 2027",
    startsOn: "2027-06-14",
    endsOn: "2027-06-17",
    organizer: "Web Summit",
    place: "rio",
    url: "https://rio.websummit.com/en/",
  },
  {
    id: "vivatech-2027",
    name: "VivaTech 2027",
    startsOn: "2027-06-16",
    endsOn: "2027-06-19",
    organizer: "Publicis Groupe and Les Echos",
    place: "paris",
    url: "https://vivatech.com/",
  },
  {
    id: "microsoft-build-2027",
    name: "Microsoft Build 2027",
    endsOn: "2027-06-30",
    organizer: "Microsoft",
    place: "sf",
    online: true,
    url: "https://build.microsoft.com/",
  },
  {
    id: "wwdc-2027",
    name: "Apple WWDC 2027",
    endsOn: "2027-06-30",
    organizer: "Apple",
    place: "cupertino",
    online: true,
    url: "https://developer.apple.com/wwdc/",
  },
  {
    id: "black-hat-usa-2027",
    name: "Black Hat USA 2027",
    startsOn: "2027-07-31",
    endsOn: "2027-08-05",
    organizer: "Black Hat",
    place: "vegas",
    url: "https://blackhat.com/",
  },
  {
    id: "dreamforce-2027",
    name: "Dreamforce 2027",
    startsOn: "2027-09-21",
    endsOn: "2027-09-23",
    organizer: "Salesforce",
    place: "sf",
    online: true,
    url: "https://www.salesforce.com/dreamforce/",
  },
  {
    id: "techcrunch-disrupt-2027",
    name: "TechCrunch Disrupt 2027",
    endsOn: "2027-10-31",
    organizer: "TechCrunch",
    place: "sf",
    url: "https://techcrunch.com/events/techcrunch-disrupt/",
  },
  {
    id: "gartner-symposium-2027",
    name: "Gartner IT Symposium/Xpo 2027",
    endsOn: "2027-10-31",
    organizer: "Gartner",
    place: "orlando",
    url: "https://www.gartner.com/en/conferences/calendar/all/it-symposium-xpo",
  },
  {
    id: "web-summit-2027",
    name: "Web Summit 2027",
    endsOn: "2027-11-30",
    organizer: "Web Summit",
    place: "lisbon",
    url: "https://websummit.com/",
  },
  {
    id: "microsoft-ignite-2027",
    name: "Microsoft Ignite 2027",
    endsOn: "2027-11-30",
    organizer: "Microsoft",
    place: "sf",
    online: true,
    url: "https://ignite.microsoft.com/",
  },
  {
    id: "ai-summit-new-york-2027",
    name: "The AI Summit New York 2027",
    startsOn: "2027-12-08",
    endsOn: "2027-12-09",
    organizer: "Informa Tech",
    place: "ny",
    url: "https://newyork.theaisummit.com/",
  },
  {
    id: "aws-reinvent-2027",
    name: "AWS re:Invent 2027",
    endsOn: "2027-12-31",
    organizer: "Amazon Web Services",
    place: "vegas",
    online: true,
    url: "https://aws.amazon.com/events/reinvent/",
  },
  {
    id: "gitex-global-2027",
    name: "GITEX Global 2027",
    endsOn: "2027-12-31",
    organizer: "Dubai World Trade Centre",
    place: "dubai",
    url: "https://www.gitex.com/",
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


const TYPE_FILTERS = ["all", "training", "workshop", "webinar", "event"] as const;

const TYPE_COLORS: Record<string, string> = {
  TRAINING: "bg-[#2251A3]/10 text-[#2251A3]",
  EVENT: "bg-purple-100 text-purple-700",
  WORKSHOP: "bg-emerald-100 text-emerald-700",
  WEBINAR: "bg-teal-100 text-teal-700",
};

function formatDate(dateStr: string, locale: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

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

/** "9–13 June 2026", or "Expected March 2027" when only the month is known. */
function techEventWhen(ev: TechEvent, locale: string, t: T): string {
  const end = new Date(`${ev.endsOn}T12:00:00Z`);
  if (!ev.startsOn) {
    const month = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(end);
    return t("pages.events.expected", { month });
  }
  const start = new Date(`${ev.startsOn}T12:00:00Z`);
  const f = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return f.formatRange(start, end);
}

/** The month a conference belongs to in the calendar (its first day, or the expected month). */
const monthKey = (ev: TechEvent) => (ev.startsOn ?? ev.endsOn).slice(0, 7);

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

/** Big date badge: day and month, or "TBA". */
function DateBadge({ iso, locale, tba }: { iso?: string | null; locale: string; tba: string }) {
  if (!iso) {
    return (
      <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#F47C20]/10 text-[#B8500A]">
        <Calendar size={20} aria-hidden />
        <span className="mt-1 font-dm text-[11px] font-bold uppercase tracking-wide">{tba}</span>
      </div>
    );
  }
  const d = new Date(iso);
  return (
    <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#1B3A6B] text-white">
      <span className="font-dm text-[11px] font-bold uppercase tracking-widest text-[#F9B47A]">{d.toLocaleDateString(locale, { month: "short" })}</span>
      <span className="font-syne text-3xl font-extrabold leading-none">{d.getDate()}</span>
      <span className="font-dm text-[10px] text-white/70">{d.getFullYear()}</span>
    </div>
  );
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
  // Tags prefixed with "module:" are the session's modules.
  const modules = event.tags.filter((x) => x.startsWith("module:")).map((x) => x.slice(7));
  const price = event.price > 0 ? formatPrice(event.price, event.currency, locale) : isOpen ? t("pages.events.card.free") : t("pages.events.card.priceTba");

  return (
    <>
      {notifyOpen && <NotifyModal eventName={event.title} eventSlug={event.slug} onClose={() => setNotifyOpen(false)} />}
      <article className={`group relative flex flex-col gap-5 rounded-3xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:p-6 ${isOpen ? "border-green-300" : "border-[#D2DCE8]"}`}>
        <DateBadge iso={event.date} locale={locale} tba={t("pages.events.tba")} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 font-dm text-xs font-semibold ${typeColor}`}>{typeLabel.startsWith("pages.") ? event.type : typeLabel}</span>
            {isOpen ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500 px-2.5 py-0.5 font-dm text-xs font-semibold text-white">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                {t("pages.events.card.openNow")}
              </span>
            ) : finished ? (
              <span className="rounded-full bg-[#3A4A5C] px-2.5 py-0.5 font-dm text-xs font-semibold text-white">{t("pages.events.card.completed")}</span>
            ) : (
              <span className="rounded-full bg-[#F47C20] px-2.5 py-0.5 font-dm text-xs font-semibold text-white">{t("pages.events.card.comingSoon")}</span>
            )}
            {event.featured && <span className="rounded-full bg-[#F47C20]/10 px-2.5 py-0.5 font-dm text-xs font-semibold text-[#B8500A]">{t("pages.events.card.featured")}</span>}
          </div>
          <h3 className="font-syne text-xl font-bold leading-snug text-[#0D1B2A]">
            <Link href={`/events/${event.slug}`} className="after:absolute after:inset-0 after:content-[''] group-hover:text-[#2251A3]">
              {event.title}
            </Link>
          </h3>
          <p className="line-clamp-2 font-dm text-sm leading-relaxed text-[#3A4A5C]">{event.description}</p>
          {modules.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {modules.map((m, i) => (
                <span key={m} className="rounded-full bg-[#F4F7FB] px-2.5 py-1 font-dm text-xs font-medium text-[#1B3A6B]">
                  {i + 1}. {m}
                </span>
              ))}
            </div>
          )}
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-dm text-xs text-[#5A6E84]">
            {event.date && (
              <span className="inline-flex items-center gap-1.5"><Calendar size={13} aria-hidden />{formatDate(event.date, locale)}</span>
            )}
            {event.timeSlot && (
              <span className="inline-flex items-center gap-1.5"><Clock size={13} aria-hidden />{event.timeSlot}</span>
            )}
            <span className="inline-flex items-center gap-1.5"><MapPin size={13} aria-hidden />{event.location}</span>
            {isOpen && event.spotsLeft != null && (
              <span className={`inline-flex items-center gap-1.5 font-semibold ${event.spotsLeft <= 5 ? "text-red-600" : "text-[#B8500A]"}`}>
                <Users size={13} aria-hidden />
                {event.spotsLeft === 0
                  ? t("pages.events.card.soldOut")
                  : event.spotsLeft === 1
                    ? t("pages.events.card.onlyOne")
                    : event.spotsLeft <= 5
                      ? t("pages.events.card.onlyFew", { n: event.spotsLeft })
                      : t("pages.events.card.seatsLeft", { n: event.spotsLeft.toLocaleString(locale) })}
              </span>
            )}
          </div>
        </div>
        <div className="relative z-10 flex shrink-0 flex-row items-center justify-between gap-3 border-t border-[#E3E9F1] pt-4 sm:w-44 sm:flex-col sm:items-stretch sm:justify-center sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <p className="font-syne text-2xl font-extrabold text-[#0D1B2A] sm:text-center">{price}</p>
          {isOpen ? (
            <Link href={`/events/${event.slug}`} className="rounded-xl bg-[#F47C20] px-4 py-2.5 text-center font-dm text-sm font-semibold text-white transition-colors hover:bg-[#e06a10]">
              {isFree ? t("pages.events.card.joinFree") : t("pages.events.card.register")}
            </Link>
          ) : finished ? (
            <Link href={`/events/${event.slug}`} className="rounded-xl border border-[#D2DCE8] px-4 py-2.5 text-center font-dm text-sm font-semibold text-[#1B3A6B] hover:bg-[#F4F7FB]">
              {t("pages.events.card.details")}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setNotifyOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1B3A6B] px-4 py-2.5 font-dm text-sm font-semibold text-white transition-colors hover:bg-[#2251A3]"
            >
              <Bell size={14} aria-hidden /> {t("pages.events.card.waitlist")}
            </button>
          )}
        </div>
      </article>
    </>
  );
}

/** One conference in the calendar: date, name, organizer, place, why it matters, official site. */
function TechEventRow({ ev }: { ev: TechEvent }) {
  const t = useT();
  const locale = useLocale();
  const place = t(`pages.events.place.${ev.place}`);
  const start = ev.startsOn ? new Date(`${ev.startsOn}T12:00:00Z`) : null;
  return (
    <li className="group relative flex gap-4 rounded-2xl border border-[#E3E9F1] bg-white p-4 transition-all hover:border-[#2251A3]/40 hover:shadow-md sm:items-center sm:p-5">
      <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl ${start ? "bg-[#EBF0FA] text-[#1B3A6B]" : "border border-dashed border-[#F47C20]/50 text-[#B8500A]"}`}>
        {start ? (
          <>
            <span className="font-dm text-[10px] font-bold uppercase tracking-widest">{start.toLocaleDateString(locale, { month: "short", timeZone: "UTC" })}</span>
            <span className="font-syne text-2xl font-extrabold leading-none">{start.getUTCDate()}</span>
          </>
        ) : (
          <span className="px-1 text-center font-dm text-[10px] font-bold uppercase leading-tight tracking-wide">{t("pages.events.expectedShort")}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-syne text-base font-bold text-[#0D1B2A]">
            <a href={ev.url} target="_blank" rel="noopener noreferrer" className="after:absolute after:inset-0 after:content-[''] group-hover:text-[#2251A3]">
              {ev.name}
            </a>
          </h3>
          {ev.online && <span className="rounded-full bg-teal-100 px-2 py-0.5 font-dm text-[11px] font-semibold text-teal-700">{t("pages.events.onlineToo")}</span>}
          {!ev.startsOn && <span className="rounded-full bg-[#F47C20]/10 px-2 py-0.5 font-dm text-[11px] font-semibold text-[#B8500A]">{t("pages.events.datesTba")}</span>}
        </div>
        <p className="mt-0.5 line-clamp-2 font-dm text-sm leading-relaxed text-[#3A4A5C]">{t(`pages.events.tech.${ev.id}.desc`)}</p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-dm text-xs text-[#5A6E84]">
          <span className="inline-flex items-center gap-1.5"><Calendar size={12} aria-hidden />{techEventWhen(ev, locale, t)}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin size={12} aria-hidden />{place}</span>
          <span>{ev.organizer}</span>
        </div>
      </div>
      <ExternalLink size={16} className="hidden shrink-0 text-[#7A8FA6] group-hover:text-[#F47C20] sm:block" aria-hidden />
    </li>
  );
}

export default function EventsPage() {
  const t = useT();
  const locale = useLocale();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<(typeof TYPE_FILTERS)[number]>("all");
  const [year, setYear] = useState<string>("all");
  const [notifyGeneral, setNotifyGeneral] = useState(false);

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

  // Our sessions: upcoming first (soonest first, undated after), finished ones last.
  const ours = useMemo(() => {
    const live = events.filter((e) => !hasFinished(e));
    const past = events.filter((e) => hasFinished(e));
    const when = (e: EventItem) => (e.date ? new Date(e.date).getTime() : Number.MAX_SAFE_INTEGER);
    return { live: live.sort((a, b) => when(a) - when(b)), past };
  }, [events]);
  const typesPresent = useMemo(() => new Set(ours.live.map((e) => e.type.toLowerCase())), [ours.live]);
  const shown = ours.live.filter((e) => type === "all" || e.type.toLowerCase() === type);

  // Conferences: computed once per mount, so server and client agree on the day.
  const conferences = useMemo(() => upcomingTechEvents(), []);
  const years = useMemo(() => [...new Set(conferences.map((e) => monthKey(e).slice(0, 4)))].sort(), [conferences]);
  const byMonth = useMemo(() => {
    const list = conferences.filter((e) => year === "all" || monthKey(e).startsWith(year));
    const groups = new Map<string, TechEvent[]>();
    for (const e of list.sort((a, b) => (a.startsOn ?? a.endsOn).localeCompare(b.startsOn ?? b.endsOn))) {
      const k = monthKey(e);
      groups.set(k, [...(groups.get(k) ?? []), e]);
    }
    return [...groups.entries()];
  }, [conferences, year]);
  const monthTitle = (k: string) => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${k}-15T12:00:00Z`));

  const chip = (on: boolean) =>
    `flex-shrink-0 rounded-full px-4 py-2 font-dm text-sm font-medium transition-all ${on ? "bg-[#1B3A6B] text-white" : "bg-white text-[#3A4A5C] ring-1 ring-[#D2DCE8] hover:bg-[#EBF0FA] hover:text-[#1B3A6B]"}`;

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {notifyGeneral && <NotifyModal eventName={t("pages.events.ours.nextSession")} eventSlug="next-live-session" onClose={() => setNotifyGeneral(false)} />}

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0D1B2A] via-[#1B3A6B] to-[#2251A3] px-4 pb-14 pt-28 text-white sm:pt-36 lg:pt-44">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#F47C20]/15 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
            <Calendar size={14} className="text-[#F9B47A]" aria-hidden />
            <span className="font-dm text-sm text-white/85">{t("pages.events.hero.badge")}</span>
          </div>
          <h1 className="max-w-3xl font-syne text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">{t("pages.events.hero.title")}</h1>
          <p className="mt-4 max-w-2xl font-dm text-lg leading-relaxed text-white/75 sm:text-xl">{t("pages.events.hero.body")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#live-sessions" className="inline-flex items-center gap-2 rounded-xl bg-[#F47C20] px-5 py-3 font-dm text-sm font-semibold text-white hover:bg-[#e06a10]">
              {t("pages.events.hero.ctaSessions")} <ArrowRight size={16} aria-hidden />
            </a>
            <a href="#conferences" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 font-dm text-sm font-semibold text-white hover:bg-white/20">
              {t("pages.events.hero.ctaCalendar")}
            </a>
          </div>
          <dl className="mt-10 flex max-w-xl flex-wrap gap-3">
            {/* Only when there is something to count: "0 live sessions" says the wrong thing. */}
            {!loading && ours.live.length > 0 && (
              <div className="min-w-[10rem] flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <dt className="font-dm text-xs uppercase tracking-wide text-white/60">{t("pages.events.stats.sessions")}</dt>
                <dd className="font-syne text-2xl font-extrabold">{ours.live.length}</dd>
              </div>
            )}
            <div className="min-w-[10rem] flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
              <dt className="font-dm text-xs uppercase tracking-wide text-white/60">{t("pages.events.stats.conferences")}</dt>
              <dd className="font-syne text-2xl font-extrabold">{conferences.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Our live sessions */}
        <section id="live-sessions" className="scroll-mt-28 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-dm text-xs font-bold uppercase tracking-[0.18em] text-[#B8500A]">{t("pages.events.ours.kicker")}</p>
              <h2 className="mt-1 font-syne text-2xl font-bold text-[#0D1B2A] sm:text-3xl">{t("pages.events.ours.title")}</h2>
              <p className="mt-1 max-w-2xl font-dm text-sm text-[#5A6E84]">{t("pages.events.ours.body")}</p>
            </div>
          </div>
          {ours.live.length > 0 && typesPresent.size > 1 && (
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t("pages.events.filterLabel")}>
              {TYPE_FILTERS.filter((f) => f === "all" || typesPresent.has(f)).map((f) => (
                <button key={f} type="button" onClick={() => setType(f)} aria-pressed={type === f} className={chip(type === f)}>
                  {t(`pages.events.filter.${f}`)}
                </button>
              ))}
            </div>
          )}
          <div className="mt-6 space-y-4">
            {loading ? (
              [1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-3xl border border-[#D2DCE8] bg-white" />)
            ) : shown.length > 0 ? (
              shown.map((e) => <EventCard key={e.id} event={e} />)
            ) : (
              <div className="grid gap-6 rounded-3xl border border-[#D2DCE8] bg-white p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
                <div>
                  <h3 className="font-syne text-xl font-bold text-[#0D1B2A]">{t("pages.events.ours.emptyTitle")}</h3>
                  <p className="mt-2 max-w-xl font-dm text-sm leading-relaxed text-[#3A4A5C]">{t("pages.events.ours.emptyBody")}</p>
                </div>
                <div className="flex flex-col gap-2 sm:w-56">
                  <Link href="/learning-box" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F47C20] px-4 py-2.5 font-dm text-sm font-semibold text-white hover:bg-[#e06a10]">
                    {t("pages.events.ours.learnNow")} <ArrowRight size={15} aria-hidden />
                  </Link>
                  <button type="button" onClick={() => setNotifyGeneral(true)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#D2DCE8] px-4 py-2.5 font-dm text-sm font-semibold text-[#1B3A6B] hover:bg-[#F4F7FB]">
                    <Bell size={14} aria-hidden /> {t("pages.events.ours.notifyMe")}
                  </button>
                </div>
              </div>
            )}
          </div>
          {ours.past.length > 0 && (
            <details className="mt-4 rounded-2xl border border-[#E3E9F1] bg-white/60 p-4">
              <summary className="cursor-pointer font-dm text-sm font-semibold text-[#3A4A5C]">{t("pages.events.ours.past", { n: ours.past.length })}</summary>
              <ul className="mt-3 space-y-2">
                {ours.past.map((e) => (
                  <li key={e.id}>
                    <Link href={`/events/${e.slug}`} className="font-dm text-sm text-[#2251A3] hover:underline">
                      {e.title}
                    </Link>
                    {e.date && <span className="font-dm text-xs text-[#7A8FA6]"> · {formatDate(e.date, locale)}</span>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        {/* Conference calendar */}
        {conferences.length > 0 && (
          <section id="conferences" className="scroll-mt-28 pt-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-dm text-xs font-bold uppercase tracking-[0.18em] text-[#2251A3]">{t("pages.events.industry.kicker")}</p>
                <h2 className="mt-1 font-syne text-2xl font-bold text-[#0D1B2A] sm:text-3xl">{t("pages.events.industry.title")}</h2>
                <p className="mt-1 max-w-2xl font-dm text-sm text-[#5A6E84]">{t("pages.events.industry.body")}</p>
              </div>
              {years.length > 1 && (
                <div className="flex gap-2" role="group" aria-label={t("pages.events.yearLabel")}>
                  {["all", ...years].map((y) => (
                    <button key={y} type="button" onClick={() => setYear(y)} aria-pressed={year === y} className={chip(year === y)}>
                      {y === "all" ? t("pages.events.filter.all") : y}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6 space-y-8">
              {byMonth.map(([k, list]) => (
                <div key={k}>
                  <h3 className="sticky top-[76px] z-10 -mx-1 mb-3 bg-[#F4F7FB]/95 px-1 py-1 font-syne text-lg font-bold capitalize text-[#1B3A6B] backdrop-blur lg:top-[120px]">{monthTitle(k)}</h3>
                  <ul className="space-y-3">
                    {list.map((ev) => (
                      <TechEventRow key={ev.id} ev={ev} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-4 font-dm text-xs text-[#7A8FA6]">{t("pages.events.industry.note")}</p>
          </section>
        )}

        {/* Private training */}
        <section className="py-16">
          <div className="grid gap-6 rounded-3xl bg-gradient-to-r from-[#1B3A6B] to-[#2251A3] p-8 text-white sm:p-12 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="font-syne text-2xl font-bold sm:text-3xl">{t("pages.events.cta.title")}</h2>
              <p className="mt-3 max-w-xl font-dm text-white/75">{t("pages.events.cta.body")}</p>
            </div>
            <Link href="/book" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F47C20] px-6 py-3 font-dm font-semibold text-white transition-colors hover:bg-[#e06a10]">
              {t("pages.events.cta.button")} <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
