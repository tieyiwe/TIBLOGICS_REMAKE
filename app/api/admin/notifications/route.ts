import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

  const [appointments, contacts, serviceRequests, partnerships, waitlist] = await Promise.all([
    prisma.appointment.findMany({
      where: { status: "PENDING", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, lastName: true, serviceType: true, createdAt: true },
    }),
    Promise.resolve([]),
    prisma.serviceRequest.findMany({
      where: { status: "pending", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, lastName: true, service: true, createdAt: true },
    }),
    prisma.partnershipApplication.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { id: true, businessName: true, contactName: true, createdAt: true },
    }),
    prisma.waitlistEntry.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, product: true, createdAt: true },
    }),
  ]);

  const items = [
    ...appointments.map(a => ({
      id: `appt-${a.id}`, type: "appointment" as const,
      title: `New appointment — ${a.firstName} ${a.lastName}`,
      subtitle: a.serviceType.replace(/_/g, " "),
      href: "/admin/appointments",
      createdAt: a.createdAt,
    })),
    ...(Array.isArray(contacts) ? contacts : []).map((c: any) => ({
      id: `contact-${c.id}`, type: "contact" as const,
      title: `New contact — ${c.name}`,
      subtitle: c.email,
      href: "/admin/contacts",
      createdAt: c.createdAt,
    })),
    ...serviceRequests.map(s => ({
      id: `sr-${s.id}`, type: "service_request" as const,
      title: `Service request — ${s.firstName} ${s.lastName}`,
      subtitle: s.service,
      href: "/admin/service-requests",
      createdAt: s.createdAt,
    })),
    ...partnerships.map(p => ({
      id: `partner-${p.id}`, type: "partnership" as const,
      title: `Partnership — ${p.businessName}`,
      subtitle: p.contactName,
      href: "/admin/partnerships",
      createdAt: p.createdAt,
    })),
    ...waitlist.map(w => ({
      id: `wait-${w.id}`, type: "waitlist" as const,
      title: `Waitlist signup — ${w.product}`,
      subtitle: w.email,
      href: "/admin/waitlist",
      createdAt: w.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ items, total: items.length });
}
