import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { TRAINING_EVENT_SLUG } from "@/lib/event-seeds";
import ConfirmedPage from "./ConfirmedPage";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ conf?: string }>;
}

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export default async function EventConfirmedPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { conf } = await searchParams;

  let event = await prisma.event.findUnique({ where: { slug } }).catch(() => null);
  if (!event && slug === TRAINING_EVENT_SLUG) {
    event = await prisma.event.findUnique({ where: { slug: TRAINING_EVENT_SLUG } }).catch(() => null);
  }
  if (!event) return notFound();

  const registration = conf
    ? await prisma.eventRegistration.findUnique({
        where: { confirmationNumber: conf },
        select: { firstName: true, confirmationNumber: true, email: true, status: true },
      }).catch(() => null)
    : null;

  return (
    <ConfirmedPage
      eventSlug={slug}
      eventTitle={event.title}
      eventDate={event.date?.toISOString() ?? null}
      eventTimeSlot={event.timeSlot ?? null}
      eventLocation={event.location}
      eventPrice={event.price}
      eventCurrency={event.currency}
      eventUrl={`${SITE_URL}/events/${slug}`}
      confirmationNumber={conf ?? null}
      firstName={registration?.firstName ?? null}
    />
  );
}
