import prisma from "@/lib/prisma";
import {
  TRAINING_EVENT_SEED,
  TRAINING_EVENT_SLUG,
  PARENTS_EVENT_SEED,
  PARENTS_EVENT_SLUG,
} from "@/lib/event-seeds";
import { requireAdminPage } from "../_lib/admin-page-auth";
import EventsClient from "./EventsClient";

// Admin data is per-request and session-scoped — never cached or prerendered.
export const dynamic = "force-dynamic";

/**
 * Events admin — server-rendered initial read.
 *
 * This page used to be a client component that showed a spinner until a
 * useEffect fetch of /api/admin/events came back. The list now comes from
 * Prisma during the server render, so the first paint already has the data.
 *
 * Mutations are unchanged: the client still POSTs/PATCHes/DELETEs through
 * /api/admin/events*, then calls router.refresh() to re-run this query.
 */
export default async function AdminEventsPage() {
  // A server component reading Prisma directly has to authorise itself —
  // proxy.ts and the layout guard only control what the browser is shown.
  await requireAdminPage();

  // Ensure the current live training event and the parents one always appear in
  // admin, even if no one has visited the public page yet. Create-only: existing
  // edits preserved. Carried over from the GET handler this page replaces —
  // different slugs, so neither waits on the other, and each keeps its own error
  // handling so one failing still lets the other land.
  await Promise.all([
    prisma.event
      .upsert({
        where: { slug: TRAINING_EVENT_SLUG },
        create: TRAINING_EVENT_SEED,
        update: {
          title: TRAINING_EVENT_SEED.title,
          price: TRAINING_EVENT_SEED.price,
          date: TRAINING_EVENT_SEED.date,
          endDate: TRAINING_EVENT_SEED.endDate,
          published: true,
        },
      })
      .catch((err) => {
        console.error("[admin/events page] ensure training event", err);
      }),
    prisma.event
      .upsert({
        where: { slug: PARENTS_EVENT_SLUG },
        create: PARENTS_EVENT_SEED,
        update: { spots: 50, capacity: 50, price: PARENTS_EVENT_SEED.price },
      })
      .catch((err) => {
        console.error("[admin/events page] ensure parents event", err);
      }),
  ]);

  // Each read is caught on its own so a problem with one table (e.g. a missing
  // EventRegistration) renders an empty section instead of a 500, and never
  // blanks out the other.
  const [rawEvents, regCounts] = await Promise.all([
    prisma.event.findMany({ orderBy: { createdAt: "desc" } }).catch((err) => {
      console.error("[admin/events page] events", err);
      return [];
    }),
    prisma.eventRegistration
      .groupBy({ by: ["eventSlug", "status"], _count: { id: true } })
      .catch((err) => {
        console.error("[admin/events page] regCounts", err);
        return [] as { eventSlug: string; status: string; _count: { id: number } }[];
      }),
  ]);

  // Dates are sent as ISO strings so the props match what the client component
  // used to receive from JSON, and its formatting helpers keep working as-is.
  const events = rawEvents.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    type: e.type,
    price: e.price,
    currency: e.currency,
    location: e.location,
    date: e.date ? e.date.toISOString() : null,
    endDate: e.endDate ? e.endDate.toISOString() : null,
    timeSlot: e.timeSlot,
    description: e.description,
    content: e.content,
    capacity: e.capacity,
    spots: e.spots,
    coverImage: e.coverImage,
    stripePaymentLink: e.stripePaymentLink,
    zoomLink: e.zoomLink,
    registrationOpen: e.registrationOpen,
    featured: e.featured,
    published: e.published,
    tags: e.tags,
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <EventsClient
      events={events}
      regCounts={regCounts.map((r) => ({
        eventSlug: r.eventSlug,
        status: r.status,
        _count: { id: r._count.id },
      }))}
    />
  );
}
