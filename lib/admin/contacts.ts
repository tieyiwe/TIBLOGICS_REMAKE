import prisma from "@/lib/prisma";

export interface ContactRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  detail: string;
  createdAt: Date;
}

/** Newest rows per source. Each table grows with traffic; the list is for people, not export of history. */
const PER_SOURCE = 1000;

/**
 * Everyone who has reached TIBLOGICS through any channel, newest first.
 *
 * Shared by GET /api/contacts and the server-rendered admin page, so the two
 * cannot drift. Callers must have already checked for a staff session.
 */
export async function getContacts(): Promise<ContactRow[]> {
  const [serviceRequests, appointments, prospects, scannerLeads, subscribers] = await Promise.all([
    prisma.serviceRequest.findMany({
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, company: true, service: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: PER_SOURCE,
    }),
    prisma.appointment.findMany({
      // `phone` is a column. This used to parse it out of `notes` as JSON,
      // which bookings never write, so booking contacts never showed a phone.
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, company: true, serviceType: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: PER_SOURCE,
    }),
    prisma.prospect.findMany({
      select: { id: true, name: true, email: true, phone: true, business: true, industry: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: PER_SOURCE,
    }),
    prisma.scannerLead.findMany({
      where: { email: { not: null } },
      select: { id: true, name: true, email: true, url: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: PER_SOURCE,
    }),
    prisma.newsletterSubscriber.findMany({
      select: { id: true, firstName: true, email: true, subscribedAt: true, active: true },
      orderBy: { subscribedAt: "desc" },
      take: PER_SOURCE,
    }),
  ]);

  const contacts: ContactRow[] = [];
  for (const r of serviceRequests) {
    contacts.push({ id: "sr_" + r.id, name: `${r.firstName} ${r.lastName}`, email: r.email, phone: r.phone ?? undefined, company: r.company ?? undefined, source: "Service Request", detail: r.service, createdAt: r.createdAt });
  }
  for (const a of appointments) {
    contacts.push({ id: "appt_" + a.id, name: `${a.firstName} ${a.lastName}`, email: a.email, phone: a.phone ?? undefined, company: a.company ?? undefined, source: "Booking", detail: a.serviceType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()), createdAt: a.createdAt });
  }
  for (const p of prospects) {
    contacts.push({ id: "prospect_" + p.id, name: p.name, email: p.email ?? "", phone: p.phone ?? undefined, company: p.business, source: "Prospect", detail: p.industry, createdAt: p.createdAt });
  }
  for (const s of scannerLeads) {
    contacts.push({ id: "scan_" + s.id, name: s.name ?? s.email ?? "Unknown", email: s.email ?? "", source: "Scanner Lead", detail: s.url, createdAt: s.createdAt });
  }
  for (const sub of subscribers) {
    contacts.push({ id: "nl_" + sub.id, name: sub.firstName ?? sub.email, email: sub.email, source: "Newsletter", detail: sub.active ? "Active subscriber" : "Unsubscribed", createdAt: sub.subscribedAt });
  }
  contacts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return contacts;
}
