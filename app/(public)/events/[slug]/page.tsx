import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Clock, Users, ArrowLeft, DollarSign } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const TYPE_COLORS: Record<string, string> = {
  TRAINING: "bg-[#2251A3]/10 text-[#2251A3]",
  EVENT: "bg-purple-100 text-purple-700",
  WORKSHOP: "bg-emerald-100 text-emerald-700",
  WEBINAR: "bg-teal-100 text-teal-700",
};

const TYPE_FALLBACK_IMAGE: Record<string, string> = {
  TRAINING: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
  WORKSHOP: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  WEBINAR: "https://images.unsplash.com/photo-1587440871875-191322ee64b0?auto=format&fit=crop&w=1200&q=80",
  EVENT: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80",
};

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;

  let event = null;
  try {
    const { prisma } = await import("@/lib/prisma");
    event = await prisma.event.findUnique({ where: { slug } });
  } catch {
    notFound();
  }

  if (!event || !event.published) {
    notFound();
  }

  const isFree = event.price === 0;
  const registerHref = event.stripePaymentLink || "/book";
  const typeColor = TYPE_COLORS[event.type] ?? "bg-gray-100 text-gray-700";

  return (
    <main className="min-h-screen bg-[#F4F7FB]">
      {/* Back link */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 font-dm text-sm text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Events
        </Link>
      </div>

      {/* Hero image */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <img
          src={event.coverImage || TYPE_FALLBACK_IMAGE[event.type] || TYPE_FALLBACK_IMAGE.EVENT}
          alt={event.title}
          className="w-full h-64 sm:h-80 object-cover rounded-2xl"
        />
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: details */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`text-xs font-dm font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>
                {event.type}
              </span>
              {event.featured && (
                <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-[#F47C20]/10 text-[#F47C20]">
                  Featured
                </span>
              )}
              {isFree ? (
                <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  Free
                </span>
              ) : (
                <span className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full bg-[#F47C20]/10 text-[#F47C20]">
                  ${(event.price / 100).toFixed(0)} {event.currency}
                </span>
              )}
            </div>

            <h1 className="font-syne font-extrabold text-3xl sm:text-4xl text-[#0D1B2A] leading-tight mb-4">
              {event.title}
            </h1>

            <p className="font-dm text-lg text-[#3A4A5C] leading-relaxed mb-8">
              {event.description}
            </p>

            {event.content && (
              <div
                className="font-dm text-[#3A4A5C] leading-relaxed prose prose-headings:font-syne prose-headings:text-[#0D1B2A] prose-a:text-[#2251A3] prose-strong:text-[#0D1B2A] max-w-none"
                dangerouslySetInnerHTML={{ __html: event.content }}
              />
            )}

            {event.tags && event.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-dm text-xs text-[#7A8FA6] bg-white border border-[#D2DCE8] px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right: sidebar / CTA */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 sticky top-20 flex flex-col gap-4">
              <h3 className="font-syne font-bold text-[#0D1B2A] text-lg">Event Details</h3>

              <div className="flex flex-col gap-3 text-sm">
                {event.date && (
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-[#F47C20] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-dm font-semibold text-[#0D1B2A]">Date</p>
                      <p className="font-dm text-[#3A4A5C]">{formatDate(new Date(event.date))}</p>
                      {event.endDate && new Date(event.endDate).toDateString() !== new Date(event.date).toDateString() && (
                        <p className="font-dm text-[#7A8FA6] text-xs">to {formatDate(new Date(event.endDate))}</p>
                      )}
                    </div>
                  </div>
                )}

                {event.timeSlot && (
                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-[#F47C20] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-dm font-semibold text-[#0D1B2A]">Time</p>
                      <p className="font-dm text-[#3A4A5C]">{event.timeSlot}</p>
                      <p className="font-dm text-[#7A8FA6] text-xs">{event.timezone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-[#F47C20] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-dm font-semibold text-[#0D1B2A]">Location</p>
                    <p className="font-dm text-[#3A4A5C]">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign size={16} className="text-[#F47C20] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-dm font-semibold text-[#0D1B2A]">Price</p>
                    <p className="font-dm text-[#3A4A5C]">
                      {isFree ? "Free" : `$${(event.price / 100).toFixed(0)} ${event.currency}`}
                    </p>
                  </div>
                </div>

                {event.spots != null && (
                  <div className="flex items-start gap-3">
                    <Users size={16} className="text-[#F47C20] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-dm font-semibold text-[#0D1B2A]">Availability</p>
                      <p className="font-dm text-[#3A4A5C]">{event.spots} spots available</p>
                    </div>
                  </div>
                )}
              </div>

              {event.registrationOpen ? (
                <a
                  href={registerHref}
                  target={event.stripePaymentLink ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="block text-center font-dm font-semibold text-white bg-[#F47C20] hover:bg-[#e06a10] transition-colors py-3 px-6 rounded-xl mt-2"
                >
                  {isFree ? "Join Free →" : "Register Now →"}
                </a>
              ) : (
                <div className="bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl p-3 text-center">
                  <p className="font-dm text-sm text-[#7A8FA6]">Registration is currently closed.</p>
                </div>
              )}

              <Link
                href="/book"
                className="block text-center font-dm text-sm text-[#2251A3] hover:text-[#1B3A6B] transition-colors"
              >
                Have questions? Book a free call →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
