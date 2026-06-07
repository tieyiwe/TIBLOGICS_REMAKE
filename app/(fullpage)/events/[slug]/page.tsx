import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import TrainingLandingPage from "./TrainingLandingPage";
import Link from "next/link";
import { Calendar, MapPin, Clock, Users, DollarSign, ArrowLeft } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

// Auto-seed the training event on first load so the page works on a fresh DB.
const TRAINING_EVENT_SEED = {
  slug: "ai-practical-training-cohort-1",
  title: "AI Practical Training — Cohort 1",
  description: "A hands-on 4-session live training where you go from curious to capable — writing with AI, building income, creating automations, and getting your first taste of vibe coding. Live on Zoom. Every Saturday 9:30AM–1PM.",
  type: "TRAINING",
  price: 64900,
  currency: "USD",
  capacity: 30,
  spots: 30,
  location: "Live on Zoom",
  date: new Date("2026-06-20T09:30:00"),
  endDate: new Date("2026-07-11T13:00:00"),
  timeSlot: "9:30AM – 1:00PM ET (Saturdays)",
  timezone: "America/New_York",
  coverImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
  tags: ["ai", "training", "practical", "cohort", "live", "zoom"],
  featured: true,
  published: true,
  registrationOpen: true,
};

export default async function EventPage({ params }: Props) {
  const { slug } = await params;

  let event: typeof TRAINING_EVENT_SEED & { id: string; createdAt: Date; updatedAt: Date; stripePaymentLink?: string | null } | null = null;

  try {
    let raw = await prisma.event.findUnique({ where: { slug } });

    // Auto-seed the training event if it doesn't exist yet.
    if (!raw && slug === "ai-practical-training-cohort-1") {
      raw = await prisma.event.create({ data: TRAINING_EVENT_SEED });
    }

    if (!raw) return notFound();
    if (!raw.published) return notFound();

    event = raw as typeof event;
  } catch {
    return notFound();
  }

  if (!event) return notFound();

  // Training events → full landing page
  if (event.type === "TRAINING") {
    return (
      <TrainingLandingPage
        eventSlug={event.slug}
        startDate={event.date ? event.date.toISOString() : "2026-06-20T09:30:00"}
        spots={event.spots ?? 30}
        stripeLink={event.stripePaymentLink ?? null}
        registrationOpen={event.registrationOpen}
      />
    );
  }

  // All other event types — clean detail page (no platform nav since we're in (fullpage) group)
  const isFree = event.price === 0;
  const priceDisplay = isFree ? "Free" : `$${(event.price / 100).toFixed(0)} ${event.currency}`;
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <div className="bg-white border-b border-[#D2DCE8] px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <Link href="/events" className="inline-flex items-center gap-2 font-dm text-sm text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors">
            <ArrowLeft size={14} /> Back to Events
          </Link>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="font-syne font-extrabold text-3xl sm:text-4xl text-[#0D1B2A] leading-tight mb-4">{event.title}</h1>
            <p className="font-dm text-lg text-[#3A4A5C] leading-relaxed mb-6">{event.description}</p>
          </div>
          <div>
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 sticky top-6 flex flex-col gap-4">
              <h3 className="font-syne font-bold text-[#0D1B2A] text-lg">Event Details</h3>
              <div className="flex flex-col gap-3 text-sm">
                {event.date && (
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-[#F47C20] mt-0.5 flex-shrink-0" />
                    <div><p className="font-dm font-semibold text-[#0D1B2A]">Date</p><p className="font-dm text-[#3A4A5C]">{formatDate(new Date(event.date))}</p></div>
                  </div>
                )}
                {event.timeSlot && (
                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-[#F47C20] mt-0.5 flex-shrink-0" />
                    <div><p className="font-dm font-semibold text-[#0D1B2A]">Time</p><p className="font-dm text-[#3A4A5C]">{event.timeSlot}</p></div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-[#F47C20] mt-0.5 flex-shrink-0" />
                  <div><p className="font-dm font-semibold text-[#0D1B2A]">Location</p><p className="font-dm text-[#3A4A5C]">{event.location}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign size={16} className="text-[#F47C20] mt-0.5 flex-shrink-0" />
                  <div><p className="font-dm font-semibold text-[#0D1B2A]">Price</p><p className="font-dm text-[#3A4A5C]">{priceDisplay}</p></div>
                </div>
                {event.spots != null && (
                  <div className="flex items-start gap-3">
                    <Users size={16} className="text-[#F47C20] mt-0.5 flex-shrink-0" />
                    <div><p className="font-dm font-semibold text-[#0D1B2A]">Availability</p><p className="font-dm text-[#3A4A5C]">{event.spots} spots available</p></div>
                  </div>
                )}
              </div>
              {event.registrationOpen ? (
                <a href={event.stripePaymentLink || "/book"} className="block text-center font-dm font-semibold text-white bg-[#F47C20] hover:bg-[#e06a10] transition-colors py-3 px-6 rounded-xl mt-2">
                  {isFree ? "Join Free →" : "Register Now →"}
                </a>
              ) : (
                <div className="bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl p-3 text-center">
                  <p className="font-dm text-sm text-[#7A8FA6]">Registration is currently closed.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
