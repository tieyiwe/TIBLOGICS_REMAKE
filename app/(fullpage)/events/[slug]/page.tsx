import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import type { Event } from "@prisma/client";
import TrainingLandingPage from "./TrainingLandingPage";
import { TRAINING_EVENT_SEED, TRAINING_EVENT_SLUG, PARENTS_EVENT_SEED, PARENTS_EVENT_SLUG } from "@/lib/event-seeds";
import { mergeContent, DEFAULT_TRAINING_CONTENT, PARENTS_TRAINING_CONTENT } from "@/lib/training-content";
import { fitTitle, pageMetadata, plain } from "@/lib/seo/meta";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbNode, priceFromCents, type JsonLdNode } from "@/lib/seo/jsonld";
import { OG_IMAGE, ORG_ID, SITE_NAME, absUrl } from "@/lib/seo/site";

export const revalidate = 60; // edits made in admin appear within ~1 min

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ payment?: string; conf?: string }>;
}


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
    if (!event || !event.published) return { robots: { index: false, follow: true } };
    return pageMetadata({
      path: `/events/${slug}`,
      // Event names are long; drop the brand suffix rather than truncate.
      title: fitTitle([event.title]),
      absoluteTitle: true,
      description: event.description,
      image: event.coverImage ? { url: event.coverImage, width: 1200, height: 630, alt: event.title } : undefined,
    });
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

  // Event structured data (Google requires a start date, so an undated
  // "coming soon" event gets only its breadcrumb).
  const eventUrl = absUrl(`/events/${event.slug}`);
  const online = /online|zoom|virtual|meet/i.test(event.location ?? "");
  const jsonLd: JsonLdNode[] = [
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Events", path: "/events" },
      { name: event.title, path: `/events/${event.slug}` },
    ]),
  ];
  if (event.date) {
    jsonLd.unshift({
      "@type": event.type === "TRAINING" ? "EducationEvent" : "Event",
      "@id": `${eventUrl}#event`,
      name: event.title,
      description: plain(event.description),
      url: eventUrl,
      startDate: event.date.toISOString(),
      endDate: event.endDate?.toISOString(),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: online ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
      location: online
        ? { "@type": "VirtualLocation", url: eventUrl }
        : { "@type": "Place", name: event.location, address: event.location },
      image: event.coverImage ? absUrl(event.coverImage) : OG_IMAGE,
      organizer: { "@type": "Organization", "@id": ORG_ID, name: SITE_NAME, url: absUrl("/") },
      offers: {
        "@type": "Offer",
        price: priceFromCents(event.price),
        priceCurrency: event.currency ?? "USD",
        availability: event.registrationOpen && spotsLeft > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
        validFrom: event.createdAt.toISOString(),
        url: eventUrl,
      },
      maximumAttendeeCapacity: event.capacity ?? event.spots ?? undefined,
      remainingAttendeeCapacity: event.spots != null ? spotsLeft : undefined,
      inLanguage: "en",
    });
  }

  return (
    <>
      <JsonLd data={jsonLd} />
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
