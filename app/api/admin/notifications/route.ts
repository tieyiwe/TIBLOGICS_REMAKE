import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { listLimit } from "@/lib/admin/list-limit";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days
  // Four unbounded reads merged into one list. A busy week used to mean four
  // full table scans and a payload to match, for a panel that shows the most
  // recent handful. Capped per feed, newest first, so the top of the list is
  // the same either way.
  const perFeed = listLimit(req.url, { def: 50, max: 200 });

  const [appointments, contacts, serviceRequests, partnerships, waitlist] = await Promise.all([
    prisma.appointment.findMany({
      where: { status: "PENDING", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: perFeed,
      select: { id: true, firstName: true, lastName: true, serviceType: true, createdAt: true },
    }),
    Promise.resolve([]),
    prisma.serviceRequest.findMany({
      where: { status: "pending", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: perFeed,
      select: { id: true, firstName: true, lastName: true, service: true, createdAt: true },
    }),
    prisma.partnershipApplication.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: perFeed,
      select: { id: true, businessName: true, contactName: true, createdAt: true },
    }),
    prisma.waitlistEntry.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: perFeed,
      select: { id: true, email: true, product: true, createdAt: true },
    }),
  ]);

  const items = [
    ...appointments.map(a => ({
      id: `appt-${a.id}`, type: "appointment" as const,
      title: `New appointment — ${a.firstName} ${a.lastName}`,
      subtitle: a.serviceType.replace(/_/g, " "),
      href: "/admin_pro/appointments",
      createdAt: a.createdAt,
    })),
    ...(Array.isArray(contacts) ? contacts : []).map((c: any) => ({
      id: `contact-${c.id}`, type: "contact" as const,
      title: `New contact — ${c.name}`,
      subtitle: c.email,
      href: "/admin_pro/contacts",
      createdAt: c.createdAt,
    })),
    ...serviceRequests.map(s => ({
      id: `sr-${s.id}`, type: "service_request" as const,
      title: `Service request — ${s.firstName} ${s.lastName}`,
      subtitle: s.service,
      href: "/admin_pro/service-requests",
      createdAt: s.createdAt,
    })),
    ...partnerships.map(p => ({
      id: `partner-${p.id}`, type: "partnership" as const,
      title: `Partnership — ${p.businessName}`,
      subtitle: p.contactName,
      href: "/admin_pro/partnerships",
      createdAt: p.createdAt,
    })),
    ...waitlist.map(w => ({
      id: `wait-${w.id}`, type: "waitlist" as const,
      title: `Waitlist signup — ${w.product}`,
      subtitle: w.email,
      href: "/admin_pro/waitlist",
      createdAt: w.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ items, total: items.length });
}
