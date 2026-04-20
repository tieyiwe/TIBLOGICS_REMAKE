import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [serviceRequests, appointments, prospects, scannerLeads, subscribers] = await Promise.all([
      prisma.serviceRequest.findMany({
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, company: true, service: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.appointment.findMany({
        select: { id: true, firstName: true, lastName: true, email: true, serviceType: true, createdAt: true, notes: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.prospect.findMany({
        select: { id: true, name: true, email: true, phone: true, business: true, industry: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.scannerLead.findMany({
        where: { email: { not: null } },
        select: { id: true, name: true, email: true, url: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.newsletterSubscriber.findMany({
        select: { id: true, firstName: true, email: true, source: true, subscribedAt: true, active: true },
        orderBy: { subscribedAt: "desc" },
      }),
    ]);

    // Normalise each source into a unified contact shape
    const contacts: Array<{
      id: string;
      name: string;
      email: string;
      phone?: string;
      company?: string;
      source: string;
      detail: string;
      createdAt: Date;
    }> = [];

    for (const r of serviceRequests) {
      contacts.push({
        id: "sr_" + r.id,
        name: `${r.firstName} ${r.lastName}`,
        email: r.email,
        phone: r.phone ?? undefined,
        company: r.company ?? undefined,
        source: "Service Request",
        detail: r.service,
        createdAt: r.createdAt,
      });
    }
    for (const a of appointments) {
      let phone: string | undefined;
      try { phone = JSON.parse(a.notes ?? "{}").phone; } catch { /* */ }
      contacts.push({
        id: "appt_" + a.id,
        name: `${a.firstName} ${a.lastName}`,
        email: a.email,
        phone,
        source: "Booking",
        detail: a.serviceType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()),
        createdAt: a.createdAt,
      });
    }
    for (const p of prospects) {
      contacts.push({
        id: "prospect_" + p.id,
        name: p.name,
        email: p.email ?? "",
        phone: p.phone ?? undefined,
        company: p.business,
        source: "Prospect",
        detail: p.industry,
        createdAt: p.createdAt,
      });
    }
    for (const s of scannerLeads) {
      contacts.push({
        id: "scan_" + s.id,
        name: s.name ?? s.email ?? "Unknown",
        email: s.email ?? "",
        source: "Scanner Lead",
        detail: s.url,
        createdAt: s.createdAt,
      });
    }
    for (const sub of subscribers) {
      contacts.push({
        id: "nl_" + sub.id,
        name: sub.firstName ?? sub.email,
        email: sub.email,
        source: "Newsletter",
        detail: sub.active ? "Active subscriber" : "Unsubscribed",
        createdAt: sub.subscribedAt,
      });
    }

    // Sort by most recent, deduplicate by email (keep first occurrence = most recent)
    contacts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const seen = new Set<string>();
    const unique = contacts.filter(c => {
      if (!c.email || seen.has(c.email.toLowerCase())) return true; // keep duplicates in full list
      seen.add(c.email.toLowerCase());
      return true;
    });

    return NextResponse.json({ contacts: unique, total: unique.length });
  } catch (err) {
    console.error("[GET /api/contacts]", err);
    return NextResponse.json({ contacts: [], total: 0 });
  }
}
