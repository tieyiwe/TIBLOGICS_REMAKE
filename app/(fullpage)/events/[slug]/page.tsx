import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import type { Event } from "@prisma/client";
import TrainingLandingPage from "./TrainingLandingPage";
import { TRAINING_EVENT_SEED, TRAINING_EVENT_SLUG, PARENTS_EVENT_SEED, PARENTS_EVENT_SLUG } from "@/lib/event-seeds";
import { mergeContent, DEFAULT_TRAINING_CONTENT, PARENTS_TRAINING_CONTENT } from "@/lib/training-content";

export const revalidate = 60; // edits made in admin appear within ~1 min

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ payment?: string; conf?: string }>;
}

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

export default async function EventPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { payment, conf } = await searchParams;

  let event: Event | null = null;

  try {
    let raw = await prisma.event.findUnique({ where: { slug } });

    if (!raw && slug === TRAINING_EVENT_SLUG) {
      raw = await prisma.event.create({ data: TRAINING_EVENT_SEED });
    }

    if (!raw && slug === PARENTS_EVENT_SLUG) {
      raw = await prisma.event.create({ data: PARENTS_EVENT_SEED });
    }

    if (!raw) return notFound();
    if (!raw.published) return notFound();

    event = raw;
  } catch {
    return notFound();
  }

  if (!event) return notFound();

  // Live seat count: total spots minus paid registrations
  const paidCount = await prisma.eventRegistration.count({
    where: { eventSlug: event.slug, status: "paid" },
  }).catch(() => 0);
  const totalSpots = event.spots ?? 30;
  const spotsLeft = Math.max(0, totalSpots - paidCount);

  // "Coming soon" events (e.g. AI for Parents) have no set date and closed
  // registration — render the landing page in waitlist mode instead of paid checkout.
  const isParents = event.slug === PARENTS_EVENT_SLUG;
  const comingSoon = isParents || (!event.registrationOpen && event.date == null);
  const contentBase = isParents ? PARENTS_TRAINING_CONTENT : DEFAULT_TRAINING_CONTENT;

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
        spots={spotsLeft}
        price={event.price}
        currency={event.currency}
        location={event.location}
        timeSlot={event.timeSlot ?? ""}
        stripeLink={event.stripePaymentLink ?? null}
        registrationOpen={event.registrationOpen}
        content={mergeContent(event.content, contentBase)}
        comingSoon={comingSoon}
        paymentResult={payment === "success" ? "success" : payment === "cancelled" ? "cancelled" : null}
        confirmationNumber={conf ?? null}
      />
    </>
  );
}
