import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Event } from "@prisma/client";
import TrainingLandingPage from "./TrainingLandingPage";

interface Props { params: Promise<{ slug: string }> }

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

  // All events use the full landing page template — only details vary per event
  return (
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
  );
}
