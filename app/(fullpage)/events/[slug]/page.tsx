import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import type { Event } from "@prisma/client";
import TrainingLandingPage from "./TrainingLandingPage";

export const revalidate = 1800;

interface Props { params: Promise<{ slug: string }> }

const SITE_URL = (process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export async function generateStaticParams() {
  try {
    const events = await prisma.event.findMany({
      where: { published: true },
      select: { slug: true },
    });
    return events.map((e) => ({ slug: e.slug }));
  } catch {
    return [{ slug: "ai-practical-training-cohort-1" }];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event || !event.published) return {};

    const title = `${event.title} | TIBLOGICS Events`;
    const description = event.description.slice(0, 160);
    const image = event.coverImage ?? `${SITE_URL}/og-image.png`;
    const url = `${SITE_URL}/events/${slug}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: "website",
        images: [{ url: image, width: 1200, height: 630, alt: event.title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
      alternates: { canonical: url },
    };
  } catch {
    return {};
  }
}

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

  let event: Event | null = null;

  try {
    let raw = await prisma.event.findUnique({ where: { slug } });

    if (!raw && slug === "ai-practical-training-cohort-1") {
      raw = await prisma.event.create({ data: TRAINING_EVENT_SEED });
    }

    if (!raw) return notFound();
    if (!raw.published) return notFound();

    event = raw;
  } catch {
    return notFound();
  }

  if (!event) return notFound();

  const eventUrl = `${SITE_URL}/events/${event.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": event.type === "TRAINING" ? "EducationEvent" : "Event",
    name: event.title,
    description: event.description,
    url: eventUrl,
    startDate: event.date?.toISOString(),
    endDate: event.endDate?.toISOString(),
    location: {
      "@type": event.location?.toLowerCase().includes("zoom") || event.location?.toLowerCase() === "online"
        ? "VirtualLocation"
        : "Place",
      name: event.location,
      url: event.location?.toLowerCase().includes("zoom") ? "https://zoom.us" : undefined,
    },
    organizer: {
      "@type": "Organization",
      name: "TIBLOGICS",
      url: SITE_URL,
    },
    offers: {
      "@type": "Offer",
      price: (event.price / 100).toFixed(2),
      priceCurrency: event.currency ?? "USD",
      availability: event.registrationOpen
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      url: eventUrl,
    },
    image: event.coverImage ?? `${SITE_URL}/og-image.png`,
    ...(event.capacity != null && { maximumAttendeeCapacity: event.capacity }),
    ...(event.spots != null && { remainingAttendeeCapacity: event.spots }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrainingLandingPage
        eventSlug={event.slug}
        eventTitle={event.title}
        eventDescription={event.description}
        startDate={event.date ? event.date.toISOString() : new Date().toISOString()}
        spots={event.spots ?? 30}
        price={event.price}
        currency={event.currency}
        location={event.location}
        timeSlot={event.timeSlot ?? ""}
        stripeLink={event.stripePaymentLink ?? null}
        registrationOpen={event.registrationOpen}
      />
    </>
  );
}
